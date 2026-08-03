export declare class CreateDocumentDto {
    name: string;
    fileType?: 'PDF' | 'IMAGE' | 'XLSX' | 'DOCX' | 'OTHER';
    category?: string;
    filePath?: string;
    referenceType?: string;
    referenceId?: number;
    notes?: string;
}
