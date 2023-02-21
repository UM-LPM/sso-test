//import * as saml from 'samlify';
//import * as validator from '@authenio/samlify-node-xmllint';

import saml from "@node-saml/node-saml"
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import Account from './views/account.js';
import postBack from './views/post-back.js';
import fetch from 'node-fetch';

import {LoginProvider} from './types.js';

//saml.setSchemaValidator(validator);

const formParser = bodyParser.urlencoded({extended: false});

export default (displayName: string, discoveryLocation: string, idps: {[index: string]: any}, sp: any, metadata: string) => ({

  displayName,

  async redirect(entityID: string) {
    const url = new URL(discoveryLocation);
    url.search = new URLSearchParams({entityID: sp.issuer, return: `https://sso-test.lpm.feri.um.si/prov/aai/disco`}).toString()
    const res = await fetch(url.toString(), {redirect: 'manual'});
    if (!res.redirected) {
      throw new Error("Unsuccessful discovery!");
    }
    console.error(res.headers.get('location'));

    return "";


    //const {id, context} = await sp.createLoginRequest(idps[entityID], 'redirect'); 
    //const url = new URL(context);
    //url.searchParams.append('RelayState', uid);
    //return url.toString()
  },

  router(redirect: (uid: string) => string) {
    const router = express.Router();

    // Dummy path, not intended to be called, the redirect is intercepted and never makes it to the user-agent.
    router.get('/disco', async (req, res) => {});

      //const uid = req.query.uid as string;
      //req.session.entityID = req.query.entityID as string;
      //return res.send(postBack(Account({endpoint: redirect(uid)})));

    router.post('/acs', formParser, async (req, res) => {
      //const entityID = req.session.entityID;
      //const uid = req.body.RelayState;
      //const {extract} = await sp.parseLoginResponse(idps[entityID!], 'post', req);
      //req.session.accountId = extract.nameID;
      //return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.get('/metadata', (req, res) => {
      res.header('Content-Type', 'text/xml').send(metadata);
    });

    return router;
  }
});
