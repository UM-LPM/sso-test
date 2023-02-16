import React from 'react';

export default function Login(params: {login: string, federated: {name: string, displayName: string, endpoint: string}[]}) {
  return (<React.Fragment>
    <h1>Login</h1>
    <h2>Local</h2>
    <form method="post" action={params.login} autoComplete="off">
      <input required type="text" name="login" placeholder="Username" />
      <input required type="password" name="password" placeholder="Password" />
      <button type="submit">Sign in</button>
    </form>
    <h2>Federated</h2>
    {params.federated.map(({name, displayName, endpoint}) =>
      (<form method="post" action={endpoint}>
        <input type="hidden" name="provider" value={name} />
        <button type="submit">{displayName}</button>
      </form>))}
  </React.Fragment>)
}
