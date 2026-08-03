import { Response } from 'express';
import { ExportService, ExportFormat } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    formats(): {
        formats: string[];
        resources: string[];
    };
    export(resource: string, format: ExportFormat | undefined, q: string | undefined, from: string | undefined, to: string | undefined, res: Response): Promise<void>;
}
