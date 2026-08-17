import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OrdersService } from '../orders/orders.service';
import { UpsertPreOrderDto } from '../orders/dto/upsert-pre-order.dto';

@ApiTags('Customer Reservation Pre-Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/reservations')
export class CustomerPreOrderController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create a dine-in pre-order attached to a reservation' })
  @Post(':reservationId/pre-order')
  async create(@Req() req: any, @Param('reservationId') reservationId: string, @Body() dto: UpsertPreOrderDto) {
    return this.ordersService.createPreOrder(req.user.userId, reservationId, dto);
  }

  @ApiOperation({ summary: 'Get the pre-order attached to a reservation, if any' })
  @Get(':reservationId/pre-order')
  async findOne(@Req() req: any, @Param('reservationId') reservationId: string) {
    return this.ordersService.getPreOrder(req.user.userId, reservationId);
  }

  @ApiOperation({ summary: 'Replace pre-order items while the reservation is still pending or confirmed' })
  @Patch(':reservationId/pre-order')
  async update(@Req() req: any, @Param('reservationId') reservationId: string, @Body() dto: UpsertPreOrderDto) {
    return this.ordersService.updatePreOrder(req.user.userId, reservationId, dto);
  }

  @ApiOperation({ summary: 'Cancel the pre-order attached to a reservation' })
  @Delete(':reservationId/pre-order')
  async remove(@Req() req: any, @Param('reservationId') reservationId: string) {
    return this.ordersService.cancelPreOrder(req.user.userId, reservationId);
  }
}
