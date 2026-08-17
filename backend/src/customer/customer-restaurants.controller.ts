import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CustomerRestaurantsService } from './customer-restaurants.service';
import { ReservationsService } from '../reservations/reservations.service';

@ApiTags('Customer Restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/restaurants')
export class CustomerRestaurantsController {
  constructor(
    private readonly customerRestaurantsService: CustomerRestaurantsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @ApiOperation({ summary: 'List active restaurants for customers' })
  @ApiQuery({ name: 'search', required: false })
  @Get()
  async list(@Query('search') search?: string) {
    return this.customerRestaurantsService.listActive(search);
  }

  @ApiOperation({ summary: 'Get a restaurant menu grouped by category' })
  @Get(':id/menu')
  async menu(@Param('id') id: string) {
    return this.customerRestaurantsService.getMenu(id);
  }

  @ApiOperation({ summary: 'List available reservation time slots for a restaurant on a date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-08-20' })
  @ApiQuery({ name: 'partySize', required: false, example: 4 })
  @Get(':id/available-slots')
  async availableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('partySize') partySize?: string,
  ) {
    const parsedPartySize = partySize === undefined || partySize === '' ? undefined : Number(partySize);
    return this.reservationsService.getAvailableSlots(id, date, parsedPartySize);
  }

  @ApiOperation({ summary: 'Get public restaurant details' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerRestaurantsService.findOne(id);
  }
}
