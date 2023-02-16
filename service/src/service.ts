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
  entityID: `${endpoint}/prov/aai/metadata`,
  authnRequestsSigned: true,
  wantAssertionsSigned: true,
  signingCert: fs.readFileSync(spCertificate),
  privateKey: fs.readFileSync(spCertificateKey),
  assertionConsumerService: [
    {
      isDefault: true,
      Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
      Location: `${endpoint}/prov/aai/acs`
    }
  ]
})

const metadata = `<EntityDescriptor entityID="https://sso-test.lpm.feri.um.si/prov/aai/metadata" xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:assertion="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:idpdisc="urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol"><SPSSODescriptor AuthnRequestsSigned="true" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><Extensions><idpdisc:DiscoveryResponse Binding="urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol" Location="https://sso-test.lpm.feri.um.si/prov/aai/disco" index="1"/></Extensions><KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIFSTCCAzGgAwIBAgIUebMtBZo6PBenrXKVuTFdxBhuwjIwDQYJKoZIhvcNAQELBQAwNDELMAkGA1UEBhMCU0kxDDAKBgNVBAoMA0xQTTEXMBUGA1UEAwwObHBtLmZlcmkudW0uc2kwHhcNMjMwMjEwMTUxMDA2WhcNNDIxMDI4MTUxMDA2WjA0MQswCQYDVQQGEwJTSTEMMAoGA1UECgwDTFBNMRcwFQYDVQQDDA5scG0uZmVyaS51bS5zaTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBANpbq5w+MrqYGTMRp3w2z8UtrH6aCWIyovzG4VmLEcHNjNte6Aeuki5lZbH5hc/yPT4BSe64ia5Uzmmvq70q+PGeSv2O2cULIUW8XNkozE9UB8lR72L2qxiyuUF06c0/uR06OySCZqoIChl8P1luTJkXWJwiaZ4y1D3WP31TF8mne5WiMy8nfP70S1T0G0U7H3HdoqCeX/e9eOX3/BRLnz9UrNTDn21pJrC1DbMPWBjK0DC0SIP9UnfBf1/CJFd31BnxaFYY26mV8XqgXsvTE2uqgcr21gg2swwBLtq4Bn9X9CjO0gSr8A1wQiuxe3cLB3JOtaodekxP3BuMffO2xhWADvCYMlBY7V/raPnPA+cgym3jeFB1+vjJ5csfllXmPVa68e4UHvxi95uOZcTLWZKkM9de1Jf7isjf2R5Ue+9IV/QfIWW/HONwIQNhNtvjAZWKiT7P8TKuLTPwfKweBP0uheV0k/k88bKE09+78FFcc70ftOo85xP6anTyyAVXi0NIsBIUYhNXbI9wB6vM/WpXYZg+hyjQFz5U6o19QH/FHty+gtnDc3RdlIU44vnu5s49bHiqxdm5nYr5UJnUdJTfK/2B/rGf5daWzd5L5RZ0wHJ51nCsFfPbOqNYhOjQdw5TPDCLRDs8ksWp6GraMlcKZoje1xwhl28CjL+37aZPAgMBAAGjUzBRMB0GA1UdDgQWBBT6qcCKRWp8pqWi0Tf1ykqCiL0sOzAfBgNVHSMEGDAWgBT6qcCKRWp8pqWi0Tf1ykqCiL0sOzAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4ICAQAv5eYr4VGTsmAchnhVsLL/q3RY4FAqtwBXigNgc549FPZ4oZsdw6UJGeu6sLoQxmIeewasldP0DjYsyWc1vbZQV7xsp9vFHc8LHwxTD65RZRDW3geWD4NnndrrcULaNbNr3XXTVEQh3Jvr16RTZjsW2BaHuxzLeK90Jkb2c5cT6rK0CC/+L/XAcXcUeTPvP4e3x/kIbyAEuJuTIrm/pUX1x65Fxpu1Q59RekF5hD5C7/z/0kN/Au6zCW/BsSbpXZhSCtqak5wonJSygTyuK2wZ5zkOfle+95O4PfiLVj8t3sr6j094Q2Se/Lh+FyhK6VL7FgFm/XHPfomF1FyNI3mTiUHhw/79OnoYoOkp3VrdvIOnVA8MQTwbpD/P33CYgZvIG3ckxrV/Z82G5VQM6J/assjnMZzzE/eOG1v/X3vQmT8qbA181VcfNxESsD9rc2hKZyJjh6wMEFztPW0b3aoLKLI5TTPgpbVjika5KVXCDmfXYxnTXRx0LsMYyw+fdC2RDS+CiBN395L1sdzi7kQz98YPJspwZLjb5DidPBAQCQtSD/18vUWkwwY8r7Ict6YOu6Fb9+fRdIjjwO9UARRXILCsYE0WYNxxqHvj2JkuPJyz9zY+6M7/oi6TL5C2xpMho6dJkNIeeVDcxfZYfeOdRMhBu4uu2n1p/jHX+iRynQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></KeyDescriptor><NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat><AssertionConsumerService index="0" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://sso-test.lpm.feri.um.si/prov/aai/acs" isDefault="true"></AssertionConsumerService></SPSSODescriptor></EntityDescriptor>`;

const oidc = new Provider(`${endpoint}/oidc`, {
  clients: [
    {
      client_id: 'test',
      client_secret: 'test',
      grant_types: ['authorization_code'],
      redirect_uris: ['https://oidcdebugger.com/debug'],
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
oidc.proxy = true;

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
