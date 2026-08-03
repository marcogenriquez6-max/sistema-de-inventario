import { DataSource, Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductCode } from './product-code.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { PricingService } from '../pricing/pricing.service';
import { Paginated } from '../../common/interfaces/paginated.interface';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Request } from 'express';
export declare class CatalogService {
    private readonly productRepo;
    private readonly codeRepo;
    private readonly pricingService;
    private readonly auditService;
    private readonly dataSource;
    constructor(productRepo: Repository<Product>, codeRepo: Repository<ProductCode>, pricingService: PricingService, auditService: AuditService, dataSource: DataSource);
    findByCode(code: string): Promise<Product | null>;
    findAll(query: QueryProductDto): Promise<Paginated<Product>>;
    findOne(id: number): Promise<Product>;
    create(dto: CreateProductDto, user: AuthUser, req: Request): Promise<Product>;
    update(id: number, dto: UpdateProductDto, user: AuthUser, req: Request): Promise<Product>;
    remove(id: number, user: AuthUser, req: Request): Promise<void>;
    recalculateSalePrices(ids: number[]): Promise<number>;
    private isUniqueViolation;
}
