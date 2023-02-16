import * as saml from 'samlify';
import * as validator from '@authenio/samlify-node-xmllint';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import Account from './views/account.js';
import postBack from './views/post-back.js';
import fetch from 'node-fetch';

import {LoginProvider} from './types.js';

saml.setSchemaValidator(validator);

const formParser = bodyParser.urlencoded({extended: false});

export default (displayName: string, discoveryLocation: string, idps: {[index: string]: saml.IdentityProviderInstance}, sp: saml.ServiceProviderInstance, metadata: string) => ({

  displayName,

  async discovery(uid: string) {
    const url = new URL(discoveryLocation);
    url.search = new URLSearchParams({entityID: sp.entityMeta.getEntityID(), return: `https://sso-test.lpm.feri.um.si/prov/aai/disco?uid=${uid}`}).toString()
    return Promise.resolve(url.toString())
  },

  async redirect(entityID: string, uid: string) {
    const {id, context} = await sp.createLoginRequest(idps[entityID], 'redirect'); 
    const url = new URL(context);
    url.searchParams.append('RelayState', uid);
    return url.toString()
  },

  router(redirect: (uid: string) => string) {
    const router = express.Router();

    router.get('/disco', async (req, res) => {
      const uid = req.query.uid as string;
      req.session.entityID = req.query.entityID as string;
      return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.post('/acs', formParser, async (req, res) => {
      const entityID = req.session.entityID;
      const uid = req.body.RelayState;
      const {extract} = await sp.parseLoginResponse(idps[entityID!], 'post', req);
      req.session.accountId = extract.nameID;
      return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.get('/metadata', (req, res) => {
      res.header('Content-Type', 'text/xml').send(metadata);
    });

    return router;
  }
});
