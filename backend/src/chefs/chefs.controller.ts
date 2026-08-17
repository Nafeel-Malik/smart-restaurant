import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ChefsService } from './chefs.service';
import { CreateChefDto } from './dto/create-chef.dto';
import { UpdateChefDto } from './dto/update-chef.dto';

@ApiTags('Chefs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('branch_manager')
@Controller('chefs')
export class ChefsController {
  constructor(private readonly chefsService: ChefsService) {}

  private getAssignedRestaurantId(req: any): string {
    const restaurantId = req.user?.assignedRestaurant;
    if (!restaurantId) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    return restaurantId.toString();
  }

  @ApiOperation({ summary: 'Create a new chef (Branch Manager only)' })
  @ApiResponse({ status: 201, description: 'Chef created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires branch_manager role and assigned restaurant)' })
  @Post()
  async create(@Body() createChefDto: CreateChefDto, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.chefsService.create(createChefDto, restaurantId);
  }

  @ApiOperation({ summary: 'Get all chefs for the assigned restaurant (Branch Manager only)' })
  @ApiResponse({ status: 200, description: 'List of chefs' })
  @Get()
  async findAll(@Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.chefsService.findAll(restaurantId);
  }

  @ApiOperation({ summary: 'Get chef by ID (Branch Manager only)' })
  @ApiResponse({ status: 200, description: 'Chef details' })
  @ApiResponse({ status: 404, description: 'Chef not found' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.chefsService.findOne(id, restaurantId);
  }

  @ApiOperation({ summary: 'Update chef by ID (Branch Manager only)' })
  @ApiResponse({ status: 200, description: 'Updated chef details' })
  @ApiResponse({ status: 404, description: 'Chef not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChefDto: UpdateChefDto,
    @Req() req: any,
  ) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.chefsService.update(id, updateChefDto, restaurantId);
  }

  @ApiOperation({ summary: 'Delete chef by ID (Branch Manager only)' })
  @ApiResponse({ status: 200, description: 'Chef deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chef not found' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restaurantId = this.getAssignedRestaurantId(req);
    return this.chefsService.remove(id, restaurantId);
  }
}
