

exports = module.exports = function factory(connector, config) {
  return function callConnectorShutdown(shutdownCallback) {
    // If the provided connector wrapper has a teardown property, call it.
    if (config.hasOwnProperty('teardown')) {
      config.teardown.call(connector, function shutDownComplete() {
        shutdownCallback();
      });
    } else {
      shutdownCallback();
    }
  };
};
