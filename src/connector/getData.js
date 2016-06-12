
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
          dependencies.map(connector.getDataPromise)
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
        return connector.setDataPromise(
          tableId,
          config.tables[tableId].getData.call(
            connector,
            table.incrementValue,
            dependentResults,
            table.appendRows
          )
        );
      }, connector.promiseErrorWrapper)
      .then(postProcess, connector.promiseErrorWrapper)
      .then(function (results) {
        table.appendRows(results || []);
        doneCallback();
      }, connector.promiseErrorWrapper)
      .catch(connector.promiseErrorWrapper);
  };
};
