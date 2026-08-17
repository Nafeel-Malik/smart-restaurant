import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FavoriteRestaurant, FavoriteRestaurantDocument } from './schemas/favorite-restaurant.schema';
import { FavoriteFood, FavoriteFoodDocument } from './schemas/favorite-food.schema';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(FavoriteRestaurant.name)
    private favoriteRestaurantModel: Model<FavoriteRestaurantDocument>,
    @InjectModel(FavoriteFood.name)
    private favoriteFoodModel: Model<FavoriteFoodDocument>,
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItemDocument>,
  ) {}

  async addRestaurant(customerId: string, restaurantId: string) {
    await this.assertRestaurantExists(restaurantId);
    await this.assertNotDuplicateRestaurant(customerId, restaurantId);

    try {
      const created = await this.favoriteRestaurantModel.create({
        customerId: new Types.ObjectId(customerId),
        restaurantId: new Types.ObjectId(restaurantId),
      });
      return this.populateRestaurantFavorite(created);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Restaurant is already in your favorites');
      }
      throw error;
    }
  }

  async removeRestaurant(customerId: string, restaurantId: string) {
    this.assertObjectId(restaurantId, 'Restaurant');
    const deleted = await this.favoriteRestaurantModel
      .findOneAndDelete({
        customerId: new Types.ObjectId(customerId),
        restaurantId: new Types.ObjectId(restaurantId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Restaurant is not in your favorites');
    }

    return { message: 'Restaurant removed from favorites' };
  }

  async listRestaurants(customerId: string) {
    const favorites = await this.favoriteRestaurantModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .populate({
        path: 'restaurantId',
        select: 'name logo openingTime closingTime currency status',
      })
      .exec();

    return favorites.filter((fav) => fav.restaurantId);
  }

  async checkRestaurant(customerId: string, restaurantId: string) {
    this.assertObjectId(restaurantId, 'Restaurant');
    const exists = await this.favoriteRestaurantModel.exists({
      customerId: new Types.ObjectId(customerId),
      restaurantId: new Types.ObjectId(restaurantId),
    });
    return { isFavorite: Boolean(exists) };
  }

  async addFood(customerId: string, foodId: string) {
    await this.assertFoodExists(foodId);
    await this.assertNotDuplicateFood(customerId, foodId);

    try {
      const created = await this.favoriteFoodModel.create({
        customerId: new Types.ObjectId(customerId),
        foodId: new Types.ObjectId(foodId),
      });
      return this.populateFoodFavorite(created);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Food item is already in your favorites');
      }
      throw error;
    }
  }

  async removeFood(customerId: string, foodId: string) {
    this.assertObjectId(foodId, 'Food item');
    const deleted = await this.favoriteFoodModel
      .findOneAndDelete({
        customerId: new Types.ObjectId(customerId),
        foodId: new Types.ObjectId(foodId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Food item is not in your favorites');
    }

    return { message: 'Food item removed from favorites' };
  }

  async listFood(customerId: string) {
    const favorites = await this.favoriteFoodModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .populate({
        path: 'foodId',
        select: 'name price image category restaurant',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'restaurant', select: 'name logo currency status' },
        ],
      })
      .exec();

    return favorites.filter((fav) => fav.foodId);
  }

  async checkFood(customerId: string, foodId: string) {
    this.assertObjectId(foodId, 'Food item');
    const exists = await this.favoriteFoodModel.exists({
      customerId: new Types.ObjectId(customerId),
      foodId: new Types.ObjectId(foodId),
    });
    return { isFavorite: Boolean(exists) };
  }

  private assertObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`${label} not found`);
    }
  }

  private async assertRestaurantExists(restaurantId: string) {
    this.assertObjectId(restaurantId, 'Restaurant');
    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
  }

  private async assertFoodExists(foodId: string) {
    this.assertObjectId(foodId, 'Food item');
    const food = await this.menuItemModel.findById(foodId).exec();
    if (!food) {
      throw new NotFoundException('Food item not found');
    }
  }

  private async assertNotDuplicateRestaurant(customerId: string, restaurantId: string) {
    const existing = await this.favoriteRestaurantModel.exists({
      customerId: new Types.ObjectId(customerId),
      restaurantId: new Types.ObjectId(restaurantId),
    });
    if (existing) {
      throw new ConflictException('Restaurant is already in your favorites');
    }
  }

  private async assertNotDuplicateFood(customerId: string, foodId: string) {
    const existing = await this.favoriteFoodModel.exists({
      customerId: new Types.ObjectId(customerId),
      foodId: new Types.ObjectId(foodId),
    });
    if (existing) {
      throw new ConflictException('Food item is already in your favorites');
    }
  }

  private populateRestaurantFavorite(doc: FavoriteRestaurantDocument) {
    return this.favoriteRestaurantModel
      .findById(doc._id)
      .populate({
        path: 'restaurantId',
        select: 'name logo openingTime closingTime currency status',
      })
      .exec();
  }

  private populateFoodFavorite(doc: FavoriteFoodDocument) {
    return this.favoriteFoodModel
      .findById(doc._id)
      .populate({
        path: 'foodId',
        select: 'name price image category restaurant',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'restaurant', select: 'name logo currency status' },
        ],
      })
      .exec();
  }
}
