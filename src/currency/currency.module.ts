import { Module } from '@nestjs/common';
import { HistoricalController } from './historical/historical.controller';
import { ListController } from './list/list.controller';
import { ListService } from './list/list.service';
import { List, ListSchema } from './schemas/list.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoricalService } from './historical/historical.service';
import { Historical, HistoricalSchema } from './schemas/historical.schema';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema, collection: 'list' },
    ]),
    MongooseModule.forFeature([
      {
        name: Historical.name,
        schema: HistoricalSchema,
        collection: 'historical',
      },
    ]),
    HttpModule,
  ],
  controllers: [HistoricalController, ListController],
  providers: [ListService, HistoricalService],
  exports: [HistoricalService],
})
export class CurrencyModule {}
