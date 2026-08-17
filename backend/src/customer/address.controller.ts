import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Customer)
@Controller('customer/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @ApiOperation({ summary: 'Create a delivery address for the logged-in customer' })
  @ApiResponse({ status: 201, description: 'Address created' })
  @Post()
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressService.create(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'List all delivery addresses for the logged-in customer' })
  @Get()
  async findAll(@Req() req: any) {
    return this.addressService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: 'Get one delivery address owned by the logged-in customer' })
  @ApiResponse({ status: 404, description: 'Address not found or not owned by this customer' })
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.addressService.findOne(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Set an address as the default delivery address' })
  @ApiResponse({ status: 404, description: 'Address not found or not owned by this customer' })
  @Patch(':id/set-default')
  async setDefault(@Req() req: any, @Param('id') id: string) {
    return this.addressService.setDefault(req.user.userId, id);
  }

  @ApiOperation({ summary: 'Update a delivery address owned by the logged-in customer' })
  @ApiResponse({ status: 404, description: 'Address not found or not owned by this customer' })
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a delivery address. Does not auto-promote another default.' })
  @ApiResponse({ status: 404, description: 'Address not found or not owned by this customer' })
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.addressService.remove(req.user.userId, id);
  }
}
