import express from 'express';

export interface LoginProvider {
  displayName: string,
  discovery: () => Promise<string>,
  redirect: () => Promise<string>,
  router: (redirect: (uid: string) => string) => express.Router
};
