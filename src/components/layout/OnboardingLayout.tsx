import { Outlet } from 'react-router-dom';
import { FocusShell } from '@/components/layout/FocusShell';

export function OnboardingLayout() {
  return (
    <FocusShell>
      <Outlet />
    </FocusShell>
  );
}
