import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@ApiTags('Menu Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('branch_manager')
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  private getAssignedRestaurantId(req: any): string {
    const restaurantId = req.user?.assignedRestaurant;
    if (!restaurantId) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    return restaurantId.toString();
  }

  @ApiOperation({ summary: 'Create a new menu item (Branch Manager only)' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully' })
  @Post()
  async create(@Body() createMenuItemDto: CreateMenuItemDto, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.menuItemsService.create(createMenuItemDto, restaurantId);
  }

  @ApiOperation({ summary: 'Get all menu items for the assigned restaurant (Branch Manager only)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Optional Category ID to filter by' })
  @Get()
  async findAll(@Req() req: any, @Query('category') categoryId?: string) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.menuItemsService.findAll(restaurantId, categoryId);
  }

  @ApiOperation({ summary: 'Get menu item by ID (Branch Manager only)' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.menuItemsService.findOne(id, restaurantId);
  }

  @ApiOperation({ summary: 'Update menu item by ID (Branch Manager only)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.menuItemsService.update(id, updateMenuItemDto, restaurantId);
  }

  @ApiOperation({ summary: 'Delete menu item by ID (Branch Manager only)' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.menuItemsService.remove(id, restaurantId);
  }
}
