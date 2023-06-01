import { Body, Controller, Get, Logger, Put, Query } from '@nestjs/common';
import { HistoricalService } from './historical.service';
import { HistoricalPeriods } from '../../enums/historicalPeriods';
import dayjs from 'dayjs';

@Controller('currency/historical')
export class HistoricalController {
  private readonly logger = new Logger(HistoricalService.name);

  constructor(private readonly historicalService: HistoricalService) {}

  @Get('/')
  async getHistoricalRatesByPeriod(
    @Query('currency') currencySign: string,
    @Query('period') period: HistoricalPeriods,
    @Query('skip') skip: number,
    @Query('limit') limit: number,
  ) {
    return this.historicalService.getHistoricalRatesByPeriod({
      currencySign,
      period,
      skip,
      limit,
    });
  }

  @Put('/')
  async updateLatestRates(@Body() { key }: { key: string }) {
    try {
      await this.historicalService.updateLatestRates(key);
      const message = `Currency rates are updated at: ${dayjs().format(
        'YYYY-MM-DD HH:mm:ss',
      )}`;
      this.logger.log(message);
      return message;
    } catch (error) {
      this.logger.error(error);
      return error.message;
    }
  }

  @Get('/latest')
  async getRatesForLastWeek() {
    return this.historicalService.getRatesForLastWeek();
  }
}
