import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UIStateProvider } from './integration/UIStateContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIStateProvider>
      <App />
    </UIStateProvider>
  </StrictMode>,
);
