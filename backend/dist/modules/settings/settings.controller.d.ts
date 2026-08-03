import { Request } from 'express';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
export declare class SettingsController {
    private readonly settingsService;
    private readonly auditService;
    constructor(settingsService: SettingsService, auditService: AuditService);
    getAll(): Promise<import("./settings.entity").Setting[]>;
    update(key: string, dto: UpdateSettingDto, user: AuthUser, req: Request): Promise<import("./settings.entity").Setting>;
    getPublic(key: string): Promise<{
        key: string;
        value: Record<string, unknown>;
    }>;
    history(key: string): Promise<import("./settings.entity").SettingHistory[]>;
}
