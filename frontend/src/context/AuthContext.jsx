import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchProfile = async (accessToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.access_token);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = () => {
    if (session) {
      fetchProfile(session.access_token);
    }
  };

  return (
    <AuthContext.Provider value={{ session, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);   