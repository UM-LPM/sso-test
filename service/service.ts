/// <reference path="./declarations" />

import url from 'node:url';
import * as fs from 'fs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as saml from 'samlify';
import * as validator from '@authenio/samlify-xsd-schema-validator';
import * as jwt from 'jsonwebtoken';
import Provider from 'oidc-provider';
import express from 'express';
import session from "express-session";

const app = express();
const port = 8080;
const secret = 'secret'; //XXX: replace

declare module 'express-session' {
  interface SessionData {
    accountId: string;
  }
}

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    proxy: true,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true},
}));

saml.setSchemaValidator(validator);

const configuration = {
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
    cookies: {
        keys: [secret],
        short: {
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
        }
    },
};

const oidc = new Provider(`https://sso-test.lpm.feri.um.si`, configuration);
oidc.proxy = true;

const sp = saml.ServiceProvider({
    entityID: 'https://sso-test.lpm.feri.um.si/metadata', //XXX: make a parameter
    privateKey: fs.readFileSync('./dev-bzlda3fl7ht5also.pem'),
})

const idp = saml.IdentityProvider({
    metadata: fs.readFileSync("./dev-bzlda3fl7ht5also_eu_auth0_com-metadata.xml")
})

app.get('/oidc/interaction/:uid', async (req, res, next) => {
    try {
        const {uid, prompt, params} = await oidc.interactionDetails(req, res);
        const client = await oidc.Client.find(params.client_id as string);

        console.log(prompt);
        console.log(client);
        switch (prompt.name) {
            case 'login':
                return res.redirect(303, `/saml/login/${uid}`);
            case 'consent':
                return res.redirect(303, `/oidc/interaction/${uid}/consent`);
            default:
                return undefined;
        }
    } catch (err) {
        next(err);
    }
});

app.get('/oidc/interaction/:uid/login', async (req, res, next) => {
    try {
        if (req.session.accountId === undefined) {
            throw Error("Missing accountId");
        }
        const result = {
            login: {
                accountId: req.session.accountId
            }
        };
        await oidc.interactionFinished(req, res, result, {mergeWithLastSubmission: false});
    } catch (err) {
        next(err);
    }
});

app.get('/oidc/interaction/:uid/consent', async (req, res, next) => {
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

app.get('/saml/login/:uid', async (req, res) => {
    const uid = req.params.uid;
    const {id, context} = await sp.createLoginRequest(idp, 'redirect'); 
    return res.redirect(303, context + `&RelayState=${uid}`);
});

app.post('/saml/acs', async (req, res) => {
    const uid = req.body.RelayState;
    const {extract} = await sp.parseLoginResponse(idp, 'post', req);
    req.session.accountId = extract.nameID;
    return res.redirect(303, `/oidc/interaction/${uid}/login`);
});

app.get('/metadata', (req, res) => {
    res.header('Content-Type', 'text/xml').send(sp.getMetadata());
});

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.use('/oidc', oidc.callback());
app.listen(port)

// vim: et sts=4 ts=4 sw=4
