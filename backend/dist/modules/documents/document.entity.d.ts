export declare class DocumentRecord {
    id: number;
    name: string;
    fileType: string;
    category: string | null;
    filePath: string | null;
    referenceType: string | null;
    referenceId: string | null;
    uploadedBy: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
