"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_document_entity_1 = require("../sales/sale-document.entity");
const product_entity_1 = require("../catalog/product.entity");
let ReportsService = class ReportsService {
    constructor(saleRepo, productRepo, dataSource) {
        this.saleRepo = saleRepo;
        this.productRepo = productRepo;
        this.dataSource = dataSource;
    }
    async dashboard() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todaySales, monthSales] = await Promise.all([
            this.saleRepo
                .createQueryBuilder('d')
                .select('COUNT(*)', 'count')
                .addSelect('COALESCE(SUM(d.total), 0)', 'total')
                .where('d.createdAt >= :start', { start: startOfDay })
                .andWhere('d.status = :status', { status: 'COMPLETED' })
                .getRawOne(),
            this.saleRepo
                .createQueryBuilder('d')
                .select('COUNT(*)', 'count')
                .addSelect('COALESCE(SUM(d.total), 0)', 'total')
                .where('d.createdAt >= :start', { start: startOfMonth })
                .andWhere('d.status = :status', { status: 'COMPLETED' })
                .getRawOne(),
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
                .getRawOne(),
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
    async salesByDay(from, to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (Number.isNaN(fromDate.getTime()) ||
            Number.isNaN(toDate.getTime()) ||
            fromDate > toDate) {
            return [];
        }
        const rows = await this.dataSource
            .createQueryBuilder()
            .select("to_char(d.createdAt, 'YYYY-MM-DD')", 'day')
            .addSelect('COALESCE(SUM(d.total), 0)', 'total')
            .addSelect('COUNT(*)', 'count')
            .from(sale_document_entity_1.SaleDocument, 'd')
            .where('d.createdAt >= :from', { from: fromDate })
            .andWhere('d.createdAt < :to', {
            to: new Date(toDate.getTime() + 86400000),
        })
            .andWhere('d.status = :status', { status: 'COMPLETED' })
            .groupBy('day')
            .orderBy('day', 'ASC')
            .getRawMany();
        return rows.map((r) => ({
            day: r.day,
            total: Number(r.total),
            count: Number(r.count),
        }));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_document_entity_1.SaleDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ReportsService);
//# sourceMappingURL=reports.service.js.map