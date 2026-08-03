import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SaleDocument } from '../sales/sale-document.entity';
import { Product } from '../catalog/product.entity';

export interface DashboardSummary {
  todaySales: { count: number; total: number };
  monthSales: { count: number; total: number };
  lowStockCount: number;
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: {
    id: number;
    sku: string;
    name: string;
    stock: number;
    minStock: number;
    salePrice: string;
  }[];
  recentSales: {
    id: number;
    docNumber: string;
    docType: string;
    total: string;
    customerName: string;
    createdAt: Date;
  }[];
}

/**
 * Reportes de negocio: resumen de dashboard, márgenes, stock crítico y
 * ventas. Consultas optimizadas con agregados SQL.
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SaleDocument)
    private readonly saleRepo: Repository<SaleDocument>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /** Resumen principal para el dashboard (RF-17). */
  async dashboard(): Promise<DashboardSummary> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaySales, monthSales] = await Promise.all([
      this.saleRepo
        .createQueryBuilder('d')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(d.total), 0)', 'total')
        .where('d.createdAt >= :start', { start: startOfDay })
        .andWhere('d.status = :status', { status: 'COMPLETED' })
        .getRawOne<{ count: string; total: string }>(),
      this.saleRepo
        .createQueryBuilder('d')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(d.total), 0)', 'total')
        .where('d.createdAt >= :start', { start: startOfMonth })
        .andWhere('d.status = :status', { status: 'COMPLETED' })
        .getRawOne<{ count: string; total: string }>(),
    ]);

    const [lowStockCount, totalProducts, totalStockValue] = await Promise.all([
      this.productRepo
        .createQueryBuilder('p')
        .where('p.stock <= p.minStock')
        .andWhere('p.isActive = true')
        .getCount(),
      this.productRepo
        .createQueryBuilder('p')
        .where('p.isActive = true')
        .getCount(),
      this.productRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.stock * p.costPrice), 0)', 'value')
        .where('p.isActive = true')
        .getRawOne<{ value: string }>(),
    ]);

    const lowStockProducts = await this.productRepo.find({
      where: { isActive: true },
      order: { stock: 'ASC' },
      take: 10,
    });
    const filteredLow = lowStockProducts.filter((p) => p.stock <= p.minStock);

    const recentSales = await this.saleRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      todaySales: {
        count: Number(todaySales?.count ?? 0),
        total: Number(todaySales?.total ?? 0),
      },
      monthSales: {
        count: Number(monthSales?.count ?? 0),
        total: Number(monthSales?.total ?? 0),
      },
      lowStockCount,
      totalProducts,
      totalStockValue: Number(totalStockValue?.value ?? 0),
      lowStockProducts: filteredLow.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        salePrice: p.salePrice,
      })),
      recentSales: recentSales.map((d) => ({
        id: d.id,
        docNumber: d.docNumber,
        docType: d.docType,
        total: d.total,
        customerName: d.customerName,
        createdAt: d.createdAt,
      })),
    };
  }

  /** Stock crítico (reposición, RF-09). */
  async lowStock(page = 1, pageSize = 20) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.stock <= p.minStock')
      .andWhere('p.isActive = true')
      .orderBy('p.stock', 'ASC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items, total, page, pageSize };
  }

  /** Resumen de ventas por día en un rango (para gráficas). */
  async salesByDay(
    from: string,
    to: string,
  ): Promise<{ day: string; total: number; count: number }[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate > toDate
    ) {
      return [];
    }

    const rows = await this.dataSource
      .createQueryBuilder()
      .select("to_char(d.createdAt, 'YYYY-MM-DD')", 'day')
      .addSelect('COALESCE(SUM(d.total), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .from(SaleDocument, 'd')
      .where('d.createdAt >= :from', { from: fromDate })
      .andWhere('d.createdAt < :to', {
        to: new Date(toDate.getTime() + 86400000),
      })
      .andWhere('d.status = :status', { status: 'COMPLETED' })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; total: string; count: string }>();

    return rows.map((r) => ({
      day: r.day,
      total: Number(r.total),
      count: Number(r.count),
    }));
  }
}
