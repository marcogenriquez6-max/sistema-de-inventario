import { ConfigService } from '@nestjs/config';
export interface ModuleStatus {
    name: string;
    slug: string;
    enabled: boolean;
    description: string;
    category: 'core' | 'operational' | 'financial' | 'support';
}
export declare class ModuleRegistryService {
    private readonly configService;
    private readonly modules;
    constructor(configService: ConfigService);
    getModules(): ModuleStatus[];
    getEnabledCount(): number;
}
