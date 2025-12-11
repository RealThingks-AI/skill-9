import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageAccess } from '@/hooks/usePageAccess';
import { useAuthContext } from '@/components/common/AuthProvider';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { hasAccess, isLoading, accessMap } = usePageAccess();
  const { profile, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isLoading && profile) {
      const currentRoute = location.pathname;
      
      // Utility routes that should always be accessible
      const publicUtilityRoutes = ['/profile', '/notifications'];
      const isUtilityRoute = publicUtilityRoutes.some(route => currentRoute.startsWith(route));
      
      // Only check access if accessMap has been loaded (not empty)
      // This prevents redirect during initial page load/refresh
      const accessMapLoaded = Object.keys(accessMap).length > 0;
      
      // For admin users, redirect root to dashboard
      if (currentRoute === '/' && profile.role === 'admin') {
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // For non-admin users, redirect root to skills
      if (currentRoute === '/' && profile.role !== 'admin') {
        navigate('/skills', { replace: true });
        return;
      }
      
      if (!isUtilityRoute && accessMapLoaded && !hasAccess(currentRoute)) {
        // Redirect based on role
        if (profile.role === 'admin') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/skills', { replace: true });
        }
      }
    }
  }, [hasAccess, authLoading, isLoading, location.pathname, navigate, profile, accessMap]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <>{children}</>;
}
