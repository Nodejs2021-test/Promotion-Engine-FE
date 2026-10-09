import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeysTab } from './api-keys-tab';
import { EligibilityTab } from './eligibility-tab';
import { RolesTab } from './roles-tab';
import { SettingsTab } from './settings-tab';
import { UsersTab } from './users-tab';

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Administration" description="Users, roles & permissions, programme eligibility, integration API keys and business settings" />
      <Tabs defaultValue="users">
        <TabsList variant="line" className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          <TabsTrigger value="eligibility">Programme eligibility</TabsTrigger>
          <TabsTrigger value="keys">API keys</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="eligibility"><EligibilityTab /></TabsContent>
        <TabsContent value="keys"><ApiKeysTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </>
  );
}
