import { format, isValid, parse, parseISO } from 'date-fns';

/** Dates travel to/from the API as ISO strings (`YYYY-MM-DD` for business dates). */
export const ISO_DATE = 'yyyy-MM-dd';
export const DISPLAY_DATE = 'dd-MMM-yyyy';

export function toDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = value.length === 10 ? parse(value, ISO_DATE, new Date()) : parseISO(value);
  return isValid(d) ? d : undefined;
}

export const isoDate = (d: Date) => format(d, ISO_DATE);
export const todayIso = () => isoDate(new Date());

export function fmtDate(value?: string | null) {
  const d = toDate(value);
  return d ? format(d, DISPLAY_DATE) : '—';
}

export function fmtDateTime(value?: string | null) {
  const d = toDate(value);
  return d ? format(d, `${DISPLAY_DATE} HH:mm`) : '—';
}

export const fmtMoney = (v?: number | null) =>
  v === null || v === undefined ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
