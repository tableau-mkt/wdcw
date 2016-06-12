
exports = module.exports = function factory(connector, config) {

  /**
   * Wraps implementor's shutdown logic.
   *
   * @param {Function} shutdownCallback
   */
  return function callConnectorShutdown(shutdownCallback) {
    // If the provided connector wrapper has a teardown property, call it.
    if (config.hasOwnProperty('teardown')) {
      /**
       * Call the implementor's shutdown function, then tell Tableau we'red done.
       */
      config.teardown.call(connector, function shutDownComplete() {
        shutdownCallback();
      });
    } else {
      shutdownCallback();
    }
  };

};
