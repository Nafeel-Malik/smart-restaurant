import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WaitersService } from './waiters.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { UpdateWaiterDto } from './dto/update-waiter.dto';
import { AssignTablesDto } from './dto/assign-tables.dto';

@ApiTags('Waiters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('branch_manager')
@Controller('waiters')
export class WaitersController {
  constructor(private readonly waitersService: WaitersService) {}

  private getAssignedRestaurantId(req: any): string {
    const restaurantId = req.user?.assignedRestaurant;
    if (!restaurantId) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    return restaurantId.toString();
  }

  @ApiOperation({ summary: 'Create a new waiter (Branch Manager only)' })
  @ApiResponse({ status: 201, description: 'Waiter created successfully' })
  @Post()
  async create(@Body() createWaiterDto: CreateWaiterDto, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.create(createWaiterDto, restaurantId);
  }

  @ApiOperation({ summary: 'Get all waiters for the assigned restaurant (Branch Manager only)' })
  @Get()
  async findAll(@Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.findAll(restaurantId);
  }

  @ApiOperation({ summary: 'Get waiter by ID (Branch Manager only)' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.findOne(id, restaurantId);
  }

  @ApiOperation({ summary: 'Update waiter by ID (Branch Manager only)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWaiterDto: UpdateWaiterDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.update(id, updateWaiterDto, restaurantId);
  }

  @ApiOperation({ summary: 'Delete waiter by ID (Branch Manager only)' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.remove(id, restaurantId);
  }

  @ApiOperation({ summary: 'Assign multiple tables to a waiter (Branch Manager only)' })
  @Patch(':id/assign-tables')
  async assignTables(
    @Param('id') id: string,
    @Body() dto: AssignTablesDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.waitersService.assignTables(id, dto.tableIds, restaurantId);
  }
}
