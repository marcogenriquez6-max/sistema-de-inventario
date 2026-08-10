import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
        const unitSale =
          dto.docType === 'FACTURA'
            ? Number(product.salePrice)
            : Number(product.basePrice);
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
      {
        docNumber,
        total: docTotal.toFixed(2),
        docType: dto.docType,
        userId: user.id,
      },
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

  /** Genera la factura / nota de venta en PDF (A4) para entregar al cliente. */
  async pdfInvoice(id: number): Promise<Buffer> {
    const doc = await this.findOne(id);
    const docTypeLabel =
      doc.docType === 'FACTURA' ? 'FACTURA' : 'NOTA DE VENTA';
    const company =
      (await this.settingsService.get<{ value: string }>('company_name'))
        ?.value ?? 'Distribuidora de Repuestos S.R.L.';

    const pdf = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    pdf.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      pdf.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const money = (v: string | number): string => `Bs ${Number(v).toFixed(2)}`;

    const logoPath = path.join(process.cwd(), 'assets', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
      pdf.image(logoPath, { fit: [56, 56] }).moveDown(0.2);
    }

    // Encabezado de la empresa
    pdf.fontSize(20).fillColor('#1e6fd9').text(company, { align: 'left' });
    pdf
      .fontSize(9)
      .fillColor('#5a6b85')
      .text('Sistema de Ventas de Repuestos · Ventas al por mayor y menor', {
        align: 'left',
      });
    pdf
      .fontSize(9)
      .fillColor('#5a6b85')
      .text('NIT: 0000000000 · Tel: 000-0000', { align: 'left' });
    pdf.moveDown(0.5);

    // Título del documento
    pdf
      .fontSize(16)
      .fillColor('#17233a')
      .text(docTypeLabel, { align: 'right' });
    pdf
      .fontSize(9)
      .fillColor('#5a6b85')
      .text(doc.docNumber, { align: 'right' });
    pdf.moveDown(1);

    // Datos del documento y del cliente
    pdf.fontSize(9).fillColor('#17233a');
    pdf.text(`Fecha: ${new Date(doc.createdAt).toLocaleString()}`);
    pdf.text(`Atendido por: ${doc.user?.fullName ?? '—'}`);
    pdf.text(`Cliente: ${doc.customerName}`);
    if (doc.customerDoc) pdf.text(`Carnet/Doc: ${doc.customerDoc}`);
    pdf.moveDown(1);

    // Tabla de ítems
    const left = 40;
    const right = 595 - 40;
    const usable = right - left;
    const col = {
      sku: 0.16,
      name: 0.44,
      qty: 0.1,
      price: 0.15,
      total: 0.15,
    };
    const w = (k: keyof typeof col) => col[k] * usable;
    const rowH = 22;
    const pageBottom = 760;
    const headers: Array<[string, number, keyof typeof col]> = [
      ['Código', w('sku'), 'sku'],
      ['Descripción', w('name'), 'name'],
      ['Cant.', w('qty'), 'qty'],
      ['P/U', w('price'), 'price'],
      ['Total', w('total'), 'total'],
    ];

    const drawTableHead = () => {
      let x = left;
      pdf.fontSize(8).fillColor('#ffffff');
      for (const [h, width] of headers) {
        pdf.rect(x, pdf.y, width, 18).fill('#1e6fd9');
        pdf
          .fillColor('#ffffff')
          .text(h, x + 4, pdf.y + 5, { width: width - 8 });
        x += width;
      }
      pdf.moveDown(1.2);
    };

    drawTableHead();
    pdf.fontSize(9).fillColor('#17233a');
    let y = pdf.y;
    for (const it of doc.items) {
      if (y > pageBottom) {
        pdf.addPage();
        pdf.y = 60;
        drawTableHead();
        pdf.fontSize(9).fillColor('#17233a');
        y = pdf.y;
      }
      let x = left;
      const cellY = y + 4;
      pdf.text(String(it.productSku).slice(0, 20), x + 4, cellY, {
        width: w('sku') - 8,
      });
      x += w('sku');
      pdf.text(String(it.productName).slice(0, 46), x + 4, cellY, {
        width: w('name') - 8,
      });
      x += w('name');
      pdf.text(String(it.quantity), x + 4, cellY, { width: w('qty') - 8 });
      x += w('qty');
      pdf.text(money(it.unitSale), x + 4, cellY, { width: w('price') - 8 });
      x += w('price');
      pdf.text(money(it.lineTotal), x + 4, cellY, { width: w('total') - 8 });
      y += rowH;
      pdf.y = y;
    }

    // Totales
    pdf.moveDown(0.5);
    pdf.fontSize(10);
    const totalX = left + usable * 0.55;
    const labelW = usable * 0.2;
    const valX = left + usable * 0.82;
    const drawTotal = (label: string, value: string, bold = false) => {
      if (bold) pdf.font('Helvetica-Bold');
      pdf.text(label, totalX, pdf.y, { width: labelW, align: 'left' });
      pdf.text(value, valX, pdf.y, { width: usable * 0.16, align: 'right' });
      if (bold) pdf.font('Helvetica');
      pdf.moveDown(0.4);
    };
    drawTotal('Subtotal:', money(doc.subtotal));
    if (Number(doc.taxAmount) > 0) {
      drawTotal(
        `IVA (${Number(doc.taxRate).toFixed(2)}%):`,
        money(doc.taxAmount),
      );
    }
    drawTotal('TOTAL A PAGAR:', money(doc.total), true);

    pdf.moveDown(2);
    pdf.fontSize(8).fillColor('#5a6b85');
    pdf.text(
      'Este documento fue generado por el Sistema de Ventas de Repuestos. Sin firmas y sellos no es válido para fines fiscales.',
      { align: 'center', width: usable },
    );
    pdf.text(`Sistema de Repuestos ERP · ${new Date().toLocaleString()}`, {
      align: 'center',
      width: usable,
    });

    pdf.end();
    return done;
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
