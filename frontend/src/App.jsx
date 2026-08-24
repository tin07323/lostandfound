import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}

export default App;