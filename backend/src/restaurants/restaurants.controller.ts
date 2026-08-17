import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';

@ApiTags('Restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: 'Create a new restaurant branch (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Restaurant branch created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Post()
  async create(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(createRestaurantDto);
  }

  @ApiOperation({ summary: 'Get all restaurant branches (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all restaurant branches' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Get()
  async findAll() {
    return this.restaurantsService.findAll();
  }

  @ApiOperation({ summary: 'Get restaurant branch by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant branch details' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update restaurant branch or toggle status 0/1 (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Updated restaurant branch details' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @ApiOperation({ summary: 'Delete restaurant branch by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant branch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }

  @ApiOperation({ summary: 'Assign a branch_manager user to a restaurant branch (Super Admin only). Reassigns automatically if either side was already linked elsewhere.' })
  @ApiResponse({ status: 200, description: 'Manager assigned successfully' })
  @ApiResponse({ status: 400, description: 'User is not a branch_manager' })
  @ApiResponse({ status: 404, description: 'Restaurant or user not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Patch(':id/assign-manager')
  async assignManager(
    @Param('id') id: string,
    @Body() dto: AssignManagerDto,
  ) {
    return this.restaurantsService.assignManager(id, dto.managerId);
  }

  @ApiOperation({ summary: 'Unassign current manager from a restaurant branch (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Manager unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Patch(':id/unassign-manager')
  async unassignManager(@Param('id') id: string) {
    return this.restaurantsService.unassignManager(id);
  }
}
