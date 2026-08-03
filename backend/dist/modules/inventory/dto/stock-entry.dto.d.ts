export declare class StockEntryItemDto {
    productId: number;
    quantity: number;
    unitCost: number;
}
export declare class StockEntryDto {
    concept?: string;
    items: StockEntryItemDto[];
}
