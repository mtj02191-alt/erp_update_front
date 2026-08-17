import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './styles/components.css';
import './utils/theme-init';
import App from './App';
import { registerSW } from "virtual:pwa-register";

const root = ReactDOM.createRoot(document.getElementById('root'));
registerSW({ immediate: true });

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);