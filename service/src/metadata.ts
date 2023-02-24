import {Stream, Readable} from 'node:stream';
import util from 'node:util';
import sax from 'saxes';

// An incomplete implementation of the SAML metadata schema

// <complexType name="localizedNameType">
//     <simpleContent>
//         <extension base="string">
//             <attribute ref="xml:lang" use="required"/>
//         </extension>
//     </simpleContent>
// </complexType>
// <complexType name="localizedURIType">
//     <simpleContent>
//         <extension base="anyURI">
//             <attribute ref="xml:lang" use="required"/>
//         </extension>
//     </simpleContent>
// </complexType>
type Localized = {lang: string; content: string};

// <complexType name="EndpointType">
//     <sequence>
//         <any namespace="##other" processContents="lax" minOccurs="0" maxOccurs="unbounded"/>
//     </sequence>
//     <attribute name="Binding" type="anyURI" use="required"/>
//     <attribute name="Location" type="anyURI" use="required"/>
//     <attribute name="ResponseLocation" type="anyURI" use="optional"/>
//     <anyAttribute namespace="##other" processContents="lax"/>
// </complexType>
interface Endpoint {
  binding: string;
  location: string;
  responseLocation?: string;
}
    
// <complexType name="IndexedEndpointType">
//     <complexContent>
//         <extension base="md:EndpointType">
//             <attribute name="index" type="unsignedShort" use="required"/>
//             <attribute name="isDefault" type="boolean" use="optional"/>
//         </extension>
//     </complexContent>
// </complexType>
interface IndexedEndpoint extends Endpoint {
  index: number;
  isDefault?: boolean;
}

// <complexType name="KeyDescriptorType">
//     <sequence>
//         <element ref="ds:KeyInfo"/>
//         <element ref="md:EncryptionMethod" minOccurs="0" maxOccurs="unbounded"/>
//     </sequence>
//     <attribute name="use" type="md:KeyTypes" use="optional"/>
// </complexType>
// <simpleType name="KeyTypes">
//     <restriction base="string">
//         <enumeration value="encryption"/>
//         <enumeration value="signing"/>
//     </restriction>
// </simpleType>
// <element name="EncryptionMethod" type="xenc:EncryptionMethodType"/>
type KeyType = 'encryption' | 'signing';
interface Key {
  certificates: string[];
  // EncryptionMethod

  use?: KeyType
}

// <complexType name="EntitiesDescriptorType">
//     <sequence>
//         <element ref="ds:Signature" minOccurs="0"/>
//         <element ref="md:Extensions" minOccurs="0"/>
//         <choice minOccurs="1" maxOccurs="unbounded">
//             <element ref="md:EntityDescriptor"/>
//             <element ref="md:EntitiesDescriptor"/>
//         </choice>
//     </sequence>
//     <attribute name="validUntil" type="dateTime" use="optional"/>
//     <attribute name="cacheDuration" type="duration" use="optional"/>
//     <attribute name="ID" type="ID" use="optional"/>
//     <attribute name="Name" type="string" use="optional"/>
// </complexType>
interface EntitiesDescriptor {
  // Signature
  // Extensions
  entities: (EntityDescriptor | EntitiesDescriptor)[], // required

  validUntil?: string; // Date
  cacheDuration?: string; // Duration
  // ID
  name?: string;
}

// <complexType name="EntityDescriptorType">
//     <sequence>
//         <element ref="ds:Signature" minOccurs="0"/>
//         <element ref="md:Extensions" minOccurs="0"/>
//         <choice>
//             <choice maxOccurs="unbounded">
//                 <element ref="md:RoleDescriptor"/>
//                 <element ref="md:IDPSSODescriptor"/>
//                 <element ref="md:SPSSODescriptor"/>
//                 <element ref="md:AuthnAuthorityDescriptor"/>
//                 <element ref="md:AttributeAuthorityDescriptor"/>
//                 <element ref="md:PDPDescriptor"/>
//             </choice>
//             <element ref="md:AffiliationDescriptor"/>
//         </choice>
//         <element ref="md:Organization" minOccurs="0"/>
//         <element ref="md:ContactPerson" minOccurs="0" maxOccurs="unbounded"/>
//         <element ref="md:AdditionalMetadataLocation" minOccurs="0" maxOccurs="unbounded"/>
//     </sequence>
//     <attribute name="entityID" type="md:entityIDType" use="required"/>
//     <attribute name="validUntil" type="dateTime" use="optional"/>
//     <attribute name="cacheDuration" type="duration" use="optional"/>
//     <attribute name="ID" type="ID" use="optional"/>
//     <anyAttribute namespace="##other" processContents="lax"/>
// </complexType>
interface EntityDescriptor {
    entityID: string;
    // validUntil
    // cacheDuration
    // ID

