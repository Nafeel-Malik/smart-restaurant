import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedDateQueryDto } from '../../common/dto/paginated-date-query.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { OrderType } from '../../common/enums/order-type.enum';

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
};

export class CustomerOrderQueryDto extends PaginatedDateQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderType })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;
}
