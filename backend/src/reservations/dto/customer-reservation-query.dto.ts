import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedDateQueryDto } from '../../common/dto/paginated-date-query.dto';
import { ReservationStatus } from '../../common/enums/reservation-status.enum';

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
};

export class CustomerReservationQueryDto extends PaginatedDateQueryDto {
  @ApiPropertyOptional({ enum: ReservationStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
