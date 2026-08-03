export declare class Setting {
    key: string;
    value: Record<string, unknown>;
    updatedBy: number | null;
    updatedAt: Date;
}
export declare class SettingHistory {
    id: number;
    key: string;
    value: Record<string, unknown>;
    changedBy: number | null;
    changedAt: Date;
}
