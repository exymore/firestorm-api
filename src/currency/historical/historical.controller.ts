import { Body, Controller, Get, Logger, Put, Query } from '@nestjs/common';
import { HistoricalService } from './historical.service';
import { HistoricalPeriods } from '../../enums/historicalPeriods';
import dayjs from 'dayjs';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateLatestRatesDto } from './dto/updateLatestRatesDto';

@Controller('currency/historical')
export class HistoricalController {
  private readonly logger = new Logger(HistoricalService.name);

  constructor(private readonly historicalService: HistoricalService) {}

  @Get('/')
  @ApiOperation({ summary: 'Returns USD/currency historical data by period.' })
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
  @ApiOperation({
    summary: 'Updates latest rates in database. Requires a key.',
  })
  async updateLatestRates(@Body() updateLatestRatesDto: UpdateLatestRatesDto) {
    try {
      await this.historicalService.updateLatestRates(updateLatestRatesDto.key);
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
  @ApiOperation({ summary: 'Returns historical data for last week.' })
  async getRatesForLastWeek() {
    return this.historicalService.getRatesForLastWeek();
  }
}
