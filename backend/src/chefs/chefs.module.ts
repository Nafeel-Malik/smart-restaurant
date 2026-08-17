import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChefsService } from './chefs.service';
import { ChefsController } from './chefs.controller';
import { Chef, ChefSchema } from './schemas/chef.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chef.name, schema: ChefSchema }]),
  ],
  controllers: [ChefsController],
  providers: [ChefsService],
})
export class ChefsModule {}
