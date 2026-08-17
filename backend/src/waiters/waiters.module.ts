import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaitersService } from './waiters.service';
import { WaitersController } from './waiters.controller';
import { Waiter, WaiterSchema } from './schemas/waiter.schema';
import { TableSchema } from '../tables/schemas/table.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Waiter.name, schema: WaiterSchema },
      { name: 'Table', schema: TableSchema },
    ]),
  ],
  controllers: [WaitersController],
  providers: [WaitersService],
})
export class WaitersModule {}
