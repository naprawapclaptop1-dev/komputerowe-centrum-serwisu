"use strict";
const REQUIRED_FILTER_MARKERS = Object.freeze([
  'hasHumanSubjectMetadata',
  'NO_HUMAN_SUBJECT_RE',
  'FIX129'
]);

function verifyPhotoMetadataFilterRuntime({ responseOk, source } = {}) {
  const runtime = String(source || '');
  const missing = REQUIRED_FILTER_MARKERS.filter(marker => !runtime.includes(marker));
  return {
    valid: responseOk === true && missing.length === 0,
    missing,
    markerCount: REQUIRED_FILTER_MARKERS.length
  };
}

module.exports = { REQUIRED_FILTER_MARKERS, verifyPhotoMetadataFilterRuntime };
