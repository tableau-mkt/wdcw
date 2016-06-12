
exports = module.exports = function factory(connector, config, $, tableau) {

  /**
   * Wraps implementor's initialization logic.
   *
   * @param {Function} initCallback
   */
  return function callConnectorInit(initCallback) {
    var data = this.getConnectionData(),
        $input,
        key;

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
    if (config.hasOwnProperty('setup')) {
      /**
       * Call the implementor's setup logic, then register to Tableau we're done.
       */
      config.setup.call(this, tableau.phase, function setUpComplete() {
        initCallback();
      });
    } else {
      initCallback();
    }
  };

};
