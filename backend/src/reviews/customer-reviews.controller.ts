import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('Customer Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/reviews')
export class CustomerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Create a review for a completed order or reservation' })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: "List the logged-in customer's reviews" })
  @Get()
  async findMine(@Req() req: any) {
    return this.reviewsService.findMine(req.user.userId);
  }

  @ApiOperation({ summary: 'Update rating or comment on your own review' })
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.updateMine(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Delete your own review' })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.deleteMine(req.user.userId, id);
  }
}
