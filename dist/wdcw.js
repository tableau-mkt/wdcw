/*! wdcw.2.0.0-beta.1.6:14:58 2016-06-12 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wdcw = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @copyright Copyright (c) 2015, All Rights Reserved.
 * @licence MIT
 * @author Eric Peterson
 *
 * @file Handy extension to native Web Data Connector objects.
 */

// jscs:disable disallowMultipleVarDecl,safeContextKeyword

exports = module.exports = Connector;

// Scoping insanity.
var _tableau,
    _this;

/**
 * A native Tableau web data connector object, decorated with several utility
 * methods that prevent the need to reach out to the global tableau object.
 *
 * @class
 */
function Connector(tableau) {
  _tableau = tableau;
  _this = this;

  // Turns out this doesn't do much anyway and isn't really necessary...
  // tableau.makeConnector();

  // Create a space where we can store data getter promises.
  this.semaphore = {};
}

/**
 * Registers a promise with the connector for a particular table's data. This
 * promise can be read from and chained via the waitForData method.
 *
 * @param {string} tableId - The ID of the table for which the given promise is
 *   being registered.
 *
 * @param {Promise} promise - The promise returned by the data retrieval callback
 *   associated with this table.
 *
 * @returns {Promise}
 * @see wdcw~dataRetrieval
 */
Connector.prototype.registerDataRetrieval = function regRet(tableId, promise) {
  _this.semaphore[tableId] = promise;
  return promise;
};

/**
 * Returns a promise that resolves when data collection for the given table
 * completes. The promise will resolve with the full set of data returned for
 * the given table.
 *
 * @param {string} tableId - The ID of the table whose data you are waiting for.
 *
 * @returns {Promise}
 * @throws An error if no data retrieval promise has been registered for the
 *   given table.
 *
 * @see {@link Connector#registerDataRetrieval}
 *
 * @example
 * connector.waitForData('independentTable')
 *   .then(function (independentTableData) {
 *     // Do things based on the independentTable's data here.
 *   });
 */
Connector.prototype.waitForData = function waitForData(tableId) {
  if (!_this.semaphore.hasOwnProperty(tableId)) {
    throw 'Could not find data gathering semaphore for table: ' + tableId;
  }

  return _this.semaphore[tableId];
};

/**
 * Extension of the web data connector API that handles complex connection
 * data getting for the implementor.
 *
 * @param {?string} key - An optional key to return an individual connection
 *   detail. If no key is provided, all connection details will be returned.
 *
 * @returns {Object|string}
 *   An object representing connection data. Keys are assumed to be form input
 *   names; values are assumed to be form input values. If a key was provided
 *   as, an individual connection detail will be returned as a string.
 *
 * @see connector.setConnectionData
 */
Connector.prototype.getConnectionData = function getConnectionData(key) {
  var json = _tableau.connectionData ? JSON.parse(_tableau.connectionData) : {};

  if (key) {
    return json.hasOwnProperty(key) ? json[key] : '';
  } else {
    return json;
  }
};

/**
 * Extension of the web data connector API that handles complex connection
 * data setting for the implementor.
 *
 * @param {Object} data - The data that's intended to be set for this
 *   connection. Keys are assumed to be form input names; values are assumed to
 *   be form input values.
 *
 * @returns {Object}
 *   Returns the data that was set.
 *
 * @see connector.getConnectionData
 */
Connector.prototype.setConnectionData = function setConnectionData(data) {
  _tableau.connectionData = JSON.stringify(data);
  return data;
};

/**
 * Extension of the web data connector API that gets the connection username.
 *
 * @returns {string}
 *   The username associated with this connection.
 */
Connector.getUsername = function getUsername() {
  return _tableau.username;
};

/**
 * Extension of the web data connector API that sets the connection username.
 *
 * @param {string} username
 *   The username to be associated with this connection.
 *
 * @returns {string}
 *   The username now associated with this connection.
 */
Connector.prototype.setUsername = function setUsername(username) {
  _tableau.username = username;
  return _tableau.username;
};

/**
 * Extension of the web data connector API that gets the connection password.
 *
 * @returns {string}
 *   The password associated with this connection.
 */
