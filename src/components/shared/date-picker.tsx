import { format } from 'date-fns';
import { CalendarIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DISPLAY_DATE, isoDate, toDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Common {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
  'aria-invalid'?: boolean;
}

/** Single business date; the value is an ISO `YYYY-MM-DD` string. */
export function DatePicker({ value, onChange, ...p }: Common & { value?: string | null; onChange: (v: string | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const date = toDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <div className={cn('relative w-full', p.className)}>
        <PopoverTrigger asChild>
          <Button
            id={p.id}
            type="button"
            variant="outline"
            disabled={p.disabled}
            aria-invalid={p['aria-invalid']}
            className={cn('w-full justify-start font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon />
            {date ? format(date, DISPLAY_DATE) : (p.placeholder ?? 'Pick a date')}
          </Button>
        </PopoverTrigger>
        {p.clearable && date && (
          <button type="button" aria-label="Clear date" onClick={() => onChange(undefined)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            onChange(d ? isoDate(d) : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangeValue {
  from?: string;
  to?: string;
}

/** Inclusive date range; both ends are ISO `YYYY-MM-DD` strings. */
export function DateRangePicker({ value, onChange, ...p }: Common & { value?: DateRangeValue | null; onChange: (v: DateRangeValue | undefined) => void }) {
  const [open, setOpen] = useState(false);
  const from = toDate(value?.from);
  const to = toDate(value?.to);
  const text = from ? `${format(from, DISPLAY_DATE)} – ${to ? format(to, DISPLAY_DATE) : '…'}` : (p.placeholder ?? 'Pick a date range');
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <div className={cn('relative w-full', p.className)}>
        <PopoverTrigger asChild>
          <Button
            id={p.id}
            type="button"
            variant="outline"
            disabled={p.disabled}
            aria-invalid={p['aria-invalid']}
            className={cn('w-full justify-start font-normal', !from && 'text-muted-foreground')}
          >
            <CalendarIcon />
            <span className="truncate">{text}</span>
          </Button>
        </PopoverTrigger>
        {p.clearable && from && (
          <button type="button" aria-label="Clear dates" onClick={() => onChange(undefined)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground">
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          captionLayout="dropdown"
          numberOfMonths={2}
          defaultMonth={from}
          selected={{ from, to }}
          onSelect={(r) => {
            onChange(r?.from ? { from: isoDate(r.from), to: r.to ? isoDate(r.to) : undefined } : undefined);
            if (r?.from && r?.to && r.from.getTime() !== r.to.getTime()) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
