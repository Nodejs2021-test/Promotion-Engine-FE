import type { ReactElement, ReactNode } from 'react';
import {
  Controller, type Control, type ControllerRenderProps, type FieldPath, type FieldValues, type RegisterOptions,
} from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

export interface ControlProps {
  id: string;
  'aria-invalid': boolean;
}

interface Props<T extends FieldValues, N extends FieldPath<T>> {
  control: Control<T>;
  name: N;
  label?: ReactNode;
  description?: ReactNode;
  rules?: RegisterOptions<T, N>;
  className?: string;
  render: (field: ControllerRenderProps<T, N>, control: ControlProps) => ReactElement;
}

/** A react-hook-form controlled field rendered with the shadcn Field primitives. */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({ control, name, label, description, rules, className, render }: Props<T, N>) {
  const id = `f-${String(name).replace(/\W/g, '-')}`;
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={cn(className)}>
          {label && (
            <FieldLabel htmlFor={id} className="label-mono text-muted-foreground">
              {label}
              {rules?.required ? <span className="text-destructive">*</span> : null}
            </FieldLabel>
          )}
          {render(field, { id, 'aria-invalid': fieldState.invalid })}
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** Props for a text <Input>/<Textarea>: undefined/null render as an empty string. */
export function textInput(field: { value: unknown; onChange: (v: string) => void; onBlur: () => void; name: string }) {
  return {
    name: field.name,
    value: (field.value as string | null | undefined) ?? '',
    onBlur: field.onBlur,
    onChange: (e: { target: { value: string } }) => field.onChange(e.target.value),
  };
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>{children}</div>;
}
