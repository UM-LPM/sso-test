import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

export default (body: React.ReactElement) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <body>
    ${renderToStaticMarkup(body)}
    <script type="text/javascript">
      (function() {
          document.forms[0].submit();
      })();
    </script>
  </body>
</html>`


