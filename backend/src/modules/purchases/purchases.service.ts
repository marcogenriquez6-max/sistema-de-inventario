import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseDocument } from './purchase-document.entity';
import { PurchaseItem } from './purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Product } from '../catalog/product.entity';
import { StockMovement } from '../inventory/stock-movement.entity';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { SuppliersService } from '../suppliers/suppliers.service';
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
 * Módulo de compras: genera el documento de compra y, en la misma transacción
 * atómica, ingresa stock, actualiza el costo y recalcula el PVP sugerido
 * (integración con inventario + precios + Kardex).
 */
@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseDocument)
    private readonly docRepo: Repository<PurchaseDocument>,
    @InjectRepository(PurchaseItem)
    private readonly itemRepo: Repository<PurchaseItem>,
    private readonly pricingService: PricingService,
    private readonly settingsService: SettingsService,
    private readonly suppliersService: SuppliersService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreatePurchaseDto,
    user: AuthUser,
    req: Request,
  ): Promise<PurchaseDocument> {
    const supplier = await this.suppliersService.findOne(dto.supplierId);
    const taxRate = await this.pricingService.getTaxRate();
    const docNumber = await this.nextDocNumber(user.id);

    const result = await this.dataSource.transaction(async (manager) => {
      const productIds = dto.items.map((i) => i.productId);
      const products = await manager
        .createQueryBuilder(Product, 'p')
        .where('p.id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();
      const productMap = new Map(products.map((p) => [p.id, p]));

      const items: PurchaseItem[] = [];
      for (const line of dto.items) {
        const product = productMap.get(line.productId);
        if (!product) {
          throw new DomainException(
            404,
            `Repuesto id ${line.productId} no encontrado`,
          );
        }

        // Actualiza stock, costo y PVP sugerido.
        product.stock += line.quantity;
        product.costPrice = line.unitCost.toFixed(2);
        product.basePrice = (
          await this.pricingService.computeSuggestedBasePrice(line.unitCost)
        ).toFixed(2);
        product.salePrice = (
          await this.pricingService.computeSalePrice(
            Number(product.basePrice),
            taxRate,
          )
        ).toFixed(2);
        await manager.save(Product, product);

        items.push(
          manager.create(PurchaseItem, {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            quantity: line.quantity,
            unitCost: line.unitCost.toFixed(2),
            lineTotal: (line.unitCost * line.quantity).toFixed(2),
          }),
        );
      }

      const subtotal = items.reduce((acc, i) => acc + Number(i.lineTotal), 0);
      const taxAmount = this.pricingService.round(subtotal * (taxRate / 100));
      const document = manager.create(PurchaseDocument, {
        docNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        invoiceNumber: dto.invoiceNumber ?? null,
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: (subtotal + taxAmount).toFixed(2),
        status: 'RECEIVED',
        userId: user.id,
        items,
      });
      await manager.save(PurchaseDocument, document);

      // Kardex por cada línea (entrada por compra).
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        await manager.save(
          manager.create(StockMovement, {
            productId: item.productId,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitBase: product.basePrice,
            unitSale: product.salePrice,
            concept: `Compra ${docNumber}`,
            referenceType: 'PURCHASE',
            referenceId: String(document.id),
            userId: user.id,
          }),
        );
      }

      await this.auditService.record({
        userId: user.id,
        action: 'PURCHASE:CREATE',
        resourceType: 'purchase_documents',
        resourceId: document.id,
        metadata: {
          docNumber,
          supplierId: supplier.id,
          total: document.total,
          items: items.length,
        },
        request: req,
      });

      return document;
    });

    await this.notificationsService.createForRoles(
      ['ADMIN', 'MANAGER'],
      'PURCHASE',
      `Compra registrada ${docNumber}`,
      `Compra por $${result.total} a ${supplier.name}`,
      { docNumber, total: result.total, supplierId: supplier.id },
    );
    return result;
  }

  async findAll(query: {
    page: number;
    pageSize: number;
    q?: string;
  }): Promise<Paginated<PurchaseDocument>> {
    const { page, pageSize } = query;
    const qb = this.docRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.supplier', 's')
      .orderBy('d.createdAt', 'DESC');
    if (query.q) {
      qb.andWhere('(d.docNumber ILIKE :q OR d.supplierName ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return toPaginated(items, total, page, pageSize);
  }

  async findOne(id: number): Promise<PurchaseDocument> {
    const doc = await this.docRepo.findOne({
      where: { id },
      relations: ['supplier', 'items'],
    });
    if (!doc) {
      throw new DomainException(404, 'Documento de compra no encontrado');
    }
    return doc;
  }

  private async nextDocNumber(userId: number): Promise<string> {
    const settings = await this.settingsService.get<{
      value: Record<string, number>;
    }>('doc_sequence');
    const sequence = settings?.value ?? {};
    const current = sequence.purchase ?? 1;
    sequence.purchase = current + 1;
    await this.settingsService.set('doc_sequence', { value: sequence }, userId);
    return `COM-${String(current).padStart(5, '0')}`;
  }
}
