import { Toast } from '@heroui/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import './i18n/i18n.js';
import App from './App.jsx';

import './styles/index.css';
import { HeroUIProvider } from './components/HeroUIProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <Toast.Provider />
      <App />
    </HeroUIProvider>
  </React.StrictMode>,
);
