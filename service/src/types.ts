import express from 'express';

export interface LoginProvider {
  displayName: string,
  discovery: (uid: string) => Promise<string>,
  redirect: (entityID: string, uid: string) => Promise<string>,
  router: (redirect: (uid: string) => string) => express.Router
};
