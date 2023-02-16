import * as saml from 'samlify';
import * as validator from '@authenio/samlify-node-xmllint';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import Account from './views/account.js';
import postBack from './views/post-back.js';

import {LoginProvider} from './types.js';

saml.setSchemaValidator(validator);

const formParser = bodyParser.urlencoded({extended: false});

export default (displayName: string, idp: saml.IdentityProviderInstance, sp: saml.ServiceProviderInstance) => ({

  displayName,

  async redirect(uid: string) {
    const {id, context} = await sp.createLoginRequest(idp, 'redirect'); 
    const url = new URL(context);
    url.searchParams.append('RelayState', uid);
    return url.toString()
  },

  router(redirect: (uid: string) => string) {
    const router = express.Router();

    router.post('/acs', formParser, async (req, res) => {
      const uid = req.body.RelayState;
      const {extract} = await sp.parseLoginResponse(idp, 'post', req);
      req.session.accountId = extract.nameID;
      return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.get('/metadata', (req, res) => {
      res.header('Content-Type', 'text/xml').send(sp.getMetadata());
    });

    return router;
  }
});
