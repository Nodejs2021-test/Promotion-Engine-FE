import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Confirm } from '@/components/shared/confirm';
import { DataTable } from '@/components/shared/data-table';
import { FormField, FormGrid, textInput } from '@/components/shared/form-field';
import { SimpleSelect } from '@/components/shared/select';
import { ToneBadge } from '@/components/shared/status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { api, errorText } from '@/lib/api-client';
import { fmtDateTime } from '@/lib/format';
import { useRoles } from '@/lib/meta';
import type { User } from '@/lib/types';

interface UserForm {
  username: string;
  full_name: string;
  email: string;
  role: string;
  password: string;
  active: boolean;
}

export function UsersTab() {
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get<User[]>('/users')).data });
  const roles = useRoles();
  const roleOptions = (roles.data || []).map((r) => ({ value: r.role, label: r.label }));
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [approving, setApproving] = useState<User | null>(null);
  const [approveRole, setApproveRole] = useState<string | undefined>();
  const form = useForm<UserForm>();
  const c = form.control;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['users'] });
    qc.invalidateQueries({ queryKey: ['roles'] });
  };

  const save = useMutation({
    mutationFn: async (v: UserForm) => {
      const body = { full_name: v.full_name, email: v.email || null, role: v.role, active: v.active, password: v.password || undefined };
      if (editing) await api.put(`/users/${editing.username}`, body);
      else await api.post('/users', { ...body, username: v.username });
    },
    onSuccess: () => { toast.success('User saved'); setOpen(false); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });
  const approve = useMutation({
    mutationFn: async () => { await api.post(`/users/${approving!.username}/approve`, { role: approveRole }); },
    onSuccess: () => { toast.success(`${approving?.username} approved`); setApproving(null); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });
  const reject = useMutation({
    mutationFn: async (username: string) => { await api.delete(`/users/${username}/registration`); },
    onSuccess: () => { toast.success('Registration rejected'); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });

  const openForm = (u: User | null) => {
    setEditing(u);
    form.reset({ username: u?.username ?? '', full_name: u?.full_name ?? '', email: u?.email ?? '', role: u?.role ?? '', password: '', active: u?.active ?? true });
    setOpen(true);
  };
  const pending = (users.data || []).filter((u) => u.registration_status === 'PENDING');

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <Alert className="border-warning/30 bg-warning-soft text-warning">
          <TriangleAlertIcon />
          <AlertTitle>{pending.length} account{pending.length > 1 ? 's' : ''} awaiting approval</AlertTitle>
          <AlertDescription className="text-current/80">Self-registered users can sign in after you approve them and choose their role.</AlertDescription>
        </Alert>
      )}
      <Button onClick={() => openForm(null)}><PlusIcon /> New user</Button>
      <DataTable<User>
        rows={users.data}
        rowKey={(u) => u.username}
        loading={users.isLoading}
        columns={[
          { key: 'u', header: 'Username', cell: (u) => <span className="font-medium">{u.username}</span> },
          { key: 'n', header: 'Name', cell: (u) => u.full_name },
          { key: 'e', header: 'Email', cell: (u) => u.email || '—' },
          { key: 'r', header: 'Role', cell: (u) => <ToneBadge tone="blue">{u.role_label || u.role}</ToneBadge> },
          {
            key: 's', header: 'Status',
            cell: (u) => (u.registration_status === 'PENDING'
              ? <ToneBadge tone="amber">Awaiting approval</ToneBadge>
              : <ToneBadge tone={u.active ? 'green' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</ToneBadge>),
          },
          { key: 'c', header: 'Registered', cell: (u) => fmtDateTime(u.created_at) },
          { key: 'l', header: 'Last login', cell: (u) => fmtDateTime(u.last_login_at) },
          {
            key: 'a', header: <span className="sr-only">Actions</span>,
            cell: (u) => (u.registration_status === 'PENDING' ? (
              <div className="flex justify-end gap-1">
                <Button size="sm" onClick={() => { setApproving(u); setApproveRole(undefined); }}>Approve</Button>
                <Confirm title={`Reject ${u.username}'s registration?`} description="The account is deleted." confirmLabel="Reject" destructive onConfirm={() => reject.mutate(u.username)}>
                  <Button size="sm" variant="destructive">Reject</Button>
                </Confirm>
              </div>
            ) : (
              <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => openForm(u)}>Edit</Button></div>
            )),
          },
        ]}
      />

      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {approving?.full_name} ({approving?.username})</DialogTitle>
            <DialogDescription>Choose the role this user gets. They can sign in straight away.</DialogDescription>
          </DialogHeader>
          <SimpleSelect options={roleOptions} value={approveRole} onChange={setApproveRole} placeholder="Role" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproving(null)}>Cancel</Button>
            <Button disabled={!approveRole || approve.isPending} onClick={() => approve.mutate()}>{approve.isPending && <Spinner />}Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.username}` : 'New user'}</DialogTitle>
          </DialogHeader>
          <form id="user-form" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            <FieldGroup>
              <FormGrid>
                <FormField control={c} name="username" label="Username" rules={editing ? undefined : { required: 'Required', minLength: { value: 3, message: 'At least 3 characters' } }}
                  render={(f, p) => <Input {...p} {...textInput(f)} disabled={!!editing} />} />
                <FormField control={c} name="full_name" label="Full name" rules={{ required: 'Required' }} render={(f, p) => <Input {...p} {...textInput(f)} />} />
              </FormGrid>
              <FormField control={c} name="email" label="Email" render={(f, p) => <Input {...p} {...textInput(f)} type="email" />} />
              <FormField control={c} name="role" label="Role" rules={{ required: 'Select a role' }}
                render={(f, p) => <SimpleSelect {...p} options={roleOptions} value={f.value || undefined} onChange={(v) => f.onChange(v ?? '')} placeholder="Select role" />} />
              <FormField control={c} name="password" label={editing ? 'New password (leave empty to keep)' : 'Password'}
                rules={{ required: editing ? false : 'Required', validate: (v) => !v || v.length >= 8 || 'At least 8 characters' }}
                render={(f, p) => <Input {...p} {...textInput(f)} type="password" autoComplete="new-password" />} />
              <FormField control={c} name="active"
                render={(f) => (
                  <Field orientation="horizontal">
                    <Switch id="user-active" checked={f.value} onCheckedChange={f.onChange} />
                    <FieldLabel htmlFor="user-active">Active</FieldLabel>
                  </Field>
                )} />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="user-form" disabled={save.isPending}>{save.isPending && <Spinner />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
