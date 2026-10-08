import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option } from '@/lib/meta';
import { cn } from '@/lib/utils';

const NONE = '__none__';

export interface SimpleSelectProps {
  options?: Option[];
  value?: string | null;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  /** Adds an entry that clears the value (used by list filters). */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  size?: 'sm' | 'default';
  'aria-invalid'?: boolean;
  'aria-label'?: string;
}

/** Small fixed option list (statuses, types); use Combobox for long or searchable lists. */
export function SimpleSelect({ options, value, onChange, placeholder, clearLabel, disabled, className, id, size, ...rest }: SimpleSelectProps) {
  return (
    <Select value={value ?? (clearLabel ? NONE : '')} onValueChange={(v) => onChange(v === NONE ? undefined : v)} disabled={disabled}>
      <SelectTrigger id={id} size={size} className={cn('w-full', className)} aria-invalid={rest['aria-invalid']} aria-label={rest['aria-label']}>
        <SelectValue placeholder={placeholder ?? 'Select…'} />
      </SelectTrigger>
      <SelectContent position="popper">
        {clearLabel && <SelectItem value={NONE}>{clearLabel}</SelectItem>}
        {(options ?? []).map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
