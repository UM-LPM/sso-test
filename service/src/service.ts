#!/usr/bin/env node
/// <reference path="./declarations" />

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

import oidcRouter from './login.js';
import samlLoginProvider from './sp2.js';
import idpRouter from './idp.js';
//import metadata from './metadata.js';

function env(name: string): string {
    class Missing extends Error {}
    const value = process.env[name];
    if (!value) {
        throw new Missing(name);
    } 
    return value;
}
const port: number = parseInt(env('PORT'), 10);
const sessionSecret: string = env('SESSION_SECRET');
const domain: string = env('DOMAIN');
const spCertificate: string = env('SAML_CERTIFICATE')
const spCertificateKey: string = env('SAML_CERTIFICATE_KEY');
const idpMetadata: string = env('IDP_METADATA');

const endpoint = `https://${domain}`;

const idp = saml.IdentityProvider({
    metadata: fs.readFileSync(idpMetadata)
})

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

const metadata = ``;

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
    keys: [sessionSecret],
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
  secret: [sessionSecret],
  resave: false,
  saveUninitialized: false,
  cookie: {secure: true},
}));

app.use(oidcRouter(oidc, {
  'aai': samlLoginProvider('ArnesAAI', 'https://ds.aai.arnes.si/simplesaml/saml2/sp/idpdisco.php', {}, sp, metadata)
}));
app.use('/idp', idpRouter(idp, sp));

app.listen(port);
