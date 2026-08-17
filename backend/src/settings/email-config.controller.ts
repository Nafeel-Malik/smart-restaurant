import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailConfigService } from './email-config.service';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { TestEmailDto } from './dto/test-email.dto';

@ApiTags('Admin Email Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('admin/settings/email')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  @ApiOperation({ summary: 'Get current SMTP config (password masked). Superadmin only.' })
  @Get()
  async getConfig() {
    return this.emailConfigService.getPublicConfig();
  }

  @ApiOperation({ summary: 'Create or update SMTP config. Superadmin only.' })
  @Put()
  async upsert(@Req() req: any, @Body() dto: UpdateEmailConfigDto) {
    return this.emailConfigService.upsert(dto, req.user?.userId);
  }

  @ApiOperation({ summary: 'Send a test email using the currently saved SMTP config. Superadmin only.' })
  @Post('test')
  async test(@Body() dto: TestEmailDto) {
    return this.emailConfigService.sendTest(dto.to);
  }
}
