import { Inject, Injectable, Logger } from '@nestjs/common';
import { HistoricalService } from '../currency/historical/historical.service';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';

@Injectable()
export class TasksService {
  @Inject(HistoricalService)
  private readonly historicalService: HistoricalService;
  private readonly logger = new Logger(TasksService.name);

  // Every hour
  @Cron('0 0 */1 * * *')
  async handleCron() {
    await this.historicalService.updateLatestRates();
    this.logger.log(
      `Currency rates are updated at: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
    );
  }
}
