import React from 'react';

export default (params: {entityEndpoint: string, type: string, context: string, relayState: string}) => 
  (<form id="saml-form" method="post" action={params.entityEndpoint} autoComplete="off">
    <input type="hidden" name={params.type} value={params.context} />
    <input type="hidden" name="RelayState" value={params.relayState} />
  </form>);
