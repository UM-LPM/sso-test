#!/usr/bin/env node
/// <reference path="./declarations" />

import url from 'node:url';
import * as fs from 'fs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import Provider from 'oidc-provider';
import express from 'express';
import session from 'express-session';
import keygrip from 'keygrip';

import Login from './views/login.js';
import site from './views/site.js';

import {LoginProvider} from './types.js';


//export const app = express();


//    const sp = saml.ServiceProvider({
//        entityID: `https://${domain}/saml/metadata`,
//            privateKey: fs.readFileSync(samlCertificateKey),
//        authnRequestsSigned: true,
//        wantAssertionsSigned: true,
//        signingCert: fs.readFileSync(samlCertificate),
//        assertionConsumerService: [
//            {
//                isDefault: true,
//                Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
//                Location: `https://${domain}/saml/acs`
//            }
//        ]
//    })
//
//    const idp = saml.IdentityProvider({
//        metadata: fs.readFileSync(idpMetadata)
//    })

//app.use(bodyParser.urlencoded({extended: false}));
//app.use(cookieParser());
//app.use(session({
//    proxy: true,
//    secret: sessionSecret,
//    resave: false,
//    saveUninitialized: false,
//    cookie: {secure: true},
//}));

   // const configuration = {
   //     clients: [
   //         {
   //             client_id: 'test',
   //             client_secret: 'test',
   //             grant_types: ['authorization_code'],
   //             redirect_uris: ['https://oidcdebugger.com/debug'],
   //         }
   //     ],
   //     interactions: {
   //         async url(ctx: any, interaction: any) {
   //             return `/oidc/interaction/${interaction.uid}`;
   //         }
   //     },
   //     cookies: {
   //        // keys: [sessionSecret],
   //         keys: ["secret"],
   //         short: {
   //             httpOnly: true,
   //             secure: true,
   //             signed: true,
   //             overwrite: true,
   //             sameSite: 'strict' as const
   //         },
   //         long: {
   //             httpOnly: true,
   //             secure: true,
   //             signed: true,
   //             overwrite: true,
   //             sameSite: 'none' as const
   //         }
   //     },
   //     features: {
   //         devInteractions: {
   //             enabled: false as const,
   //         }
   //     },
   // };

   // const oidc = new Provider(`https://${domain}`, configuration);
   // oidc.proxy = true;

const formParser = bodyParser.urlencoded({extended: false});

export default (oidc: Provider, provs: {[name: string]: LoginProvider}) => {

  const router = express.Router();

  router.get('/oidc/interaction/:uid', async (req, res, next) => {
    try {
      const interactionDetails = await oidc.interactionDetails(req, res);
      const {uid, prompt, params} = interactionDetails;
      const client = await oidc.Client.find(params.client_id as string);

      console.log(prompt);
      switch (prompt.name) {
        case 'login':
          res.setHeader('Content-Type', 'text/html');
          return res.send(site(Login({
            login: `/oidc/interaction/${uid}/login`,
            federated: Object.entries(provs).map(([name, prov]) => ({name, displayName: prov.displayName, endpoint: `/oidc/interaction/${uid}/federated`}))
          })));
        case 'consent':
          return res.redirect(303, `/oidc/interaction/${uid}/consent`);
        default:
          return undefined;
      }
    } catch (err) {
      next(err);
    }
  });

  router.post('/oidc/interaction/:uid/federated', formParser, async (req, res, next) => {
    try {
      const interactionDetails = await oidc.interactionDetails(req, res);
      const {uid, prompt, params} = interactionDetails;

      if (req.session.entityID === undefined) {
        const url =  await provs[req.body.provider].discovery(uid);
        return res.redirect(303, url);
      } else if (req.session.accountId === undefined) {
        const url =  await provs[req.body.provider].redirect(req.session.entityID, uid);
        return res.redirect(303, url);
      } else {
        const result = {
          login: {
            accountId: req.session.accountId
          }
        };
        await oidc.interactionFinished(req, res, result, {mergeWithLastSubmission: false});
      }
    } catch (err) {
      next(err);
    }
  });

  router.get('/oidc/interaction/:uid/consent', async (req, res, next) => {
    try {
      const dets = await oidc.interactionDetails(req, res);
      if (dets.session === undefined) {
        throw Error("Missing session");
      }

      const {prompt: {name, details}, params, session: {accountId}} = dets;
      let {grantId} = dets;
      let grant;

      if (grantId) {
        grant = await oidc.Grant.find(grantId);
      } else {
        grant = new oidc.Grant({
          accountId,
          clientId: params.client_id as string,
        });
      }
      if (grant === undefined) {
        throw Error("Missing grant");
      }

      if (details.missingOIDCScope) {
        grant.addOIDCScope((details.missingOIDCScope as string[]).join(' '));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims as string[]);
      }
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }

      grantId = await grant.save();

      const consent: {grantId?: string} = {};
      if (!dets.grantId) {
        consent.grantId = grantId;
      }

      const result = {consent};
      await oidc.interactionFinished(req, res, result, {mergeWithLastSubmission: true});
    } catch (err) {
        next(err);
    }
  });

  router.use('/oidc', oidc.callback());
  for (const [name, prov] of Object.entries(provs)) {
    router.use(`/prov/${name}`, prov.router((uid) => `/oidc/interaction/${uid}/federated`));
  }

  return router;
}

//app.get('/', (req, res) => {
//    res.send("Hello world!");
//});
//
//app.listen(port)
