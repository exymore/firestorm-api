import { Controller, Get, Query } from '@nestjs/common';
import { HistoricalService } from './historical.service';
import { HistoricalPeriods } from '../../enums/historicalPeriods';

@Controller('currency/historical')
export class HistoricalController {
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

  @Get('/latest')
  async getRatesForLastWeek() {
    return this.historicalService.getRatesForLastWeek();
  }
}