    // Signature
    // Extensions
    // RoleDescriptor
    // AuthnAuthorityDescriptor
    // AttributeAuthorityDescriptor
    // PDPDescriptor
    // AffiliationDescriptor
    idps: IDPSSO[];
    sps: SPSSO[];
    organization?: Organization;
    // ContactPerson
    // AdditionalMetadataLocation
}

// <complexType name="OrganizationType">
//     <sequence>
//         <element ref="md:Extensions" minOccurs="0"/>
//         <element ref="md:OrganizationName" maxOccurs="unbounded"/>
//         <element ref="md:OrganizationDisplayName" maxOccurs="unbounded"/>
//         <element ref="md:OrganizationURL" maxOccurs="unbounded"/>
//     </sequence>
//     <anyAttribute namespace="##other" processContents="lax"/>
// </complexType>
// <element name="OrganizationName" type="md:localizedNameType"/>
// <element name="OrganizationDisplayName" type="md:localizedNameType"/>
// <element name="OrganizationURL" type="md:localizedURIType"/>
interface Organization {
  // Extensions
  organizationName: Localized[];
  organizationDisplayName: Localized[];
  organizationURL: Localized[];
}

// <complexType name="RoleDescriptorType" abstract="true">
//     <sequence>
//         <element ref="ds:Signature" minOccurs="0"/>
//         <element ref="md:Extensions" minOccurs="0"/>
//         <element ref="md:KeyDescriptor" minOccurs="0" maxOccurs="unbounded"/>
//         <element ref="md:Organization" minOccurs="0"/>
//         <element ref="md:ContactPerson" minOccurs="0" maxOccurs="unbounded"/>
//     </sequence>
//     <attribute name="ID" type="ID" use="optional"/>
//     <attribute name="validUntil" type="dateTime" use="optional"/>
//     <attribute name="cacheDuration" type="duration" use="optional"/>
//     <attribute name="protocolSupportEnumeration" type="md:anyURIListType" use="required"/>
//     <attribute name="errorURL" type="anyURI" use="optional"/>
//     <anyAttribute namespace="##other" processContents="lax"/>
// </complexType>
interface Role {
    // Signature
    // Extensions
    keys: Key[];
    organization?: Organization;
    // ContactPerson

    // ID
    // validUntil
    // cacheDuration
    protocolSupportEnumeration: string[];
    // errorURL
}

// <complexType name="SSODescriptorType" abstract="true">
//     <complexContent>
//         <extension base="md:RoleDescriptorType">
//             <sequence>
//                 <element ref="md:ArtifactResolutionService" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="md:SingleLogoutService" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="md:ManageNameIDService" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="md:NameIDFormat" minOccurs="0" maxOccurs="unbounded"/>
//             </sequence>
//         </extension>
//     </complexContent>
// </complexType>
// <element name="ArtifactResolutionService" type="md:IndexedEndpointType"/>
// <element name="SingleLogoutService" type="md:EndpointType"/>
// <element name="ManageNameIDService" type="md:EndpointType"/>
// <element name="NameIDFormat" type="anyURI"/>
interface SSO extends Role {
  // ArtifactResolutionService
  singleLogoutServices: Endpoint[];
  // ManageNameIDService
  nameIDFormats: string[];
}

