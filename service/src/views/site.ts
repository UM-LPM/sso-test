import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

export default (body: React.ReactElement) => `<!DOCTYPE html>
  <html>
    <body>
      ${renderToStaticMarkup(body)}
    </body>
  </html>`


