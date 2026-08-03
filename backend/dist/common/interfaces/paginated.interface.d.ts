export interface Paginated<T> {
    items: T[];
    meta: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}
export declare function toPaginated<T>(items: T[], totalItems: number, page: number, pageSize: number): Paginated<T>;
