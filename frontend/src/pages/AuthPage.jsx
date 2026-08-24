import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import FoundItemsPage from './FoundItemsPage';

export default function AuthPage() {
  const { session, userProfile, refreshProfile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  
  const [schoolName, setSchoolName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else setInfoMsg('Account created! Check your email or log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await fetch(`${API_BASE_URL}/api/auth/create-school`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: schoolName, join_code: joinCode }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.detail || 'Failed to create school workspace.');
    } else {
      refreshProfile();
    }
  };

  const handleJoinSchool = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = await fetch(`${API_BASE_URL}/api/auth/join-school`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ join_code: joinCode, name: studentName }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.detail || 'Failed to join school workspace.');
    } else {
      refreshProfile();
    }
  };

  if (!session) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>{isSignUp ? 'Create Account' : 'Student / Admin Login'}</h2>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        {infoMsg && <p style={{ color: 'green' }}>{infoMsg}</p>}

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '10px' }}>
            <label>Email: </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password: </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 15px', width: '100%', cursor: 'pointer' }}>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ marginTop: '15px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    );
  }

  if (session && !userProfile) {
    return (
      <div style={{ maxWidth: '450px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>Complete Your School Setup</h2>
        <p>Logged in as: <strong>{session.user.email}</strong></p>
        
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setMode('join')}
            style={{ fontWeight: mode === 'join' ? 'bold' : 'normal', marginRight: '10px' }}
          >
            Join Existing School
          </button>
          <button
            onClick={() => setMode('create')}
            style={{ fontWeight: mode === 'create' ? 'bold' : 'normal' }}
          >
            Create New School (Admin)
          </button>
        </div>

        {mode === 'join' ? (
          <form onSubmit={handleJoinSchool}>
            <div style={{ marginBottom: '10px' }}>
              <label>Your Name: </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>School Join Code: </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px', width: '100%' }}>Join Workspace</button>
          </form>
        ) : (
          <form onSubmit={handleCreateSchool}>
            <div style={{ marginBottom: '10px' }}>
              <label>School Name: </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Set Unique Join Code: </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px', width: '100%' }}>Create Workspace</button>
          </form>
        )}

        <button onClick={handleLogout} style={{ marginTop: '20px', color: 'gray' }}>
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>School Workspace</h1>
          <p style={{ margin: 0, color: '#666' }}>Logged in as: <strong>{userProfile.name}</strong> ({userProfile.role})</p>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '8px 16px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Sign Out
        </button>
      </header>

      <FoundItemsPage />
    </div>
  );
}