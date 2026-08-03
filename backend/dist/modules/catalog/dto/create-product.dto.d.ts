declare class CompatEntryDto {
    vehicleBrand: string;
    vehicleModel: string;
    yearFrom?: number;
    yearTo?: number;
    engineType?: string;
}
export declare class CreateProductDto {
    sku: string;
    oemCode?: string;
    barcode?: string;
    name: string;
    category?: string;
    brand?: string;
    unit?: string;
    costPrice: number;
    basePrice?: number;
    stock?: number;
    minStock?: number;
    warehouseAisle?: string;
    warehouseShelf?: string;
    warehouseLevel?: string;
    warehouseBin?: string;
    compat?: CompatEntryDto[];
}
export { CompatEntryDto };
