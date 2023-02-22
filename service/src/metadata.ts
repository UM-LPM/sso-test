import {Stream} from 'node:stream';
import sax from 'sax';

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
type Localized = {[lang: string]: string}

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
  binding: string
  location: string
  responseLocation?: string
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
  index: number
  isDefault?: boolean
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
type KeyTypes = 'encryption' | 'signing';
interface Key {
  info: string
  // EncryptionMethod

  use?: KeyTypes
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

  validUntil?: string // Date
  cacheDuration?: string // Duration
  // ID
  name?: string
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
    entityID: string
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
    idps: IDPSSO[]
    sps: SPSSO[]
    organization?: Organization
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
  organizationName: Localized
  organizationDisplayName: Localized
  organizationURL: Localized
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
    key: Key
    organization?: Organization
    // ContactPerson

    // ID
    // validUntil
    // cacheDuration
    protocolSupportEnumeration: string[]
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
  singleLogoutServices: Endpoint[]
  // ManageNameIDService
  nameIDFormat: string
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
  singleSignOnServices: Endpoint[] // required
  // NameIDMappingService
  // AssertionIDRequestService
  // AttributeProfile
  // Attribute

  wantAuthnRequestsSigned?: boolean
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
  assertionConsumerServices: IndexedEndpoint[], // required
  // AttributeConsumingService

  authnRequestsSigned?: boolean
  wantAssertionsSigned?: boolean
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

type Tag = 
  | 'EntitiesDescriptor' 
  | 'EntityDescriptor'
  | 'SPSSODescriptor'
  | 'IDPSSODescriptor'
  | 'Organization'
  | 'OrganizationName'
  | 'OrganizationDisplayName'
  | 'OrganizationURL'
  | 'KeyDescriptor'
  | 'KeyInfo'
  | 'X509Data'
  | 'X509Certificate'
  | 'SingleSignOnService' 
  | 'SingleLogoutService'
  | 'AssertionConsumerService'
  | 'NameIDFormat'


type Element = {tag: Tag, components: any}

interface PathMatcher {
  match(top: Element[], k: (top_: Element[]) => boolean): boolean
}

class And implements PathMatcher {
  left: PathMatcher
  right: PathMatcher
  constructor(left: PathMatcher, right: PathMatcher) {
    this.left = left;
    this.right = right;
  }

  match(top: Element[], k: (top_: Element[]) => boolean): boolean {
    return this.right.match(top, (top_) => this.left.match(top_, k)) // Match in reverse
  }
}

class Or implements PathMatcher {
  ms: PathMatcher[]
  constructor(ms: PathMatcher[]) {
    this.ms = ms;
  }

  match(top: Element[], k: (top_: Element[]) => boolean): boolean {
    return this.ms.some((m) => m.match(top, k));
  }
}

class Seg implements PathMatcher {
  tag: Tag
  constructor(tag: Tag) {
    this.tag = tag;
  }

  match(top: Element[], k: (top_: Element[]) => boolean): boolean {
    if (top.length > 0) {
      return top[top.length - 1].tag === this.tag && k(top.slice(0, -1))
    } else {
      return false;
    }
  }
}

class One implements PathMatcher {
  match(top: Element[], k: (top_: Element[]) => boolean): boolean {
    return k(top)
  }
}

function or(ms: PathMatcher[]) {
  return new Or(ms)
}

function and(left: PathMatcher, right: PathMatcher) {
  return new And(left, right)
}

function seg(tag: Tag) {
  return new Seg(tag)
}

const one = new One();

class Stack {
  data: Element[] = []

  push(tag: Tag, components: any) {
    this.data.push({tag, components});
  }

  pop(tag: Tag): any {
    const element = this.data.pop();
    if (element === undefined) {
      throw Error("Stack empty"); 
    }
    if (element.tag !== tag) {
      console.log(this.data)
      throw Error(`Unexpected tag ${tag}`); 
    }
    return element.components
  }

  get focus() {
    return this.data[this.data.length - 1].components
  }

