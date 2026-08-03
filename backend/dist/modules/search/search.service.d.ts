import { DataSource } from 'typeorm';
export interface SearchResults {
    products: Array<Record<string, unknown>>;
    customers: Array<Record<string, unknown>>;
    suppliers: Array<Record<string, unknown>>;
    employees: Array<Record<string, unknown>>;
    sales: Array<Record<string, unknown>>;
}
export declare class SearchService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    search(q: string, limit?: number): Promise<SearchResults>;
}
