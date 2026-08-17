import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel('Category') private categoryModel: Model<any>,
  ) {}

  private async validateCategoryOwnership(categoryId: string, restaurantId: string): Promise<void> {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID format');
    }
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(categoryId),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!category) {
      throw new BadRequestException('Category not found or does not belong to your restaurant');
    }
  }

  async create(createMenuItemDto: CreateMenuItemDto, restaurantId: string): Promise<MenuItemDocument> {
    await this.validateCategoryOwnership(createMenuItemDto.categoryId, restaurantId);

    const newMenuItem = new this.menuItemModel({
      name: createMenuItemDto.name,
      price: createMenuItemDto.price,
      image: createMenuItemDto.image,
      category: new Types.ObjectId(createMenuItemDto.categoryId),
      restaurant: new Types.ObjectId(restaurantId),
    });
    return newMenuItem.save();
  }

  async findAll(restaurantId: string, categoryId?: string): Promise<MenuItemDocument[]> {
    const filter: any = { restaurant: new Types.ObjectId(restaurantId) };
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException('Invalid category ID format');
      }
      filter.category = new Types.ObjectId(categoryId);
    }
    return this.menuItemModel.find(filter).populate('category').exec();
  }

  async findOne(id: string, restaurantId: string): Promise<MenuItemDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid menu item ID format`);
    }
    const menuItem = await this.menuItemModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).populate('category').exec();

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }
    return menuItem;
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto, restaurantId: string): Promise<MenuItemDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid menu item ID format`);
    }

    if (updateMenuItemDto.categoryId) {
      await this.validateCategoryOwnership(updateMenuItemDto.categoryId, restaurantId);
    }

    const updateData: any = { ...updateMenuItemDto };
    if (updateMenuItemDto.categoryId) {
      updateData.category = new Types.ObjectId(updateMenuItemDto.categoryId);
      delete updateData.categoryId;
    }

    const updatedMenuItem = await this.menuItemModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        restaurant: new Types.ObjectId(restaurantId),
      },
      updateData,
      { new: true },
    ).populate('category').exec();

    if (!updatedMenuItem) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }
    return updatedMenuItem;
  }

  async remove(id: string, restaurantId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid menu item ID format`);
    }
    const deleted = await this.menuItemModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!deleted) {
      throw new NotFoundException(`Menu item with ID "${id}" not found`);
    }
    return { message: `Menu item "${deleted.name}" deleted successfully` };
  }
}
