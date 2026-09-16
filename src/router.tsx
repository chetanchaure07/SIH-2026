import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

const OverviewPage = lazy(() => import('@/pages/OverviewPage'));
const ForecastPage = lazy(() => import('@/pages/ForecastPage'));
const GenerationPage = lazy(() => import('@/pages/GenerationPage'));
const BatteryPage = lazy(() => import('@/pages/BatteryPage'));
const FuelPage = lazy(() => import('@/pages/FuelPage'));
const GeneratorsPage = lazy(() => import('@/pages/GeneratorsPage'));
const LoadsPage = lazy(() => import('@/pages/LoadsPage'));
const RenewablesPage = lazy(() => import('@/pages/RenewablesPage'));
const AIPage = lazy(() => import('@/pages/AIPage'));
const ScenariosPage = lazy(() => import('@/pages/ScenariosPage'));
const AlertsPage = lazy(() => import('@/pages/AlertsPage'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage'));
const WeatherPage = lazy(() => import('@/pages/WeatherPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const HealthPage = lazy(() => import('@/pages/HealthPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'forecast', element: <ForecastPage /> },
      { path: 'generation', element: <GenerationPage /> },
      { path: 'battery', element: <BatteryPage /> },
      { path: 'fuel', element: <FuelPage /> },
      { path: 'generators', element: <GeneratorsPage /> },
      { path: 'loads', element: <LoadsPage /> },
      { path: 'renewables', element: <RenewablesPage /> },
      { path: 'ai', element: <AIPage /> },
      { path: 'scenarios', element: <ScenariosPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'weather', element: <WeatherPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
