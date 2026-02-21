import React from 'react';
import ReactDOM from 'react-dom/client';
import NewTab from './NewTab';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="system" storageKey="webtime-theme">
            <NewTab />
        </ThemeProvider>
    </React.StrictMode>
);
