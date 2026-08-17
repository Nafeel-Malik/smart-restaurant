import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new branch manager user, optionally assigned to a restaurant (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Branch manager user created successfully' })
  @ApiResponse({ status: 409, description: 'Username is already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Post('managers')
  async createManager(@Body() dto: CreateManagerDto) {
    return this.usersService.createManager(dto);
  }

  @ApiOperation({ summary: 'List all branch manager users (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all branch manager users with assignedRestaurant details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Get('managers')
  async findManagers() {
    return this.usersService.findManagers();
  }

  @ApiOperation({ summary: 'Update branch manager username and/or password (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch manager updated successfully' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  @ApiResponse({ status: 409, description: 'Username is already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Patch('managers/:id')
  async updateManager(
    @Param('id') id: string,
    @Body() dto: UpdateManagerDto,
  ) {
    return this.usersService.updateManager(id, dto);
  }

  @ApiOperation({ summary: 'Delete a branch manager user and unassign from restaurant (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch manager deleted successfully' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires super_admin role)' })
  @Delete('managers/:id')
  async deleteManager(@Param('id') id: string) {
    return this.usersService.deleteManager(id);
  }
}

