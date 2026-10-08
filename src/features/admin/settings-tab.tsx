import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpIcon, Trash2Icon } from 'lucide-react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Combobox } from '@/components/shared/combobox';
import { FormField, textInput } from '@/components/shared/form-field';
import { LoadingBlock } from '@/components/shared/misc';
import { Button } from '@/components/ui/button';
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { api, errorText } from '@/lib/api-client';
import { fmtDateTime } from '@/lib/format';
import { useAppSettings, useMeta, type AppSettings } from '@/lib/meta';
import { logoUrl, useSetupStatus } from '@/lib/setup';

type SettingsForm = Pick<AppSettings, 'organization_name' | 'currency' | 'timezone'> & { channel: string; banner: string; marketing_flag: string };

const CONTROLLED = [
  { name: 'channel', label: 'Controlled Channels' },
  { name: 'banner', label: 'Controlled Banners' },
  { name: 'marketing_flag', label: 'Controlled Marketing Flags' },
] as const;

function Form({ settings }: { settings: AppSettings }) {
  const qc = useQueryClient();
  const meta = useMeta();
  const form = useForm<SettingsForm>({
    defaultValues: {
      organization_name: settings.organization_name, currency: settings.currency, timezone: settings.timezone,
      channel: (settings.controlled_values?.channel || []).join(', '),
      banner: (settings.controlled_values?.banner || []).join(', '),
      marketing_flag: (settings.controlled_values?.marketing_flag || []).join(', '),
    },
  });
  const c = form.control;
  const save = useMutation({
    mutationFn: ({ channel, banner, marketing_flag, ...v }: SettingsForm) =>
      api.put('/settings', { ...v, currency: v.currency.toUpperCase(), controlled_values: { channel, banner, marketing_flag } }),
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['setup-status'] });
      qc.invalidateQueries({ queryKey: ['meta'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <form noValidate className="max-w-lg" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <FieldGroup>
        <FormField control={c} name="organization_name" label="Organisation name" rules={{ required: 'Required', validate: (v) => !!v.trim() || 'Required' }}
          render={(f, p) => <Input {...p} {...textInput(f)} />} />
        <FormField control={c} name="currency" label="Currency (ISO code)"
          rules={{ required: 'Required', pattern: { value: /^[A-Za-z]{3}$/, message: 'Three-letter code' } }}
          render={(f, p) => <Input {...p} {...textInput(f)} maxLength={3} className="w-28 uppercase" />} />
        <FormField control={c} name="timezone" label="Business timezone" rules={{ required: 'Required' }}
          description="Decides the default order date of a sales order sent without one."
          render={(f, p) => (
            <Combobox {...p} options={(meta.data?.timezones || []).map((t) => ({ value: t, label: t }))} value={f.value} onChange={(v) => f.onChange(v ?? '')} />
          )} />
        {CONTROLLED.map((f) => (
          <FormField key={f.name} control={c} name={f.name} label={f.label}
            description="Comma separated. When set, sales orders and rules may only use these values (otherwise INVALID_CONTROLLED_ATTRIBUTE). Leave empty to accept any value."
            render={(fl, p) => <Input {...p} {...textInput(fl)} placeholder="e.g. Pharmacy, Health Food" />} />
        ))}
        <p className="text-sm text-muted-foreground">Last changed by {settings.updated_by} · {fmtDateTime(settings.updated_at)}</p>
        <div>
          <Button type="submit" disabled={save.isPending}>{save.isPending && <Spinner />}Save settings</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

const LOGO_TYPES = 'image/png,image/jpeg,image/svg+xml,image/webp,image/avif,image/gif';

/** Upload, replace or remove the organisation logo (stored by the backend, shown in the sidebar and on sign-in). */
function LogoSection() {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const status = useSetupStatus().data;
  const src = logoUrl(status?.logo_version);
  const uploaded = !!status?.logo_uploaded;
  const refresh = () => qc.invalidateQueries({ queryKey: ['setup-status'] });
  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return api.put('/settings/logo', body);
    },
    onSuccess: () => {
      toast.success('Logo uploaded');
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
    onSettled: () => {
      if (input.current) input.current.value = '';
    },
  });
  const remove = useMutation({
    mutationFn: () => api.delete('/settings/logo'),
    onSuccess: () => {
      toast.success('Default logo restored');
      refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <FieldSet className="max-w-lg">
      <FieldLegend>Logo</FieldLegend>
      <FieldDescription>Shown in the sidebar, on the sign-in page and as the browser tab icon. {uploaded ? 'Uploaded logo.' : 'Default logo from the backend.'} Upload PNG, JPEG, SVG, WebP, AVIF or GIF, up to 512 KB.</FieldDescription>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-44 place-items-center rounded-lg border bg-[#fbf8f1] p-2">
          {src ? <img src={src} alt="Current logo" className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">No logo</span>}
        </div>
        <input ref={input} id="logo-file" type="file" accept={LOGO_TYPES} className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}>
            {upload.isPending ? <Spinner /> : <ImageUpIcon />} {uploaded ? 'Replace logo' : 'Upload logo'}
          </Button>
          {uploaded && (
            <Button type="button" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? <Spinner /> : <Trash2Icon />} Use default logo
            </Button>
          )}
        </div>
      </div>
    </FieldSet>
  );
}

export function SettingsTab() {
  const settings = useAppSettings();
  if (!settings.data) return <LoadingBlock rows={3} />;
  return (
    <div className="space-y-8">
      <Form key={settings.data.updated_at} settings={settings.data} />
      <LogoSection />
    </div>
  );
}