  match(m: PathMatcher): boolean {
    return m.match(this.data, (_) => true)
  }
}

export default async function(stream: Stream): Promise<Metadata | undefined> {
  const parser = sax.createStream(true, {xmlns: true});


  const stack: Stack = new Stack()
  let metadata: Metadata | undefined
  let atKeyInfo: boolean = false
  let atX509Data: boolean = false
  let atX509Certificate: boolean = false

  parser.on('opentag', (tag: sax.QualifiedTag) => {
    function a(name: string): string {
      const attribute = tag.attributes[name]
      return attribute && attribute.value
    }

    switch (tag.ns[tag.prefix]) {
      case 'urn:oasis:names:tc:SAML:2.0:metadata':
        switch (tag.local) {
          case 'EntitiesDescriptor':
            stack.push(tag.local, {
              entities: [],
              validUntil: a('validUntil'),
              cacheDuration: a('cacheDuration'),
              name: a('Name')
            });
            return;
          case 'EntityDescriptor':
            stack.push(tag.local, {
              entityID: a('entityID'),
              idps: [],
              sps: [],
            });
            return;
          case 'IDPSSODescriptor':
            stack.push(tag.local, {
               wantAuthnRequestsSigned: parseBoolean(a('WantAuthnRequestsSigned')),
               protocolSupportEnumeration: parseEnumeration(a('protocolSupportEnumeration')),
               singleLogoutServices: [],
               singleSignOnServices: []
            });
            return;
          case 'SPSSODescriptor':
            stack.push(tag.local, {
               authnRequestsSigned: parseBoolean(a('AuthnRequestsSigned')),
               wantAssertionsSigned: parseBoolean(a('WantAssertionsSigned')),
               protocolSupportEnumeration: parseEnumeration(a('protocolSupportEnumeration')),
               singleLogoutServices: [],
               assertionConsumerServices: []
            });
            return;
          case 'SingleSignOnService':
          case 'SingleLogoutService':
            stack.push(tag.local, {
               binding: a('Binding'),
               location: a('Location'),
               responseLocation: a('ResponseLocation')
            });
            return;
          case 'AssertionConsumerService':
            stack.push(tag.local, {
               binding: a('Binding'),
               location: a('Location'),
               responseLocation: a('ResponseLocation'),
               index: parseInteger(a('index')),
               isDefault: parseBoolean(a('isDefault'))
            });
            return;
          case 'KeyDescriptor':
            stack.push(tag.local, {
              use: parseUse(a('use'))
            })
            return;
          case 'Organization':
            stack.push(tag.local, {
              organizationName: {},
              organizationDisplayName: {},
              organizationURL: {},
            });
            return;
          case 'OrganizationName':
          case 'OrganizationDisplayName':
          case 'OrganizationURL':
            stack.push(tag.local, {
              lang: parseUse(a('lang'))
            })
            return;
          case 'NameIDFormat':
            stack.push(tag.local, {});
            return;
        }
        break;
      case "http://www.w3.org/2000/09/xmldsig#":
        switch (tag.local) {
          case 'KeyInfo':
            atKeyInfo = true;
            return;
          case 'X509Data':
            atX509Data = true;
            return;
          case 'X509Certificate':
            atX509Certificate = true;
            return;
        }
    }
  });

  parser.on('text', (text: string) => {
    if (stack.match(new Seg('KeyDescriptor')) && atKeyInfo && atX509Data && atX509Certificate) {
      stack.focus.info = text;
    } else if (stack.match(or([
      and(or([seg('IDPSSODescriptor'), seg('SPSSODescriptor')]), seg('NameIDFormat')),
      and(seg('Organization'), seg('OrganizationName')),
      and(seg('Organization'), seg('OrganizationDisplayName')),
      and(seg('Organization'), seg('OrganizationURL'))
    ]))) {
      stack.focus.text = text;
    }
  });

  parser.on('closetag', (name: string) => {
    const ext = /(?:\w+:)?(\w+)/.exec(name);
    if (ext === null) {
      throw Error("Malformed XML closing tag")
    }
    const local = ext[1]
    switch (local) {
      case 'EntitiesDescriptor': {
        const x = stack.pop(local);
        if (stack.match(seg('EntitiesDescriptor'))) {
          stack.focus.entities.push(x);
        } else {
          metadata = x;
        }
        return;
      } case 'EntityDescriptor': {
        const x = stack.pop(local);
        if (stack.match(seg('EntitiesDescriptor'))) {
          stack.focus.entities.push(x);
        } else {
          metadata = x;
        }
        return;
      } case 'IDPSSODescriptor': {
        const x = stack.pop(local);
        if (stack.match(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')))) {
          stack.focus.idps.push(x);
        }
        return;
      } case 'SPSSODescriptor': {
        const x = stack.pop(local);
        if (stack.match(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')))) {
          stack.focus.sps.push(x);
        }
        return;
      } case 'SingleLogoutService': {
        const x = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')),
                            or([seg('IDPSSODescriptor'), seg('SPSSODescriptor')])))) {
          stack.focus.singleLogoutServices.push(x);
        }
        return;
      } case 'SingleSignOnService': {
        const x = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                            seg('IDPSSODescriptor')))) {
          stack.focus.singleSignOnServices.push(x);
        }
        return;
      } case 'AssertionConsumerService': {
        const x = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                            seg('SPSSODescriptor')))) {
          stack.focus.assertionConsumerServices.push(x);
        }
        return;
      } case 'KeyDescriptor': {
        const x = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                            or([seg('IDPSSODescriptor'), seg('SPSSODescriptor')])))) {
          stack.focus.key = x;
        }
        return;
      } case 'Organization': {
        const x = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                            or([one, seg('IDPSSODescriptor'), seg('SPSSODescriptor')])))) {
          stack.focus.organization = x;
        }
        return;
      } case 'NameIDFormat': {
        const {text} = stack.pop(local);
        if (stack.match(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                            or([seg('IDPSSODescriptor'), seg('SPSSODescriptor')])))) {
          stack.focus.localIDFormat = text;
        }
        return;
      } case 'OrganizationName': {
        const {lang, text} = stack.pop(local);
        if (stack.match(and(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                                or([one, seg('IDPSSODescriptor'), seg('SPSSODescriptor')])),
                              seg('Organization')))) {
          stack.focus.organizationName[lang] = text;
        }
        return;
      } case 'OrganizationDisplayName': {
        const {lang, text} = stack.pop(local);
        if (stack.match(and(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                                or([one, seg('IDPSSODescriptor'), seg('SPSSODescriptor')])), 
                              seg('Organization')))) {
          stack.focus.organizationDisplayName[lang] = text;
        }
        return;
      } case 'OrganizationURL': {
        const {lang, text} = stack.pop(local);
        if (stack.match(and(and(and(seg('EntitiesDescriptor'), seg('EntityDescriptor')), 
                                or([one, seg('IDPSSODescriptor'), seg('SPSSODescriptor')])), 
                              seg('Organization')))) {
          stack.focus.organizationURL[lang] = text;
        }
        return;
      }
      case 'KeyInfo':
        atKeyInfo = false;
        return;
      case 'X509Data':
        atX509Data = false;
        return;
      case 'X509Certificate':
        atX509Certificate = false;
        return;
    }
  });

  const end: Promise<Metadata | undefined> = new Promise((resolve, reject) => {
    parser.on('end', () =>  { return resolve(metadata)});
    parser.on('error', (e) => reject(e));
  });

  stream.pipe(parser);
  return await end;
}
