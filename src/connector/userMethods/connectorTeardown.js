
/**
 * Should return a promise that resolves once shutdown / end-of-request logic is
 * complete.
 *
 * @callback wdcw~connectorTeardown
 * @this Connector
 * @return {Promise}
 *
 * @example
 * function teardownCallback() {
 *   // Custom shutdown function here.
 *   return Promise.resolve();
 * }
 *
 */
