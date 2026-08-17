import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';
import { Address, AddressDocument } from '../customer/schemas/address.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { CustomerOrderQueryDto } from './dto/customer-order-query.dto';
import { UpsertPreOrderDto } from './dto/upsert-pre-order.dto';
import { CUSTOMER_CANCELLABLE_STATUSES, OrderStatus } from '../common/enums/order-status.enum';
import { OrderType } from '../common/enums/order-type.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { CUSTOMER_CANCELLABLE_RESERVATION_STATUSES, ReservationStatus } from '../common/enums/reservation-status.enum';
import { Role } from '../common/enums/role.enum';
import { dateOnlyToUtc, isValidDateOnly, utcToDateOnly } from '../common/utils/time-slots.util';
import { normalizePagination, paginatedResult } from '../common/utils/pagination.util';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
  ) {}

  async createCustomerOrder(customerId: string, dto: CreateCustomerOrderDto) {
    if (!Types.ObjectId.isValid(dto.restaurantId)) {
      throw new NotFoundException('Restaurant not found');
    }
    if (!Types.ObjectId.isValid(dto.deliveryAddressId)) {
      throw new BadRequestException('Invalid delivery address');
    }

    const restaurant = await this.restaurantModel.findById(dto.restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.status !== 1) {
      throw new BadRequestException('This restaurant is not currently accepting orders');
    }

    const address = await this.addressModel
      .findOne({
        _id: new Types.ObjectId(dto.deliveryAddressId),
        customerId: new Types.ObjectId(customerId),
      })
      .exec();
    if (!address) {
      throw new BadRequestException('Delivery address not found or does not belong to you');
    }
    if (!String(address.phone || '').trim()) {
      throw new BadRequestException(
        'Selected delivery address is missing a phone number. Update the address with a phone before ordering.',
      );
    }

    const { items, totalAmount } = await this.buildPricedItems(dto.restaurantId, dto.items);

    const created = await this.orderModel.create({
      customerId: new Types.ObjectId(customerId),
      restaurantId: new Types.ObjectId(dto.restaurantId),
      orderType: OrderType.Delivery,
      items,
      deliveryAddressId: address._id,
      deliveryAddressSnapshot: {
        label: address.label,
        fullAddress: address.fullAddress,
        city: address.city,
        area: address.area || null,
        phone: address.phone || null,
      },
      reservationId: null,
      totalAmount,
      status: OrderStatus.Pending,
      paymentStatus: PaymentStatus.Pending,
    });

    return this.populateCustomerOrder(created._id.toString());
  }

  async findCustomerOrders(customerId: string, query: CustomerOrderQueryDto = {}) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {
      customerId: new Types.ObjectId(customerId),
    };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.orderType) {
      filter.orderType = query.orderType;
    }

    const createdAt = this.createdAtRange(query.from, query.to);
    if (createdAt) {
      filter.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('restaurantId', 'name logo currency status openingTime closingTime')
        .populate('reservationId', 'reservationDate timeSlot partySize status')
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return paginatedResult(data, total, page, limit);
  }

  async findCustomerOrder(customerId: string, orderId: string) {
    const order = await this.getPopulatedOrder(orderId);
    const ownerId = this.refId(order.customerId);
    if (ownerId !== customerId) {
      throw new ForbiddenException('You cannot access this order');
    }
    return order;
  }

  async getCustomerOrderReceipt(customerId: string, orderId: string) {
    const order = await this.findCustomerOrder(customerId, orderId);
    return this.toReceipt(order);
  }

  async cancelCustomerOrder(customerId: string, orderId: string) {
    const order = await this.findOwnedOrder(orderId);
    const ownerId = order.customerId.toString();
    if (ownerId !== customerId) {
      throw new ForbiddenException('You cannot access this order');
    }
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status as any)) {
      throw new BadRequestException(
        `Order can only be cancelled while pending or confirmed. Current status: ${order.status}`,
      );
    }
    order.status = OrderStatus.Cancelled;
    await order.save();
    return this.populateCustomerOrder(order._id.toString());
  }

  async findStaffOrders(user: { role: string; assignedRestaurant?: any }, restaurantId?: string) {
    const filter: any = {};
    if (user.role === Role.BranchManager) {
      const assigned = user.assignedRestaurant?.toString?.() || user.assignedRestaurant;
      if (!assigned) {
        throw new ForbiddenException('You are not assigned to a restaurant yet.');
      }
      filter.restaurantId = new Types.ObjectId(assigned);
    } else if (restaurantId) {
      if (!Types.ObjectId.isValid(restaurantId)) {
        throw new BadRequestException('Invalid restaurant ID');
      }
      filter.restaurantId = new Types.ObjectId(restaurantId);
    }

    return this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('restaurantId', 'name logo currency status')
      .populate('customerId', 'fullName email phone')
      .exec();
  }

  async findStaffOrder(user: { role: string; assignedRestaurant?: any }, orderId: string) {
    const order = await this.getPopulatedOrder(orderId);
    this.assertStaffAccess(user, order);
    return order;
  }

  async updateStaffStatus(user: { role: string; assignedRestaurant?: any }, orderId: string, status: OrderStatus) {
    const order = await this.findOwnedOrder(orderId);
    this.assertStaffAccess(user, order);
    if (order.status === OrderStatus.Cancelled && status !== OrderStatus.Cancelled) {
      throw new BadRequestException('A cancelled order cannot be reopened');
    }
    if (order.status === OrderStatus.Delivered && status !== OrderStatus.Delivered) {
      throw new BadRequestException('A delivered order cannot change status');
    }
    if (order.status === OrderStatus.Served && status !== OrderStatus.Served) {
      throw new BadRequestException('A served order cannot change status');
    }
    if (
      order.orderType === OrderType.PreOrder &&
      (status === OrderStatus.OutForDelivery || status === OrderStatus.Delivered)
    ) {
      throw new BadRequestException('Pre-orders cannot be marked out for delivery or delivered. Use ready or served instead.');
    }
    order.status = status;
    await order.save();
    return this.getPopulatedOrder(order._id.toString());
  }

  async createPreOrder(customerId: string, reservationId: string, dto: UpsertPreOrderDto) {
    const reservation = await this.findOwnedReservation(customerId, reservationId);
    this.assertReservationAcceptsNewPreOrder(reservation);

    const existing = await this.findActivePreOrderDoc(reservationId);
    if (existing) {
      throw new BadRequestException('This reservation already has a pre-order. Use update instead.');
    }

    const restaurantId = this.refId(reservation.restaurantId);
    const { items, totalAmount } = await this.buildPricedItems(restaurantId, dto.items);

    try {
      const created = await this.orderModel.create({
        customerId: new Types.ObjectId(customerId),
        restaurantId: new Types.ObjectId(restaurantId),
        orderType: OrderType.PreOrder,
        reservationId: reservation._id,
        items,
        deliveryAddressId: null,
        deliveryAddressSnapshot: null,
        totalAmount,
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Pending,
      });
      return this.populatePreOrder(created._id.toString());
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new BadRequestException('This reservation already has a pre-order. Use update instead.');
      }
      throw err;
    }
  }

  async getPreOrder(customerId: string, reservationId: string) {
    const reservation = await this.findOwnedReservation(customerId, reservationId);
    const order = await this.findActivePreOrderDoc(reservationId);
    return {
      reservationId: reservation._id,
      canModify: this.canModifyPreOrder(reservation, order),
      preOrder: order ? await this.populatePreOrder(order._id.toString()) : null,
    };
  }

  async updatePreOrder(customerId: string, reservationId: string, dto: UpsertPreOrderDto) {
    const reservation = await this.findOwnedReservation(customerId, reservationId);
    const order = await this.findActivePreOrderDoc(reservationId);
    if (!order) {
      throw new NotFoundException('No pre-order found for this reservation');
    }
    this.assertPreOrderModifiable(reservation, order);

    const restaurantId = this.refId(reservation.restaurantId);
    const { items, totalAmount } = await this.buildPricedItems(restaurantId, dto.items);
    order.items = items as any;
    order.totalAmount = totalAmount;
    await order.save();
    return this.populatePreOrder(order._id.toString());
  }

  async cancelPreOrder(customerId: string, reservationId: string) {
    const reservation = await this.findOwnedReservation(customerId, reservationId);
    const order = await this.findActivePreOrderDoc(reservationId);
    if (!order) {
      throw new NotFoundException('No pre-order found for this reservation');
    }
    this.assertPreOrderModifiable(reservation, order);
    order.status = OrderStatus.Cancelled;
    await order.save();
    return this.populatePreOrder(order._id.toString());
  }

  private async findOwnedOrder(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private populateCustomerOrder(orderId: string) {
    return this.orderModel
      .findById(orderId)
      .populate('restaurantId', 'name logo currency status openingTime closingTime')
      .populate('deliveryAddressId')
      .populate('reservationId', 'reservationDate timeSlot partySize status')
      .exec();
  }

  private getPopulatedOrder(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    return this.orderModel
      .findById(orderId)
      .populate('restaurantId', 'name logo currency status openingTime closingTime')
      .populate('customerId', 'fullName email phone')
      .populate('deliveryAddressId')
      .populate('reservationId', 'reservationDate timeSlot partySize status')
      .then((order) => {
        if (!order) throw new NotFoundException('Order not found');
        return order;
      });
  }

  private refId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'object' && value !== null && '_id' in (value as any)) {
      return String((value as any)._id);
    }
    return String(value);
  }

  private assertStaffAccess(user: { role: string; assignedRestaurant?: any }, order: OrderDocument) {
    if (user.role === Role.SuperAdmin) return;
    const assigned = user.assignedRestaurant?.toString?.() || user.assignedRestaurant;
    if (!assigned) {
      throw new ForbiddenException('You are not assigned to a restaurant yet.');
    }
    const orderRestaurantId = this.refId(order.restaurantId);
    if (orderRestaurantId !== assigned.toString()) {
      throw new ForbiddenException('You cannot access orders for another restaurant');
    }
  }

  private async buildPricedItems(restaurantId: string, rawItems: { foodId: string; quantity: number }[]) {
    const merged = new Map<string, number>();
    for (const item of rawItems) {
      if (!Types.ObjectId.isValid(item.foodId)) {
        throw new BadRequestException(`Invalid food item: ${item.foodId}`);
      }
      merged.set(item.foodId, (merged.get(item.foodId) || 0) + item.quantity);
    }

    const foodIds = [...merged.keys()].map((id) => new Types.ObjectId(id));
    const foods = await this.menuItemModel
      .find({
        _id: { $in: foodIds },
        restaurant: new Types.ObjectId(restaurantId),
      })
      .exec();

    if (foods.length !== foodIds.length) {
      throw new BadRequestException('One or more food items are invalid or do not belong to this restaurant');
    }

    const foodById = new Map(foods.map((food) => [food._id.toString(), food]));
    const items = [...merged.entries()].map(([foodId, quantity]) => {
      const food = foodById.get(foodId)!;
      const price = Number(food.price);
      return {
        foodId: food._id,
        name: food.name,
        price,
        quantity,
        subtotal: Number((price * quantity).toFixed(2)),
      };
    });

    const totalAmount = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    return { items, totalAmount };
  }

  private createdAtRange(from?: string, to?: string) {
    if (!from && !to) return null;
    if (from && !isValidDateOnly(from)) {
      throw new BadRequestException('from must be a valid YYYY-MM-DD value');
    }
    if (to && !isValidDateOnly(to)) {
      throw new BadRequestException('to must be a valid YYYY-MM-DD value');
    }
    if (from && to && from > to) {
      throw new BadRequestException('"from" cannot be after "to"');
    }

    const range: Record<string, Date> = {};
    if (from) {
      range.$gte = dateOnlyToUtc(from);
    }
    if (to) {
      const end = dateOnlyToUtc(to);
      end.setUTCDate(end.getUTCDate() + 1);
      range.$lt = end;
    }
    return range;
  }

  private toReceipt(order: OrderDocument) {
    const restaurant = (order.restaurantId as any) || {};
    const items = (order.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }));
    const subtotal = Number(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2));
    const snapshot = order.deliveryAddressSnapshot;
    const populatedAddress = order.deliveryAddressId as any;
    const reservation = order.reservationId as any;

    return {
      orderId: order._id,
      orderType: order.orderType,
      status: order.status,
      paymentStatus: order.paymentStatus,
      placedAt: order.createdAt,
      restaurant: {
        _id: restaurant._id || order.restaurantId,
        name: restaurant.name || 'Restaurant',
        logo: restaurant.logo || '',
        currency: restaurant.currency || 'PKR',
      },
      items,
      subtotal,
      total: Number(order.totalAmount || 0),
      deliveryAddress:
        order.orderType === OrderType.Delivery
          ? {
              label: snapshot?.label || populatedAddress?.label || '',
              fullAddress: snapshot?.fullAddress || populatedAddress?.fullAddress || '',
              city: snapshot?.city || populatedAddress?.city || '',
              area: snapshot?.area || populatedAddress?.area || null,
              phone: snapshot?.phone || populatedAddress?.phone || null,
            }
          : null,
      reservation:
        order.orderType === OrderType.PreOrder && reservation
          ? {
              _id: reservation._id || order.reservationId,
              reservationDate: reservation.reservationDate
                ? typeof reservation.reservationDate === 'string'
                  ? reservation.reservationDate
                  : utcToDateOnly(reservation.reservationDate)
                : null,
              timeSlot: reservation.timeSlot || null,
              partySize: reservation.partySize || null,
              status: reservation.status || null,
            }
          : null,
    };
  }

  private async findOwnedReservation(customerId: string, reservationId: string) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new NotFoundException('Reservation not found');
    }
    const reservation = await this.reservationModel
      .findById(reservationId)
      .populate('restaurantId', 'name logo currency status')
      .exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.customerId.toString() !== customerId) {
      throw new ForbiddenException('You cannot access this reservation');
    }
    return reservation;
  }

  private async findActivePreOrderDoc(reservationId: string) {
    return this.orderModel
      .findOne({
        reservationId: new Types.ObjectId(reservationId),
        orderType: OrderType.PreOrder,
        status: { $ne: OrderStatus.Cancelled },
      })
      .exec();
  }

  private populatePreOrder(orderId: string) {
    return this.orderModel
      .findById(orderId)
      .populate('restaurantId', 'name logo currency status openingTime closingTime')
      .populate('reservationId', 'reservationDate timeSlot partySize status')
      .populate('items.foodId', 'name price image')
      .exec();
  }

  private assertReservationAcceptsNewPreOrder(reservation: ReservationDocument) {
    const blocked = [ReservationStatus.Cancelled, ReservationStatus.Completed, ReservationStatus.NoShow];
    if (blocked.includes(reservation.status as ReservationStatus)) {
      throw new BadRequestException(
        `Cannot add a pre-order to a ${reservation.status.replaceAll('_', ' ')} reservation`,
      );
    }
  }

  private canModifyPreOrder(reservation: ReservationDocument, order: OrderDocument | null) {
    if (!CUSTOMER_CANCELLABLE_RESERVATION_STATUSES.includes(reservation.status as any)) {
      return false;
    }
    if (order && !CUSTOMER_CANCELLABLE_STATUSES.includes(order.status as any)) {
      return false;
    }
    return true;
  }

  private assertPreOrderModifiable(reservation: ReservationDocument, order: OrderDocument) {
    if (!CUSTOMER_CANCELLABLE_RESERVATION_STATUSES.includes(reservation.status as any)) {
      throw new BadRequestException('Pre-order can no longer be modified');
    }
    if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status as any)) {
      throw new BadRequestException(
        `Pre-order can no longer be modified because kitchen status is ${order.status.replaceAll('_', ' ')}`,
      );
    }
  }
}
