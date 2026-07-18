import { useContext } from 'react';
import type { AuthContextType } from '../auth/AuthContext';
import { AuthContext } from '../auth/AuthContext';

export const useAuth = (): AuthContextType => {
  console.log("===From useAuth hook user object:===", useContext(AuthContext));
  const context = useContext(AuthContext);
  console.log("from useAuth hook user object:", context);

  if (!context) {
    throw new Error('From useAuth hook must be used within an AuthProvider');
  }

  return context;
};
