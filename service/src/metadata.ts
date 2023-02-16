import {Stream} from 'node:stream';
import sax from 'sax';

type CertificateUse = 'encryption' | 'signing';

export interface Certificate {
  use?: CertificateUse,
  data?: string,
}

export interface Idp {
  WantAuthnRequestsSigned?: boolean,
  certificates: Certificate[],
}

export interface Entity {
  entityID: string,
  idp?: Idp,
}

function parseBoolean(s: string): boolean | undefined {
  switch(s) {
    case 'true': return true;
    case 'false': return false;
    default: return undefined;
  }
}

function parseUse(s: string): CertificateUse | undefined {
  if (s === "encryption" || s === "signing") {
    return s as CertificateUse;
  }
  return undefined
}

export default async (stream: Stream) => {
  const parser = sax.createStream(true);

  const entities: {[index: string]: Entity} = {};
  let entity: Entity | undefined;
  let idp: Idp | undefined;
  let certificate: Certificate | undefined;
  let certificateData: boolean = false;

  parser.on('opentag', (tag: sax.Tag) => {
    switch (tag.name) {
      case 'md:EntityDescriptor':
        entity = {
          entityID: tag.attributes.entityID,
        };
        break;
      case 'md:IDPSSODescriptor':
        if (entity) {
          idp = {
            WantAuthnRequestsSigned: parseBoolean(tag.attributes.WantAuthnRequestsSigned),
            certificates: []
          }
        }
        break;
      case 'md:KeyDescriptor':
        if (entity && idp) {
          certificate = {
            use: parseUse(tag.attributes.value),
          };
        }
        break;
      case 'ds:X509Certificate':
        if (entity && idp && certificate) {
          certificateData = true;
        }
        break;
    }
  });

  parser.on('text', (text: string) => {
    if (entity && idp && certificate && certificateData) {
      certificate.data = text;
    }
  });

  parser.on('closetag', (name: string) => {
    switch (name) {
      case 'md:EntityDescriptor':
        if (entity?.idp) { // Only preserve the entities with an identity provider
          entities[entity.entityID] = entity;
        }
        entity = undefined;
        break;
      case 'md:IDPSSODescriptor':
        entity!.idp = idp;
        idp = undefined;
        break;
      case 'md:KeyDescriptor':
        idp?.certificates!.push(certificate!);
        certificate = undefined;
        break;
      case 'ds:X509Certificate':
        certificateData = false;
        break;
    }
  });

  const end = new Promise((resolve, reject) => {
    parser.on('end', () => resolve(entities));
    parser.on('error', (e) => reject(e));
  });

  stream.pipe(parser);
  return await end;
}
