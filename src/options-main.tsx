import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="webtime-theme">
      <Options />
    </ThemeProvider>
  </React.StrictMode>
);
