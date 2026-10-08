import { CircleAlertIcon, InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField, textInput } from '@/components/shared/form-field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { errorText } from '@/lib/api-client';
import { useSetupStatus } from '@/lib/setup';
import { useAuth } from './auth-context';
import { AuthShell } from './auth-shell';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const setup = useSetupStatus();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ username: string; password: string }>({ defaultValues: { username: '', password: '' } });
  const noAccounts = setup.data ? !setup.data.initialized : false;

  if (user) return <Navigate to="/" replace />;

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.username, v.password);
      navigate('/');
    } catch (e) {
      setError(errorText(e));
    }
  });

  return (
    <AuthShell title="Sign in" subtitle={setup.data?.organization_name || 'Promotion Management & Pricing'}>
      {noAccounts && (
        <Alert className="mb-4">
          <InfoIcon />
          <AlertTitle>No accounts exist yet</AlertTitle>
          <AlertDescription>
            <p>
              Register first: the first account becomes the administrator.{' '}
              <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
            </p>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <CircleAlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <FormField control={form.control} name="username" label="Username" rules={{ required: 'Enter your username' }}
            render={(f, c) => <Input {...c} {...textInput(f)} autoFocus autoComplete="username" />} />
          <FormField control={form.control} name="password" label="Password" rules={{ required: 'Enter your password' }}
            render={(f, c) => <Input {...c} {...textInput(f)} type="password" autoComplete="current-password" />} />
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Spinner />}
            Sign in
          </Button>
        </FieldGroup>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
