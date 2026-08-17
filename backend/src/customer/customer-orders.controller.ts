import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OrdersService } from '../orders/orders.service';
import { CreateCustomerOrderDto } from '../orders/dto/create-customer-order.dto';
import { CustomerOrderQueryDto } from '../orders/dto/customer-order-query.dto';

@ApiTags('Customer Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/orders')
export class CustomerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Place a delivery order' })
  @ApiResponse({ status: 201, description: 'Order created with pending status and pending payment' })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateCustomerOrderDto) {
    return this.ordersService.createCustomerOrder(req.user.userId, dto);
  }

  @ApiOperation({ summary: "Paginated, filterable history of the logged-in customer's orders (including pre-orders)" })
  @Get()
  async findAll(@Req() req: any, @Query() query: CustomerOrderQueryDto) {
    return this.ordersService.findCustomerOrders(req.user.userId, query);
  }

  @ApiOperation({ summary: 'Receipt-style breakdown of one order owned by the logged-in customer' })
  @Get(':id/receipt')
  async receipt(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getCustomerOrderReceipt(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Get one order owned by the logged-in customer' })
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findCustomerOrder(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Cancel a pending or confirmed order' })
  @Patch(':id/cancel')
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.cancelCustomerOrder(req.user.userId, id);
  }
}

