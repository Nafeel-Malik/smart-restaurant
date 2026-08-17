import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FavoritesService } from './favorites.service';

@ApiTags('Customer Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: 'List favorite restaurants for the logged-in customer' })
  @Get('restaurants')
  async listRestaurants(@Req() req: any) {
    return this.favoritesService.listRestaurants(req.user.userId);
  }

  @ApiOperation({ summary: 'Check if a restaurant is favorited' })
  @Get('restaurants/:restaurantId/check')
  async checkRestaurant(@Req() req: any, @Param('restaurantId') restaurantId: string) {
    return this.favoritesService.checkRestaurant(req.user.userId, restaurantId);
  }

  @ApiOperation({ summary: 'Add a restaurant to favorites' })
  @ApiResponse({ status: 201, description: 'Restaurant added to favorites' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  @ApiResponse({ status: 409, description: 'Restaurant is already favorited' })
  @Post('restaurants/:restaurantId')
  async addRestaurant(@Req() req: any, @Param('restaurantId') restaurantId: string) {
    return this.favoritesService.addRestaurant(req.user.userId, restaurantId);
  }

  @ApiOperation({ summary: 'Remove a restaurant from favorites' })
  @ApiResponse({ status: 404, description: 'Restaurant is not in favorites' })
  @Delete('restaurants/:restaurantId')
  async removeRestaurant(@Req() req: any, @Param('restaurantId') restaurantId: string) {
    return this.favoritesService.removeRestaurant(req.user.userId, restaurantId);
  }

  @ApiOperation({ summary: 'List favorite food items for the logged-in customer' })
  @Get('food')
  async listFood(@Req() req: any) {
    return this.favoritesService.listFood(req.user.userId);
  }

  @ApiOperation({ summary: 'Check if a food item is favorited' })
  @Get('food/:foodId/check')
  async checkFood(@Req() req: any, @Param('foodId') foodId: string) {
    return this.favoritesService.checkFood(req.user.userId, foodId);
  }

  @ApiOperation({ summary: 'Add a food item to favorites' })
  @ApiResponse({ status: 201, description: 'Food item added to favorites' })
  @ApiResponse({ status: 404, description: 'Food item not found' })
  @ApiResponse({ status: 409, description: 'Food item is already favorited' })
  @Post('food/:foodId')
  async addFood(@Req() req: any, @Param('foodId') foodId: string) {
    return this.favoritesService.addFood(req.user.userId, foodId);
  }

  @ApiOperation({ summary: 'Remove a food item from favorites' })
  @ApiResponse({ status: 404, description: 'Food item is not in favorites' })
  @Delete('food/:foodId')
  async removeFood(@Req() req: any, @Param('foodId') foodId: string) {
    return this.favoritesService.removeFood(req.user.userId, foodId);
  }
}
