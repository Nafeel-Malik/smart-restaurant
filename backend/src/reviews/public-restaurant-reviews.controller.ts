import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { PublicRestaurantReviewsQueryDto } from './dto/public-reviews-query.dto';

@ApiTags('Restaurant Reviews')
@Controller('restaurants')
export class PublicRestaurantReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Public paginated reviews for a restaurant (newest / highest / lowest)' })
  @Get(':id/reviews')
  async findAll(@Param('id') id: string, @Query() query: PublicRestaurantReviewsQueryDto) {
    return this.reviewsService.findPublicForRestaurant(id, query);
  }
}
