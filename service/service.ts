/// <reference path="./declarations" />

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
const port = 80;
const secret = 'secret'; //XXX: replace

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
saml.setSchemaValidator(validator);

const configuration = {
    clients: [
        {
            client_id: 'test',
            client_secret: 'test',
            redirect_uris: ['https://oidcdebugger.com/debug'],
        }
    ],
    cookies: {
        keys: ["secret"],
        short: {
            httpOnly: true,
            overwrite: true,
            secure: true,
            sameSite: 'lax' as const
        }
    }
};

const oidc = new Provider(`http://localhost:${port}`, configuration);

const sp = saml.ServiceProvider({
    entityID: 'http://localhost:8080/metadata', //XXX: make a parameter
    privateKey: fs.readFileSync('./dev-bzlda3fl7ht5also.pem'),
})

const idp = saml.IdentityProvider({
    metadata: fs.readFileSync("./dev-bzlda3fl7ht5also_eu_auth0_com-metadata.xml")
})

app.get('/interaction/:uid', async (req, res, next) => {
    const dets = await oidc.interactionDetails(req, res);
    const client = await oidc.Client.find(dets.params.client_id as string);
    console.log(dets);
    console.log(req.cookies);

    return res.redirect(`/interaction/${dets.uid}/login`)
});

app.get('/interaction/:uid/login', async (req, res, next) => {
    console.log("HHEE");

    const {id, context} = await sp.createLoginRequest(idp, 'redirect'); 
    console.log(id)
    return res.redirect(context);
});

app.post('/acs', async (req, res) => {
    //const dets = await oidc.interactionDetails(req, res);
    const {extract} = await sp.parseLoginResponse(idp, 'post', req);
    //console.log(dets);
    console.log(req.cookies);
    console.log("HEEEEREEEE");
    /*console.log(extract);
    console.log(req.query);
    console.log(req.body);
    console.log(req.cookies);*/

    //return res.redirect(302, `/interaction/${req.body.RelayState}/login`)

    //var token = jwt.sign({test: "test"}, secret);
    //return res.redirect(`sso-test://app/accept?token=${token}`);
    res.cookie('extract', extract);
    return res.redirect("/test");
})

app.get('/test', async (req, res, next) => {
    const dets = await oidc.interactionDetails(req, res);
    console.log("HHEE");
    console.log(req.cookies);
    return ""
});

app.get('/metadata', (req, res) => {
    res.header('Content-Type', 'text/xml').send(sp.getMetadata());
});

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.use(
    session({
        proxy: true,
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
);

app.use(oidc.callback());
app.listen(port, '164.8.230.207')
