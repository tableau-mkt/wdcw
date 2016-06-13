# Web Data Connector Wrapper

[![Build Status](https://travis-ci.org/tableau-mkt/wdcw.svg?branch=master)](https://travis-ci.org/tableau-mkt/wdcw)

This JavaScript library aims to simplify the way you write and instantiate
Tableau web data connectors.

Still under active development! Use at your own risk.

## Installation & Usage

If you don't use bower, you can get started by downloading here:

* [Version 2.0.0-beta.1, minimized, 6K](https://rawgit.com/tableau-mkt/wdcw/2.0.0-beta.1/dist/wdcw.min.js)
* [Version 2.0.0-beta.1, un-minimized, 23K](https://rawgit.com/tableau-mkt/wdcw/2.0.0-beta.1/dist/wdcw.js)

However, we do highly recommend downloading and installing this library via
[bower](https://bower.io/)!

```sh
bower install wdcw --save
```

In any web page:
```html
// Requires ES6 Promises (either a shim or a library like bluebird is fine),
// As well as jQuery and, naturally, the Tableau WDC API (v2.0.0+)
<script src="/bower_components/es6-promise/es6-promise.min.js"></script>
<script src="/bower_components/jquery/dist/jquery.min.js"></script>
<script src="https://connectors.tableau.com/libs/tableauwdc-2.0.0-beta.js"></script>
<script src="/bower_components/wdcw/dist/wdcw.min.js)"></script>
<script>
  // Instantiate your WDC and supply custom WDC logic.
  var wrapper = wdcw({
    name: 'My Web Data Connector',
    schema: function () {
      return Promise.resolve([{
        // Your schema definition here.
      }]);
    }
  });
</script>
```

Full [Web Data Connecter Wrapper API documentation](https://tableau-mkt.github.io/wdcw/)
is also available.

## Enhancements and differences vs. the native WDC API

### Instantiation
With the Tableau API...
```javascript
// Call global connector factory.
var connector = tableau.makeConnector();

// Implement connector methods.
connector.getSchema = function (schemaCallback) {/*...*/};

// Set connector name on global object and register the connector.
tableau.connectionName = 'My Web Data Connector';
tableau.registerConnector(connector);
```

With the WDC wrapper...
```javascript
// Call the global wdcw function with your WDC name/logic as configuration.
var wrapper = wdcw({
  name: 'My Web Data Connector',
  schema: function () {/*...*/},
});
```

### Connection data / configuration handling
With the Tableau API...
```html
<form>
  <input type="text" name="SomeConfig" />
  <select name="SelectableConfig">
    <option value="Opt1">Option 1</option>
    <option value="Opt2">Option 2</option>
  </select>
  <input type="submit" value="Connect" />
</form>

<script>
var connector = tableau.makeConnector();

connector.init = function(initCallback) {
  // Attach a form submit handler during the interactive phase.
  if (tableau.phase === tableau.phaseEnum.interactivePhase) {
    $('form').submit(function connectorFormSubmitHandler(event) {
      var connectionData = {};

      // Prevent the form from actually being submitted/processed.
      event.preventDefault();

      // Pull configuration values from the DOM.
      connectionData.SomeConfig = $('input[name="SomeConfig"]').val();
      connectionData.SelectableConfig = $('select[name="SelectableConfig"]').val();

      // Serialize the config data as JSON
      tableau.connectionData = JSON.stringify(connectionData);
      tableau.submit();
    }
  }

  initCallback();
};

connector.getData = function(table, dataDoneCallback) {
  // Unserialize the config data from Tableau.
  var config = JSON.parse(tableau.connectionData);

  // Use the config in your data getter
  $.getJSON('/table/' + table.tableInfo.id + '.json?config=' + config.SomeConfig, function(data) {
    table.appendRows(data);
    dataDoneCallback();
  });
};
</script>
```

With the WDC Wrapper...
```html
<form>
  <input type="text" name="SomeConfiguration" />
  <select name="SelectableConfig">
    <option value="Opt1">Option 1</option>
    <option value="Opt2">Option 2</option>
  </select>
  <input type="submit" value="Connect" />
</form>

<script>
var wrapper = wdcw({name: 'My Web Data Connector'});

// The wrapper automatically retrieves and stores form inputs, keyed on their
// "name" attribute. You can retrieve them via the getConnectionData method.
wrapper.registerData('someTableId', function () {
  var connector = this,
      someConfig = connector.getConnectionData('SomeConfig');

  return $.when($.getJSON('/table/someTableId.json?config=' + someConfig));
});
</script>
```

### Authentication handling
With the Tableau API...
```javascript
var connector = tableau.makeConnector();

connector.init = function (doneCallback) {
  // Register the authentication type with Tableau.
  tableau.authType = 'basic';

  if (tableau.phase === tableau.phaseEnum.interactivePhase) {
    // Listen for form submission, grab values, and register them with Tableau.
    $('form').submit(function() {
      tableau.username = $('input[name="username"]').val();
      tableau.password = $('input[type="password"]').val();
      tableau.submit();
    });
  }
}
```

With the WDC wrapper...
```javascript
// The WDC Wrapper automatically stores inputs named "username" or "password" on
// their respective native tableau.username and tableau.password properties.
wdcw({
  name: 'My Web Data Connector',
  authType: 'basic'
});
```

### Multi-table handling
With the Tableau API...
```javascript
connector.getData = function (table, dataDoneCallback) {
  // Branch logic based on the table ID
  switch (table.tableInfo.id) {
    case: 'tableOne':
      // Manually handle asynchronicity
      $.getJSON('/path/to/tableOne/resource.json', function (data) {
        table.appendRows(data);
        dataDoneCallback();
      });
      break;

    case: 'tableTwo':
      $.getJSON('/path/to/tableTwo/resource.json', function (data) {
        table.appendRows(data);
        dataDoneCallback();
      }
      break;
  }
};
```

With the WDC wrapper...
```javascript
wrapper = wdcw();

// Specify getData methods for each table, based on tableId.
wrapper.registerData('tableOne', function () {
  // WDCW table data getters expect promises to be returned.
  return $.when($.getJSON('/path/to/tableOne/resource.json'));
});

wrapper.registerData('tableTwo', function () {
  return return $.when($.getJSON('/path/to/tableTwo/resource.json'));
});
```

### Data processing / filtering / transformation
With the Tableau API...
```javascript
// Helper function for returning API data by page.
function getDataForPage(pageNumber, successCallback) {
  return $.getJSON('/path/to/resource.json?page=' + pageNumber), successCallback);
};

connector.getData = function (table, dataDoneCallback) {
  var combinedDataSink = [],
      deferred = [];

  // Loop through 5 pages and concatenate API data to a data sink.
  for (var i = 0; i < 5; i++) {
    deferred.push(getDataForPage(i, function (data) {
      // Potentially, some filtering or transformation logic would live here.
      combinedDataSink = combinedDataSink.concat(data);
    }));
  }

  $.when(deferred).done(function () {
    var transformedData = combinedData;
    // Additional filtering or transformation logic could live here.
    table.appendRows(transformedData);
    dataDoneCallback();
  });
};
```

With the WDC Wrapper...
```javascript
// Basically the same helper function for returning API data by page.
function getDataForPage(pageNumber) {
  return $.when($.getJSON('/path/to/resource.json?page=' + pageNumber));
};

var wrapper = wdcw();

wrapper.registerData('someTableId', function () {
  return Promise.all([0, 1, 2, 3, 4, 5].map(getDataForPage);
});

// Provide a postProcess method that encapsulates all processing logic.
wrapper.registerPostProcess('someTableId', function (data) {
  var transformedData = data;
  // All transformation logic goes here.
  return Promise.resolve(transformedData);
});
```

### Dependent table data
With the Tableau API...
```javascript
// Globally keep track of whether or not the first table is done loading data.
var tableDeferred;

connector.getSchema = function (schemaCallback) {
  schemaCallback([{
    id: 'independentTable',
    columns: [/*...*/]
  }, {
    id: 'dependentTable',
    columns: [/*...*/]
  }]);
};

connector.getData = function (table, dataDoneCallback) {
  switch (table.tableInfo.id) {
    case: 'independentTable':
      tableDeferred = $.when($.getJSON('/path/to/independentTable.json'));
      tableDeferred.then(function (data) {
        table.appendRows(data);
        dataDoneCallback();
      });
      break;

    case: 'dependentTable':
      // Only proceed once the global tableDeferred var indicates completion.
      tableDeferred.done(function (independentTableData) {
        var dependentIds = [];

        // Extract some sub-identifiers from each row.
        independentTableData.forEach(function (tableRow) {
          dependentIds = dependentIds.concat(tableRow.someIds);
        });

        // Query some endpoint using the extracted sub-identifiers as a filter.
        $.getJSON('/path/to/dependentTable.json?whereIn=' + dependentIds.join(','), function (data) {
          table.appendRows(data);
          dataDoneCallback();
        }
      break;
  }
};
```

With the WDC Wrapper...
```javascript
var wrapper = wdcw();

wrapper.registerSchema(function () {
  return Promise.resolve([{
    id: 'independentTable',
    columns: [/*...*/]
  }, {
    id: 'dependentTable',
    columns: [/*...*/],
    // A magic WDC wrapper-specific schema property which causes the execution
    // of this table's getData method to occur after its dependencies.
    dependsOn: ['independentTable'] // WDC Wrapper magic property.
  }]);
});

wrapper.registerData('independentTable', function () {
  return $.when($.getJSON('/path/to/independentTable.json'));
});

// This method won't be called until after the independentTable method resolves.
wrapper.registerData('dependentTable', function (lastToken, independentTableData) {
  var dependentIds = [];

  // Here [0] represents the first dependency. If this table depended on more
  // than one table, additional dependencies could be accessed by incrementing.
  independentTableData[0].forEach(function (tableRow) {
    dependentIds = dependentIds.concat(tableRow.someIds);
  });

  return $.when($.getJSON('/path/to/dependentTable.json?whereIn=' + dependentIds.join(',')));
});
```

<!---
### Node.js ###

```js
var wdcw = require('./src/wdcw.js');
var example = new wdcw();

example.hello();
```
-->