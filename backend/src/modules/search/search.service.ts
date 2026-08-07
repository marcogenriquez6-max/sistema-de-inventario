import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface SearchResults {
  products: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
  suppliers: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
  sales: Array<Record<string, unknown>>;
}

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(q: string, limit = 8): Promise<SearchResults> {
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

    const [products, customers, suppliers, employees, sales] =
      await Promise.all([
        this.dataSource.query(
          `SELECT id, sku, name, category, brand, stock, sale_price AS "salePrice", is_active AS "isActive"
           FROM products
          WHERE (name ILIKE $1 OR sku ILIKE $1 OR oem_code ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`,
          [like],
        ),
        this.dataSource.query(
          `SELECT id, code, name, document_type AS "documentType", document_number AS "documentNumber", is_active AS "isActive"
           FROM customers
          WHERE (name ILIKE $1 OR code ILIKE $1 OR document_number ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`,
          [like],
        ),
        this.dataSource.query(
          `SELECT id, code, name, tax_id AS "taxId", is_active AS "isActive"
           FROM suppliers
          WHERE (name ILIKE $1 OR code ILIKE $1 OR tax_id ILIKE $1)
          ORDER BY name
          LIMIT ${limit}`,
          [like],
        ),
        this.dataSource.query(
          `SELECT id, code, full_name AS "fullName", position, department, is_active AS "isActive"
           FROM employees
          WHERE (full_name ILIKE $1 OR code ILIKE $1 OR document_number ILIKE $1 OR email ILIKE $1)
          ORDER BY full_name
          LIMIT ${limit}`,
          [like],
        ),
        this.dataSource.query(
          `SELECT id, doc_number AS "docNumber", doc_type AS "docType", customer_name AS "customerName",
                total, status
           FROM sale_documents
          WHERE (doc_number ILIKE $1 OR customer_name ILIKE $1)
          ORDER BY id DESC
          LIMIT ${limit}`,
          [like],
        ),
      ]);

    return { products, customers, suppliers, employees, sales };
  }
}
