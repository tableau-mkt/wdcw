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
var $ = require('jquery'),
    Promise = require('bluebird'),
    tableau = require('../lib/tableau.js'),
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
