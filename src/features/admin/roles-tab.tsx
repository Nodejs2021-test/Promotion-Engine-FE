import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InfoIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Confirm } from '@/components/shared/confirm';
import { DataTable } from '@/components/shared/data-table';
import { FormField, textInput } from '@/components/shared/form-field';
import { ToneBadge } from '@/components/shared/status';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { api, errorText } from '@/lib/api-client';
import { useMeta, useRoles, type RoleDef } from '@/lib/meta';

interface RoleForm {
  role: string;
  label: string;
  description: string;
  permissions: string[];
}

export function RolesTab() {
  const qc = useQueryClient();
  const meta = useMeta();
  const roles = useRoles();
  const [editing, setEditing] = useState<RoleDef | null>(null);
  const [open, setOpen] = useState(false);
  const form = useForm<RoleForm>();
  const c = form.control;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['roles'] });
    qc.invalidateQueries({ queryKey: ['users'] });
  };
  const save = useMutation({
    mutationFn: async (v: RoleForm) => {
      if (editing) await api.put(`/roles/${editing.role}`, { label: v.label, description: v.description || null, permissions: v.permissions });
      else await api.post('/roles', { role: v.role, label: v.label, description: v.description || null, permissions: v.permissions });
    },
    onSuccess: () => { toast.success('Role saved'); setOpen(false); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });
  const remove = useMutation({
    mutationFn: (role: string) => api.delete(`/roles/${role}`),
    onSuccess: () => { toast.success('Role deleted'); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });
  const openForm = (r: RoleDef | null) => {
    setEditing(r);
    form.reset({ role: r?.role ?? '', label: r?.label ?? '', description: r?.description ?? '', permissions: r?.permissions ?? [] });
    setOpen(true);
  };
  const permLabel = (p: string) => meta.data?.permissions.find((x) => x.value === p)?.label ?? p;

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon />
        <AlertTitle>Roles and their permissions are stored in the database. Changes apply to users immediately.</AlertTitle>
      </Alert>
      <Button onClick={() => openForm(null)}><PlusIcon /> New role</Button>
      <DataTable<RoleDef>
        rows={roles.data}
        rowKey={(r) => r.role}
        loading={roles.isLoading}
        columns={[
          { key: 'r', header: 'Role', cell: (r) => <div><div className="font-medium">{r.label}</div><code className="text-xs text-muted-foreground">{r.role}</code></div> },
          { key: 'd', header: 'Description', className: 'whitespace-normal', cell: (r) => r.description || '—' },
          { key: 'u', header: 'Users', align: 'right', cell: (r) => r.user_count },
          {
            key: 'p', header: 'Permissions', className: 'whitespace-normal',
            cell: (r) => <div className="flex max-w-xl flex-wrap gap-1">{r.permissions.map((p) => <ToneBadge key={p}>{permLabel(p)}</ToneBadge>)}</div>,
          },
          {
            key: 'a', header: <span className="sr-only">Actions</span>,
            cell: (r) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => openForm(r)}>Edit</Button>
                {!r.system && (
                  <Confirm title={`Delete role ${r.label}?`} confirmLabel="Delete" destructive onConfirm={() => remove.mutate(r.role)}>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </Confirm>
                )}
              </div>
            ),
          },
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit role ${editing.label}` : 'New role'}</DialogTitle>
          </DialogHeader>
          <form id="role-form" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))} className="max-h-[70vh] overflow-y-auto px-0.5">
            <FieldGroup>
              {!editing && (
                <FormField control={c} name="role" label="Role code"
                  rules={{ required: 'Required', pattern: { value: /^[A-Za-z][A-Za-z0-9_]*$/, message: 'Letters, digits and _' } }}
                  render={(f, p) => <Input {...p} {...textInput(f)} className="uppercase" />} />
              )}
              <FormField control={c} name="label" label="Name" rules={{ required: 'Required' }} render={(f, p) => <Input {...p} {...textInput(f)} />} />
              <FormField control={c} name="description" label="Description" render={(f, p) => <Input {...p} {...textInput(f)} />} />
              <FormField control={c} name="permissions" label="Permissions"
                render={(f) => (
                  <div className="grid gap-3 rounded-lg border p-3">
                    {(meta.data?.permissions || []).map((perm) => {
                      const checked = f.value.includes(perm.value);
                      return (
                        <div key={perm.value} className="flex items-start gap-3">
                          <Checkbox id={`perm-${perm.value}`} checked={checked}
                            onCheckedChange={(v) => f.onChange(v ? [...f.value, perm.value] : f.value.filter((x: string) => x !== perm.value))} />
                          <Label htmlFor={`perm-${perm.value}`} className="block leading-snug font-normal">
                            <span className="font-medium">{perm.label}</span>
                            <span className="block text-muted-foreground">{perm.description}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )} />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="role-form" disabled={save.isPending}>{save.isPending && <Spinner />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
