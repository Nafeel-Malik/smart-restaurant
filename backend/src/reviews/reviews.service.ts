import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PublicRestaurantReviewsQueryDto } from './dto/public-reviews-query.dto';
import {
  OrderStatus,
  REVIEWABLE_DELIVERY_STATUSES,
  REVIEWABLE_PREORDER_STATUSES,
} from '../common/enums/order-status.enum';
import { OrderType } from '../common/enums/order-type.enum';
import { ReservationStatus } from '../common/enums/reservation-status.enum';
import { normalizePagination, paginatedResult } from '../common/utils/pagination.util';
import { utcToDateOnly } from '../common/utils/time-slots.util';

const ELIGIBILITY_MESSAGE = 'You can only review restaurants after a completed order or reservation';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  async getEligible(customerId: string, restaurantId: string) {
    const restaurant = await this.findRestaurant(restaurantId);
    const customerObjectId = new Types.ObjectId(customerId);
    const restaurantObjectId = restaurant._id as Types.ObjectId;

    const existing = await this.reviewModel
      .find({ customerId: customerObjectId, restaurantId: restaurantObjectId })
      .select('orderId reservationId')
      .exec();

    const reviewedOrderIds = existing
      .map((row) => row.orderId)
      .filter(Boolean)
      .map((id) => id!.toString());
    const reviewedReservationIds = existing
      .map((row) => row.reservationId)
      .filter(Boolean)
      .map((id) => id!.toString());

    const [orders, reservations] = await Promise.all([
      this.orderModel
        .find({
          customerId: customerObjectId,
          restaurantId: restaurantObjectId,
          $or: [
            { orderType: { $ne: OrderType.PreOrder }, status: { $in: [...REVIEWABLE_DELIVERY_STATUSES] } },
            { orderType: OrderType.PreOrder, status: { $in: [...REVIEWABLE_PREORDER_STATUSES] } },
          ],
        })
        .select('orderType status totalAmount items createdAt')
        .sort({ createdAt: -1 })
        .exec(),
      this.reservationModel
        .find({
          customerId: customerObjectId,
          restaurantId: restaurantObjectId,
          status: ReservationStatus.Completed,
        })
        .select('reservationDate timeSlot partySize status createdAt')
        .sort({ reservationDate: -1 })
        .exec(),
    ]);

    return {
      restaurantId: restaurant._id,
      orders: orders
        .filter((order) => !reviewedOrderIds.includes(order._id.toString()))
        .map((order) => ({
          _id: order._id,
          orderType: order.orderType,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: (order.items || []).map((item) => ({
            foodId: item.foodId,
            name: item.name,
          })),
        })),
      reservations: reservations
        .filter((row) => !reviewedReservationIds.includes(row._id.toString()))
        .map((row) => ({
          _id: row._id,
          reservationDate: utcToDateOnly(row.reservationDate),
          timeSlot: row.timeSlot,
          partySize: row.partySize,
          status: row.status,
          createdAt: row.createdAt,
        })),
    };
  }

  async create(customerId: string, dto: CreateReviewDto) {
    const hasOrder = Boolean(dto.orderId);
    const hasReservation = Boolean(dto.reservationId);
    if (hasOrder === hasReservation) {
      throw new BadRequestException('Provide either orderId or reservationId');
    }

    const restaurant = await this.findRestaurant(dto.restaurantId);
    const restaurantId = restaurant._id.toString();

    if (dto.foodId) {
      await this.assertFoodBelongsToRestaurant(dto.foodId, restaurantId);
    }

    if (dto.orderId) {
      const order = await this.findOwnedOrder(customerId, dto.orderId);
      this.assertOrderMatchesRestaurant(order, restaurantId);
      this.assertOrderReviewable(order);
      await this.assertNoReviewForVisit({ orderId: order._id });
    } else {
      const reservation = await this.findOwnedReservation(customerId, dto.reservationId!);
      this.assertReservationMatchesRestaurant(reservation, restaurantId);
      this.assertReservationReviewable(reservation);
      await this.assertNoReviewForVisit({ reservationId: reservation._id });
    }

    try {
      const created = await this.reviewModel.create({
        customerId: new Types.ObjectId(customerId),
        restaurantId: restaurant._id,
        orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : null,
        reservationId: dto.reservationId ? new Types.ObjectId(dto.reservationId) : null,
        foodId: dto.foodId ? new Types.ObjectId(dto.foodId) : null,
        rating: dto.rating,
        comment: dto.comment?.trim() || '',
        restaurantReply: '',
      });
      await this.syncRestaurantRating(restaurantId);
      return this.populateOne(created._id.toString());
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('You have already reviewed this order or reservation');
      }
      throw err;
    }
  }

  async findMine(customerId: string) {
    const rows = await this.reviewModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name logo currency averageRating reviewCount')
      .populate('foodId', 'name')
      .populate('orderId', 'orderType status totalAmount createdAt')
      .populate('reservationId', 'reservationDate timeSlot partySize status')
      .exec();
    return rows.map((row) => this.toPublic(row, { includeVisit: true }));
  }

  async updateMine(customerId: string, id: string, dto: UpdateReviewDto) {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException('Provide a rating or comment to update');
    }
    const review = await this.findOwnedReview(customerId, id);
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;
    await review.save();
    await this.syncRestaurantRating(review.restaurantId.toString());
    return this.populateOne(review._id.toString());
  }

  async deleteMine(customerId: string, id: string) {
    const review = await this.findOwnedReview(customerId, id);
    const restaurantId = review.restaurantId.toString();
    await review.deleteOne();
    await this.syncRestaurantRating(restaurantId);
    return { deleted: true };
  }

  async findPublicForRestaurant(restaurantId: string, query: PublicRestaurantReviewsQueryDto) {
    const restaurant = await this.findRestaurant(restaurantId);
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const sort = query.sort || 'newest';
    const sortSpec: Record<string, 1 | -1> =
      sort === 'highest'
        ? { rating: -1, createdAt: -1 }
        : sort === 'lowest'
          ? { rating: 1, createdAt: -1 }
          : { createdAt: -1 };

    const filter = { restaurantId: restaurant._id };
    const [rows, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'fullName profilePicture')
        .populate('foodId', 'name')
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        averageRating: Number(restaurant.averageRating || 0),
        reviewCount: Number(restaurant.reviewCount || 0),
      },
      ...paginatedResult(
        rows.map((row) => this.toPublic(row)),
        total,
        page,
        limit,
      ),
    };
  }

  async syncRestaurantRating(restaurantId: string) {
    const [stats] = await this.reviewModel
      .aggregate([
        { $match: { restaurantId: new Types.ObjectId(restaurantId) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      .exec();

    const reviewCount = stats?.count || 0;
    const averageRating = reviewCount ? Number(Number(stats.avg).toFixed(1)) : 0;
    await this.restaurantModel.findByIdAndUpdate(restaurantId, { averageRating, reviewCount }).exec();
    return { averageRating, reviewCount };
  }

  private async populateOne(id: string) {
    const review = await this.reviewModel
      .findById(id)
      .populate('restaurantId', 'name logo currency averageRating reviewCount')
      .populate('customerId', 'fullName profilePicture')
      .populate('foodId', 'name')
      .populate('orderId', 'orderType status totalAmount createdAt')
      .populate('reservationId', 'reservationDate timeSlot partySize status')
      .exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return this.toPublic(review, { includeVisit: true });
  }

  private toPublic(review: ReviewDocument, options?: { includeVisit?: boolean }) {
    const customer = review.customerId as any;
    const restaurant = review.restaurantId as any;
    const food = review.foodId as any;
    const payload: Record<string, unknown> = {
      _id: review._id,
      rating: review.rating,
      comment: review.comment || '',
      restaurantReply: review.restaurantReply || '',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      customer: customer?._id
        ? { _id: customer._id, fullName: customer.fullName, profilePicture: customer.profilePicture || null }
        : { _id: review.customerId },
      restaurant: restaurant?._id
        ? {
            _id: restaurant._id,
            name: restaurant.name,
            logo: restaurant.logo || null,
            currency: restaurant.currency,
            averageRating: restaurant.averageRating,
            reviewCount: restaurant.reviewCount,
          }
        : { _id: review.restaurantId },
      food: food?._id ? { _id: food._id, name: food.name } : null,
    };

    if (options?.includeVisit) {
      payload.orderId = review.orderId || null;
      payload.reservationId = review.reservationId || null;
    }
    return payload;
  }

  private async findRestaurant(restaurantId: string) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new NotFoundException('Restaurant not found');
    }
    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  private async findOwnedReview(customerId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Review not found');
    }
    const review = await this.reviewModel.findById(id).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.customerId.toString() !== customerId) {
      throw new ForbiddenException('You cannot modify this review');
    }
    return review;
  }

  private async findOwnedOrder(customerId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.customerId.toString() !== customerId) {
      throw new ForbiddenException('You cannot review this order');
    }
    return order;
  }

  private async findOwnedReservation(customerId: string, reservationId: string) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new NotFoundException('Reservation not found');
    }
    const reservation = await this.reservationModel.findById(reservationId).exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.customerId.toString() !== customerId) {
      throw new ForbiddenException('You cannot review this reservation');
    }
    return reservation;
  }

  private async assertFoodBelongsToRestaurant(foodId: string, restaurantId: string) {
    if (!Types.ObjectId.isValid(foodId)) {
      throw new BadRequestException('Invalid food item');
    }
    const food = await this.menuItemModel.findById(foodId).exec();
    if (!food || food.restaurant.toString() !== restaurantId) {
      throw new BadRequestException('Food item does not belong to this restaurant');
    }
  }

  private assertOrderMatchesRestaurant(order: OrderDocument, restaurantId: string) {
    if (order.restaurantId.toString() !== restaurantId) {
      throw new BadRequestException('This order does not belong to the selected restaurant');
    }
  }

  private assertReservationMatchesRestaurant(reservation: ReservationDocument, restaurantId: string) {
    if (reservation.restaurantId.toString() !== restaurantId) {
      throw new BadRequestException('This reservation does not belong to the selected restaurant');
    }
  }

  private assertOrderReviewable(order: OrderDocument) {
    const allowed =
      order.orderType === OrderType.PreOrder
        ? REVIEWABLE_PREORDER_STATUSES.includes(order.status as any)
        : REVIEWABLE_DELIVERY_STATUSES.includes(order.status as any);
    if (!allowed) {
      throw new ForbiddenException(ELIGIBILITY_MESSAGE);
    }
  }

  private assertReservationReviewable(reservation: ReservationDocument) {
    if (reservation.status !== ReservationStatus.Completed) {
      throw new ForbiddenException(ELIGIBILITY_MESSAGE);
    }
  }

  private async assertNoReviewForVisit(filter: { orderId?: Types.ObjectId; reservationId?: Types.ObjectId }) {
    const existing = await this.reviewModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('You have already reviewed this order or reservation');
    }
  }
}
