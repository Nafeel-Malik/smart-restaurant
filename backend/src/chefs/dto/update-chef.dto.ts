import { PartialType } from '@nestjs/swagger';
import { CreateChefDto } from './create-chef.dto';

export class UpdateChefDto extends PartialType(CreateChefDto) {}
