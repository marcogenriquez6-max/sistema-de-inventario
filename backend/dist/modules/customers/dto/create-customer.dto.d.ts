export declare class CreateCustomerDto {
    code?: string;
    name: string;
    documentType?: 'CI' | 'NIT' | 'RUC' | 'PASSPORT';
    documentNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
}
