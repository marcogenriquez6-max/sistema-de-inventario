import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/** Actualización parcial de la ficha de repuesto. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
