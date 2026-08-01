import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import './index.css';
import './styles.css';

// Configure axios base URL from environment variable for production
const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
if (apiUrl) axios.defaults.baseURL = apiUrl;
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
