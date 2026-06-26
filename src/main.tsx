import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit', fontSize: '12px', fontWeight: '600' },
        }}
      />
    </ErrorBoundary>
  </StrictMode>,
);

