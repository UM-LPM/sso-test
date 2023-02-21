//import * as saml from 'samlify';
//import * as validator from '@authenio/samlify-node-xmllint';

import saml from "@node-saml/node-saml"
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import Account from './views/account.js';
import postBack from './views/post-back.js';
import fetch from 'node-fetch';

import {LoginProvider, SamlDiscovery} from './types.js';

//saml.setSchemaValidator(validator);

const formParser = bodyParser.urlencoded({extended: false});

export default (displayName: string, disco: SamlDiscovery, idps: {[index: string]: any}, sp: any, metadata: string) => ({

  displayName,

  discovery(uid: string) {
    const cb = new URL(disco.callbackUrl)
    cb.search = new URLSearchParams({uid}).toString()
    const ep = new URL(disco.entryPoint);
    ep.search = new URLSearchParams({entityID: sp.issuer, return: cb.toString()}).toString();
    return Promise.resolve(ep.toString());
  },

  async redirect(uid: string, entityID: string) {
    const s = new saml.SAML({...sp, ...idps[entityID]});
    return s.getAuthorizeUrlAsync(uid, undefined, {});
  },

  router(redirect: (uid: string) => string) {
    const router = express.Router();

    router.get('/disco', async (req, res) => {
      const uid = req.query.uid as string;
      req.session.entityID = req.query.entityID as string;
      return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.post('/acs', formParser, async (req, res) => {
      const entityID = req.session.entityID!;
      const uid = req.body.RelayState;

      const s = new saml.SAML({...sp, ...idps[entityID]});
      const {profile} = await s.validatePostResponseAsync(req.body);

      req.session.accountId = profile!.nameID;
      return res.send(postBack(Account({endpoint: redirect(uid)})));
    });

    router.get('/metadata', (req, res) => {
      res.header('Content-Type', 'text/xml').send(metadata);
    });

    return router;
  }
});
