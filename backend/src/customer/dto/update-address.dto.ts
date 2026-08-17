import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

/** All fields optional; when `phone` is sent it must be non-empty and match the shared phone format. */
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
