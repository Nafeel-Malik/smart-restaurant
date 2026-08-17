import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { isValidPhone, normalizePhone } from '../common/utils/phone.util';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(customerId: string, dto: CreateAddressDto): Promise<AddressDocument> {
    const phone = this.requirePhone(dto.phone);

    if (dto.isDefault) {
      await this.unsetDefaults(customerId);
    }

    const created = await this.addressModel.create({
      customerId: new Types.ObjectId(customerId),
      label: dto.label.trim(),
      fullAddress: dto.fullAddress.trim(),
      city: dto.city.trim(),
      area: dto.area?.trim() || null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      phone,
      isDefault: Boolean(dto.isDefault),
    });

    return created;
  }

  async findAll(customerId: string): Promise<AddressDocument[]> {
    return this.addressModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async findOne(customerId: string, id: string): Promise<AddressDocument> {
    return this.findOwned(customerId, id);
  }

  async update(customerId: string, id: string, dto: UpdateAddressDto): Promise<AddressDocument> {
    const address = await this.findOwned(customerId, id);

    if (dto.label !== undefined) address.label = dto.label.trim();
    if (dto.fullAddress !== undefined) address.fullAddress = dto.fullAddress.trim();
    if (dto.city !== undefined) address.city = dto.city.trim();
    if (dto.area !== undefined) address.area = dto.area?.trim() || null;
    if (dto.latitude !== undefined) address.latitude = dto.latitude ?? null;
    if (dto.longitude !== undefined) address.longitude = dto.longitude ?? null;
    if (dto.phone !== undefined) {
      address.phone = this.requirePhone(dto.phone);
    }

    if (dto.isDefault === true) {
      await this.unsetDefaults(customerId);
      address.isDefault = true;
    } else if (dto.isDefault === false) {
      address.isDefault = false;
    }

    await address.save();
    return address;
  }

  async remove(customerId: string, id: string): Promise<{ message: string }> {
    const address = await this.findOwned(customerId, id);
    await this.addressModel.findByIdAndDelete(address._id).exec();
    return { message: 'Address deleted successfully' };
  }

  async setDefault(customerId: string, id: string): Promise<AddressDocument> {
    const address = await this.findOwned(customerId, id);
    await this.unsetDefaults(customerId);
    address.isDefault = true;
    await address.save();
    return address;
  }

  private requirePhone(phone?: string | null): string {
    const normalized = normalizePhone(phone || '');
    if (!normalized) {
      throw new BadRequestException('Phone number is required');
    }
    if (!isValidPhone(normalized)) {
      throw new BadRequestException(
        'Phone must be 7–15 digits and may include spaces, dashes, or a leading +',
      );
    }
    return normalized;
  }

  private async findOwned(customerId: string, id: string): Promise<AddressDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Address not found');
    }

    const address = await this.addressModel
      .findOne({
        _id: new Types.ObjectId(id),
        customerId: new Types.ObjectId(customerId),
      })
      .exec();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  private async unsetDefaults(customerId: string) {
    await this.addressModel
      .updateMany(
        { customerId: new Types.ObjectId(customerId), isDefault: true },
        { $set: { isDefault: false } },
      )
      .exec();
  }
}
