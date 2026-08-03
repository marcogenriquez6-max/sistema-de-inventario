import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('Repuestos ERP API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health → liveness ok', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('ok');
      });
  });

  it('GET /api/health/db → conexión con PostgreSQL ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health/db')
      .expect(200);
    expect(res.body.data.database).toBe('connected');
  });

  it('POST /api/auth/login con credenciales inválidas → 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nadie@test.com', password: 'incorrecta' })
      .expect(401);
  });

  it('POST /api/auth/login admin → 200 con tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@sistema.com', password: 'Admin@123' })
      .expect(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
    return res;
  });

  it('GET /api/products sin token → 401', () => {
    return request(app.getHttpServer()).get('/api/products').expect(401);
  });

  it('GET /api/products con token → 200 con productos', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@sistema.com', password: 'Admin@123' })
      .expect(200);
    const token = login.body.data.tokens.accessToken;
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.meta.totalItems).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/settings/public/tax_rate → parámetro público IVA', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/settings/public/tax_rate')
      .expect(200);
    expect(res.body.data.key).toBe('tax_rate');
    expect(Number(res.body.data.value.value)).toBeGreaterThan(0);
  });
});
