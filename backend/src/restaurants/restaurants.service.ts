import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async create(createDto: CreateRestaurantDto): Promise<RestaurantDocument> {
    const newRestaurant = new this.restaurantModel({
      ...createDto,
      assignedManager: null,
    });
    return newRestaurant.save();
  }

  async findAll(): Promise<RestaurantDocument[]> {
    return this.restaurantModel
      .find()
      .populate('assignedManager', '-password')
      .exec();
  }

  async findOne(id: string): Promise<RestaurantDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${id}`);
    }
    const restaurant = await this.restaurantModel
      .findById(id)
      .populate('assignedManager', '-password')
      .exec();
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${id}" not found`);
    }
    return restaurant;
  }

  async update(id: string, updateDto: UpdateRestaurantDto): Promise<RestaurantDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${id}`);
    }

    const updatedRestaurant = await this.restaurantModel
      .findByIdAndUpdate(id, { ...updateDto }, { new: true })
      .populate('assignedManager', '-password')
      .exec();

    if (!updatedRestaurant) {
      throw new NotFoundException(`Restaurant with ID "${id}" not found`);
    }
    return updatedRestaurant;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${id}`);
    }

    const restaurant = await this.restaurantModel.findById(id).exec();
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${id}" not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.restaurantModel.findByIdAndDelete(id, { session });

      // If a manager was assigned, clear their assignedRestaurant reference
      if (restaurant.assignedManager) {
        await this.userModel.findByIdAndUpdate(
          restaurant.assignedManager,
          { assignedRestaurant: null },
          { session },
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return { message: `Restaurant "${restaurant.name}" deleted successfully` };
  }

  async assignManager(restaurantId: string, managerId: string): Promise<RestaurantDocument> {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${restaurantId}`);
    }
    if (!Types.ObjectId.isValid(managerId)) {
      throw new NotFoundException(`Invalid manager ID format: ${managerId}`);
    }

    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${restaurantId}" not found`);
    }

    const user = await this.userModel.findById(managerId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${managerId}" not found`);
    }

    if (user.role !== 'branch_manager') {
      throw new BadRequestException(`User "${user.username}" is not a branch_manager (role is "${user.role}")`);
    }

    const previousRestaurantManagerId = restaurant.assignedManager
      ? restaurant.assignedManager.toString()
      : null;
    const previousManagerRestaurantId = user.assignedRestaurant
      ? user.assignedRestaurant.toString()
      : null;

    if (previousRestaurantManagerId === managerId && previousManagerRestaurantId === restaurantId) {
      return this.findOne(restaurantId);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (previousRestaurantManagerId && previousRestaurantManagerId !== managerId) {
        await this.userModel.findByIdAndUpdate(
          previousRestaurantManagerId,
          { assignedRestaurant: null },
          { session },
        );
      }

      if (previousManagerRestaurantId && previousManagerRestaurantId !== restaurantId) {
        await this.restaurantModel.findByIdAndUpdate(
          previousManagerRestaurantId,
          { assignedManager: null },
          { session },
        );
      }

      await this.restaurantModel.findByIdAndUpdate(
        restaurantId,
        { assignedManager: new Types.ObjectId(managerId) },
        { session },
      );
      await this.userModel.findByIdAndUpdate(
        managerId,
        { assignedRestaurant: new Types.ObjectId(restaurantId) },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return this.findOne(restaurantId);
  }

  async unassignManager(restaurantId: string): Promise<RestaurantDocument> {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${restaurantId}`);
    }

    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${restaurantId}" not found`);
    }

    if (!restaurant.assignedManager) {
      return this.findOne(restaurantId);
    }

    const managerId = restaurant.assignedManager.toString();

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.restaurantModel.findByIdAndUpdate(
        restaurantId,
        { assignedManager: null },
        { session },
      );
      await this.userModel.findByIdAndUpdate(
        managerId,
        { assignedRestaurant: null },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return this.findOne(restaurantId);
  }
}
