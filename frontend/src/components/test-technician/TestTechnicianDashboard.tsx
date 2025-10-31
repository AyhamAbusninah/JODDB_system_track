import React from 'react';
import { QualityInspectorDashboard } from '../quality/QualityInspectorDashboard';

/**
 * Test Technician Dashboard - Reuses Quality Inspector logic
 * Same permissions and functionality but with distinct branding
 */
export const TestTechnicianDashboard: React.FC = () => {
  return <QualityInspectorDashboard />;
};
