import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { AssignWaiterDto } from './dto/assign-waiter.dto';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('branch_manager')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  private getAssignedRestaurantId(req: any): string {
    const restaurantId = req.user?.assignedRestaurant;
    if (!restaurantId) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    return restaurantId.toString();
  }

  @ApiOperation({ summary: 'Create a new table (Branch Manager only)' })
  @ApiResponse({ status: 201, description: 'Table created successfully' })
  @Post()
  async create(@Body() createTableDto: CreateTableDto, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.create(createTableDto, restaurantId);
  }

  @ApiOperation({ summary: 'Get all tables for the assigned restaurant (Branch Manager only)' })
  @Get()
  async findAll(@Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.findAll(restaurantId);
  }

  @ApiOperation({ summary: 'Get table by ID (Branch Manager only)' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.findOne(id, restaurantId);
  }

  @ApiOperation({ summary: 'Update table by ID (Branch Manager only)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.update(id, updateTableDto, restaurantId);
  }

  @ApiOperation({ summary: 'Delete table by ID (Branch Manager only)' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.remove(id, restaurantId);
  }

  @ApiOperation({ summary: 'Assign a waiter to a table (Branch Manager only)' })
  @Patch(':id/assign-waiter')
  async assignWaiter(
    @Param('id') id: string,
    @Body() dto: AssignWaiterDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.tablesService.assignWaiter(id, dto.waiterId, restaurantId);
  }
}
