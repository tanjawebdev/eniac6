import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import fonts from @fontsource packages (bundled by Vite for offline support)
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

// Import Bootstrap CSS (via npm package)
import 'bootstrap/dist/css/bootstrap.min.css';

// Import global design system CSS
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
