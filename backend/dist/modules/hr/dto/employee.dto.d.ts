export declare class CreateEmployeeDto {
    code: string;
    fullName: string;
    documentNumber?: string;
    position?: string;
    department?: string;
    phone?: string;
    email?: string;
    hireDate?: string;
    salary?: number;
    isActive?: boolean;
}
declare const UpdateEmployeeDto_base: import("@nestjs/common").Type<Partial<CreateEmployeeDto>>;
export declare class UpdateEmployeeDto extends UpdateEmployeeDto_base {
}
export {};
