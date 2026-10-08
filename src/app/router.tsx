import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/app-layout';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/features/auth/auth-context';
import { useBranding } from '@/lib/setup';

const AdminPage = lazy(() => import('@/features/admin/admin-page'));
const AuditPage = lazy(() => import('@/features/audit/audit-page'));
const HowItWorksPage = lazy(() => import('@/features/help/how-it-works-page'));
const CampaignsPage = lazy(() => import('@/features/campaigns/campaigns-page'));
const CampaignDetailPage = lazy(() => import('@/features/campaigns/campaign-detail-page'));
const CampaignFormPage = lazy(() => import('@/features/campaigns/campaign-form-page'));
const LoginPage = lazy(() => import('@/features/auth/login-page'));
const RegisterPage = lazy(() => import('@/features/auth/register-page'));
const NewSalesOrderPage = lazy(() => import('@/features/sales-orders/new-sales-order-page'));
const SalesOrdersPage = lazy(() => import('@/features/sales-orders/sales-orders-page'));
const SalesOrderDetailPage = lazy(() => import('@/features/sales-orders/sales-order-detail-page'));

function FullPageSpinner() {
  return (
    <div className="grid min-h-svh place-items-center">
      <Spinner className="size-6" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  useBranding();
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup" element={<Navigate to="/register" replace />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/sales-orders" replace />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/new" element={<CampaignFormPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="campaigns/:id/edit" element={<CampaignFormPage />} />
          <Route path="sales-orders" element={<SalesOrdersPage />} />
          <Route path="sales-orders/new" element={<NewSalesOrderPage />} />
          <Route path="sales-orders/:id" element={<SalesOrderDetailPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
