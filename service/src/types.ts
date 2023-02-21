import express from 'express';

export interface LoginProvider {
  displayName: string,
  discovery: (uid: string) => Promise<string>,
  redirect: (uid: string, entityID: string) => Promise<string>,
  router: (redirect: (uid: string) => string) => express.Router
};

export interface SamlDiscovery {
  entryPoint: string,
  callbackUrl: string
}
