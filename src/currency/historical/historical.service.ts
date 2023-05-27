import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Historical } from '../schemas/historical.schema';
import dayjs from 'dayjs';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as process from 'process';
import { HistoricalPeriods } from '../../types';

@Injectable()
export class HistoricalService {
  private readonly logger = new Logger(HistoricalService.name);
  private readonly dateFormat = 'YYYY-MM-DD';

  constructor(
    @InjectModel(Historical.name)
    private readonly historicalModel: Model<Historical>,
    private readonly httpService: HttpService,
  ) {}

  async getLatestRates() {
    const latestRates = await this.historicalModel
      .find({}, {}, { sort: { date: -1 } })
      .limit(7);

    for (const rates of latestRates) {
      for (const [key, value] of Object.entries(rates.data)) {
        rates.data[key] = +value.toFixed(3);
      }
    }
    return latestRates;
  }

  async updateLatestRates() {
    const today = dayjs().format(this.dateFormat);
    const rates = await this.getLatestRatesFromApi();
    return this.historicalModel.updateOne(
      { date: today },
      { $set: { data: rates.data } },
      { upsert: true },
    );
  }

  async getHistoricalRatesByPeriod(
    currencySign: string,
    period: HistoricalPeriods,
  ) {
    if (!currencySign) {
      throw new Error('Currency sign is required!');
    }
    if (!period) {
      throw new Error('Interval is required!');
    }

    return this.historicalModel
      .findOne({}, {}, { sort: { date: -1 } })
      .then((doc) => {
        if (!doc.data[currencySign]) {
          throw new Error('Currency sign is not valid!');
        }

        if (period === HistoricalPeriods.MONTH) {
          return this.getHistoricalRatesByMonth(doc.date, currencySign);
        }

        if (period === HistoricalPeriods.DAY) {
          return this.getHistoricalRatesByDay(currencySign);
        }

        if (period === HistoricalPeriods.YEAR) {
          return this.getHistoricalRatesByYear(doc.date, currencySign);
        }
      });
  }

  async updateHistoricalRates() {
    let start = this.getStartDate();
    let end = this.getEndDate();

    // Will upload data for past 10 years
    for (let i = 0; i <= 20; i++) {
      const docs = await this.getHistoricalRates(end, start);

      await this.historicalModel.insertMany(docs);
      this.logger.debug(`Inserted from ${start} to ${end}`);

      start = this.getStartDate(end);
      end = this.getEndDate(end);

      // To be ok with API rate limit
      await this.sleepFor(20000);
    }
  }

  private async getHistoricalRatesByYear(date: string, currencySign: string) {
    const dayNumber = dayjs(date).get('date');
    const monthNumber = dayjs(date).format('MM');
    return this.historicalModel
      .find()
      .where({ date: { $regex: `.*-${monthNumber}-${dayNumber}` } })
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } });
  }

  private async getHistoricalRatesByDay(currencySign: string) {
    return this.historicalModel
      .find()
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } });
  }

  private async getHistoricalRatesByMonth(date: string, currencySign: string) {
    const dayNumber = dayjs(date).get('date');
    return this.historicalModel
      .find()
      .where({ date: { $regex: `.*-${dayNumber}` } })
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } });
  }

  private async sleepFor(ms) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private getStartDate(prevStartDate?: string | undefined) {
    return dayjs(prevStartDate).subtract(1, 'days').format(this.dateFormat);
  }

  private getEndDate(prevEndDate?: string | undefined) {
    return dayjs(prevEndDate).subtract(6, 'month').format(this.dateFormat);
  }

  private async getLatestRatesFromApi() {
    const url = new URL(`${process.env.CURRENCY_API_URL}/latest`);
    url.searchParams.set('apikey', process.env.CURRENCY_API_KEY);

    const { data } = await firstValueFrom(
      this.httpService.get(url.toString()).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'Latest rates error!';
        }),
      ),
    );

    return data;
  }

  private async getHistoricalRates(end: string, start: string) {
    const url = new URL(`${process.env.CURRENCY_API_URL}/historical`);
    url.searchParams.set('apikey', process.env.CURRENCY_API_KEY);
    url.searchParams.set('date_from', end);
    url.searchParams.set('date_to', start);

    const { data: response } = await firstValueFrom(
      this.httpService.get(url.toString()).pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'Historical value error!';
        }),
      ),
    );

    return Object.entries(response.data).map((historicalDateData) => ({
      date: historicalDateData[0],
      data: historicalDateData[1],
    }));
  }
}
