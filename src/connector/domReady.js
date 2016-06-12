
exports = module.exports = function factory(connector, config, tableau, $) {

  /**
   * Method to be fired on document ready. Handles most non-init UI bindings.
   */
  return function connectorDocumentReady() {
    /**
     * Connection form submit handler; handles tableau.submit and some data
     * serialization tasks.
     *
     * @param e - the jQuery event.
     */
    $('form').submit(function connectorFormSubmitHandler(e) {
      var $fields = $('input, select, textarea')
            .not('[type="password"],[type="submit"],[name="username"]'),
          $password = $('input[type="password"]'),
          $username = $('input[name="username"]'),
          data = {};

      e.preventDefault();

      /**
       * Format connection data according to assumptions.
       */
      $fields.map(function getValuesFromFields() {
        var $this = $(this);
        name = $this.attr('name');
        if (name) {
          if ($this.is(':checkbox')) {
            data[name] = $this.is(':checked');
          } else {
            data[name] = $this.val();
          }
        }

        return this;
      });

      // If nothing was entered, there was a problem. Abort.
      // @todo Automatically add validation handling.
      if ($fields.length && data === {}) {
        return false;
      }

      // Set connection data and connection name.
      connector.setConnectionData(data);
      tableau.connectionName = config.name;

      // If there was a password, set the password.
      if ($password.length) {
        connector.setPassword($password.val());
      }

      // If there was a username, set the username.
      if ($username.length) {
        connector.setUsername($username.val());
      }

      // Initiate the data retrieval process.
      tableau.submit();
    });
  };

};
