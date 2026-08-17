import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel('MenuItem') private menuItemModel: Model<any>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, restaurantId: string): Promise<CategoryDocument> {
    const newCategory = new this.categoryModel({
      ...createCategoryDto,
      restaurant: new Types.ObjectId(restaurantId),
    });
    return newCategory.save();
  }

  async findAll(restaurantId: string): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ restaurant: new Types.ObjectId(restaurantId) }).exec();
  }

  async findOne(id: string, restaurantId: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid category ID format`);
    }
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, restaurantId: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid category ID format`);
    }
    const updatedCategory = await this.categoryModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        restaurant: new Types.ObjectId(restaurantId),
      },
      updateCategoryDto,
      { new: true },
    ).exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return updatedCategory;
  }

  async remove(id: string, restaurantId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid category ID format`);
    }

    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      restaurant: new Types.ObjectId(restaurantId),
    }).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check if any MenuItems reference this category
    const menuItemsCount = await this.menuItemModel.countDocuments({
      category: new Types.ObjectId(id),
    });

    if (menuItemsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it is referenced by ${menuItemsCount} menu item(s).`,
      );
    }

    await this.categoryModel.findByIdAndDelete(id).exec();
    return { message: `Category "${category.name}" deleted successfully` };
  }
}
