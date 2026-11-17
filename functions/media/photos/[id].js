import { serveCuratedPhotoFix131 } from '../../_photo-proxy-fix131.js';

export async function onRequest({ request, params, waitUntil }) {
  return serveCuratedPhotoFix131({
    request,
    id: params?.id,
    waitUntil: typeof waitUntil === 'function' ? waitUntil : null
  });
}
