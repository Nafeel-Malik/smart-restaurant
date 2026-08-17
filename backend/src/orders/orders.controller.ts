import { Body, Controller, ForbiddenException, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SuperAdmin, Role.BranchManager)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List orders (branch manager: own restaurant; super admin: all)' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @Get()
  async findAll(@Req() req: any, @Query('restaurantId') restaurantId?: string) {
    return this.ordersService.findStaffOrders(req.user, restaurantId);
  }

  @ApiOperation({ summary: 'Get one order for staff' })
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findStaffOrder(req.user, id);
  }

  @ApiOperation({ summary: 'Update order status (manager / super admin)' })
  @Patch(':id/status')
  async updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    if (!req.user?.role) {
      throw new ForbiddenException('User role not found');
    }
    return this.ordersService.updateStaffStatus(req.user, id, dto.status);
  }
}
