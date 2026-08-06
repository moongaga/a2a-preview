import React from 'react';
import { createRoot } from 'react-dom/client';
import AimpPrototype from './aimp-platform';

const root = document.getElementById('root');

if (!root) {
  throw new Error('AIMP preview root element was not found.');
}

createRoot(root).render(
  <React.StrictMode>
    <AimpPrototype />
  </React.StrictMode>,
);
