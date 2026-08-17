import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';
import { Table, TableDocument } from '../tables/schemas/table.schema';
import { Customer, CustomerDocument } from '../customer/schemas/customer.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CustomerReservationQueryDto } from './dto/customer-reservation-query.dto';
import {
  ACTIVE_RESERVATION_STATUSES,
  CUSTOMER_CANCELLABLE_RESERVATION_STATUSES,
  ReservationStatus,
} from '../common/enums/reservation-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { OrderType } from '../common/enums/order-type.enum';
import { normalizePagination, paginatedResult } from '../common/utils/pagination.util';
import {
  currentMinutesOfDay,
  dateOnlyToUtc,
  generateTimeSlots,
  isValidDateOnly,
  parseClockToMinutes,
  todayDateOnly,
  utcToDateOnly,
} from '../common/utils/time-slots.util';

const DEFAULT_TABLE_SEATS = 4;
const SLOT_INTERVAL_MINUTES = 30;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getAvailableSlots(restaurantId: string, date: string, partySize?: number) {
    if (!Types.ObjectId.isValid(restaurantId)) {
      throw new NotFoundException('Restaurant not found');
    }
    if (!isValidDateOnly(date)) {
      throw new BadRequestException('date must be a valid YYYY-MM-DD value');
    }
    if (date < todayDateOnly()) {
      throw new BadRequestException('Cannot look up slots for a past date');
    }
    if (partySize !== undefined && (!Number.isInteger(partySize) || partySize < 1)) {
      throw new BadRequestException('partySize must be a positive integer');
    }

    const restaurant = await this.findActiveRestaurant(restaurantId);
    const totalCapacity = await this.getRestaurantCapacity(restaurantId);
    const reservationDate = dateOnlyToUtc(date);
    const bookedBySlot = await this.bookedCapacityBySlot(restaurantId, reservationDate);
    const allSlots = generateTimeSlots(restaurant.openingTime, restaurant.closingTime, SLOT_INTERVAL_MINUTES);
    const isToday = date === todayDateOnly();
    const nowMinutes = currentMinutesOfDay();

    const slots = allSlots.map((timeSlot) => {
      const remainingCapacity = Math.max(0, totalCapacity - (bookedBySlot.get(timeSlot) || 0));
      const slotMinutes = parseClockToMinutes(timeSlot) ?? 0;
      const inThePast = isToday && slotMinutes <= nowMinutes;
      const fitsParty = partySize ? remainingCapacity >= partySize : remainingCapacity > 0;
      return {
        timeSlot,
        remainingCapacity,
        available: !inThePast && totalCapacity > 0 && fitsParty,
      };
    });

    return {
      restaurantId,
      date,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
      totalCapacity,
      slots,
    };
  }

  async create(customerId: string, dto: CreateReservationDto) {
    if (!isValidDateOnly(dto.reservationDate)) {
      throw new BadRequestException('reservationDate must be a valid YYYY-MM-DD value');
    }
    if (dto.reservationDate < todayDateOnly()) {
      throw new BadRequestException('Cannot reserve a table in the past');
    }

    const restaurant = await this.findActiveRestaurant(dto.restaurantId);
    const allowedSlots = generateTimeSlots(restaurant.openingTime, restaurant.closingTime, SLOT_INTERVAL_MINUTES);
    if (!allowedSlots.includes(dto.timeSlot)) {
      throw new BadRequestException(
        `timeSlot must fall within restaurant hours (${restaurant.openingTime} – ${restaurant.closingTime})`,
      );
    }

    if (dto.reservationDate === todayDateOnly()) {
      const slotMinutes = parseClockToMinutes(dto.timeSlot) ?? 0;
      if (slotMinutes <= currentMinutesOfDay()) {
        throw new BadRequestException('That time slot has already passed');
      }
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const contactPhone = String(dto.contactPhone || '').trim();
    if (!contactPhone) {
      throw new BadRequestException('Phone number is required');
    }

    const reservationDate = dateOnlyToUtc(dto.reservationDate);
    const totalCapacity = await this.getRestaurantCapacity(dto.restaurantId);
    if (totalCapacity < 1) {
      throw new BadRequestException('This restaurant has no tables configured for reservations yet');
    }

    const booked = await this.bookedCapacityForSlot(dto.restaurantId, reservationDate, dto.timeSlot);
    if (booked + dto.partySize > totalCapacity) {
      throw new BadRequestException('This time slot is full. Please pick another slot.');
    }

    const created = await this.reservationModel.create({
      customerId: new Types.ObjectId(customerId),
      restaurantId: new Types.ObjectId(dto.restaurantId),
      reservationDate,
      timeSlot: dto.timeSlot,
      partySize: dto.partySize,
      status: ReservationStatus.Confirmed,
      specialRequests: dto.specialRequests?.trim() || '',
      contactPhone,
    });

    return this.populateOne(created._id.toString());
  }

  async findMine(customerId: string, query: CustomerReservationQueryDto = {}) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const filter: Record<string, unknown> = {
      customerId: new Types.ObjectId(customerId),
    };

    if (query.status) {
      filter.status = query.status;
    }

    const dateRange = this.reservationDateRange(query.from, query.to);
    if (dateRange) {
      filter.reservationDate = dateRange;
    }

    const [rows, total] = await Promise.all([
      this.reservationModel
        .find(filter)
        .sort({ reservationDate: -1, timeSlot: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('restaurantId', 'name logo openingTime closingTime currency status')
        .exec(),
      this.reservationModel.countDocuments(filter).exec(),
    ]);

    const data = await Promise.all(rows.map((row) => this.toPublic(row)));
    return paginatedResult(data, total, page, limit);
  }

  async findOneForCustomer(customerId: string, id: string) {
    const reservation = await this.findOwned(customerId, id);
    return this.toPublic(reservation);
  }

  async cancelForCustomer(customerId: string, id: string) {
    const reservation = await this.findOwned(customerId, id);
    if (!CUSTOMER_CANCELLABLE_RESERVATION_STATUSES.includes(reservation.status as any)) {
      throw new BadRequestException(
        `Reservation can only be cancelled while pending or confirmed. Current status: ${reservation.status}`,
      );
    }

    const date = utcToDateOnly(reservation.reservationDate);
    if (date < todayDateOnly()) {
      throw new BadRequestException('Past reservations cannot be cancelled');
    }
    if (date === todayDateOnly()) {
      const slotMinutes = parseClockToMinutes(reservation.timeSlot) ?? 0;
      if (slotMinutes <= currentMinutesOfDay()) {
        throw new BadRequestException('This reservation can no longer be cancelled because the time slot has started');
      }
    }

    reservation.status = ReservationStatus.Cancelled;
    await reservation.save();
    await this.orderModel.updateMany(
      {
        reservationId: reservation._id,
        orderType: OrderType.PreOrder,
        status: { $ne: OrderStatus.Cancelled },
      },
      { $set: { status: OrderStatus.Cancelled } },
    );
    return this.populateOne(reservation._id.toString());
  }

  private async findOwned(customerId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Reservation not found');
    }
    const reservation = await this.reservationModel
      .findById(id)
      .populate('restaurantId', 'name logo openingTime closingTime currency status')
      .exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.customerId.toString() !== customerId) {
      throw new ForbiddenException('You cannot access this reservation');
    }
    return reservation;
  }

  private async populateOne(id: string) {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('restaurantId', 'name logo openingTime closingTime currency status')
      .exec();
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return this.toPublic(reservation);
  }

  private async toPublic(reservation: ReservationDocument) {
    const preOrder = await this.orderModel
      .findOne({
        reservationId: reservation._id,
        orderType: OrderType.PreOrder,
        status: { $ne: OrderStatus.Cancelled },
      })
      .select('items totalAmount status')
      .exec();

    const itemCount = preOrder
      ? preOrder.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      : 0;

    return {
      _id: reservation._id,
      customerId: reservation.customerId,
      restaurantId: reservation.restaurantId,
      reservationDate: utcToDateOnly(reservation.reservationDate),
      timeSlot: reservation.timeSlot,
      partySize: reservation.partySize,
      status: reservation.status,
      specialRequests: reservation.specialRequests || '',
      contactPhone: reservation.contactPhone,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      canModifyPreOrder: CUSTOMER_CANCELLABLE_RESERVATION_STATUSES.includes(reservation.status as any),
      preOrder: preOrder
        ? {
            _id: preOrder._id,
            itemCount,
            totalAmount: preOrder.totalAmount,
            status: preOrder.status,
          }
        : null,
    };
  }

  private async findActiveRestaurant(restaurantId: string) {
    const restaurant = await this.restaurantModel.findById(restaurantId).exec();
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.status !== 1) {
      throw new BadRequestException('This restaurant is not currently accepting reservations');
    }
    return restaurant;
  }

  private async getRestaurantCapacity(restaurantId: string) {
    const tables = await this.tableModel.find({ restaurant: new Types.ObjectId(restaurantId) }).exec();
    return tables.reduce((sum, table) => sum + (Number(table.capacity) > 0 ? Number(table.capacity) : DEFAULT_TABLE_SEATS), 0);
  }

  private async bookedCapacityBySlot(restaurantId: string, reservationDate: Date) {
    const rows = await this.reservationModel
      .find({
        restaurantId: new Types.ObjectId(restaurantId),
        reservationDate,
        status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      })
      .select('timeSlot partySize')
      .exec();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.timeSlot, (map.get(row.timeSlot) || 0) + row.partySize);
    }
    return map;
  }

  private async bookedCapacityForSlot(restaurantId: string, reservationDate: Date, timeSlot: string) {
    const rows = await this.reservationModel
      .find({
        restaurantId: new Types.ObjectId(restaurantId),
        reservationDate,
        timeSlot,
        status: { $in: [...ACTIVE_RESERVATION_STATUSES] },
      })
      .select('partySize')
      .exec();
    return rows.reduce((sum, row) => sum + row.partySize, 0);
  }

  private reservationDateRange(from?: string, to?: string) {
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
    if (from) range.$gte = dateOnlyToUtc(from);
    if (to) range.$lte = dateOnlyToUtc(to);
    return range;
  }
}
