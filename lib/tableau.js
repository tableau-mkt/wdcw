"use strict";

// Note: hacks. Not for production use. @todo Remove hacks.
var window = window || {addEventListener: function() {}},
    _tableau = _tableau || {},
    document = document || window,
    tableau = tableau || {},
    module = module || {};

module.exports = tableau;

(function() {

  var versionNumber = "2.0.0";
  window._tableau = {};

  if (typeof tableauVersionBootstrap === 'undefined') {
    initializeSimulator();
  } else {
    initializeNative();
  }

  // Check if something weird happened during bootstraping. If so, just define a tableau object to we don't
  // throw errors all over the place because tableau isn't defined
  if (typeof tableau === "undefined") {
    tableau = {}
  }

  tableau.versionNumber = versionNumber;

  tableau.phaseEnum = {
    interactivePhase: "interactive",
    authPhase: "auth",
    gatherDataPhase: "gatherData"
  };

  tableau.authPurposeEnum = {
    ephemeral: "ephemeral",
    enduring: "enduring"
  };

  tableau.authTypeEnum = {
    none: "none",
    basic: "basic",
    custom: "custom"
  };

  tableau.dataTypeEnum = {
    bool: "bool",
    date: "date",
    datetime: "datetime",
    float: "float",
    int: "int",
    string: "string"
  };

  tableau.columnRoleEnum = {
    dimension: "dimension",
    measure: "measure"
  };

  tableau.columnTypeEnum = {
    continuous: "continuous",
    discrete: "discrete"
  };

  tableau.aggTypeEnum = {
    sum: "sum",
    avg: "avg",
    median: "median",
    count: "count",
    countd: "count_dist"
  };

  tableau.geographicRoleEnum = {
    area_code: "area_code",
    cbsa_msa: "cbsa_msa",
    city: "city",
    congressional_district: "congressional_district",
    country_region: "country_region",
    county: "county",
    state_province: "state_province",
    zip_code_postcode: "zip_code_postcode"
  };

  tableau.unitsFormatEnum = {
    thousands: "thousands",
    millions: "millions",
    billions_english: "billions_english",
    billions_standard: "billions_standard"
  };

  tableau.numberFormatEnum = {
    number: "number",
    currency: "currency",
    scientific: "scientific",
    percentage: "percentage"
  };

  if (!tableau.phase) {
    tableau.phase = tableau.phaseEnum.interactivePhase;
  }

  // Assign the functions we always want to have available on the tableau object
  tableau.makeConnector = function() {
    var defaultImpls = {
      init: function(cb) { cb(); },
      shutdown: function(cb) { cb(); }
    };
    return defaultImpls;
  };

  tableau.registerConnector = function (wdc) {
    // do some error checking on the wdc
    var functionNames = ["init", "shutdown", "getSchema", "getData"];
    for (var ii = functionNames.length - 1; ii >= 0; ii--) {
      if (typeof(wdc[functionNames[ii]]) !== "function") {
        throw "The connector did not define the required function: " + functionNames[ii];
      }
    };
    window._wdc = wdc;
  };

  // Perform the initialization needed for both the simulator and native modes
  initializeShared();

  // Add global error handler. If there is a javascript error, this will report it to Tableau
  // so that it can be reported to the user.
  window.onerror = function (message, file, line, column, errorObj) {
    console.error(errorObj); // print error for debugging in the browser
    if (tableau._hasAlreadyThrownErrorSoDontThrowAgain) {
      return true;
    }

    var msg = message;
    if(errorObj) {
      msg += "   stack:" + errorObj.stack;
    } else {
      msg += "   file: " + file;
      msg += "   line: " + line;
    }

    if (tableau && tableau.abortWithError) {
      tableau.abortWithError(msg);
    } else {
      throw msg;
    }
    tableau._hasAlreadyThrownErrorSoDontThrowAgain = true;
    return true;
  }

  function initializeShared() {
    initializeDeprecatedFunctions();

    // Validates that the passed in object has all necessary properties and types
    // for the ColumnInfo object. Throws exceptions if the format is not as expected
    _tableau.validateColumnInfoObj = function(obj) {
      // TODO - validate all these inputs
    }

    // Validates that the passed in object has all necessary properties and types
    // for the TableInfo object. Throws exceptions if the format is not as expected
    _tableau.validateTableInfoObj = function(obj) {
      // TODO - validate all these inputs
    }

    // Defines the table object which is used for sending rows of data back to Tableau
    // The table is constructed with its tableInfo and an optional incremental extract value
    _tableau.Table = function(tableInfo, incrementValue) {
      _tableau.validateTableInfoObj(tableInfo);

      this.tableInfo = tableInfo;
      this.incrementValue = incrementValue || "";
      this.appendRows = function(data) {
        // Call back with the rows for this table
        _tableau._tableDataCallback(tableInfo.id, data);
      }
    };

    // Defines the table collection object which is passed to the getData function. Takes in an array
    // of tableInfo and incrementValue objects
    _tableau.TableCollection = function(tablesAndIncrementValues) {
      // Expected format is an array of objects specifying a tableInfo object and increment values
      if (!Array.isArray(tablesAndIncrementValues)) {
        throw "TableCollection must be initialized with an array";
      }

      // Initialize isIncrementalRefresh to false
      this.isIncrementalRefresh = false;

      // Build up an internal map of all the tables we have to gather data for
      var _tables = {};
      for(var i = 0; i < tablesAndIncrementValues.length; i++) {
        var tableInfo = tablesAndIncrementValues[i].tableInfo;
        var incrementValue = tablesAndIncrementValues[i].incrementValue;
        if (!!incrementValue) {
          // We have a non-empty increment value, we must be doing an incremental refresh
          this.isIncrementalRefresh = true;
        }

        // Create the table object and add it to our map
        var table = new _tableau.Table(tableInfo, incrementValue);
        _tables[table.tableInfo.id] = table;
      }

      // Returns true if the collection has a table with the given id. False otherwise
      this.hasTable = function(tableId) {
        return _tables.hasOwnProperty(tableId || "");
      }

      // Returns the Table object with id equal to tableId. null if table doesn't exist
      this.getTable = function(tableId) {
        if (!this.hasTable(tableId)) {
          return null;
        }

        return _tables[tableId];
      }

      // Returns all of the tables which this collection contains
      this.getTables = function() {
        var result = [];
        for(var id in _tables) {
          result.push(_tables[id]);
        }

        return result;
      }

      // Returns the ids of all the tables which this collection contains
      this.getTableIds = function() {
        var result = [];
        for(var id in _tables) {
          result.push(id);
        }

        return result;
      }
    }

    // Define some internal functions which will be called by the controlling application

    _tableau.triggerInitialization = function() {
      _wdc.init(_tableau._initCallback);
    };

    // Starts the schema gathering process
    _tableau.triggerSchemaGathering = function() {
      _wdc.getSchema(_tableau._schemaCallback);
    };

    // Starts the data gathering process
    _tableau.triggerDataGathering = function(tablesAndIncrementValues) {
      var tableCollection = new _tableau.TableCollection(tablesAndIncrementValues);

      // In this version, we will always only have 1 table to pass to the user, so simplify
      // the API and just send the single table which should be in the tableCollection. Future versions
      // may allow for intra-WDC joins with multiple tables.
      if (tableCollection.getTables().length != 1) {
        tableau.abortWithError("Unexpected number of tables specified. Expected 1, actual " + tableCollection.getTables().length.toString());
      } else {
        _wdc.getData(tableCollection.getTables()[0], _tableau._dataDoneCallback);
      }
    };

    _tableau.triggerShutdown = function() {
      _wdc.shutdown(_tableau._shutdownCallback);
    };
  }

  function initializeDeprecatedFunctions() {
    tableau.initCallback = function () {
      tableau.abortWithError("tableau.initCallback has been deprecated in version 2.0.0. Please use the callback function passed to init");
    };

    tableau.headersCallback = function (fieldNames, types) {
      tableau.abortWithError("tableau.headersCallback has been deprecated in version 2.0.0");
    };

    tableau.dataCallback = function (data, lastRecordToken, moreData) {
      tableau.abortWithError("tableau.dataCallback has been deprecated in version 2.0.0");
    };

    tableau.shutdownCallback = function () {
      tableau.abortWithError("tableau.shutdownCallback has been deprecated in version 2.0.0. Please use the callback function passed to shutdown");
    };
  }

  function initializeNative() {
    // Tableau version bootstrap is defined. Let's use it
    tableauVersionBootstrap.ReportVersionNumber(versionNumber);

    // Now that we've reported our version number, we've got to assemble up all the APIs which
    // desktop will have defined for us
    tableau.abortForAuth = function(msg) { window.WDCBridge_Api_abortForAuth.api(msg); }
    tableau.abortWithError = function(msg) { window.WDCBridge_Api_abortWithError.api(msg); }
    tableau.addCrossOriginException = function(destOriginList) { window.WDCBridge_Api_addCrossOriginException.api(destOriginList); }
    tableau.log = function(msg) { window.WDCBridge_Api_log.api(msg); }

    var submitCalled = false;
    tableau.submit = function() {
      if (submitCalled) {
        console.log("submit called more than once");
        return;
      }

      submitCalled = true;
      window.WDCBridge_Api_submit.api();
    };

    // Assign our internal callback functions to a known location
    var initCallbackCalled = false;
    _tableau._initCallback = function() {
      if (initCallbackCalled) {
        console.log("initCallback called more than once");
        return;
      }

      initCallbackCalled = true;
      window.WDCBridge_Api_initCallback.api();
    }

    var shutdownCallbackCalled = false;
    _tableau._shutdownCallback = function() {
      if (shutdownCallbackCalled) {
        console.log("shutdownCallback called more than once");
        return;
      }

      shutdownCallbackCalled = true;
      window.WDCBridge_Api_shutdownCallback.api();
    };

    _tableau._schemaCallback = function(schema) { window.WDCBridge_Api_schemaCallback.api(schema); }
    _tableau._tableDataCallback = function(tableName, data) { window.WDCBridge_Api_tableDataCallback.api(tableName, data); }
    _tableau._dataDoneCallback = function() { window.WDCBridge_Api_dataDoneCallback.api(); }
  }

  // Encapsulates work necessary to make the WDC and simulator work together
  function initializeSimulator() {
    var _sourceWindow;

    // tableau version bootstrap isn't defined. We are likely running in the simulator so init up our tableau object
    window.tableau = {
      connectionName: "",
      connectionData: "",
      password: "",
      username: "",
      incrementalExtractColumn: "",

      submit: function () {
        _sendMessage("submit");
      },

      log: function (msg) {
        _sendMessage("log", {"logMsg": msg});
      },

      abortWithError: function (errorMsg) {
        _sendMessage("abortWithError", {"errorMsg": errorMsg});
      },

      abortForAuth: function(msg) {
        _sendMessage("abortForAuth", {"msg": msg});
      },

      // Note: for Tableau internal use only
      addCrossOriginException: function(destOriginList) {
        // Don't bother passing this back to the simulator since there's nothing it can
        // do. Just call back to the WDC indicating that it worked
        console.log("Cross Origin Exception requested in the simulator. Pretending to work.")
        window.setTimeout(function() {
          _wdc.addCrossOriginExceptionCompleted(destOriginList);
        }, 0)
      }
    };

    // Assign the internal callback function to send appropriate messages
    _tableau._initCallback = function () {
      _sendMessage("initCallback");
    };

    _tableau._schemaCallback = function(schema) {
      _sendMessage("_schemaCallback", {"schema": schema});
    };

    _tableau._tableDataCallback = function(tableName, data) {
      _sendMessage("_tableDataCallback", { "tableName": tableName, "data": data });
    };

    _tableau._dataDoneCallback = function() {
      _sendMessage("_dataDoneCallback");
    };

    _tableau._shutdownCallback = function () {
      _sendMessage("shutdownCallback");
    };

    document.addEventListener("DOMContentLoaded", function() {
      // Attempt to notify the simulator window that the WDC has loaded
      if(window.parent !== window) {
        window.parent.postMessage(_buildMessagePayload('loaded'), '*');
      }
      if(window.opener) {
        try { // Wrap in try/catch for older versions of IE
          window.opener.postMessage(_buildMessagePayload('loaded'), '*');
        } catch(e) {
          console.warn('Some versions of IE may not accurately simulate the Web Data Connector.  Please retry on a Webkit based browser');
        }
      }
    });

    function _sendMessage(msgName, msgData) {
      var messagePayload = _buildMessagePayload(msgName, msgData, _packagePropertyValues());

      // Check first to see if we have a messageHandler defined to post the message to
      if (typeof window.webkit != 'undefined' &&
        typeof window.webkit.messageHandlers != 'undefined' &&
        typeof window.webkit.messageHandlers.wdcHandler != 'undefined') {

        window.webkit.messageHandlers.wdcHandler.postMessage(messagePayload);
      } else if (!_sourceWindow) {
        throw "Looks like the WDC is calling a tableau function before tableau.init() has been called."
      } else {
        _sourceWindow.postMessage(messagePayload, "*");
      }
    }

    function _buildMessagePayload(msgName, msgData, props) {
      var msgObj = {"msgName": msgName, "msgData": msgData, "props": props, "version": tableau.versionNumber };

      return JSON.stringify(msgObj);
    }

    function _packagePropertyValues() {
      var propValues = {"connectionName": tableau.connectionName,
        "connectionData": tableau.connectionData,
        "password": tableau.password,
        "username": tableau.username,
        "incrementalExtractColumn": tableau.incrementalExtractColumn,
        "versionNumber": tableau.versionNumber};
      return propValues;
    }

    function _applyPropertyValues(props) {
      if (props) {
        tableau.connectionName = props.connectionName;
        tableau.connectionData = props.connectionData;
        tableau.password = props.password;
        tableau.username = props.username;
        tableau.incrementalExtractColumn = props.incrementalExtractColumn;
      }
    }

    function getPayloadObj(payloadString) {
      var payload = null;
      try {
        payload = JSON.parse(payloadString);
      } catch(e) {
        return null;
      }

      return payload;
    }

    function _receiveMessage(evt) {
      var wdc = window._wdc;
      if (!wdc) {
        throw "No WDC registered. Did you forget to call tableau.registerConnector?";
      }

      var payloadObj = getPayloadObj(evt.data);
      if(!payloadObj) return; // This message is not needed for WDC

      if (!_sourceWindow) {
        _sourceWindow = evt.source
      }

      var msgData = payloadObj.msgData;
      _applyPropertyValues(payloadObj.props);

      switch(payloadObj.msgName) {
        case "init":
          tableau.phase = msgData.phase;
          _tableau.triggerInitialization();
          break;
        case "shutdown":
          _tableau.triggerShutdown();
          break;
        case "getSchema":
          _tableau.triggerSchemaGathering();
          break;
        case "getData":
          _tableau.triggerDataGathering(msgData.tablesAndIncrementValues);
          break;
      }
    };
    window.addEventListener('message', _receiveMessage, false);
  }
})();
