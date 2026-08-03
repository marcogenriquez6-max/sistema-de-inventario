import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { StockMovement, MovementType } from './stock-movement.entity';
import { StockEntryDto } from './dto/stock-entry.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import { PricingService } from '../pricing/pricing.service';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Request } from 'express';

/**
 * Inventario: entradas por compra, ajustes/mermas y consulta del Kardex.
 * Toda operación que modifica stock se ejecuta en transacción atómica con
 * bloqueo de fila (SELECT ... FOR UPDATE) para evitar descuadres por concurrencia.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    private readonly pricingService: PricingService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Entrada de mercancía por compra (RF-06). Suma stock, actualiza el costo
   * promedio y recalcula el PVP sugerido si aplica el margen global.
   */
  async registerPurchase(
    dto: StockEntryDto,
    user: AuthUser,
    req: Request,
  ): Promise<StockMovement[]> {
    const movements: StockMovement[] = [];
    const taxRate = await this.pricingService.getTaxRate();

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new DomainException(
            404,
            `Repuesto id ${item.productId} no encontrado`,
          );
        }

        product.stock += item.quantity;
        product.costPrice = item.unitCost.toFixed(2);
        product.basePrice = (
          await this.pricingService.computeSuggestedBasePrice(item.unitCost)
        ).toFixed(2);
        product.salePrice = (
          await this.pricingService.computeSalePrice(
            Number(product.basePrice),
            taxRate,
          )
        ).toFixed(2);
        await manager.save(Product, product);

        const movement = manager.create(StockMovement, {
          productId: product.id,
          movementType: 'PURCHASE',
          quantity: item.quantity,
          unitCost: item.unitCost.toFixed(2),
          unitBase: product.basePrice,
          unitSale: product.salePrice,
          concept: dto.concept ?? 'Compra a proveedor',
          referenceType: 'PURCHASE',
          userId: user.id,
        });
        await manager.save(StockMovement, movement);
        movements.push(movement);
      }
    });

    await this.auditService.record({
      userId: user.id,
      action: 'STOCK:PURCHASE',
      resourceType: 'stock',
      metadata: { items: dto.items, concept: dto.concept },
      request: req,
    });
    return movements;
  }

  /**
   * Ajuste o merma con motivo justificado (RF-10). Valida que la salida no
   * deje stock negativo (cero stock negativo, RF-07).
   */
  async registerAdjustment(
    dto: AdjustmentDto,
    user: AuthUser,
    req: Request,
  ): Promise<StockMovement> {
    const taxRate = await this.pricingService.getTaxRate();

    let movement!: StockMovement;
    await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new DomainException(404, 'Repuesto no encontrado');
      }

      const newStock = product.stock + dto.quantity;
      if (newStock < 0) {
        throw new DomainException(
          409,
          `Stock insuficiente. Disponible: ${product.stock}`,
          {
            available: product.stock,
            requested: dto.quantity,
          },
        );
      }

      product.stock = newStock;
      await manager.save(Product, product);

      movement = manager.create(StockMovement, {
        productId: product.id,
        movementType: dto.movementType as MovementType,
        quantity: dto.quantity,
        unitCost: product.costPrice,
        unitBase: product.basePrice,
        unitSale: (
          await this.pricingService.computeSalePrice(
            Number(product.basePrice),
            taxRate,
          )
        ).toFixed(2),
        concept: dto.concept ?? null,
        referenceType: 'ADJUSTMENT',
        userId: user.id,
      });
      await manager.save(StockMovement, movement);
    });

    await this.auditService.record({
      userId: user.id,
      action: `STOCK:${dto.movementType}`,
      resourceType: 'stock',
      resourceId: dto.productId,
      metadata: { quantity: dto.quantity, concept: dto.concept },
      request: req,
    });

    if (dto.quantity < 0 && movement.productId) {
      const product = await this.dataSource
        .getRepository(Product)
        .findOneBy({ id: movement.productId });
      if (product && product.stock <= product.minStock) {
        await this.notificationsService.createForRoles(
          ['INVENTORY_MANAGER', 'ADMIN'],
          'LOW_STOCK',
          `Stock bajo: ${product.name}`,
          `Quedan ${product.stock} unidad(es); umbral de reposición ${product.minStock}. (SKU ${product.sku})`,
          { productId: product.id, sku: product.sku, stock: product.stock, minStock: product.minStock },
        );
      }
    }
    return movement;
  }

  /** Kardex de un repuesto: trazabilidad completa (RF-13). */
  async getKardex(
    productId: number,
    page: number,
    pageSize: number,
  ): Promise<Paginated<StockMovement>> {
    const [items, total] = await this.movementRepo.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return toPaginated(items, total, page, pageSize);
  }
}
