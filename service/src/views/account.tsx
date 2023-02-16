import React from 'react';

export default (params: {endpoint: string}) => 
  (<form method="post" action={params.endpoint} autoComplete="off"></form>);
