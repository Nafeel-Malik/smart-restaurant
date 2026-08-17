import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';

@Injectable()
export class CustomerRestaurantsService {
  constructor(
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async listActive(search?: string) {
    const filter: any = { status: 1 };
    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const restaurants = await this.restaurantModel
      .find(filter)
      .select('name logo openingTime closingTime currency status averageRating reviewCount')
      .sort({ name: 1 })
      .exec();

    return restaurants.map((restaurant) => this.toPublicRestaurant(restaurant));
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Restaurant not found');
    }
    const restaurant = await this.restaurantModel
      .findById(id)
      .select('name logo openingTime closingTime currency status averageRating reviewCount')
      .exec();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return this.toPublicRestaurant(restaurant);
  }

  async getMenu(id: string) {
    const restaurant = await this.findOne(id);
    const restaurantObjectId = new Types.ObjectId(id);

    const [categories, items] = await Promise.all([
      this.categoryModel.find({ restaurant: restaurantObjectId }).sort({ name: 1 }).exec(),
      this.menuItemModel
        .find({ restaurant: restaurantObjectId })
        .select('name price image category')
        .populate('category', 'name')
        .sort({ name: 1 })
        .exec(),
    ]);

    const grouped = categories.map((category) => ({
      _id: category._id,
      name: category.name,
      items: items
        .filter((item) => {
          const categoryId = this.refId(item.category);
          return categoryId === category._id.toString();
        })
        .map((item) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image || '',
        })),
    }));

    const uncategorized = items.filter((item) => !item.category);
    if (uncategorized.length > 0) {
      grouped.push({
        _id: 'uncategorized' as any,
        name: 'Other',
        items: uncategorized.map((item) => ({
          _id: item._id,
          name: item.name,
          price: item.price,
          image: item.image || '',
        })),
      });
    }

    return { restaurant, categories: grouped.filter((group) => group.items.length > 0) };
  }

  private refId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'object' && value !== null && '_id' in (value as any)) {
      return String((value as any)._id);
    }
    return String(value);
  }

  private toPublicRestaurant(restaurant: RestaurantDocument) {
    return {
      _id: restaurant._id,
      name: restaurant.name,
      logo: restaurant.logo || null,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
      currency: restaurant.currency,
      status: restaurant.status,
      isOpen: restaurant.status === 1,
      averageRating: Number(restaurant.averageRating || 0),
      reviewCount: Number(restaurant.reviewCount || 0),
    };
  }
}
