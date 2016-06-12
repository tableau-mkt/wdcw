
exports = module.exports = function factory(connector, config) {

  /**
   * Wraps an implementor's schema retrieval callback, handling any errors.
   *
   * @param {wdcw~schemaRetrieval} schemaCallback
   */
  return function callConnectorGetSchema(schemaCallback) {
    config.schema.call(connector)
      .then(schemaCallback, connector.promiseErrorHandler)
      .catch(connector.promiseErrorHandler);
  };

};
