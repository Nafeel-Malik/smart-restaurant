import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CustomerReservationQueryDto } from './dto/customer-reservation-query.dto';

@ApiTags('Customer Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/reservations')
export class CustomerReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: 'Create a table reservation. Status starts as confirmed (no manager confirmation flow).' })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Paginated, filterable history of the logged-in customer's reservations" })
  @Get()
  async findAll(@Req() req: any, @Query() query: CustomerReservationQueryDto) {
    return this.reservationsService.findMine(req.user.userId, query);
  }

  @ApiOperation({ summary: 'Get one reservation owned by the logged-in customer' })
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.reservationsService.findOneForCustomer(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Cancel a pending or confirmed upcoming reservation' })
  @Patch(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.reservationsService.cancelForCustomer(req.user.userId, id);
  }
}
