/// <reference path="./declarations" />

import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as saml from 'samlify';
import * as validator from '@authenio/samlify-xsd-schema-validator';
import * as jwt from 'jsonwebtoken';
import express from 'express';

const app = express();
const port = 8080;
const secret = 'secret'; //XXX: replace

app.use(bodyParser.urlencoded({extended: false}));

saml.setSchemaValidator(validator);

const sp = saml.ServiceProvider({
    entityID: 'http://localhost:8080/metadata', //XXX: make a parameter
    privateKey: fs.readFileSync('./dev-bzlda3fl7ht5also.pem'),
})

const idp = saml.IdentityProvider({
    metadata: fs.readFileSync("./dev-bzlda3fl7ht5also_eu_auth0_com-metadata.xml")
})

app.post('/acs', async (req, res) => {
    const {extract} = await sp.parseLoginResponse(idp, 'post', req);
    console.log(extract);
    var token = jwt.sign({test: "test"}, secret);
    return res.redirect(`sso-test://app/accept?token=${token}`);
})

app.get('/login', async (req, res) => {
    const {id, context} = await sp.createLoginRequest(idp, 'redirect'); 
    return res.redirect(context);
});

app.get('/metadata', (req, res) => {
    res.header('Content-Type', 'text/xml').send(sp.getMetadata());
});

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.listen(port)
