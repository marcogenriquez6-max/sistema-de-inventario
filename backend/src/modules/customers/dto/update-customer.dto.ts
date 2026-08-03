import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';

/** Actualización parcial de cliente. */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
