import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Combobox } from '@/components/shared/combobox';
import { FormField, FormGrid, textInput } from '@/components/shared/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { api, errorText } from '@/lib/api-client';
import { useMeta } from '@/lib/meta';
import { useSetupStatus } from '@/lib/setup';
import type { User } from '@/lib/types';
import { useAuth } from './auth-context';
import { AuthShell } from './auth-shell';

interface RegisterValues {
  username: string;
  full_name: string;
  email: string;
  password: string;
  confirm: string;
  organization_name: string;
  currency: string;
  timezone: string;
}

interface RegisterResult {
  status: 'ACTIVE' | 'PENDING';
  first_user: boolean;
  access_token?: string;
  user?: User;
  message?: string;
}

const link = 'font-medium text-primary underline-offset-4 hover:underline';

function RegisterForm({ firstUser, defaultTimezone }: { firstUser: boolean; defaultTimezone?: string }) {
  const { startSession } = useAuth();
  const meta = useMeta();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<RegisterValues>({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirm: '', organization_name: '', currency: '', timezone: defaultTimezone ?? '' },
  });
  const c = form.control;

  const register = useMutation({
    mutationFn: async (v: RegisterValues) =>
      (
        await api.post<RegisterResult>('/auth/register', {
          username: v.username,
          full_name: v.full_name,
          email: v.email || null,
          password: v.password,
          ...(firstUser ? { organization_name: v.organization_name, currency: v.currency.toUpperCase(), timezone: v.timezone } : {}),
        })
      ).data,
    onSuccess: (r) => {
      if (r.status === 'ACTIVE' && r.access_token && r.user) {
        startSession(r.access_token, r.user);
        qc.invalidateQueries({ queryKey: ['setup-status'] });
        navigate('/');
      }
    },
  });

  if (register.data?.status === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CircleCheckIcon className="size-10 text-success" />
        <h2 className="text-lg font-semibold">Account created</h2>
        <p className="text-sm text-muted-foreground">An administrator must approve your account before you can sign in.</p>
        <Button asChild className="mt-2">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  const timezones = (meta.data?.timezones || []).map((t) => ({ value: t, label: t }));

  return (
    <>
      <Alert className="mb-4">
        <InfoIcon />
        {firstUser ? (
          <>
            <AlertTitle>You are the first user</AlertTitle>
            <AlertDescription>
              Your account will be the Administrator. Enter your organisation&apos;s details as well; you can change them later under
              Administration → Settings.
            </AlertDescription>
          </>
        ) : (
          <AlertTitle>New accounts need approval by an administrator before you can sign in.</AlertTitle>
        )}
      </Alert>
      {register.isError && (
        <Alert variant="destructive" className="mb-4">
          <CircleAlertIcon />
          <AlertTitle>{errorText(register.error)}</AlertTitle>
        </Alert>
      )}
      <form onSubmit={form.handleSubmit((v) => register.mutate(v))} noValidate>
        <FieldGroup>
          {firstUser && (
            <>
              <FieldSeparator>Organisation</FieldSeparator>
              <FormField control={c} name="organization_name" label="Organisation name"
                rules={{ required: 'Required', validate: (v) => !!v.trim() || 'Required' }}
                render={(f, p) => <Input {...p} {...textInput(f)} />} />
              <FormGrid>
                <FormField control={c} name="currency" label="Currency (ISO code)"
                  rules={{ required: 'Required', pattern: { value: /^[A-Za-z]{3}$/, message: 'Three-letter code, e.g. INR' } }}
                  render={(f, p) => <Input {...p} {...textInput(f)} maxLength={3} className="uppercase" placeholder="e.g. INR" />} />
                <FormField control={c} name="timezone" label="Business timezone" rules={{ required: 'Required' }}
                  description="Decides the default order date of a sales order sent without one"
                  render={(f, p) => <Combobox {...p} options={timezones} value={f.value} onChange={(v) => f.onChange(v ?? '')} placeholder="Select timezone" />} />
              </FormGrid>
              <FieldSeparator>Your account</FieldSeparator>
            </>
          )}
          <FormGrid>
            <FormField control={c} name="username" label="Username"
              rules={{ required: 'Required', minLength: { value: 3, message: 'At least 3 characters' }, pattern: { value: /^[A-Za-z0-9_.-]+$/, message: 'Letters, digits, . _ -' } }}
              render={(f, p) => <Input {...p} {...textInput(f)} autoComplete="username" autoFocus />} />
            <FormField control={c} name="full_name" label="Full name" rules={{ required: 'Required' }}
              render={(f, p) => <Input {...p} {...textInput(f)} autoComplete="name" />} />
          </FormGrid>
          <FormField control={c} name="email" label="Email" render={(f, p) => <Input {...p} {...textInput(f)} type="email" autoComplete="email" />} />
          <FormGrid>
            <FormField control={c} name="password" label="Password" rules={{ required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } }}
              render={(f, p) => <Input {...p} {...textInput(f)} type="password" autoComplete="new-password" />} />
            <FormField control={c} name="confirm" label="Confirm password"
              rules={{ required: 'Required', validate: (v, all) => v === all.password || 'Passwords do not match' }}
              render={(f, p) => <Input {...p} {...textInput(f)} type="password" autoComplete="new-password" />} />
          </FormGrid>
          <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
            {register.isPending && <Spinner />}
            {firstUser ? 'Create administrator account' : 'Register'}
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className={link}>Sign in</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  const { user } = useAuth();
  const setup = useSetupStatus();
  const meta = useMeta();
  if (user) return <Navigate to="/" replace />;
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ready = setup.data && meta.data;
  return (
    <AuthShell title="Create an account" subtitle={setup.data?.organization_name || 'Promotion Engine'} wide>
      {ready ? (
        <RegisterForm firstUser={!setup.data!.initialized} defaultTimezone={meta.data!.timezones.includes(browserTz) ? browserTz : undefined} />
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      )}
    </AuthShell>
  );
}
