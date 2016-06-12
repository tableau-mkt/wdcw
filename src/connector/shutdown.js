
exports = module.exports = function factory(connector, config) {

  /**
   * No-op promise callback.
   *
   * @returns {Promise}
   */
  function noop() {
    return Promise.resolve();
  }

  /**
   * Wraps implementor's shutdown logic.
   *
   * @param {Function} shutdownCallback
   */
  return function callConnectorShutdown(shutdownCallback) {
    var tdCallback = config.hasOwnProperty('teardown') ? config.teardown : noop;

    // If the provided connector wrapper has a teardown property, call it.
    tdCallback.call(connector, tableau.phase)
      .then(shutdownCallback, connector.promiseErrorWrapper)
      .catch(connector.promiseErrorWrapper);
  };

};
