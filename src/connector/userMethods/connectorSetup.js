
/**
 * Should return a promise that resolves once initialization / setup logic is
 * complete.
 *
 * @callback wdcw~connectorSetup
 * @this Connector
 *
 * @param {string} phase
 *   The phase of the Web Data Connector lifecycle that the connector is currently
 *   in. One of: auth, interactive, or gatherData.
 *
 * @return {Promise}
 *
 * @example <caption>Basic auth phase example</caption>
 * function setupCallback(phase) {
 *   // If we are in the auth phase we only want to show the UI needed for auth
 *   if (phase === 'auth') {
 *     $('input, textarea, select').not('.auth-field').css('display', 'none');
 *   }
 *
 *   return Promise.resolve();
 * }
 *
 */
