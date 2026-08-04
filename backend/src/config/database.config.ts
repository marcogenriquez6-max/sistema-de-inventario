import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
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
    retryAttempts: Number(process.env.DATABASE_RETRY_ATTEMPTS ?? 30),
    retryDelay: Number(process.env.DATABASE_RETRY_DELAY ?? 2000),
    extra: {
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      connectionTimeoutMillis: Number(
        process.env.DATABASE_CONNECTION_TIMEOUT ?? 5000,
      ),
    },
  }),
);
