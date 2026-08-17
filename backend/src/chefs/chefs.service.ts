import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chef, ChefDocument } from './schemas/chef.schema';
import { CreateChefDto } from './dto/create-chef.dto';
import { UpdateChefDto } from './dto/update-chef.dto';

@Injectable()
export class ChefsService {
  constructor(
    @InjectModel(Chef.name) private chefModel: Model<ChefDocument>,
  ) {}

  async create(createChefDto: CreateChefDto, restaurantId: string): Promise<ChefDocument> {
    const newChef = new this.chefModel({
      ...createChefDto,
      restaurant: new Types.ObjectId(restaurantId),
    });
    return newChef.save();
  }

  async findAll(restaurantId: string): Promise<ChefDocument[]> {
    return this.chefModel.find({ restaurant: new Types.ObjectId(restaurantId) }).exec();
  }

  async findOne(id: string, restaurantId: string): Promise<ChefDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid chef ID format`);
    }
    const chef = await this.chefModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!chef) {
      throw new NotFoundException(`Chef with ID "${id}" not found`);
    }
    return chef;
  }

  async update(id: string, updateChefDto: UpdateChefDto, restaurantId: string): Promise<ChefDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid chef ID format`);
    }
    const updatedChef = await this.chefModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        restaurant: new Types.ObjectId(restaurantId),
      },
      updateChefDto,
      { new: true },
    ).exec();

    if (!updatedChef) {
      throw new NotFoundException(`Chef with ID "${id}" not found`);
    }
    return updatedChef;
  }

  async remove(id: string, restaurantId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid chef ID format`);
    }
    const deleted = await this.chefModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!deleted) {
      throw new NotFoundException(`Chef with ID "${id}" not found`);
    }
    return { message: `Chef "${deleted.name}" deleted successfully` };
  }
}
