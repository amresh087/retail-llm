import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAuthProps {
  roles: string[];
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const normalizedUserRoles = (user.roles ?? [user.role]).filter(Boolean) as string[];
  const hasAccess = normalizedUserRoles.some((role) => roles.includes(role.toUpperCase()));

  if (!hasAccess) return <h3>Access Denied</h3>;
  return <>{children}</>;
};

export default RequireAuth;