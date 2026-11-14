import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './state/store';
import './styles.css';
import { installNativeBridge } from './platform/native';

installNativeBridge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
