import { startOAuth } from '../../_oauth.js';
export async function onRequestGet({ request, env }) {
  return startOAuth(request, env);
}
