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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let SearchService = class SearchService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async search(q, limit = 8) {
        const term = q.trim();
        if (!term) {
            return {
                products: [],
                customers: [],
                suppliers: [],
                employees: [],
                sales: [],
            };
        }
        const like = `%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
        const [products, customers, suppliers, employees, sales] = await Promise.all([
            this.dataSource.query(`SELECT id, sku, name, category, brand, stock, sale_price AS "salePrice", is_active AS "isActive"
           FROM products
          WHERE (name ILIKE $1 OR sku ILIKE $1 OR oem_code ILIKE $1 OR barcode ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`, [like]),
            this.dataSource.query(`SELECT id, code, name, document_type AS "documentType", document_number AS "documentNumber", is_active AS "isActive"
           FROM customers
          WHERE (name ILIKE $1 OR code ILIKE $1 OR document_number ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`, [like]),
            this.dataSource.query(`SELECT id, code, name, tax_id AS "taxId", is_active AS "isActive"
           FROM suppliers
          WHERE (name ILIKE $1 OR code ILIKE $1 OR tax_id ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`, [like]),
            this.dataSource.query(`SELECT id, code, full_name AS "fullName", position, department, is_active AS "isActive"
           FROM employees
          WHERE (full_name ILIKE $1 OR code ILIKE $1 OR document_number ILIKE $1 OR email ILIKE $1)
          ORDER BY full_name
          LIMIT ${limit}`, [like]),
            this.dataSource.query(`SELECT id, doc_number AS "docNumber", doc_type AS "docType", customer_name AS "customerName",
                total, status
           FROM sale_documents
          WHERE (doc_number ILIKE $1 OR customer_name ILIKE $1)
          ORDER BY id DESC
          LIMIT ${limit}`, [like]),
        ]);
        return { products, customers, suppliers, employees, sales };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], SearchService);
//# sourceMappingURL=search.service.js.map