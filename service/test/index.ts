import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import https from 'node:https';
import {once, EventEmitter} from 'node:events';
import forge from 'node-forge';
import * as saml from 'samlify';
import Provider from 'oidc-provider';
import {Issuer, generators} from 'openid-client';
import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch';

import * as puppeteer from 'puppeteer';

import oidcRouter from '../src/login.js';
import samlLoginProvider from '../src/sp.js';
import idpRouter from '../src/idp.js';
import metadata from '../src/metadata.js';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

function generateCredentials() {
  const pki = forge.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  cert.serialNumber = '01';
  cert.publicKey = keys.publicKey;
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  var attrs = [{
    shortName: 'CN',
    value: 'lpm.feri.um.si'
  }, {
    shortName: 'C',
    value: 'SI'
  }, {
    shortName: 'O',
    value: 'LPM'
  }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);

  return {
    cert: pki.certificateToPem(cert),
    key: pki.privateKeyToPem(keys.privateKey)
  };
}

const httpsCredentials = generateCredentials();
const port: number = 8443;
const endpoint: string = `https://127.0.0.1:${port}`;
const {cert: idpCertificate, key: idpCertificateKey} = generateCredentials();
const {cert: spCertificate, key: spCertificateKey} = generateCredentials();
const sessionSecret = ['secret'];

const idp = saml.IdentityProvider({
  entityID: `${endpoint}/idp/metadata`,
  signingCert: idpCertificate,
  privateKey: idpCertificateKey,
  wantAuthnRequestsSigned: true,
  singleSignOnService: [
    {
      isDefault: true,
      Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
      Location: `${endpoint}/idp/login`
    }
  ]
});

const sp = saml.ServiceProvider({
  entityID: `${endpoint}/prov/test/metadata`,
  authnRequestsSigned: true,
  wantAssertionsSigned: true,
  signingCert: spCertificate,
  privateKey: spCertificateKey,
  assertionConsumerService: [
    {
      isDefault: true,
      Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
      Location: `${endpoint}/prov/test/acs`
    }
  ]
})

const oidc = new Provider(`${endpoint}/oidc`, {
  clients: [
    {
      client_id: 'test',
      client_secret: 'test',
      grant_types: ['authorization_code'],
      redirect_uris: [`${endpoint}/cb`]
    }
  ],
  interactions: {
    async url(ctx: any, interaction: any) {
      return `/oidc/interaction/${interaction.uid}`;
    }
  },
  ttl: {
    // XXX: Review
    Interaction: 600,
    Grant: 86400,
    AccessToken: 86400,
    IdToken: 86400,
  },
  cookies: {
    keys: sessionSecret,
    short: {
      httpOnly: true,
      secure: true,
      signed: true,
      overwrite: true,
      sameSite: 'lax' as const
    },
    long: {
      httpOnly: true,
      secure: true,
      signed: true,
      overwrite: true,
      sameSite: 'none' as const
    }
  },
  features: {
    devInteractions: {
      enabled: false as const,
    },
    resourceIndicators: {
      enabled: false as const,
    },
  },
});


declare module 'express-session' {
  interface SessionData {
    accountId: string;
  }
}

const app = express();

app.use(session({
  proxy: true,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {secure: true},
}));

app.use(oidcRouter(oidc, {
  'test': samlLoginProvider('Test', idp, sp)
}));
app.use('/idp', idpRouter(idp, sp));

const server = https.createServer(httpsCredentials, app);
server.listen(port);

(async () => {
 await test('auth request', {skip: true}, async (t) => {
     const issuer = await Issuer.discover(`${endpoint}/oidc`);
     const {Client} = issuer;

     const client = new Client({
         client_id: 'test',
         client_secret: 'test',
         redirect_uris: [`${endpoint}/cb`],
         response_types: ['code'],
     });

     const code_verifier = generators.codeVerifier();
     const code_challenge = generators.codeChallenge(code_verifier);

     app.get('/cb', async (req, res) => {
       console.log("HERE");
         const params = client.callbackParams(req);
         const tokenSet = await client.callback(`${endpoint}/cb`, params, {code_verifier});
         assert.ok("access_token" in tokenSet, "access_token");
         assert.ok("expires_at" in tokenSet, "expires_at");
         assert.ok("id_token" in tokenSet, "id_token");
         assert.strictEqual(tokenSet.scope, "openid");
         assert.strictEqual(tokenSet.token_type, "Bearer");
         res.sendStatus(200);
     });

     const url = client.authorizationUrl({
         scope: 'openid',
         code_challenge,
         code_challenge_method: 'S256',
     });

     const browser = await puppeteer.launch({
         headless: false,
         ignoreHTTPSErrors: true
     });
     const page = await browser.newPage();
     const response = await page.goto(url);
     await page.waitForNavigation()
     assert.ok(response!.ok());
     await browser.close();

 });

 await test('metadata', async (t) => {
   //const res = await fetch("https://ds.aai.arnes.si/metadata/aai.arnes.si.sha256.xml");
   const stream = fs.createReadStream("/home/ziga/Development/projects/sso-test/service/test/aai.arnes.si.sha256.xml");
   console.log(await metadata(stream));
 });

 server.close();
})();
