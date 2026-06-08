/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getSessionToken, onSessionTokenChange } from '../lib/session';

const AuthContext = createContext({
  currentUser: null,
  sessionToken: null,
  isLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [sessionToken, setSessionToken] = useState(() => getSessionToken());

  useEffect(() => {
    return onSessionTokenChange(() => setSessionToken(getSessionToken()));
  }, []);

  const profile = useQuery(
    api.users.getMe,
    sessionToken ? { sessionToken } : 'skip',
  );

  const currentUser = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      school: profile.school,
      institution: profile.school,
      fullName: profile.fullName,
      verificationStatus: profile.verificationStatus,
      isVerified: profile.isVerified,
    };
  }, [profile]);

  const isLoading = Boolean(sessionToken && profile === undefined);

  return (
    <AuthContext.Provider value={{ currentUser, sessionToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
