export declare class CreateSupplierDto {
    code: string;
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}
declare const UpdateSupplierDto_base: import("@nestjs/common").Type<Partial<CreateSupplierDto>>;
export declare class UpdateSupplierDto extends UpdateSupplierDto_base {
}
export {};
