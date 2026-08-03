export declare class PurchaseItemDto {
    productId: number;
    quantity: number;
    unitCost: number;
}
export declare class CreatePurchaseDto {
    supplierId: number;
    invoiceNumber?: string;
    items: PurchaseItemDto[];
}
