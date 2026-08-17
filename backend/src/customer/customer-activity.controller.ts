import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CustomerService } from './customer.service';

@ApiTags('Customer Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/activity')
export class CustomerActivityController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Counts for the logged-in customer activity / history overview' })
  @Get('summary')
  async summary(@Req() req: any) {
    return this.customerService.getActivitySummary(req.user.userId);
  }
}
