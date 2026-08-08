import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Readable } from 'stream';
import * as ExcelJS from 'exceljs';
import { Product } from './product.entity';
import { ProductCode } from './product-code.entity';
import { ProductCompat } from './product-compat.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PricingService } from '../pricing/pricing.service';
import { DomainException } from '../../common/domain-exceptions';
import {
  toPaginated,
  Paginated,
} from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';

/**
 * Catálogo de repuestos: ficha multicódigo, compatibilidad y cálculo de precios
 * al alta/actualización (RF-01 a RF-06, RF-16).
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCode)
    private readonly codeRepo: Repository<ProductCode>,
    private readonly pricingService: PricingService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Búsqueda por código exacto (SKU, OEM o código de barras). Usado por el POS
   * para respuesta inmediata al escanear. Devuelve null si no se encuentra.
   */
  async findByCode(code: string): Promise<Product | null> {
    const normalized = code.trim().toUpperCase();
    let product = await this.productRepo.findOne({
      where: [{ sku: code }, { oemCode: code }],
    });
    if (!product) {
      const alt = await this.codeRepo.findOne({
        where: { codeValue: normalized },
        relations: ['product'],
      });
      product = alt?.product ?? null;
    }
    return product;
  }

  /**
   * Listado con filtros: texto libre (q), marca, categoría, compatibilidad
   * por vehículo y stock bajo mínimo.
   */
  async findAll(query: QueryProductDto): Promise<Paginated<Product>> {
    const { page, pageSize } = query;
    const qb = this.productRepo
      .createQueryBuilder('p')
      .orderBy('p.name', 'ASC');

    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('p.sku ILIKE :q')
            .orWhere('p.oemCode ILIKE :q')
            .orWhere('p.name ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }
    if (query.brand) {
      qb.andWhere('p.brand ILIKE :brand', { brand: query.brand });
    }
    if (query.category) {
      qb.andWhere('p.category ILIKE :category', { category: query.category });
    }
    if (query.provenance) {
      qb.andWhere('p.provenance ILIKE :provenance', {
        provenance: query.provenance,
      });
    }
    if (query.lowStock === 1) {
      qb.andWhere('p.stock <= p.minStock');
    }

    if (query.vehicleBrand || query.vehicleModel || query.year) {
      qb.innerJoin('p.compat', 'c');
      if (query.vehicleBrand) {
        qb.andWhere('c.vehicleBrand ILIKE :vb', { vb: query.vehicleBrand });
      }
      if (query.vehicleModel) {
        qb.andWhere('c.vehicleModel ILIKE :vm', { vm: query.vehicleModel });
      }
      if (query.year) {
        qb.andWhere(
          '(c.yearFrom IS NULL OR c.yearFrom <= :year) AND (c.yearTo IS NULL OR c.yearTo >= :year)',
          {
            year: query.year,
          },
        );
      }
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return toPaginated(items, total, page, pageSize);
  }

  /** Obtiene un repuesto completo con sus códigos y compatibilidad. */
  async findOne(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['codes', 'compat'],
    });
    if (!product) {
      throw new DomainException(404, 'Repuesto no encontrado');
    }
    return product;
  }

  /** Valores disponibles para los filtros del listado (marcas, categorías, procedencias). */
  async getFacets(): Promise<{
    brands: string[];
    categories: string[];
    provenances: string[];
  }> {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('p.brand', 'brand')
      .addSelect('p.category', 'category')
      .addSelect('p.provenance', 'provenance')
      .where('p.isActive = TRUE')
      .orderBy('1')
      .getRawMany();

    const unique = (k: 'brand' | 'category' | 'provenance') =>
      Array.from(
        new Set(
          rows
            .map((r) => r?.[k] as string | null)
            .filter((v): v is string => !!v && v.trim().length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es'));

    return {
      brands: unique('brand'),
      categories: unique('category'),
      provenances: unique('provenance'),
    };
  }

  /**
   * Alta de repuesto. Si no se envía basePrice se calcula con el margen
   * global; salePrice siempre se calcula con el IVA vigente.
   */
  async create(
    dto: CreateProductDto,
    user: AuthUser,
    req: Request,
  ): Promise<Product> {
    const basePrice =
      dto.basePrice ??
      (await this.pricingService.computeSuggestedBasePrice(dto.costPrice));
    const salePrice = await this.pricingService.computeSalePrice(basePrice);
    const taxRate = await this.pricingService.getTaxRate();
    const sku = dto.sku?.trim() || (await this.generateSku());

    const product = this.productRepo.create({
      sku,
      oemCode: dto.oemCode ?? null,
      name: dto.name,
      category: dto.category ?? null,
      brand: dto.brand ?? null,
      provenance: dto.provenance ?? null,
      unit: dto.unit ?? 'uds',
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      costPrice: dto.costPrice.toFixed(2),
      basePrice: basePrice.toFixed(2),
      salePrice: salePrice.toFixed(2),
      compat: (dto.compat ?? []).map((c) =>
        this.dataSource.manager.create(ProductCompat, {
          vehicleBrand: c.vehicleBrand,
          vehicleModel: c.vehicleModel,
          yearFrom: c.yearFrom ?? null,
          yearTo: c.yearTo ?? null,
          engineType: c.engineType ?? null,
        }),
      ),
    });

    try {
      const saved = await this.productRepo.save(product);
      await this.auditService.record({
        userId: user.id,
        action: 'PRODUCT:CREATE',
        resourceType: 'products',
        resourceId: saved.id,
        metadata: {
          sku,
          name: dto.name,
          basePrice,
          salePrice,
          taxRate,
        },
        request: req,
      });
      return saved;
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new DomainException(
          409,
          'Ya existe un repuesto con el mismo SKU, OEM o código de barras',
        );
      }
      throw err;
    }
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    user: AuthUser,
    req: Request,
  ): Promise<Product> {
    const product = await this.findOne(id);
    const changed = { ...dto } as Record<string, unknown>;

    Object.assign(product, {
      sku: dto.sku ?? product.sku,
      oemCode: dto.oemCode ?? product.oemCode,
      name: dto.name ?? product.name,
      category: dto.category !== undefined ? dto.category : product.category,
      brand: dto.brand ?? product.brand,
      provenance:
        dto.provenance !== undefined ? dto.provenance : product.provenance,
      unit: dto.unit ?? product.unit,
      minStock: dto.minStock ?? product.minStock,
    });

    if (dto.costPrice !== undefined || dto.basePrice !== undefined) {
      const cost = dto.costPrice ?? Number(product.costPrice);
      const base =
        dto.basePrice ??
        (await this.pricingService.computeSuggestedBasePrice(cost));
      const sale = await this.pricingService.computeSalePrice(base);
      product.costPrice = cost.toFixed(2);
      product.basePrice = base.toFixed(2);
      product.salePrice = sale.toFixed(2);
    }

    if (dto.compat) {
      await this.dataSource.manager.delete(ProductCompat, { productId: id });
      product.compat = dto.compat.map((c) =>
        this.dataSource.manager.create(ProductCompat, {
          vehicleBrand: c.vehicleBrand,
          vehicleModel: c.vehicleModel,
          yearFrom: c.yearFrom ?? null,
          yearTo: c.yearTo ?? null,
          engineType: c.engineType ?? null,
        }),
      );
    }

    try {
      const saved = await this.productRepo.save(product);
      await this.auditService.record({
        userId: user.id,
        action: 'PRODUCT:UPDATE',
        resourceType: 'products',
        resourceId: id,
        metadata: changed,
        request: req,
      });
      return saved;
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new DomainException(
          409,
          'Ya existe un repuesto con el mismo SKU, OEM o código de barras',
        );
      }
      throw err;
    }
  }

  async remove(id: number, user: AuthUser, req: Request): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
    await this.auditService.record({
      userId: user.id,
      action: 'PRODUCT:DELETE',
      resourceType: 'products',
      resourceId: id,
      metadata: { sku: product.sku, name: product.name },
      request: req,
    });
  }

  /** Recarga el precio de venta de varios productos (p.ej. al cambiar el IVA). */
  async recalculateSalePrices(ids: number[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const taxRate = await this.pricingService.getTaxRate();
    const products = await this.productRepo.find({ where: { id: In(ids) } });
    for (const p of products) {
      const sale = await this.pricingService.computeSalePrice(
        Number(p.basePrice),
        taxRate,
      );
      p.salePrice = sale.toFixed(2);
    }
    await this.productRepo.save(products);
    return products.length;
  }

  private isUniqueViolation(err: unknown): boolean {
    const e = err as { driverError?: { code?: string } };
    return e?.driverError?.code === '23505';
  }

  /** Genera un SKU automático (AUTO-00001, AUTO-00002, …) sin chocar con los existentes. */
  private async generateSku(): Promise<string> {
    const rows = await this.productRepo.query<Array<{ next: string }>>(
      `SELECT COALESCE(MAX((substring(sku FROM '^AUTO-([0-9]+)$'))::INTEGER), 0) + 1 AS next
         FROM products
        WHERE sku ~ '^AUTO-[0-9]+$'`,
    );
    const n = Number(rows[0]?.next ?? 1);
    return `AUTO-${String(n).padStart(5, '0')}`;
  }

  /** Encabezados de la plantilla de importación (fáciles de llenar). */
  private static readonly IMPORT_HEADERS = [
    'SKU',
    'NOMBRE',
    'OEM_CODE',
    'BARCODE',
    'CATEGORIA',
    'MARCA',
    'PROCEDENCIA',
    'UNIDAD',
    'STOCK',
    'STOCK_MINIMO',
    'COSTO',
    'PVP_BASE',
    'PASILLO',
    'ESTANTE',
    'NIVEL',
    'CASILLA',
  ];

  private static readonly EXAMPLE_ROW = [
    'FA-999',
    'Filtro de Combustible',
    '15560-RTA-003',
    '7501234560099',
    'Filtros',
    'Honda',
    'Importado',
    'uds',
    '10',
    '2',
    '12.50',
    '18.75',
    'A',
    '1',
    '2',
    '3',
  ];

  /** CSV con encabezados + fila de ejemplo para importar productos. */
  getImportTemplate(): string {
    const csv = (row: string[]) => row.join(',');
    return [csv(CatalogService.IMPORT_HEADERS), csv(CatalogService.EXAMPLE_ROW)]
      .join('\n');
  }

  /**
   * Importa productos desde un archivo CSV o XLSX. Crea los que no existen
   * (por SKU) y actualiza los existentes. Devuelve un resumen de resultados.
   */
  async importProducts(
    buffer: Buffer,
    filename: string,
    user: AuthUser,
    req: Request,
  ): Promise<{ created: number; updated: number; errors: Array<{ row: number; message: string }> }> {
    const workbook = new ExcelJS.Workbook();
    let sheet: ExcelJS.Worksheet;
    if (filename.toLowerCase().endsWith('.xlsx')) {
      await workbook.xlsx.read(Readable.from(buffer));
      sheet = workbook.worksheets[0];
    } else {
      await workbook.csv.read(Readable.from(buffer));
      sheet = workbook.worksheets[0];
    }
    if (!sheet) {
      throw new DomainException(400, 'El archivo está vacío o no tiene hoja');
    }

    const headerRow = sheet.getRow(1);
    const map = new Map<string, number>();
    headerRow.eachCell((cell, col) => {
      const header = CatalogService.normalizeHeader(String(cell.value ?? ''));
      if (header) map.set(header, col);
    });

    const get = (row: ExcelJS.Row, key: string): string | null => {
      const col = map.get(key);
      if (!col) return null;
      const v = row.getCell(col).value;
      if (v === null || v === undefined) return null;
      return String(v).trim();
    };

    const results = { created: 0, updated: 0, errors: [] as Array<{ row: number; message: string }> };
    const taxRate = await this.pricingService.getTaxRate();

    const rowCount = sheet.rowCount;
    for (let r = 2; r <= rowCount; r += 1) {
      const row = sheet.getRow(r);
      try {
        const sku = get(row, 'SKU');
        const name = get(row, 'NOMBRE');
        const costRaw = get(row, 'COSTO');
        if (!sku || !name || !costRaw) {
          throw new DomainException(
            400,
            `Faltan datos obligatorios (SKU, NOMBRE y COSTO). Fila: "${(row.getCell(1).value ?? '').toString()}"`,
          );
        }
        const costPrice = Number(costRaw);
        if (!Number.isFinite(costPrice) || costPrice < 0) {
          throw new DomainException(400, `COSTO inválido: "${costRaw}"`);
        }
        const baseRaw = get(row, 'PVP_BASE');
        const basePrice =
          baseRaw !== null && baseRaw !== ''
            ? Number(baseRaw)
            : await this.pricingService.computeSuggestedBasePrice(costPrice);
        const salePrice = await this.pricingService.computeSalePrice(
          basePrice,
          taxRate,
        );

        const existing = await this.productRepo.findOne({ where: { sku } });
        const data: Partial<Product> = {
          oemCode: get(row, 'OEM_CODE'),
          barcode: get(row, 'BARCODE'),
          name,
          category: get(row, 'CATEGORIA'),
          brand: get(row, 'MARCA'),
          provenance: get(row, 'PROCEDENCIA'),
          unit: get(row, 'UNIDAD') ?? 'uds',
          costPrice: costPrice.toFixed(2),
          basePrice: basePrice.toFixed(2),
          salePrice: salePrice.toFixed(2),
          warehouseAisle: get(row, 'PASILLO'),
          warehouseShelf: get(row, 'ESTANTE'),
          warehouseLevel: get(row, 'NIVEL'),
          warehouseBin: get(row, 'CASILLA'),
        };
        const stockRaw = get(row, 'STOCK');
        const minRaw = get(row, 'STOCK_MINIMO');
        const stock = stockRaw !== null && stockRaw !== '' ? Number(stockRaw) : undefined;
        const minStock = minRaw !== null && minRaw !== '' ? Number(minRaw) : undefined;

        if (existing) {
          Object.assign(existing, data);
          if (stock !== undefined && Number.isFinite(stock)) existing.stock = Math.max(0, Math.trunc(stock));
          if (minStock !== undefined && Number.isFinite(minStock)) existing.minStock = Math.max(0, Math.trunc(minStock));
          await this.productRepo.save(existing);
          results.updated += 1;
        } else {
          const product = this.productRepo.create({
            ...data,
            sku,
            stock: stock !== undefined && Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0,
            minStock: minStock !== undefined && Number.isFinite(minStock) ? Math.max(0, Math.trunc(minStock)) : 0,
          } as Partial<Product>);
          await this.productRepo.save(product);
          results.created += 1;
        }
      } catch (err) {
        const message = err instanceof DomainException ? err.message : 'Error inesperado';
        results.errors.push({ row: r, message });
      }
    }

    await this.auditService.record({
      userId: user.id,
      action: 'PRODUCT:IMPORT',
      resourceType: 'products',
      resourceId: filename,
      metadata: { created: results.created, updated: results.updated, errors: results.errors.length },
      request: req,
    });

    return results;
  }

  private static normalizeHeader(value: string): string | null {
    const clean = value
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .trim();
    if (!clean) return null;
    const aliases: Record<string, string> = {
      SKU: 'SKU',
      CODIGO: 'SKU',
      CODE: 'SKU',
      NOMBRE: 'NOMBRE',
      PRODUCTO: 'NOMBRE',
      OEM: 'OEM_CODE',
      OEM_CODE: 'OEM_CODE',
      CODIGO_OEM: 'OEM_CODE',
      BARCODE: 'BARCODE',
      CODIGO_BARRAS: 'BARCODE',
      CODIGODEBARRAS: 'BARCODE',
      CATEGORIA: 'CATEGORIA',
      MARCA: 'MARCA',
      PROCEDENCIA: 'PROCEDENCIA',
      ORIGEN: 'PROCEDENCIA',
      UNIDAD: 'UNIDAD',
      STOCK: 'STOCK',
      CANTIDAD: 'STOCK',
      STOCKMINIMO: 'STOCK_MINIMO',
      STOCK_MINIMO: 'STOCK_MINIMO',
      COSTO: 'COSTO',
      PRECIO_COSTO: 'COSTO',
      PVP_BASE: 'PVP_BASE',
      PVP: 'PVP_BASE',
      PASILLO: 'PASILLO',
      ESTANTE: 'ESTANTE',
      NIVEL: 'NIVEL',
      CASILLA: 'CASILLA',
    };
    return aliases[clean] ?? null;
  }
}
