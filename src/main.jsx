import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './theme';
import { AuthProvider } from './auth';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
