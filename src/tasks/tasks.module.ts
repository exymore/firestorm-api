import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [CurrencyModule],
  providers: [TasksService],
})
export class TasksModule {}