Connector.prototype.getPassword = function getPassword() {
  return _tableau.password;
};

/**
 * Extension of the web data connector API that sets the connection password.
 *
 * @param {string} password - The password or other sensitive connection
 *   information to be associated with this connection. The value is encrypted
 *   and stored by tableau.
 *
 * @returns {string}
 *   The password now associated with this connection.
 */
Connector.prototype.setPassword = function setPassword(password) {
  _tableau.password = password;
  return _tableau.password;
};

/**
 * A generic error handler that can be used by implementors for simplicity.
 *
 * @param {Object} jqXHR
 * @param {string} textStatus
 * @param {string} errThrown
 */
Connector.prototype.ajaxErrorHandler = function (jqXHR, textStatus, errThrown) {
  var message = 'There was a problem retrieving data: "' +
      textStatus + '" with error thrown: "' +
      errThrown + '"';

  _tableau.abortWithError(message);
};

/**
 * Generic error handler that can be passed to any Promise error handler.
 *
 * @param e
 */
Connector.prototype.promiseErrorHandler = function tableauErrorHandler(e) {
  if (typeof e === 'string') {
    _tableau.abortWithError(e);
  } else {
    _tableau.abortWithError(JSON.stringify(e));
  }
};

/**
 * Helper method used to determine whether or not authentication is being
 * attempted for an ad-hoc query (Desktop) or in an automated context (Server).
 * Useful when dealing with restrictive oauth providers.
 *
 * @returns {string}
 *   The authentication purpose. One of:
 *   - ephemeral: when the user is authenticating with Tableau Desktop.
 *   - enduring: when authentication is being performed on Server.
 */
