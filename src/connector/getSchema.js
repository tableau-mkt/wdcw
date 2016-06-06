
exports = module.exports = function factory(connector, config) {
  return function callConnectorGetSchema(schemaCallback) {
    config.schema.call(connector)
      .then(schemaCallback, connector.promiseErrorWrapper)
      .catch(connector.promiseErrorWrapper);
  };
};
