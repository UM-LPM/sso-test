import express from 'express';

export interface LoginProvider {
  displayName: string,
  redirect: (uid: string) => Promise<string>,
  router: (redirect: (uid: string) => string) => express.Router
};