// <complexType name="IDPSSODescriptorType">
//     <complexContent>
//         <extension base="md:SSODescriptorType">
//             <sequence>
//                 <element ref="md:SingleSignOnService" maxOccurs="unbounded"/>
//                 <element ref="md:NameIDMappingService" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="md:AssertionIDRequestService" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="md:AttributeProfile" minOccurs="0" maxOccurs="unbounded"/>
//                 <element ref="saml:Attribute" minOccurs="0" maxOccurs="unbounded"/>
//             </sequence>
//             <attribute name="WantAuthnRequestsSigned" type="boolean" use="optional"/>
//         </extension>
//     </complexContent>
// </complexType>
// <element name="SingleSignOnService" type="md:EndpointType"/>
// <element name="NameIDMappingService" type="md:EndpointType"/>
// <element name="AssertionIDRequestService" type="md:EndpointType"/>
// <element name="AttributeProfile" type="anyURI"/>
interface IDPSSO extends SSO {
  singleSignOnServices: Endpoint[]; // required
  // NameIDMappingService
  // AssertionIDRequestService
  // AttributeProfile
  // Attribute

  wantAuthnRequestsSigned?: boolean;
}

// <complexType name="SPSSODescriptorType">
//     <complexContent>
//         <extension base="md:SSODescriptorType">
//             <sequence>
//                 <element ref="md:AssertionConsumerService" maxOccurs="unbounded"/>
//                 <element ref="md:AttributeConsumingService" minOccurs="0" maxOccurs="unbounded"/>
//             </sequence>
//             <attribute name="AuthnRequestsSigned" type="boolean" use="optional"/>
//             <attribute name="WantAssertionsSigned" type="boolean" use="optional"/>
//         </extension>
//     </complexContent>
// </complexType>
// <element name="AssertionConsumerService" type="md:IndexedEndpointType"/>
// <element name="AttributeConsumingService" type="md:AttributeConsumingServiceType"/>
// <complexType name="AttributeConsumingServiceType">
//     <sequence>
//         <element ref="md:ServiceName" maxOccurs="unbounded"/>
//         <element ref="md:ServiceDescription" minOccurs="0" maxOccurs="unbounded"/>
//         <element ref="md:RequestedAttribute" maxOccurs="unbounded"/>
//     </sequence>
//     <attribute name="index" type="unsignedShort" use="required"/>
//     <attribute name="isDefault" type="boolean" use="optional"/>
// </complexType>
// <element name="ServiceName" type="md:localizedNameType"/>
// <element name="ServiceDescription" type="md:localizedNameType"/>
// <element name="RequestedAttribute" type="md:RequestedAttributeType"/>
// <complexType name="RequestedAttributeType">
//     <complexContent>
//         <extension base="saml:AttributeType">
//             <attribute name="isRequired" type="boolean" use="optional"/>
//         </extension>
//     </complexContent>
// </complexType>
interface SPSSO extends SSO {
  assertionConsumerServices: IndexedEndpoint[]; // required
  // AttributeConsumingService

  authnRequestsSigned?: boolean;
  wantAssertionsSigned?: boolean;
}

type Metadata = EntityDescriptor | EntitiesDescriptor
    
function parseBoolean(s: string): boolean | undefined {
  switch(s) {
    case 'true': return true;
    case 'false': return false;
    default: return undefined;
  }
}

