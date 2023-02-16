import * as fs from 'fs';
import * as url from 'url';
import * as saml from 'samlify';
//import {IdentityProviderConstructor, ServiceProviderConstructor} from 'samlify/types';
import {renderToStaticMarkup} from 'react-dom/server';
import express from 'express';
import bodyParser from 'body-parser';
import Assertion from './views/assertion.js';
import postBack from './views/post-back.js';

//const port: number = 8081;
//const domain: string = "localhost";

    //const idp = saml.IdentityProvider({
    //    entityID: cfg.endpoint,
    //    signingCert: fs.readFileSync(cfg.certificate),
    //    privateKey: fs.readFileSync(cfg.certificateKey),
    //    wantAuthnRequestsSigned: true,
    //    singleSignOnService: [
    //        {
    //            isDefault: true,
    //            Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    //            Location: `${cfg.endpoint}/login`
    //        }
    //    ]
    //});

export default (idp: saml.IdentityProviderInstance, sp: saml.ServiceProviderInstance) => {

    const router = express.Router();

    router.get('/login', async (req, res) => {
        const query = req.query;
        const octetString = new URLSearchParams({SAMLRequest: query.SAMLRequest as string, SigAlg: query.SigAlg as string}).toString();

        const {samlContent, extract} = await idp.parseLoginRequest(sp, 'redirect', {query, octetString});
        const user = {email: `user@example.com`};
        const params = await idp.createLoginResponse(sp, {extract}, 'post', user, undefined, undefined, query.RelayState as string);

        res.setHeader("Content-Type", "application/xhtml+xml").send(postBack(Assertion(params)));
    });

    return router;
};

