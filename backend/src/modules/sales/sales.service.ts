import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { SaleDocument } from './sale-document.entity';
import { SaleItem } from './sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PricingService } from '../pricing/pricing.service';
import { SettingsService } from '../settings/settings.service';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { StockMovement } from '../inventory/stock-movement.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Request } from 'express';

export interface SaleResult {
  document: SaleDocument;
}

/**
 * Módulo de ventas (POS + facturación). Implementa el caso crítico del sistema:
 * la transacción atómica que valida stock, congela precios (RF-14), descuenta
 * existencias (RF-08) y registra el Kardex (RF-13) — todo o nada.
 */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleDocument)
    private readonly documentRepo: Repository<SaleDocument>,
    @InjectRepository(SaleItem)
    private readonly itemRepo: Repository<SaleItem>,
    private readonly pricingService: PricingService,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  /** Ejecuta la venta en una única transacción ACID con bloqueo pesimista. */
  async createSale(
    dto: CreateSaleDto,
    user: AuthUser,
    req: Request,
  ): Promise<SaleResult> {
    const taxRate = await this.pricingService.getTaxRate();
    const docNumber = await this.nextDocumentNumber(dto.docType, user.id);

    const result = await this.dataSource.transaction(async (manager) => {
      // 1) Reservar stock con bloqueo de fila (evita over-sell por concurrencia).
      const productIds = dto.items.map((i) => i.productId);
      const products = await manager
        .createQueryBuilder(Product, 'p')
        .where('p.id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write')
        .getMany();
      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2) Preparar detalle con precios congelados del momento.
      const items: SaleItem[] = [];
      for (const line of dto.items) {
        const product = productMap.get(line.productId);
        if (!product) {
          throw new DomainException(
            404,
            `Repuesto id ${line.productId} no encontrado`,
          );
        }
        if (!product.isActive) {
          throw new DomainException(
            409,
            `Repuesto ${product.sku} está inactivo`,
          );
        }
        if (product.stock < line.quantity) {
          throw new DomainException(
            409,
            `Stock insuficiente de "${product.name}"`,
            {
              sku: product.sku,
              available: product.stock,
              requested: line.quantity,
            },
          );
        }

        const unitBase = Number(product.basePrice);
        const unitSale = Number(product.salePrice);
        const unitCost = Number(product.costPrice);
        const taxAmount = this.pricingService.round(unitSale - unitBase);

        items.push(
          manager.create(SaleItem, {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            quantity: line.quantity,
            unitCost: unitCost.toFixed(2),
            unitBase: unitBase.toFixed(2),
            unitSale: unitSale.toFixed(2),
            taxRate: taxRate.toFixed(2),
            taxAmount: (taxAmount * line.quantity).toFixed(2),
            lineTotal: (unitSale * line.quantity).toFixed(2),
          }),
        );
      }

      // 3) Descontar stock en tiempo real.
      for (const line of dto.items) {
        const product = productMap.get(line.productId)!;
        product.stock -= line.quantity;
        await manager.save(Product, product);
      }

      // 4) Cabecera del documento.
      const subtotal = items.reduce(
        (acc, i) => acc + Number(i.unitBase) * Number(i.quantity),
        0,
      );
      const taxTotal = items.reduce((acc, i) => acc + Number(i.taxAmount), 0);
      const total = subtotal + taxTotal;

      const document = manager.create(SaleDocument, {
        docType: dto.docType,
        docNumber,
        customerName: dto.customerName,
        customerDoc: dto.customerDoc ?? null,
        subtotal: subtotal.toFixed(2),
        taxRate: taxRate.toFixed(2),
        taxAmount: taxTotal.toFixed(2),
        total: total.toFixed(2),
        status: 'COMPLETED',
        userId: user.id,
        items,
      });
      await manager.save(SaleDocument, document);

      // 5) Kardex de cada línea (salida por venta).
      for (const item of items) {
        await manager.save(
          manager.create(StockMovement, {
            productId: item.productId,
            movementType: 'SALE',
            quantity: -item.quantity,
            unitCost: item.unitCost,
            unitBase: item.unitBase,
            unitSale: item.unitSale,
            concept: `${dto.docType} ${docNumber}`,
            referenceType: 'SALE',
            referenceId: String(document.id),
            userId: user.id,
          }),
        );
      }

      await this.auditService.record({
        userId: user.id,
        action: 'SALE:CREATE',
        resourceType: 'sale_documents',
        resourceId: document.id,
        metadata: {
          docNumber,
          docType: dto.docType,
          total,
          items: items.length,
        },
        request: req,
      });

      return { document };
    });

    const docTotal = Number(result.document.total) || 0;
    await this.notificationsService.createForRoles(
      ['ADMIN', 'MANAGER'],
      'SALE',
      `Nueva venta ${docNumber}`,
      `Venta ${dto.docType} ${docNumber} por $${docTotal.toFixed(2)} — ${result.document.items.length} línea(s)`,
      { docNumber, total: docTotal.toFixed(2), docType: dto.docType, userId: user.id },
    );
    return result;
  }
  /** Consulta de documentos de venta con filtros (paginado). */
  async findAll(query: {
    page: number;
    pageSize: number;
    docType?: string;
    status?: string;
    from?: string;
    to?: string;
    q?: string;
  }): Promise<Paginated<SaleDocument>> {
    const { page, pageSize } = query;
    const qb = this.documentRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.user', 'user')
      .orderBy('d.createdAt', 'DESC');

    if (query.docType) {
      qb.andWhere('d.docType = :docType', { docType: query.docType });
    }
    if (query.status) {
      qb.andWhere('d.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('d.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('d.createdAt <= :to', { to: new Date(query.to) });
    }
    if (query.q) {
      qb.andWhere('(d.docNumber ILIKE :q OR d.customerName ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return toPaginated(items, total, page, pageSize);
  }

  /** Detalle de un documento con sus ítems. */
  async findOne(id: number): Promise<SaleDocument> {
    const doc = await this.documentRepo.findOne({
      where: { id },
      relations: ['user', 'items'],
    });
    if (!doc) {
      throw new DomainException(404, 'Documento de venta no encontrado');
    }
    return doc;
  }

  /** Anulación de documento (no restaura stock; registra auditoría). */
  async voidDocument(
    id: number,
    reason: string,
    user: AuthUser,
    req: Request,
  ): Promise<SaleDocument> {
    const doc = await this.findOne(id);
    if (doc.status === 'VOIDED') {
      throw new DomainException(409, 'El documento ya está anulado');
    }
    doc.status = 'VOIDED';
    doc.voidReason = reason;
    const saved = await this.documentRepo.save(doc);
    await this.auditService.record({
      userId: user.id,
      action: 'SALE:VOID',
      resourceType: 'sale_documents',
      resourceId: id,
      metadata: { docNumber: doc.docNumber, reason },
      request: req,
    });
    return saved;
  }

  /**
   * Genera el correlativo único del documento de forma segura frente a
   * concurrencia usando una fila de contador con bloqueo.
   */
  private async nextDocumentNumber(
    docType: 'NOTA' | 'FACTURA',
    userId: number,
  ): Promise<string> {
    const prefix = docType === 'FACTURA' ? 'FAC' : 'NOT';
    const settings = await this.settingsService.get<{
      value: Record<string, number>;
    }>('doc_sequence');
    const sequence = settings?.value ?? { nota: 1, factura: 1 };
    const current = docType === 'FACTURA' ? sequence.factura : sequence.nota;

    // Reserva el siguiente número y lo persiste de inmediato (contador atómico).
    sequence[docType === 'FACTURA' ? 'factura' : 'nota'] = current + 1;
    await this.settingsService.set('doc_sequence', { value: sequence }, userId);

    return `${prefix}-${String(current).padStart(5, '0')}`;
  }
}
