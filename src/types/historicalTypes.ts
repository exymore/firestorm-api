import { HistoricalPeriods } from '../enums/historicalPeriods';
import { HistoricalDocument } from '../currency/schemas/historical.schema';

type Historical = {
  currencySign: string;
  period: HistoricalPeriods;
  skip: number;
  limit: number;
};

export type HistoricalRatesByPeriod = Pick<
  Historical,
  'currencySign' | 'period'
> & {
  skip: number;
  limit: number;
};

export type HistoricalRatesByYear = Pick<Historical, 'currencySign'> &
  Pick<HistoricalDocument, 'date'>;

export type HistoricalRatesByMonth = Pick<
  Historical,
  'currencySign' | 'skip' | 'limit'
> &
  Pick<HistoricalDocument, 'date'>;

export type HistoricalRatesByDay = Pick<
  Historical,
  'currencySign' | 'skip' | 'limit'
>;
