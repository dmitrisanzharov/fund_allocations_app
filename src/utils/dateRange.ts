import dayjs, { Dayjs } from 'dayjs';

export function isWithinRange(date: string, start: Dayjs, end: Dayjs): boolean {
    const value = dayjs(date).valueOf();
    return value >= start.valueOf() && value <= end.valueOf();
}
