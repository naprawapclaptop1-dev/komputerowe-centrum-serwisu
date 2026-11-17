'use strict';

// Remote publication contract for Global Academy FIX64–FIX73.
// FIX70 is represented in the runtime by its actual namespaced storage key;
// the UI copy uses a combined FIX77 label, so the literal text "FIX70" is
// not required to be present in the minified browser bundle.
const REQUIRED_GLOBAL_ACADEMY_EXPANSION_MARKERS = Object.freeze([
  'FIX64', 'FIX65', 'FIX66', 'FIX67', 'FIX68', 'FIX69',
  'npaFix70CertificatesV1',
  'FIX71', 'FIX72', 'FIX73',
  'faultLabView', 'electronicsView', 'boardviewView', 'compatibilityView', 'serviceSimView',
  'bindFaultLab', 'bindElectronics', 'bindBoardview', 'bindCompatibility', 'bindServiceSim',
  'npaFix77FaultLabV1', 'npaFix77ServiceSimV1',
  'runAudit', 'bindExplorer', 'bindAi', 'bindDevices', 'bindJobs', 'bindTraining',
  'bindCert', 'bindCommunity', 'bindOffline', '/api/chat', 'npaFix73SyncMetaV1'
]);

function getMissingGlobalAcademyExpansionMarkers(source) {
  const text = String(source ?? '');
  return REQUIRED_GLOBAL_ACADEMY_EXPANSION_MARKERS.filter(marker => !text.includes(marker));
}

function hasRequiredGlobalAcademyExpansionMarkers(source) {
  return getMissingGlobalAcademyExpansionMarkers(source).length === 0;
}

module.exports = {
  REQUIRED_GLOBAL_ACADEMY_EXPANSION_MARKERS,
  getMissingGlobalAcademyExpansionMarkers,
  hasRequiredGlobalAcademyExpansionMarkers
};
