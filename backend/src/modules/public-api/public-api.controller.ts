import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from '../catalog/product.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

/**
 * API pública de consulta (catálogo y estado). No requiere autenticación
 * pero está limitada por rate limiting. Pensada para integraciones externas
 * y consultas de mostrador en kioscos.
 */
@ApiTags('API Pública')
@Controller('public')
export class PublicApiController {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  @Public()
  @Get('products')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Búsqueda pública de repuestos (paginada)' })
  async products(@Query() query: PublicSearchDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize ?? 20)));
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.isActive = true')
      .orderBy('p.name', 'ASC');

    if (query.q) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('p.sku ILIKE :q')
            .orWhere('p.oemCode ILIKE :q')
            .orWhere('p.name ILIKE :q');
        }),
        { q: `%${query.q}%` },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      items: items.map((p) => ({
        id: p.id,
        sku: p.sku,
        oemCode: p.oemCode,
        name: p.name,
        brand: p.brand,
        category: p.category,
        stock: p.stock,
        salePrice: p.salePrice,
      })),
      meta: {
        page,
        pageSize,
        totalItems: total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Estado del servicio (público)' })
  status() {
    return {
      service: 'sistema-repuestos-api',
      version: '1.0.0',
      status: 'operational',
    };
  }
}
