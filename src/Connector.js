/**
 * @copyright Copyright (c) 2015, All Rights Reserved.
 * @licence MIT
 * @author Eric Peterson
 *
 * @file Entry Point to Web Data Connector Wrapper
 *       Replace it with your own code.
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
