import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('branch_manager')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private getAssignedRestaurantId(req: any): string {
    const restaurantId = req.user?.assignedRestaurant;
    if (!restaurantId) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    return restaurantId.toString();
  }

  @ApiOperation({ summary: 'Create a new category (Branch Manager only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.categoriesService.create(createCategoryDto, restaurantId);
  }

  @ApiOperation({ summary: 'Get all categories for the assigned restaurant (Branch Manager only)' })
  @Get()
  async findAll(@Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.categoriesService.findAll(restaurantId);
  }

  @ApiOperation({ summary: 'Get category by ID (Branch Manager only)' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.categoriesService.findOne(id, restaurantId);
  }

  @ApiOperation({ summary: 'Update category by ID (Branch Manager only)' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.categoriesService.update(id, updateCategoryDto, restaurantId);
  }

  @ApiOperation({ summary: 'Delete category by ID (Branch Manager only)' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.categoriesService.remove(id, restaurantId);
  }
}
