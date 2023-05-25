import { Inject, Injectable, Logger } from '@nestjs/common';
import { HistoricalService } from '../currency/historical/historical.service';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

@Injectable()
export class TasksService {
  @Inject(HistoricalService)
  private readonly historicalService: HistoricalService;
  private readonly logger = new Logger(TasksService.name);

  // Every day at 00:00 & 12:00
  @Cron('12 0 * * *')
  async handleCron() {
    await this.historicalService.updateLatestRates();
    this.logger.log(
      `Currency rates are updated at: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
    );
  }
}
