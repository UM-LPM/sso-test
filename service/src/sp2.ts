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

async function discovery(sp: saml.ServiceProviderInstance, discoveryLocation: string) {
  const url = new URL(discoveryLocation);
  url.search = new URLSearchParams({entityID: sp.entityMeta.getEntityID()}).toString()
  const res = await fetch(url.toString());

  console.log(res.url);
}

export default (displayName: string, discoveryLocation: string, idps: {[index: string]: saml.IdentityProviderInstance}, sp: saml.ServiceProviderInstance, metadata: string) => ({

  displayName,

  async redirect(uid: string) {
    await discovery(sp, discoveryLocation)
    //const {id, context} = await sp.createLoginRequest(idp, 'redirect'); 
    //const url = new URL(context);
    //url.searchParams.append('RelayState', uid);
    //return url.toString()
    return "";
  },

  router(redirect: (uid: string) => string) {
    const router = express.Router();

    router.get('/disco', async (req, res) => {
      console.log("DISCO");
    });

    router.post('/acs', formParser, async (req, res) => {
      //const uid = req.body.RelayState;
      //const {extract} = await sp.parseLoginResponse(idp, 'post', req);
      //req.session.accountId = extract.nameID;
      //return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.get('/metadata', (req, res) => {
      res.header('Content-Type', 'text/xml').send(sp.getMetadata());
    });

    return router;
  }
});
