import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'right';
}

interface ResourceDef {
  columns: ExportColumn[];
  query: (params: ExportParams) => Promise<Array<Record<string, unknown>>>;
  title: string;
}

export interface ExportParams {
  q?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ExportService {
  constructor(private readonly dataSource: DataSource) {}

  private readonly resources: Record<string, ResourceDef> = {
    products: {
      title: 'Catálogo de Repuestos',
      columns: [
        { key: 'sku', header: 'SKU', width: 14 },
        { key: 'name', header: 'Nombre', width: 36 },
        { key: 'category', header: 'Categoría', width: 16 },
        { key: 'brand', header: 'Marca', width: 14 },
        { key: 'stock', header: 'Stock', width: 10, align: 'right' },
        { key: 'minStock', header: 'Stock Mín.', width: 10, align: 'right' },
        { key: 'costPrice', header: 'Costo', width: 12, align: 'right' },
        { key: 'basePrice', header: 'P. Base', width: 12, align: 'right' },
        { key: 'salePrice', header: 'P. Venta', width: 12, align: 'right' },
        { key: 'isActive', header: 'Activo', width: 8 },
      ],
      query: ({ q }) => {
        const like = q ? `%${q}%` : '%';
        return this.dataSource.query(
          `SELECT sku, name, category, brand, stock, min_stock AS "minStock",
                  cost_price AS "costPrice", base_price AS "basePrice",
                  sale_price AS "salePrice", is_active AS "isActive"
             FROM products
            WHERE (name ILIKE $1 OR sku ILIKE $1 OR category ILIKE $1)
            ORDER BY name`,
          [like],
        );
      },
    },
    inventory: {
      title: 'Movimientos de Inventario',
      columns: [
        { key: 'createdAt', header: 'Fecha', width: 22 },
        { key: 'productSku', header: 'SKU', width: 14 },
        { key: 'productName', header: 'Producto', width: 30 },
        { key: 'movementType', header: 'Tipo', width: 12 },
        { key: 'quantity', header: 'Cant.', width: 10, align: 'right' },
        { key: 'unitCost', header: 'Costo', width: 12, align: 'right' },
        { key: 'concept', header: 'Concepto', width: 26 },
      ],
      query: ({ from, to, q }) => {
        const like = q ? `%${q}%` : '%';
        const where = [
          `(p.name ILIKE $1 OR p.sku ILIKE $1 OR m.concept ILIKE $1)`,
          from ? `m.created_at >= $2::timestamptz` : null,
          to ? `m.created_at <= $3::timestamptz` : null,
        ]
          .filter(Boolean)
          .join(' AND ');
        return this.dataSource.query(
          `SELECT m.created_at AS "createdAt", p.sku AS "productSku", p.name AS "productName",
                  m.movement_type AS "movementType", m.quantity, m.unit_cost AS "unitCost",
                  m.concept
             FROM stock_movements m
             JOIN products p ON p.id = m.product_id
            WHERE ${where}
            ORDER BY m.created_at DESC
            LIMIT 2000`,
          [like, from, to].filter((v) => v !== undefined && v !== null),
        );
      },
    },
    sales: {
      title: 'Ventas',
      columns: [
        { key: 'docNumber', header: 'Documento', width: 16 },
        { key: 'docType', header: 'Tipo', width: 10 },
        { key: 'createdAt', header: 'Fecha', width: 22 },
        { key: 'customerName', header: 'Cliente', width: 26 },
        { key: 'subtotal', header: 'Subtotal', width: 12, align: 'right' },
        { key: 'taxAmount', header: 'IVA', width: 12, align: 'right' },
        { key: 'total', header: 'Total', width: 12, align: 'right' },
        { key: 'status', header: 'Estado', width: 10 },
      ],
      query: ({ from, to, q }) => {
        const like = q ? `%${q}%` : '%';
        const where = [
          `(d.doc_number ILIKE $1 OR d.customer_name ILIKE $1)`,
          from ? `d.created_at >= $2::timestamptz` : null,
          to ? `d.created_at <= $3::timestamptz` : null,
        ]
          .filter(Boolean)
          .join(' AND ');
        return this.dataSource.query(
          `SELECT d.doc_number AS "docNumber", d.doc_type AS "docType", d.created_at AS "createdAt",
                  d.customer_name AS "customerName", d.subtotal, d.tax_amount AS "taxAmount",
                  d.total, d.status
             FROM sale_documents d
            WHERE ${where}
            ORDER BY d.created_at DESC
            LIMIT 2000`,
          [like, from, to].filter((v) => v !== undefined && v !== null),
        );
      },
    },
    customers: {
      title: 'Clientes',
      columns: [
        { key: 'code', header: 'Código', width: 12 },
        { key: 'name', header: 'Nombre', width: 30 },
        { key: 'documentType', header: 'Doc.', width: 8 },
        { key: 'documentNumber', header: 'N. Doc.', width: 16 },
        { key: 'email', header: 'Email', width: 24 },
        { key: 'phone', header: 'Teléfono', width: 14 },
        { key: 'address', header: 'Dirección', width: 28 },
        { key: 'isActive', header: 'Activo', width: 8 },
      ],
      query: ({ q }) => {
        const like = q ? `%${q}%` : '%';
        return this.dataSource.query(
          `SELECT code, name, document_type AS "documentType", document_number AS "documentNumber",
                  email, phone, address, is_active AS "isActive"
             FROM customers
            WHERE (name ILIKE $1 OR code ILIKE $1 OR document_number ILIKE $1)
            ORDER BY name`,
          [like],
        );
      },
    },
    suppliers: {
      title: 'Proveedores',
      columns: [
        { key: 'code', header: 'Código', width: 12 },
        { key: 'name', header: 'Nombre', width: 30 },
        { key: 'taxId', header: 'NIT', width: 16 },
        { key: 'email', header: 'Email', width: 24 },
        { key: 'phone', header: 'Teléfono', width: 14 },
        { key: 'address', header: 'Dirección', width: 28 },
      ],
      query: ({ q }) => {
        const like = q ? `%${q}%` : '%';
        return this.dataSource.query(
          `SELECT code, name, tax_id AS "taxId", email, phone, address
             FROM suppliers
            WHERE (name ILIKE $1 OR code ILIKE $1 OR tax_id ILIKE $1)
            ORDER BY name`,
          [like],
        );
      },
    },
    purchases: {
      title: 'Compras',
      columns: [
        { key: 'docNumber', header: 'Documento', width: 16 },
        { key: 'createdAt', header: 'Fecha', width: 22 },
        { key: 'supplierName', header: 'Proveedor', width: 26 },
        { key: 'invoiceNumber', header: 'Factura', width: 14 },
        { key: 'subtotal', header: 'Subtotal', width: 12, align: 'right' },
        { key: 'taxAmount', header: 'IVA', width: 12, align: 'right' },
        { key: 'total', header: 'Total', width: 12, align: 'right' },
        { key: 'status', header: 'Estado', width: 10 },
      ],
      query: ({ from, to, q }) => {
        const like = q ? `%${q}%` : '%';
        const where = [
          `(d.doc_number ILIKE $1 OR s.name ILIKE $1)`,
          from ? `d.created_at >= $2::timestamptz` : null,
          to ? `d.created_at <= $3::timestamptz` : null,
        ]
          .filter(Boolean)
          .join(' AND ');
        return this.dataSource.query(
          `SELECT d.doc_number AS "docNumber", d.created_at AS "createdAt", s.name AS "supplierName",
                  d.invoice_number AS "invoiceNumber", d.subtotal, d.tax_amount AS "taxAmount",
                  d.total, d.status
             FROM purchase_documents d
             JOIN suppliers s ON s.id = d.supplier_id
            WHERE ${where}
            ORDER BY d.created_at DESC
            LIMIT 2000`,
          [like, from, to].filter((v) => v !== undefined && v !== null),
        );
      },
    },
    employees: {
      title: 'Empleados',
      columns: [
        { key: 'code', header: 'Código', width: 12 },
        { key: 'fullName', header: 'Nombre', width: 30 },
        { key: 'position', header: 'Cargo', width: 18 },
        { key: 'department', header: 'Departamento', width: 18 },
        { key: 'phone', header: 'Teléfono', width: 14 },
        { key: 'email', header: 'Email', width: 24 },
        { key: 'hireDate', header: 'Ingreso', width: 14 },
        { key: 'salary', header: 'Salario', width: 14, align: 'right' },
      ],
      query: ({ q }) => {
        const like = q ? `%${q}%` : '%';
        return this.dataSource.query(
          `SELECT code, full_name AS "fullName", position, department, phone, email,
                  hire_date AS "hireDate", salary
             FROM employees
            WHERE (full_name ILIKE $1 OR code ILIKE $1 OR position ILIKE $1 OR email ILIKE $1)
            ORDER BY full_name`,
          [like],
        );
      },
    },
    audit: {
      title: 'Auditoría',
      columns: [
        { key: 'createdAt', header: 'Fecha', width: 22 },
        { key: 'userFullName', header: 'Usuario', width: 24 },
        { key: 'action', header: 'Acción', width: 22 },
        { key: 'resourceType', header: 'Recurso', width: 16 },
        { key: 'resourceId', header: 'ID', width: 12 },
        { key: 'ip', header: 'IP', width: 14 },
      ],
      query: ({ from, to, q }) => {
        const like = q ? `%${q}%` : '%';
        const where = [
          `(a.action ILIKE $1 OR a.resource_type ILIKE $1 OR u.full_name ILIKE $1)`,
          from ? `a.created_at >= $2::timestamptz` : null,
          to ? `a.created_at <= $3::timestamptz` : null,
        ]
          .filter(Boolean)
          .join(' AND ');
        return this.dataSource.query(
          `SELECT a.created_at AS "createdAt", u.full_name AS "userFullName", a.action,
                  a.resource_type AS "resourceType", a.resource_id AS "resourceId", a.ip
             FROM audit_logs a
             LEFT JOIN users u ON u.id = a.user_id
            WHERE ${where}
            ORDER BY a.created_at DESC
            LIMIT 2000`,
          [like, from, to].filter((v) => v !== undefined && v !== null),
        );
      },
    },
  };

  getFormats(): string[] {
    return ['csv', 'xlsx', 'pdf'];
  }

  getResourceNames(): string[] {
    return Object.keys(this.resources);
  }

  async export(
    resource: string,
    format: ExportFormat,
    params: ExportParams,
  ): Promise<{ buffer: Buffer; mime: string; extension: string }> {
    const def = this.resources[resource];
    if (!def) throw new BadRequestException(`Recurso de exportación no válido: ${resource}`);
    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      throw new BadRequestException(`Formato no válido: ${format}`);
    }
    const rows = await def.query(params);

    switch (format) {
      case 'csv':
        return { buffer: this.toCsv(def.columns, rows), mime: 'text/csv; charset=utf-8', extension: 'csv' };
      case 'xlsx':
        return {
          buffer: await this.toExcel(def.columns, rows, def.title),
          mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'xlsx',
        };
      case 'pdf':
        return {
          buffer: await this.toPdf(def.columns, rows, def.title),
          mime: 'application/pdf',
          extension: 'pdf',
        };
    }
  }