Connector.prototype.getAuthPurpose = function getAuthPurpose() {
  return _tableau.authPurpose;
};

},{}],2:[function(require,module,exports){

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

},{}],3:[function(require,module,exports){

exports = module.exports = function (connector, config, tableau, Promise) {
  /**
   * Wraps implementor's getData and post-process callbacks.
   *
   * @param table
   * @param {Function} doneCallback
   */
  return function callConnectorGetData(table, doneCallback) {
    var tableId = table.tableInfo.id,
        dependencies = table.tableInfo.dependsOn,
        postProcess,
        dependentPromise;

    // Make sure we've got a data callback to call.
    if (
      !config.tables.hasOwnProperty(tableId) ||
      typeof config.tables[tableId].getData !== 'function'
    ) {
      tableau.abortWithError('Data callback missing for table: ' + tableId);
      return doneCallback();
    }

    // If the implementor provides a post-process callback, give it to them!
    if (
      config.tables[tableId].hasOwnProperty('postProcess') &&
      typeof config.tables[tableId].postProcess === 'function'
    ) {
      postProcess = config.tables[tableId].postProcess;
    }

    // Otherwise, just pass the data through.
    else {
      /**
       * Default post-processing function; passes data straight through.
       *
       * @param data
       * @returns {Promise}
       */
      postProcess = function passThru(data) {return Promise.resolve(data);};
    }

    // If this table depends on others, chain it on their completion.
    if (dependencies) {
      try {
        dependentPromise = Promise.all(
          dependencies.map(connector.waitForData)
        );
      }
      catch (e) {
        tableau.abortWithError('Attempted to gather dependent table data ' +
          'before its requisites. Make sure your table definitions are in ' +
          'order.');
        tableau.abortWithError(e);
        return doneCallback();
      }
    }

    // Otherwise, if this table has no dependencies, proceed immediately.
    else {
      dependentPromise = Promise.resolve();
    }

    dependentPromise
      .then(function (dependentResults) {
        return connector.registerDataRetrieval(
          tableId,
          config.tables[tableId].getData.call(
            connector,
            table.incrementValue,
            dependentResults,
            table.appendRows
          )
        );
      }, connector.promiseErrorHandler)
      .then(postProcess, connector.promiseErrorHandler)
      .then(function (results) {
        table.appendRows(results || []);
        doneCallback();
      }, connector.promiseErrorHandler)
      .catch(connector.promiseErrorHandler);
  };
};

},{}],4:[function(require,module,exports){

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

},{}],5:[function(require,module,exports){

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

},{}],6:[function(require,module,exports){

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
      .then(shutdownCallback, connector.promiseErrorHandler)
      .catch(connector.promiseErrorHandler);
  };

};

},{}],"wdcw":[function(require,module,exports){
(function (global){
/**
 * @copyright Copyright (c) 2015, All Rights Reserved.
 * @licence MIT
 * @author Eric Peterson
 *
 * @file Primary entry point for instantiating wrapped Web Data Connectors.
 */

// jscs:disable disallowMultipleVarDecl,safeContextKeyword

exports = module.exports = wdcw;

// Bring in requisites.
var $ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null),
    Promise = (typeof window !== "undefined" ? window['Promise'] : typeof global !== "undefined" ? global['Promise'] : null),
    tableau = (typeof window !== "undefined" ? window['tableau'] : typeof global !== "undefined" ? global['tableau'] : null),
    Connector = require('./Connector');

/**
 * Constructs a new web data connector wrapper object, given a WDC wrapper
 * configuration object.
 *
 * @param {wdcw~config} config
 *   Declarative configuration representing your connector.
 *   @see wdcw~config
 *
 * @constructor
 *
 * @example <caption>Declaratively instantiate a WDC Wrapper.</caption>
 * var wrapper = new wdcw({
 *   name: 'My Web Data Connector',
 *   schema: function () {
 *     return Promise.all([
 *       $.getJSON('/schema/table1.json'),
 *       $.getJSON('/schema/table2.json')
 *     ]);
 *   }
 * });
 * @example <caption>Instantiate a wrapper, then chain the definition.</caption>
 * var wrapper = new wdcw({name: 'My Web Data Connector'});
 * wrapper.registerSchema(function() {
 *   return Promise.all([
 *     $.getJSON('/schema/table1.json'),
 *     $.getJSON('/schema/table2.json')
 *   ]);
 * });
 */
function wdcw(config) {
  var connector = new Connector(tableau);

  // Allow instantiation of the wrapper without any configs.
  config = config || { tables: {} };

  // Allow our prototype methods to add/remove info from the main config object.
  this.config = config;

  /**
   * Simplifies the connector.init method in several ways:
   * - Makes it so the implementor doesn't have to know to call the
   *   tableau.initCallback method.
   * - Passes the current phase directly to the initializer so that it doesn't
   *   have to know to pull it from the global tableau object.
   * - Handles population of saved data on behalf of the implementor during the
   *   interactive phase.
   * - Unifies the callback-based API of all connector wrapper methods, and
   *   simplifies asynchronous set-up tasks in the process.
   *
   * @param {Function} initCallback
   */
  connector.init = require('./connector/init')(connector, config, $, tableau);

  /**
   * Simplifies the connector.shutDown method in a couple of ways:
   * - Makes it so that the implementor doesn't have to know to call the
   *   tableau.shutdownCallback method.
   * - Mirrors the wrapped init callback for naming simplicity (setup/teardown).
   * - Unifies the callback-based API of all connector wrapper methods, and
   *   simplifies asynchronous tear-down tasks in the process.
   */
  connector.shutdown = require('./connector/shutdown')(connector, config);

  /**
   * Simplifies the connector.getSchema method in a few ways:
   * - Enables simpler asynchronous handling, expecting a promise in return.
   *
   * @param {Function} schemaCallback
   */
  connector.getSchema = require('./connector/getSchema')(connector, config);

  /**
   * Simplifies (and limits) the connector.getTableData method in a couple ways:
   * - Enables simpler asynchronous handling by providing a callback.
   * - Simplifies chunked/paged data handling by limiting the arguments that the
   *   implementor needs to be aware of to just 1) the data retrieved and 2) if
   *   paging functionality is needed, a token for the last record.
   * - Makes it so the implementor doesn't have to know to call the
   *   tableau.dataCallback method.
   *
   * @param {Object} table
   * @param {Function} doneCallback
   */
  connector.getData = require('./connector/getData')(
    connector,
    config,
    tableau,
    Promise
  );

  /**
   * Register a submit handler and take care of the following on behalf of the
   * implementor:
   * - Parse and store form data in tableau's connection data property.
   * - Provide the connection name.
   * - Trigger the data collection phase of the web data connector.
   */
  $(require('./connector/domReady')(connector, config, tableau, $));

  // Register our wrapped connector with Tableau.
  tableau.registerConnector(connector);

  /**
   * Return the wrapped, native connector. Useful for debugging.
   *
   * @return {Connector}
   *   The wrapped, native web data connector.
   */
  this.getConnector = function getConnector() {
    return connector;
  };
}

/**
 * Register custom initialization logic on the connector.
 *
 * @param {wdcw~connectorSetup} setupFunction - A function that encapsulates all
 *   setup logic for your connector. @see wdcw~connectorSetup
 *
 * @returns {wdcw}
 *   Returns itself (useful for chaining).
 */
wdcw.prototype.registerSetup = function (setupFunction) {
  // Set the setup/initialization method and return ourselves for chaining.
  this.config.setup = setupFunction;
  return this;
};

/**
 * Register custom shutdown logic on the connector.
 *
 * @param {wdcw~connectorTeardown} shutdownFunction - A function that encapsulates
 *   all teardown logic for your connector. @see wdcw~connectorTeardown
 *
 * @returns {wdcw}
 *   Returns itself (useful for chaining).
 */
wdcw.prototype.registerTeardown = function (shutdownFunction) {
  // Set the teardown/shutdown method and return ourselves for chaining.
  this.config.teardown = shutdownFunction;
  return this;
};

/**
 * Register custom schema retrieval logic on the connector.
 *
 * @param {wdcw~schemaRetrieval} schemaRetrievalFunction - A function that
 *   encapsulates schema retrieval logic for your connector.
 *   @see wdcw~schemaRetrieval
 *
 * @returns {wdcw}
 *   Returns itself (useful for chaining).
 */
wdcw.prototype.registerSchema = function (schemaRetrievalFunction) {
  // Set the schema retrieval method and return ourselves for chaining.
  this.config.schema = schemaRetrievalFunction;
  return this;
};

/**
 * Register custom data retrieval logic for a particular table on the connector.
 *
 * @param {string} tableId - The table ID (as returned in your schemaFunction)
 *   associated with the data you are returning in your dataFunction.
 *
 * @param {wdcw~dataRetrieval} dataRetrievalFunction - A function that
 *   encapsulates data retrieval logic for a particular table provided by your
 *   connector. @see wdcw~dataRetrieval
 *
 * @returns {wdcw}
 *   Returns itself (useful for chaining).
 */
wdcw.prototype.registerData = function (tableId, dataRetrievalFunction) {
  // If there's not yet a space for this table, create it.
  if (!this.config.tables.hasOwnProperty(tableId)) {
    this.config.tables[tableId] = {};
  }

  // Set the data getter method for a table and return ourselves for chaining.
  this.config.tables[tableId].getData = dataRetrievalFunction;
  return this;
};

/**
 * Register custom post-processing logic for a particular table on the connector.
 *
 * @param {string} tableId - The table ID (as returned in your schemaFunction)
 *   associated with the data you are transforming or filtering in your
 *   postProcessFunction.
 *
 * @param {wdcw~postProcess} postProcessFunction - A function that encapsulates
 *   data post-processing logic for a particular table provided by your
 *   connector. @see wdcw~postProcess
 *
 * @returns {wdcw}
 *   Returns itself (useful for chaining).
 */
wdcw.prototype.registerPostProcess = function (tableId, postProcessFunction) {
  // If there's not yet a space for this table, create it.
  if (!this.config.tables.hasOwnProperty(tableId)) {
    this.config.tables[tableId] = {};
  }

  // Set the post processor for a table and return ourselves for chaining.
  this.config.tables[tableId].postProcess = postProcessFunction;
  return this;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./Connector":1,"./connector/domReady":2,"./connector/getData":3,"./connector/getSchema":4,"./connector/init":5,"./connector/shutdown":6}]},{},["wdcw"])("wdcw")
});