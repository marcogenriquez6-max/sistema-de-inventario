export declare class AdjustmentDto {
    productId: number;
    movementType: 'ADJUST' | 'MERMA' | 'RETURN';
    quantity: number;
    concept?: string;
}