function parseInteger(s: string): number | undefined {
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

function parseUse(s: string): KeyType | undefined {
  switch(s) {
    case 'encryption':
    case 'signing':
      return s as KeyType;
    default: return undefined;
  }
}

function parseEnumeration(s: string): string[] {
  return s.split(' ');
}

namespace Path {
  export interface Matcher {
    match(top: string[], k: (top_: string[]) => boolean): boolean
  }

  class And implements Matcher {
    left: Matcher;
    right: Matcher;

    constructor(left: Matcher, right: Matcher) {
      this.left = left;
      this.right = right;
    }

    match(top: string[], k: (top_: string[]) => boolean): boolean {
      return this.right.match(top, (top_) => this.left.match(top_, k)); // Match in reverse
    }
  }

  class Or implements Matcher {
    ms: Matcher[];

    constructor(ms: Matcher[]) {
      this.ms = ms;
    }

    match(top: string[], k: (top_: string[]) => boolean): boolean {
      return this.ms.some((m) => m.match(top, k));
    }
  }

  class Repeat implements Matcher {
    m: Matcher;

    constructor(m: Matcher) {
      this.m = m; 
    }

    matchRepeatedly(top: string[], k: (top_: string[]) => boolean): boolean {
      return k(top) || this.m.match(top, (top_) => top !== top_ && this.matchRepeatedly(top_, k));
    }

    match(top: string[], k: (top_: string[]) => boolean): boolean {
      return this.matchRepeatedly(top, k);
    }
  }

  class Tag implements Matcher {
    tag: string;

    constructor(tag: string) {
      this.tag = tag;
    }

    match(top: string[], k: (top_: string[]) => boolean): boolean {
      return top.length === 0 
        ? false 
        : top[top.length - 1] === this.tag && k(top.slice(0, -1));
    }
  }

  class Root implements Matcher {
    match(top: string[], k: (top_: string[]) => boolean): boolean {
      return top.length === 0;
    }
  }

  export function or(ms: Matcher[]) {
    return new Or(ms);
  }

  export function and(left: Matcher, right: Matcher) {
    return new And(left, right);
  }

  export function tag(tag: string) {
    return new Tag(tag);
  }

  export function repeat(m: Matcher) {
    return new Repeat(m);
  }

  export const root = new Root();

  export class Stack {
    tags: string[] = [];

    push(tag: string) {
      this.tags.push(tag);
    }

    pop(tag_: string): string {
      const tag = this.tags.pop();
      if (tag === undefined) {
        throw Error('Stack empty'); 
      }
      if (tag !== tag_) {
        throw Error(`Unexpected tag ${tag}`); 
      }
      return tag;
    }

    match(m: Matcher): boolean {
      return m.match(this.tags, (_) => true);
    }
  }
}

import p = Path

export default async function(stream: Readable): Promise<Metadata | undefined> {

  const parser = new sax.SaxesParser({xmlns: true});

  const tags: p.Stack = new p.Stack()
  let metadata: Metadata | undefined
  let ns: {[key: string]: string} 

  const EntitiesDescriptorStack: EntitiesDescriptor[] = []
  let EntityDescriptor: EntityDescriptor | undefined
  let SPSSODescriptor: SPSSO | undefined
  let IDPSSODescriptor: IDPSSO | undefined
  let Organization: Organization | undefined
  let OrganizationName: Localized | undefined
  let OrganizationDisplayName: Localized | undefined
  let OrganizationURL: Localized | undefined
  let KeyDescriptor: Key | undefined
  let SingleSignOnService: Endpoint | undefined
  let SingleLogoutService: Endpoint | undefined
  let AssertionConsumerService: IndexedEndpoint | undefined
  let NameIDFormat: String | undefined
  let KeyInfo: boolean = false
  let X509Data: boolean = false
  let X509Certificate: boolean = false

  parser.on('opentag', (tag) => {
    function a(name: string): string {
      const attribute = tag.attributes[name]
      return attribute && attribute.value
    }

    ns = {...ns, ...tag.ns};

    switch (ns[tag.prefix]) {
      case 'urn:oasis:names:tc:SAML:2.0:metadata':
        switch (tag.local) {
          case 'EntitiesDescriptor':
            if (tags.match(p.and(p.root, p.repeat(p.tag('EntitiesDescriptor'))))) { 
              EntitiesDescriptorStack.push({
                entities: [],
                validUntil: a('validUntil'),
                cacheDuration: a('cacheDuration'),
                name: a('Name')
              });
            }
            break;
          case 'EntityDescriptor':
            if (tags.match(p.and(p.root, p.repeat(p.tag('EntitiesDescriptor'))))) { 
              EntityDescriptor = {
                entityID: a('entityID'),
                idps: [],
                sps: [],
              };
            }
            break;
          case 'IDPSSODescriptor':
            if (tags.match(p.tag('EntityDescriptor'))) {
              IDPSSODescriptor = {
                keys: [],
                wantAuthnRequestsSigned: parseBoolean(a('WantAuthnRequestsSigned')),
                protocolSupportEnumeration: parseEnumeration(a('protocolSupportEnumeration')),
                singleLogoutServices: [],
                singleSignOnServices: [],
                nameIDFormats: [],
              };
            }
            break;
          case 'SPSSODescriptor':
            if (tags.match(p.tag('EntityDescriptor'))) {
              SPSSODescriptor = {
                keys: [],
                authnRequestsSigned: parseBoolean(a('AuthnRequestsSigned')),
                wantAssertionsSigned: parseBoolean(a('WantAssertionsSigned')),
                protocolSupportEnumeration: parseEnumeration(a('protocolSupportEnumeration')),
                singleLogoutServices: [],
                assertionConsumerServices: [],
                nameIDFormats: [],
              };
            }
            break;
          case 'SingleLogoutService':
            if (tags.match(p.or([p.tag('IDPSSODescriptor'), p.tag('SPSSODescriptor')]))) {
              SingleLogoutService = {
                binding: a('Binding'),
                location: a('Location'),
                responseLocation: a('ResponseLocation')
              };
            }
            break;
          case 'SingleSignOnService':
            if (tags.match(p.tag('IDPSSODescriptor'))) {
              SingleSignOnService = {
                binding: a('Binding'),
                location: a('Location'),
                responseLocation: a('ResponseLocation')
              };
            }
            break;
          case 'AssertionConsumerService':
            if (tags.match(p.tag('SPSSODescriptor'))) {
              AssertionConsumerService = {
                 binding: a('Binding'),
                 location: a('Location'),
                 responseLocation: a('ResponseLocation'),
                 index: parseInteger(a('index'))!,
                 isDefault: parseBoolean(a('isDefault'))
              };
            }
            break;
          case 'KeyDescriptor':
            if (tags.match(p.or([p.tag('IDPSSODescriptor'), p.tag('SPSSODescriptor')]))) {
              KeyDescriptor = {
                use: parseUse(a('use')),
                certificates: []
              };
            }
            break;
          case 'Organization':
            if (tags.match(p.or([p.tag('EntityDescriptor'), p.tag('IDPSSODescriptor'), p.tag('SPSSODescriptor')]))) {
              Organization = {
                organizationName: [],
                organizationDisplayName: [],
                organizationURL: [],
              };
            }
            break;
          case 'OrganizationName':
            if (tags.match(p.tag('Organization'))) {
              OrganizationName = {
                lang: a('xml:lang')!,
                content: ''
              };
            }
            break;
          case 'OrganizationDisplayName':
            if (tags.match(p.tag('Organization'))) {
              OrganizationDisplayName = {
                lang: a('xml:lang')!,
                content: ''
              };
            }
            break;
          case 'OrganizationURL':
            if (tags.match(p.tag('Organization'))) {
              OrganizationURL = {
                lang: a('xml:lang')!,
                content: ''
              };
            }
            break;
          case 'NameIDFormat':
            if (tags.match(p.or([p.tag('IDPSSODescriptor'), p.tag('SPSSODescriptor')]))) {
              NameIDFormat = new String('');
            }
            break;
        }
        break;
      case "http://www.w3.org/2000/09/xmldsig#":
        switch (tag.local) {
          case 'KeyInfo':
            if (tags.match(p.tag('KeyDescriptor'))) {
              KeyInfo = true;
            }
            break;
          case 'X509Data':
            if (tags.match(p.tag('KeyInfo'))) {
              X509Data = true;
            }
            break;
          case 'X509Certificate':
            if (tags.match(p.tag('X509Data'))) {
              X509Certificate = true;
            }
            break;
        }
        break;
    }

    tags.push(tag.local);
  });

  parser.on('text', (text: string) => {
    if (KeyDescriptor && KeyInfo && X509Data && X509Certificate) {
      KeyDescriptor.certificates.push(text);
    } else if (NameIDFormat) {
      NameIDFormat = text;
    } else if (OrganizationName) {
      OrganizationName.content = text;
    } else if (OrganizationDisplayName) {
      OrganizationDisplayName.content = text;
    } else if (OrganizationURL) {
      OrganizationURL.content = text;
    }
  });

  parser.on('closetag', (tag) => {
    switch (ns[tag.prefix]) {
      case 'urn:oasis:names:tc:SAML:2.0:metadata':
        switch (tag.local) {
          case 'EntitiesDescriptor': {
            const EntitiesDescriptor = EntitiesDescriptorStack.pop(); 
            if (EntitiesDescriptorStack.length === 0) {
              metadata = EntitiesDescriptor
            } else {
              EntitiesDescriptorStack[EntitiesDescriptorStack.length - 1].entities.push(EntitiesDescriptor!);
            }
            break;
          } case 'EntityDescriptor':
            if (EntityDescriptor) {
              if (EntitiesDescriptorStack.length === 0) {
                metadata = EntityDescriptor
              } else {
                EntitiesDescriptorStack[EntitiesDescriptorStack.length - 1].entities.push(EntityDescriptor);
              }
            }
            EntityDescriptor = undefined;
            break;
          case 'IDPSSODescriptor':
            if (IDPSSODescriptor) {
              EntityDescriptor!.idps.push(IDPSSODescriptor);
            }
            IDPSSODescriptor = undefined;
            break;
          case 'SPSSODescriptor':
            if (SPSSODescriptor) {
              EntityDescriptor!.sps.push(SPSSODescriptor);
            }
            SPSSODescriptor = undefined;
            break;
          case 'SingleLogoutService': {
            const x = IDPSSODescriptor || SPSSODescriptor;
            if (SingleLogoutService) {
              x!.singleLogoutServices.push(SingleLogoutService);
            }
            SingleLogoutService = undefined;
            break;
          } case 'SingleSignOnService':
            if (SingleSignOnService) {
              IDPSSODescriptor!.singleSignOnServices.push(SingleSignOnService);
            }
            SingleSignOnService = undefined;
            break;
          case 'AssertionConsumerService':
            if (AssertionConsumerService) {
              SPSSODescriptor!.assertionConsumerServices.push(AssertionConsumerService);
            }
            AssertionConsumerService = undefined;
            break;
          case 'KeyDescriptor': {
            const x = IDPSSODescriptor || SPSSODescriptor;
            if (KeyDescriptor) {
              x!.keys.push(KeyDescriptor);
            }
            KeyDescriptor = undefined;
            break;
          } case 'Organization': {
            const x = EntityDescriptor || IDPSSODescriptor || SPSSODescriptor;
            if (Organization) {
              x!.organization = Organization;
            }
            Organization = undefined;
            break;
          } case 'OrganizationName':
            if (OrganizationName) {
              Organization!.organizationName.push(OrganizationName);
            }
            OrganizationName = undefined;
            break;
          case 'OrganizationDisplayName':
            if (OrganizationDisplayName) {
              Organization!.organizationDisplayName.push(OrganizationDisplayName);
            }
            OrganizationDisplayName = undefined;
            break;
          case 'OrganizationURL':
            if (OrganizationURL) {
              Organization!.organizationURL.push(OrganizationURL);
            }
            OrganizationURL = undefined;
            break;
          case 'NameIDFormat': {
            const x = IDPSSODescriptor || SPSSODescriptor;
            if (NameIDFormat) {
              x!.nameIDFormats.push(NameIDFormat.valueOf());
            }
            NameIDFormat = undefined;
            break;
          }
        }
        break;
      case "http://www.w3.org/2000/09/xmldsig#":
        switch (tag.local) {
          case 'KeyInfo':
            KeyInfo = false;
            break;
          case 'X509Data':
            X509Data = false;
            break;
          case 'X509Certificate':
            X509Certificate = false;
            break;
        }
        break;
    }
    tags.pop(tag.local);
  });
  const end: Promise<Metadata | undefined> = new Promise((resolve, reject) => {
    parser.on('end', () =>  {return resolve(metadata)});
    parser.on('error', (e) => reject(e));
  });

  for await (const chunk of stream) {
    parser.write(chunk);
  }
  parser.close();

  return await end;
}
