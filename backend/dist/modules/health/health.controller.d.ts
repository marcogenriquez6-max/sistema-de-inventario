import { DataSource } from 'typeorm';
import { ModuleRegistryService } from '../../common/services/module-registry.service';
export declare class HealthController {
    private readonly dataSource;
    private readonly moduleRegistry;
    constructor(dataSource: DataSource, moduleRegistry: ModuleRegistryService);
    liveness(): {
        status: string;
        uptime: number;
        timestamp: string;
    };
    readiness(): Promise<{
        status: string;
        database: string;
        timestamp: string;
    }>;
    modules(): Promise<{
        enabledCount: number;
        totalCount: number;
        modules: import("../../common/services/module-registry.service").ModuleStatus[];
        timestamp: string;
    }>;
}
