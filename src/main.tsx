import { Toast } from '@heroui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import '@/i18n';

import App from './App';
import './styles/index.css';
import { HeroUIProvider } from './components/HeroUIProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <Toast.Provider />
      <App />
    </HeroUIProvider>
  </React.StrictMode>,
);
