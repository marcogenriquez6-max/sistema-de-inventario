import { Request } from 'express';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    findByCode(code: string): Promise<import("./product.entity").Product | null>;
    findAll(query: QueryProductDto): Promise<import("../../common/interfaces/paginated.interface").Paginated<import("./product.entity").Product>>;
    findOne(id: number): Promise<import("./product.entity").Product>;
    create(dto: CreateProductDto, user: AuthUser, req: Request): Promise<import("./product.entity").Product>;
    update(id: number, dto: UpdateProductDto, user: AuthUser, req: Request): Promise<import("./product.entity").Product>;
    remove(id: number, user: AuthUser, req: Request): Promise<void>;
}
