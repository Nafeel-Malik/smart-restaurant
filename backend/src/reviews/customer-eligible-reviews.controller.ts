import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ReviewsService } from './reviews.service';

@ApiTags('Customer Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/restaurants')
export class CustomerEligibleReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'Completed orders and reservations at this restaurant that the customer has not reviewed yet',
  })
  @Get(':id/eligible-reviews')
  async eligible(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.getEligible(req.user.userId, id);
  }
}
