import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Table, TableDocument } from './schemas/table.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    @InjectModel('Waiter') private waiterModel: Model<any>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(createTableDto: CreateTableDto, restaurantId: string): Promise<TableDocument> {
    const newTable = new this.tableModel({
      ...createTableDto,
      capacity: createTableDto.capacity && createTableDto.capacity > 0 ? createTableDto.capacity : 4,
      restaurant: new Types.ObjectId(restaurantId),
      assignedWaiter: null,
    });
    return newTable.save();
  }

  async findAll(restaurantId: string): Promise<TableDocument[]> {
    return this.tableModel.find({ restaurant: new Types.ObjectId(restaurantId) }).populate('assignedWaiter').exec();
  }

  async findOne(id: string, restaurantId: string): Promise<TableDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid table ID format`);
    }
    const table = await this.tableModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).populate('assignedWaiter').exec();

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto, restaurantId: string): Promise<TableDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid table ID format`);
    }
    const updatedTable = await this.tableModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        restaurant: new Types.ObjectId(restaurantId),
      },
      updateTableDto,
      { new: true },
    ).populate('assignedWaiter').exec();

    if (!updatedTable) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }
    return updatedTable;
  }

  async remove(id: string, restaurantId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid table ID format`);
    }

    const table = await this.tableModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!table) {
      throw new NotFoundException(`Table with ID "${id}" not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.tableModel.findByIdAndDelete(id, { session });

      if (table.assignedWaiter) {
        await this.waiterModel.findByIdAndUpdate(
          table.assignedWaiter,
          { $pull: { assignedTables: new Types.ObjectId(id) } },
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

    return { message: `Table "${table.number}" deleted successfully` };
  }

  async assignWaiter(tableId: string, waiterId: string | null | undefined, restaurantId: string): Promise<TableDocument> {
    if (!Types.ObjectId.isValid(tableId)) {
      throw new NotFoundException(`Invalid table ID format`);
    }

    const table = await this.tableModel.findOne({
      _id: new Types.ObjectId(tableId),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!table) {
      throw new NotFoundException(`Table with ID "${tableId}" not found`);
    }

    // Unassign logic
    if (!waiterId) {
      if (!table.assignedWaiter) return table;
      
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        const oldWaiterId = table.assignedWaiter;
        await this.tableModel.findByIdAndUpdate(tableId, { assignedWaiter: null }, { session });
        await this.waiterModel.findByIdAndUpdate(
          oldWaiterId,
          { $pull: { assignedTables: new Types.ObjectId(tableId) } },
          { session },
        );
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
      return this.findOne(tableId, restaurantId);
    }

    // Assign logic
    if (!Types.ObjectId.isValid(waiterId)) {
      throw new NotFoundException(`Invalid waiter ID format`);
    }

    const waiter = await this.waiterModel.findOne({
      _id: new Types.ObjectId(waiterId),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!waiter) {
      throw new NotFoundException(`Waiter with ID "${waiterId}" not found or does not belong to your restaurant`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const oldWaiterId = table.assignedWaiter;

      // Update table
      await this.tableModel.findByIdAndUpdate(
        tableId,
        { assignedWaiter: new Types.ObjectId(waiterId) },
        { session },
      );

      // Add to new waiter
      await this.waiterModel.findByIdAndUpdate(
        waiterId,
        { $addToSet: { assignedTables: new Types.ObjectId(tableId) } },
        { session },
      );

      // Remove from old waiter if different
      if (oldWaiterId && oldWaiterId.toString() !== waiterId) {
        await this.waiterModel.findByIdAndUpdate(
          oldWaiterId,
          { $pull: { assignedTables: new Types.ObjectId(tableId) } },
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

    return this.findOne(tableId, restaurantId);
  }
}
