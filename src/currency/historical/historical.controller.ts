import { Controller, Get, Query } from '@nestjs/common';
import { HistoricalService } from './historical.service';
import { HistoricalPeriods } from '../../types';

@Controller('currency/historical')
export class HistoricalController {
  constructor(private readonly historicalService: HistoricalService) {}

  @Get('/latest')
  async getLatestRates() {
    return this.historicalService.getLatestRates();
  }

  @Get('/')
  async getHistoricalRatesByPeriod(
    @Query('currency') currencySign: string,
    @Query('period') period: HistoricalPeriods,
  ) {
    return this.historicalService.getHistoricalRatesByPeriod(
      currencySign,
      period,
    );
  }
}
