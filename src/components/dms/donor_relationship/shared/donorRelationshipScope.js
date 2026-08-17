import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { hasPermission } from '../../../../utils/permissions';

export function useCanViewTeam() {
  const { permissions, user } = useAuth();
  return useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'super_admin' || role === 'fund_raising_manager') return true;
    return (
      permissions?.super_admin === true ||
      permissions?.fund_raising_manager === true ||
      hasPermission(permissions, 'fund_raising', 'donor_relationship', 'manage_overview')
    );
  }, [permissions, user]);
}

export function useDonorRelationshipScope() {
  const [searchParams, setSearchParams] = useSearchParams();
  const canViewTeam = useCanViewTeam();

  const scope =
    searchParams.get('scope') === 'team' && canViewTeam ? 'team' : 'mine';

  const setScope = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'team' && canViewTeam) {
      params.set('scope', 'team');
    } else {
      params.delete('scope');
    }
    setSearchParams(params, { replace: true });
  };

  return { scope, setScope, canViewTeam };
}
