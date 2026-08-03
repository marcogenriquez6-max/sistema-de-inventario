export declare class SaleItemDto {
    productId: number;
    quantity: number;
}
export declare class CreateSaleDto {
    docType: 'NOTA' | 'FACTURA';
    customerName: string;
    customerDoc?: string;
    items: SaleItemDto[];
}
