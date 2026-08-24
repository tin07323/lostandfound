import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import FoundItemsPage from './FoundItemsPage';
import LostReportsPage from './LostReportsPage';

export default function AuthPage() {
  const { session, userProfile, refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState('join');
  const [activeTab, setActiveTab] = useState('found');

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
      else setInfoMsg('Account created! Check your inbox or log in.');
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
    if (!res.ok) setErrorMsg(data.detail || 'Failed to create workspace.');
    else refreshProfile();
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
    if (!res.ok) setErrorMsg(data.detail || 'Failed to join workspace.');
    else refreshProfile();
  };

  if (!session) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="subtitle">School Lost & Found Management Platform</p>

          {errorMsg && <div className="alert-error">{errorMsg}</div>}
          {infoMsg && <div className="alert-success">{infoMsg}</div>}

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="btn btn-outline btn-full"
            style={{ marginTop: '12px' }}
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  if (session && !userProfile) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: '480px' }}>
          <h2>Workspace Setup</h2>
          <p className="subtitle">Logged in as {session.user.email}</p>

          {errorMsg && <div className="alert-error">{errorMsg}</div>}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              onClick={() => setMode('join')}
              className={`btn btn-full ${mode === 'join' ? 'btn-primary' : 'btn-outline'}`}
            >
              Join School
            </button>
            <button
              onClick={() => setMode('create')}
              className={`btn btn-full ${mode === 'create' ? 'btn-primary' : 'btn-outline'}`}
            >
              Create School
            </button>
          </div>

          {mode === 'join' ? (
            <form onSubmit={handleJoinSchool}>
              <div className="form-group">
                <label>Your Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>School Join Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Join Workspace
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSchool}>
              <div className="form-group">
                <label>School Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Assign Unique Join Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Create Workspace
              </button>
            </form>
          )}

          <button onClick={handleLogout} className="btn btn-outline btn-full" style={{ marginTop: '12px' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div>
          <h1>School Workspace</h1>
          <p>Logged in as <strong>{userProfile.name}</strong> ({userProfile.role})</p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">
          Sign Out
        </button>
      </header>

      <nav className="tabs-nav">
        <button
          onClick={() => setActiveTab('found')}
          className={`tab-btn ${activeTab === 'found' ? 'active' : ''}`}
        >
          Found Items
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`tab-btn ${activeTab === 'lost' ? 'active' : ''}`}
        >
          Lost Reports
        </button>
      </nav>

      {activeTab === 'found' ? <FoundItemsPage /> : <LostReportsPage />}
    </div>
  );
}