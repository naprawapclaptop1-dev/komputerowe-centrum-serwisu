'use strict';

/**
 * Validates the public GET /api/support/updates JSON contract.
 * The database column is snake_case (last_seen_at), while the API deliberately
 * exposes a camelCase DTO property (lastSeenAt). Do not search for SQL names in
 * the browser bundle: that would couple two different layers of the contract.
 */
function verifySupportUpdatesPayload(payload) {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Array.isArray(payload.items) &&
    typeof payload.authenticated === 'boolean' &&
    typeof payload.enabled === 'boolean' &&
    Object.prototype.hasOwnProperty.call(payload, 'lastSeenAt') &&
    (payload.lastSeenAt === null || typeof payload.lastSeenAt === 'string') &&
    Number.isInteger(payload.unreadCount) &&
    payload.unreadCount >= 0
  );
}

module.exports = { verifySupportUpdatesPayload };
