import { completeOAuth } from '../../_oauth.js';
export async function onRequestGet({ request, env }) {
  return completeOAuth(request, env);
}
