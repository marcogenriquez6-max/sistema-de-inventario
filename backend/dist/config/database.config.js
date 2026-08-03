"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const config_1 = require("@nestjs/config");
exports.typeOrmConfig = (0, config_1.registerAs)('database', () => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    autoLoadEntities: true,
    extra: {
        max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    },
}));
//# sourceMappingURL=database.config.js.map