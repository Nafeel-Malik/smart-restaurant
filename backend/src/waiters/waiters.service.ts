import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Waiter, WaiterDocument } from './schemas/waiter.schema';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { UpdateWaiterDto } from './dto/update-waiter.dto';

@Injectable()
export class WaitersService {
  constructor(
    @InjectModel(Waiter.name) private waiterModel: Model<WaiterDocument>,
    @InjectModel('Table') private tableModel: Model<any>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(createWaiterDto: CreateWaiterDto, restaurantId: string): Promise<WaiterDocument> {
    const newWaiter = new this.waiterModel({
      ...createWaiterDto,
      restaurant: new Types.ObjectId(restaurantId),
      assignedTables: [],
    });
    return newWaiter.save();
  }

  async findAll(restaurantId: string): Promise<WaiterDocument[]> {
    return this.waiterModel.find({ restaurant: new Types.ObjectId(restaurantId) }).populate('assignedTables').exec();
  }

  async findOne(id: string, restaurantId: string): Promise<WaiterDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid waiter ID format`);
    }
    const waiter = await this.waiterModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).populate('assignedTables').exec();

    if (!waiter) {
      throw new NotFoundException(`Waiter with ID "${id}" not found`);
    }
    return waiter;
  }

  async update(id: string, updateWaiterDto: UpdateWaiterDto, restaurantId: string): Promise<WaiterDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid waiter ID format`);
    }
    const updatedWaiter = await this.waiterModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        restaurant: new Types.ObjectId(restaurantId),
      },
      updateWaiterDto,
      { new: true },
    ).populate('assignedTables').exec();

    if (!updatedWaiter) {
      throw new NotFoundException(`Waiter with ID "${id}" not found`);
    }
    return updatedWaiter;
  }

  async remove(id: string, restaurantId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid waiter ID format`);
    }

    const waiter = await this.waiterModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!waiter) {
      throw new NotFoundException(`Waiter with ID "${id}" not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.waiterModel.findByIdAndDelete(id, { session });

      if (waiter.assignedTables && waiter.assignedTables.length > 0) {
        await this.tableModel.updateMany(
          { _id: { $in: waiter.assignedTables } },
          { $set: { assignedWaiter: null } },
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

    return { message: `Waiter "${waiter.name}" deleted successfully` };
  }

  async assignTables(waiterId: string, tableIds: string[], restaurantId: string): Promise<WaiterDocument> {
    if (!Types.ObjectId.isValid(waiterId)) {
      throw new NotFoundException(`Invalid waiter ID format`);
    }

    const waiter = await this.waiterModel.findOne({
      _id: new Types.ObjectId(waiterId),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!waiter) {
      throw new NotFoundException(`Waiter with ID "${waiterId}" not found`);
    }

    // Validate tableIds format and check they all belong to the restaurant
    const objectIdTableIds = tableIds.map((id) => {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid table ID format: ${id}`);
      }
      return new Types.ObjectId(id);
    });

    const tables = await this.tableModel.find({
      _id: { $in: objectIdTableIds },
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (tables.length !== objectIdTableIds.length) {
      throw new BadRequestException(`One or more tables not found or do not belong to this restaurant`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Free tables previously assigned to this waiter
      await this.tableModel.updateMany(
        { assignedWaiter: new Types.ObjectId(waiterId) },
        { $set: { assignedWaiter: null } },
        { session },
      );

      // Now remove this waiter's assignment from any waiters that currently hold these new tables
      const newTableIds = tables.map((t) => t._id);
      
      await this.waiterModel.updateMany(
        { assignedTables: { $in: newTableIds } },
        { $pullAll: { assignedTables: newTableIds } },
        { session },
      );

      // Finally, assign tables to this waiter
      await this.tableModel.updateMany(
        { _id: { $in: newTableIds } },
        { $set: { assignedWaiter: new Types.ObjectId(waiterId) } },
        { session },
      );

      await this.waiterModel.findByIdAndUpdate(
        waiterId,
        { $set: { assignedTables: newTableIds } },
        { session },
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return this.findOne(waiterId, restaurantId);
  }
}
