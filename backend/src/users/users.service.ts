import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async createManager(dto: CreateManagerDto): Promise<UserDocument> {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Username is already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const restaurantId = dto.restaurantId?.trim() || null;

    if (!restaurantId) {
      const newManager = new this.userModel({
        username: dto.username,
        password: hashedPassword,
        role: 'branch_manager',
        assignedRestaurant: null,
      });
      const saved = await newManager.save();
      return this.userModel
        .findById(saved._id)
        .select('-password')
        .populate('assignedRestaurant')
        .exec() as Promise<UserDocument>;
    }

    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new NotFoundException(`Invalid restaurant ID format: ${restaurantId}`);
    }

    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${restaurantId}" not found`);
    }

    const previousManagerId = restaurant.assignedManager
      ? restaurant.assignedManager.toString()
      : null;

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const [created] = await this.userModel.create(
        [
          {
            username: dto.username,
            password: hashedPassword,
            role: 'branch_manager',
            assignedRestaurant: new Types.ObjectId(restaurantId),
          },
        ],
        { session },
      );

      if (previousManagerId) {
        await this.userModel.findByIdAndUpdate(
          previousManagerId,
          { assignedRestaurant: null },
          { session },
        );
      }

      await this.restaurantModel.findByIdAndUpdate(
        restaurantId,
        { assignedManager: created._id },
        { session },
      );

      await session.commitTransaction();
      return this.userModel
        .findById(created._id)
        .select('-password')
        .populate('assignedRestaurant')
        .exec() as Promise<UserDocument>;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findManagers(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: 'branch_manager' })
      .select('-password')
      .populate('assignedRestaurant')
      .exec();
  }

  async updateManager(id: string, dto: UpdateManagerDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid manager ID format: ${id}`);
    }

    const user = await this.userModel.findById(id).exec();
    if (!user || user.role !== 'branch_manager') {
      throw new NotFoundException(`Manager with ID "${id}" not found`);
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.findByUsername(dto.username);
      if (existing) {
        throw new ConflictException('Username is already taken');
      }
      user.username = dto.username;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    await user.save();
    return this.userModel.findById(id).select('-password').populate('assignedRestaurant').exec() as Promise<UserDocument>;
  }

  async deleteManager(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid manager ID format: ${id}`);
    }

    const user = await this.userModel.findById(id).exec();
    if (!user || user.role !== 'branch_manager') {
      throw new NotFoundException(`Manager with ID "${id}" not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (user.assignedRestaurant) {
        // Clear references on the restaurant side
        await this.restaurantModel.findByIdAndUpdate(
          user.assignedRestaurant,
          { assignedManager: null },
          { session },
        );
      }

      await this.userModel.findByIdAndDelete(id, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return { message: `Manager "${user.username}" deleted successfully` };
  }
}