  private toCsv(columns: ExportColumn[], rows: Array<Record<string, unknown>>): Buffer {
    const esc = (v: unknown): string => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map((c) => esc(c.header)).join(',')];
    for (const row of rows) {
      lines.push(columns.map((c) => esc(row[c.key])).join(','));
    }
    return Buffer.from('\uFEFF' + lines.join('\r\n'), 'utf8');
  }

  private async toExcel(
    columns: ExportColumn[],
    rows: Array<Record<string, unknown>>,
    title: string,
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Repuestos ERP';
    const ws = wb.addWorksheet(title.slice(0, 31));
    ws.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 18,
    }));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E6FD9' },
    };
    ws.getRow(1).alignment = { vertical: 'middle' };
    for (const row of rows) ws.addRow(row as Record<string, unknown>);
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
  }

  private async toPdf(
    columns: ExportColumn[],
    rows: Array<Record<string, unknown>>,
    title: string,
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

    doc.fontSize(16).fillColor('#17233a').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(9).fillColor('#5a6b85').text(`Generado: ${new Date().toLocaleString()}`);
    doc.moveDown();

    const left = 36;
    const right = 595 - 36;
    const usable = right - left;
    const widths = columns.map((c) => ((c.width ?? 18) / 100) * usable);
    const total = widths.reduce((a, b) => a + b, 0);
    const scale = usable / Math.max(total, usable);
    const finalW = widths.map((w) => w * scale);

    const rowH = 20;
    const pageBottom = 770;

    const drawHeader = () => {
      let x = left;
      doc.fontSize(8).fillColor('#ffffff');
      for (let i = 0; i < columns.length; i++) {
        doc.rect(x, doc.y, finalW[i], rowH).fill('#1e6fd9');
        doc.fillColor('#ffffff').text(columns[i].header.slice(0, 28), x + 3, doc.y + 6, {
          width: finalW[i] - 6,
        });
        x += finalW[i];
      }
      doc.moveDown(1.1);
    };

    drawHeader();
    doc.fontSize(8).fillColor('#17233a');
    let y = doc.y;
    for (const row of rows) {
      if (y > pageBottom) {
        doc.addPage();
        doc.y = 60;
        y = doc.y;
        drawHeader();
        doc.fontSize(8).fillColor('#17233a');
        y = doc.y;
      }
      let x = left;
      const cellH = 16;
      for (let i = 0; i < columns.length; i++) {
        const v = row[columns[i].key];
        const s = v === null || v === undefined ? '' : String(v);
        doc.text(s.slice(0, 40), x + 3, y + 3, {
          width: finalW[i] - 6,
          align: columns[i].align ?? 'left',
        });
        x += finalW[i];
      }
      y += cellH;
      doc.y = y;
    }

    doc.end();
    return done;
  }
}
