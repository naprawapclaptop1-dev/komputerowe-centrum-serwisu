'use strict';

const EXPECTED = Object.freeze({ photos: 12, posters: 3, illustrations: 18, total: 33 });

function collectFix51VisualAssetPaths(releaseManifest, visualManifest) {
  const photos = Array.isArray(releaseManifest?.localPhotos) ? releaseManifest.localPhotos : [];
  const posters = Array.isArray(releaseManifest?.localPosters) ? releaseManifest.localPosters : [];
  const illustrations = Array.isArray(visualManifest?.assets)
    ? visualManifest.assets.map(asset => asset?.src)
    : [];
  const paths = [...photos, ...posters, ...illustrations];
  const safePaths = paths.every(value => typeof value === 'string'
    && value.length > 0
    && !value.startsWith('/')
    && !value.includes('..')
    && !value.includes('\\')
    && !/[?#]/.test(value));
  const uniquePaths = new Set(paths).size === paths.length;
  const validCounts = photos.length === EXPECTED.photos
    && posters.length === EXPECTED.posters
    && illustrations.length === EXPECTED.illustrations
    && paths.length === EXPECTED.total;

  return {
    paths,
    counts: { photos: photos.length, posters: posters.length, illustrations: illustrations.length, total: paths.length },
    valid: validCounts && safePaths && uniquePaths,
    errors: [
      ...(photos.length !== EXPECTED.photos ? [`photos=${photos.length}, oczekiwano ${EXPECTED.photos}`] : []),
      ...(posters.length !== EXPECTED.posters ? [`posters=${posters.length}, oczekiwano ${EXPECTED.posters}`] : []),
      ...(illustrations.length !== EXPECTED.illustrations ? [`illustrations=${illustrations.length}, oczekiwano ${EXPECTED.illustrations}`] : []),
      ...(paths.length !== EXPECTED.total ? [`total=${paths.length}, oczekiwano ${EXPECTED.total}`] : []),
      ...(!safePaths ? ['niebezpieczna lub nieprawidłowa ścieżka zasobu'] : []),
      ...(!uniquePaths ? ['powtórzona ścieżka zasobu'] : [])
    ]
  };
}

function verifyFix51VisualAssetProbes(paths, checks) {
  return Array.isArray(paths)
    && Array.isArray(checks)
    && paths.length === EXPECTED.total
    && checks.length === paths.length
    && checks.every(value => value === true);
}

module.exports = {
  FIX51_VISUAL_ASSET_EXPECTED: EXPECTED,
  collectFix51VisualAssetPaths,
  verifyFix51VisualAssetProbes
};
