import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, TriangleAlertIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DatePicker } from '@/components/shared/date-picker';
import { FormField, FormGrid, textInput } from '@/components/shared/form-field';
import { FormLayout, FormSection, StickyActions } from '@/components/shared/form-layout';
import { LoadingBlock } from '@/components/shared/misc';
import { PageHeader } from '@/components/shared/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { api, errorText } from '@/lib/api-client';
import type { CampaignDetail } from './types';

interface FormValues {
  name: string;
  code: string;
  description: string;
  start_date: string;
  end_date: string;
  customer_ids: string;
  customer_groups: string;
  channels: string;
  skus: string;
  item_groups: string;
}

const LISTS = ['customer_ids', 'customer_groups', 'channels', 'skus', 'item_groups'] as const;
const split = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);

const EMPTY: FormValues = {
  name: '', code: '', description: '', start_date: '', end_date: '',
  customer_ids: '', customer_groups: '', channels: '', skus: '', item_groups: '',
};

const LIST_HINT = 'Separate several values with commas. Leave empty for all.';

export default function CampaignFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = !!id;
  const existing = useQuery({
    queryKey: ['campaigns', 'detail', id],
    queryFn: async () => (await api.get<CampaignDetail>(`/campaigns/${id}`)).data,
    enabled: editing,
  });
  const form = useForm<FormValues>({ defaultValues: EMPTY });
  const c = form.control;

  useEffect(() => {
    const d = existing.data;
    if (!d) return;
    form.reset({
      name: d.name, code: d.code, description: d.description || '',
      start_date: d.start_date, end_date: d.end_date,
      ...Object.fromEntries(LISTS.map((k) => [k, d.eligibility[k].join(', ')])),
    } as FormValues);
  }, [existing.data, form]);

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const body = { ...v, description: v.description || null, ...Object.fromEntries(LISTS.map((k) => [k, split(v[k])])) };
      return (await (editing ? api.put<CampaignDetail>(`/campaigns/${id}`, body) : api.post<CampaignDetail>('/campaigns', body))).data;
    },
    onSuccess: (d) => { toast.success(editing ? 'Campaign saved' : 'Campaign created: now add its rules'); navigate(`/campaigns/${d.campaign_id}`); },
    onError: (e) => toast.error(errorText(e)),
  });

  if (editing && existing.isLoading) return <LoadingBlock rows={8} />;
  const resetsApproval = existing.data && existing.data.approval_status !== 'DRAFT';

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to={editing ? `/campaigns/${id}` : '/campaigns'}><ArrowLeftIcon /> {editing ? existing.data?.name : 'Campaigns'}</Link>
      </Button>
      <PageHeader title={editing ? 'Edit campaign' : 'New campaign'}
        description="The campaign says when it runs and who and what it is for. Its rules (added next) say what discount is given." />
      {resetsApproval && (
        <Alert className="mb-4 border-warning/30 bg-warning-soft text-warning">
          <TriangleAlertIcon />
          <AlertTitle>Saving sends this campaign back to Draft</AlertTitle>
          <AlertDescription className="text-current/80">It stops pricing sales orders until it is submitted and approved again.</AlertDescription>
        </Alert>
      )}
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <FormLayout>
          <FormSection n={1} title="Campaign" required>
            <FormGrid>
              <FormField control={c} name="name" label="Campaign name" rules={{ required: 'Enter a name', validate: (v) => !!v.trim() || 'Enter a name' }}
                render={(f, p) => <Input {...p} {...textInput(f)} placeholder="October Pharmacy Promotion" />} />
              <FormField control={c} name="code" label="Campaign code"
                rules={{ required: 'Enter a code', pattern: { value: /^[A-Za-z0-9_-]{2,40}$/, message: 'Letters, digits, - and _ only (2 to 40)' } }}
                render={(f, p) => <Input {...p} {...textInput(f)} className="uppercase" placeholder="OCT-PHARM" />} />
            </FormGrid>
            <FormField control={c} name="description" label="Description"
              render={(f, p) => <Textarea {...p} {...textInput(f)} rows={2} placeholder="What the campaign is for" />} />
          </FormSection>

          <FormSection n={2} title="Dates" required description="The campaign applies to sales orders whose order date is in this period (both days included).">
            <FormGrid>
              <FormField control={c} name="start_date" label="Start date" rules={{ required: 'Choose a start date' }}
                render={(f, p) => <DatePicker {...p} value={f.value} onChange={(v) => f.onChange(v ?? '')} />} />
              <FormField control={c} name="end_date" label="End date"
                rules={{ required: 'Choose an end date', validate: (v, all) => !all.start_date || v >= all.start_date || 'The end date is before the start date' }}
                render={(f, p) => <DatePicker {...p} value={f.value} onChange={(v) => f.onChange(v ?? '')} />} />
            </FormGrid>
          </FormSection>

          <FormSection n={3} title="Customer eligibility" description="Which customers the campaign is for. Every rule of the campaign also needs these.">
            <FormGrid>
              <FormField control={c} name="customer_groups" label="Customer groups" description={LIST_HINT}
                render={(f, p) => <Input {...p} {...textInput(f)} placeholder="Pharmacy" />} />
              <FormField control={c} name="channels" label="Channels" description={LIST_HINT}
                render={(f, p) => <Input {...p} {...textInput(f)} placeholder="Pharmacy" />} />
            </FormGrid>
            <FormField control={c} name="customer_ids" label="Specific customers (ids)" description={LIST_HINT}
              render={(f, p) => <Input {...p} {...textInput(f)} placeholder="CUST001, 717918" />} />
          </FormSection>

          <FormSection n={4} title="Item eligibility" description="Which products the campaign is for. Every rule of the campaign also needs these.">
            <FormGrid>
              <FormField control={c} name="item_groups" label="Item groups" description={LIST_HINT}
                render={(f, p) => <Input {...p} {...textInput(f)} placeholder="FG-AU" />} />
              <FormField control={c} name="skus" label="SKUs" description={LIST_HINT}
                render={(f, p) => <Input {...p} {...textInput(f)} placeholder="430781" />} />
            </FormGrid>
          </FormSection>
        </FormLayout>
        <StickyActions note={editing ? undefined : 'Saved as Draft. Add rules, then submit it for approval.'}>
          <Button type="button" variant="outline" onClick={() => navigate(editing ? `/campaigns/${id}` : '/campaigns')}>Cancel</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending && <Spinner />}{editing ? 'Save campaign' : 'Create campaign'}</Button>
        </StickyActions>
      </form>
    </>
  );
}
