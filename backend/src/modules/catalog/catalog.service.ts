import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
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
 * Catálogo de repuestos: ficha multicódigo, compatibilidad, ubicación
 * física y cálculo de precios al alta/actualización (RF-01 a RF-06, RF-16).
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
      where: [{ sku: code }, { oemCode: code }, { barcode: code }],
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
            .orWhere('p.barcode ILIKE :q')
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

    const product = this.productRepo.create({
      sku: dto.sku,
      oemCode: dto.oemCode ?? null,
      barcode: dto.barcode ?? null,
      name: dto.name,
      category: dto.category ?? null,
      brand: dto.brand ?? null,
      unit: dto.unit ?? 'uds',
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      costPrice: dto.costPrice.toFixed(2),
      basePrice: basePrice.toFixed(2),
      salePrice: salePrice.toFixed(2),
      warehouseAisle: dto.warehouseAisle ?? null,
      warehouseShelf: dto.warehouseShelf ?? null,
      warehouseLevel: dto.warehouseLevel ?? null,
      warehouseBin: dto.warehouseBin ?? null,
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
          sku: dto.sku,
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
      barcode: dto.barcode ?? product.barcode,
      name: dto.name ?? product.name,
      category: dto.category !== undefined ? dto.category : product.category,
      brand: dto.brand ?? product.brand,
      unit: dto.unit ?? product.unit,
      minStock: dto.minStock ?? product.minStock,
      warehouseAisle:
        dto.warehouseAisle !== undefined
          ? dto.warehouseAisle
          : product.warehouseAisle,
      warehouseShelf:
        dto.warehouseShelf !== undefined
          ? dto.warehouseShelf
          : product.warehouseShelf,
      warehouseLevel:
        dto.warehouseLevel !== undefined
          ? dto.warehouseLevel
          : product.warehouseLevel,
      warehouseBin:
        dto.warehouseBin !== undefined
          ? dto.warehouseBin
          : product.warehouseBin,
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
}
