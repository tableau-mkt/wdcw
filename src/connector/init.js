
exports = module.exports = function factory(connector, config, $, tableau) {

  /**
   * No-op promise callback.
   *
   * @returns {Promise}
   */
  function noop() {
    return Promise.resolve();
  }

  /**
   * Wraps implementor's initialization logic.
   *
   * @param {Function} initCallback
   */
  return function callConnectorInit(initCallback) {
    var data = this.getConnectionData(),
        setupCallback = config.hasOwnProperty('setup') ? config.setup : noop,
        $input,
        key;

    // Inform tableau of the authentication type, if provided.
    if (config.authType) {
      tableau.authType = config.authType;
    }

    // Auto-fill any inputs with known data values.
    if (tableau.phase === tableau.phaseEnum.interactivePhase) {
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          $input = $('*[name="' + key + '"]');
          if ($input.length) {
            if ($input.is(':checkbox')) {
              $input.attr('checked', !!data[key]).change();
            } else {
              $input.val(data[key]).change();
            }
          }
        }
      }

      // Pre-populate username and password if stored values exist.
      if (tableau.username) {
        $('input[name="username"]').val(tableau.username);
      }

      if (tableau.password) {
        $('input[type="password"]').val(tableau.password);
      }
    }

    // If the provided connector wrapper has a setup property, call it with the
    // current initialization phase.
    setupCallback.call(connector, tableau.phase)
      .then(initCallback, connector.promiseErrorHandler)
      .catch(connector.promiseErrorHandler);
  };

};
