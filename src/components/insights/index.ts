import { lazy } from 'react';

// Direct exports for lighter components
export { default as InsightsSummary } from './InsightsSummary';
export { default as InsightsCharts } from './InsightsCharts';

// Lazy loaded export for the heavy LocationHeatmap component
export const LocationHeatmap = lazy(() => import('./LocationHeatmap')); 