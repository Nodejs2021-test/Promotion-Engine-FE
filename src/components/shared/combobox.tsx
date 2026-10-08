import { ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type Opt = { value: string; label: string; disabled?: boolean };

interface BaseProps {
  options: Opt[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean;
}

function OptionList({ options, isSelected, onPick, searchPlaceholder, emptyText }: {
  options: Opt[];
  isSelected: (v: string) => boolean;
  onPick: (v: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder ?? 'Search…'} />
      <CommandList>
        <CommandEmpty>{emptyText ?? 'No matches'}</CommandEmpty>
        <CommandGroup>
          {options.map((o) => (
            <CommandItem
              key={o.value}
              value={`${o.label} ${o.value}`}
              disabled={o.disabled}
              data-checked={isSelected(o.value)}
              onSelect={() => onPick(o.value)}
            >
              <span className="truncate">{o.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/** Searchable single-value select. */
export function Combobox({ options, value, onChange, clearable, ...p }: BaseProps & {
  value?: string | null;
  onChange: (v: string | undefined) => void;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <div className={cn('relative w-full', p.className)}>
        <PopoverTrigger asChild>
          <Button
            id={p.id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={p['aria-invalid']}
            disabled={p.disabled}
            className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', clearable && selected && 'pr-14')}
          >
            <span className="truncate">{selected ? selected.label : value || p.placeholder || 'Select…'}</span>
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        {clearable && selected && !p.disabled && (
          <button
            type="button"
            aria-label="Clear"
            className="absolute top-1/2 right-8 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => onChange(undefined)}
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <OptionList
          options={options}
          isSelected={(v) => v === value}
          onPick={(v) => {
            onChange(v === value && clearable ? undefined : v);
            setOpen(false);
          }}
          searchPlaceholder={p.searchPlaceholder}
          emptyText={p.emptyText}
        />
      </PopoverContent>
    </Popover>
  );
}
