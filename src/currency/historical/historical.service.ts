import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Historical } from '../schemas/historical.schema';
import * as dayjs from 'dayjs';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import * as process from 'process';

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
