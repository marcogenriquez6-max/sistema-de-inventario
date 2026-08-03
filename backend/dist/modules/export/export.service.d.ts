import { DataSource } from 'typeorm';
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export interface ExportColumn {
    key: string;
    header: string;
    width?: number;
    align?: 'left' | 'right';
}
export interface ExportParams {
    q?: string;
    from?: string;
    to?: string;
}
export declare class ExportService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    private readonly resources;
    getFormats(): string[];
    getResourceNames(): string[];
    export(resource: string, format: ExportFormat, params: ExportParams): Promise<{
        buffer: Buffer;
        mime: string;
        extension: string;
    }>;
    private toCsv;
    private toExcel;
    private toPdf;
}
