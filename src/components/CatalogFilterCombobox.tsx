import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export type CatalogFilterOption = {
  label: string;
  value: string;
};

type CatalogFilterComboboxProps = {
  label: string;
  value?: string | string[];
  options: CatalogFilterOption[];
  multiple?: boolean;
  allLabel?: string;
  onValueChange: (value?: string | string[]) => void;
};

function normalizeValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

export function CatalogFilterCombobox({
  label,
  value,
  options,
  multiple = false,
  allLabel,
  onValueChange,
}: CatalogFilterComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const listboxId = React.useId();
  const selectedValues = normalizeValue(value);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const selectedLabels = React.useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label),
    [options, selectedValues],
  );

  const visibleOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      return option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery);
    });
  }, [options, query]);

  const displayValue = React.useMemo(() => {
    if (open) {
      return query;
    }

    if (selectedLabels.length === 0) {
      return '';
    }

    return multiple ? selectedLabels.join(', ') : (selectedLabels[0] ?? '');
  }, [multiple, open, query, selectedLabels]);

  const handleSelect = (nextValue: string) => {
    if (multiple) {
      const nextSelectedValues = selectedValues.includes(nextValue)
        ? selectedValues.filter((entry) => entry !== nextValue)
        : [...selectedValues, nextValue];

      onValueChange(nextSelectedValues.length > 0 ? nextSelectedValues : undefined);
      setQuery('');
      return;
    }

    onValueChange(nextValue);
    setOpen(false);
  };

  const handleClear = () => {
    onValueChange(undefined);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={`filter-${label}`}>
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`filter-${label}`}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          value={displayValue}
          placeholder={selectedLabels.length > 0 ? undefined : allLabel ?? `All ${label}`}
          className="h-11 rounded-xl border-border/70 bg-card pl-9 pr-18"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            if (!open) {
              setOpen(true);
            }

            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
            }

            if (event.key === 'ArrowDown' && !open) {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {selectedValues.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Clear ${label}`}
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={open ? `Close ${label}` : `Open ${label}`}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </Button>
        </div>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={`${label} options`}
            aria-multiselectable={multiple || undefined}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-y-auto rounded-2xl border bg-popover p-2 shadow-lg ring-1 ring-foreground/10"
          >
            <button
              type="button"
              role="option"
              aria-selected={selectedValues.length === 0}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleClear}
            >
              <span>{allLabel ?? `All ${label}`}</span>
              {selectedValues.length === 0 ? <Check className="h-4 w-4" /> : null}
            </button>

            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                  >
                    {multiple ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input',
                          isSelected && 'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : null}
                      </span>
                    ) : null}
                    <span className="flex-1">{option.label}</span>
                    {!multiple && isSelected ? <Check className="h-4 w-4" /> : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">No options found.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
