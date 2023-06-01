import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Historical } from '../schemas/historical.schema';
import dayjs from 'dayjs';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as process from 'process';
import { HistoricalPeriods } from '../../enums/historicalPeriods';
import {
  HistoricalRatesByDay,
  HistoricalRatesByMonth,
  HistoricalRatesByPeriod,
  HistoricalRatesByYear,
} from '../../types/historicalTypes';
import Helpers from '../../helpers';

@Injectable()
export class HistoricalService {
  private readonly logger = new Logger(HistoricalService.name);
  private readonly dateFormat = 'YYYY-MM-DD';

  constructor(
    @InjectModel(Historical.name)
    private readonly historicalModel: Model<Historical>,
    private readonly httpService: HttpService,
  ) {}

  async getRatesForLastWeek() {
    return this.historicalModel.find({}, {}, { sort: { date: -1 } }).limit(7);
  }

  async updateLatestRates(key: string) {
    if (key !== process.env.CUREENCY_UPDATE_INTERNAL_KEY) {
      throw new Error('Currency update key is not valid!');
    }
    const today = dayjs().format(this.dateFormat);
    const rates = await this.getLatestRatesFromApi();
    return this.historicalModel.updateOne(
      { date: today },
      { $set: { data: rates.data } },
      { upsert: true },
    );
  }

  async getHistoricalRatesByPeriod({
    currencySign,
    period,
    skip,
    limit,
  }: HistoricalRatesByPeriod) {
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

        if (period === HistoricalPeriods.YEAR) {
          return this.getHistoricalRatesByYear({
            date: doc.date,
            currencySign,
          });
        }

        if (period === HistoricalPeriods.MONTH) {
          return this.getHistoricalRatesByMonth({
            date: doc.date,
            currencySign,
            skip,
            limit,
          });
        }

        if (period === HistoricalPeriods.DAY) {
          return this.getHistoricalRatesByDay({ currencySign, skip, limit });
        }
      });
  }

  async updateHistoricalRates() {
    let start = Helpers.getStartDate();
    let end = Helpers.getEndDate();

    // Will upload data for past 10 years
    for (let i = 0; i <= 20; i++) {
      const docs = await this.getHistoricalRates(end, start);

      await this.historicalModel.insertMany(docs);
      this.logger.debug(`Inserted from ${start} to ${end}`);

      start = Helpers.getStartDate(end);
      end = Helpers.getEndDate(end);

      // To be ok with API rate limit
      await Helpers.sleepFor(20000);
    }
  }

  private async getHistoricalRatesByYear({
    date,
    currencySign,
  }: HistoricalRatesByYear) {
    const dayNumber = dayjs(date).format('DD');
    const monthNumber = dayjs(date).format('MM');
    return this.historicalModel
      .find()
      .where({ date: { $regex: `.*-${monthNumber}-${dayNumber}$` } })
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } });
  }

  private async getHistoricalRatesByMonth({
    date,
    currencySign,
    skip,
    limit,
  }: HistoricalRatesByMonth) {
    const dayNumber = dayjs(date).format('DD');
    return this.historicalModel
      .find()
      .where({ date: { $regex: `.*-${dayNumber}$` } })
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } })
      .skip(skip || 0)
      .limit(limit || 365);
  }

  private async getHistoricalRatesByDay({
    currencySign,
    skip,
    limit,
  }: HistoricalRatesByDay) {
    return this.historicalModel
      .find()
      .sort({ date: -1 })
      .select({ date: 1, data: { [currencySign]: 1 } })
      .skip(skip || 0)
      .limit(limit || 365);
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
