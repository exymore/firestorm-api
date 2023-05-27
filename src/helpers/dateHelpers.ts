import dayjs from 'dayjs';

function getStartDate(prevStartDate?: string | undefined) {
  return dayjs(prevStartDate).subtract(1, 'days').format(this.dateFormat);
}

function getEndDate(prevEndDate?: string | undefined) {
  return dayjs(prevEndDate).subtract(6, 'month').format(this.dateFormat);
}

export default {
  getStartDate,
  getEndDate,
};
