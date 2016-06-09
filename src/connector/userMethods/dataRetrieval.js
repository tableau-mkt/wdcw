
/**
 * Should always return a promise which resolves when data retrieval for the
 * given table is complete. The data passed back when resolved can vary
 * depending on your use-case, see below.
 *
 * @typeDef {Function} dataRetrieval
 * @this Connector
 *
 * @param {String|null} lastRecordToken
 *   If this table supports incremental refreshes, the first argument will be
 *   the last value/record of this table's incrementColumnId column. If your
 *   table does not support incremental refreshes or if the execution context is
 *   not an incremental refresh, this parameter will be null.
 *
 * @param {Array<Array<any>>|null} tableDependencyData
 *   If you specified an array of tables that this table depends on (via the
 *   dependsOn key in this table's schema definition), then this argument will
 *   be populated with table data for each dependency. The top layer of arrays
 *   will respect the order in which you specified the dependencies in your
 *   schema, underneath which the actual table data resides. If your table does
 *   not depend on the table data of other tables, this parameter will be null.
 *
 * @param {Function} appendRows
 *   In some cases (for example, if you are dealing with a very large number of
 *   records), for performance or resource usage reasons, you may wish to bypass
 *   the WDC Wrapper's data handling and write data directly to Tableau. If this
 *   fits your use-case, you may use this function to do so; it is identical to
 *   the Table.appendRows method in the native Tableau WDC API's getData method.
 *   Note that if you use this, you'll want to resolve this method with no data,
 *   otherwise your data may be duplicated.
 *
 * @return {Promise<Array<Array<any>>>|null}
 *   In most cases, this promise should resolve with data in the format exactly
 *   as expected by Tableau in the Table.appendRows method of the native Tableau
 *   WDC API. Before being written to Tableau, data resolved here will be passed
 *   directly to the post processing method you have registered with this table.
 *   If you made use of the appendRows parameter to write data to Tableau
 *   directly, you should return NULL here so that the WDC Wrapper does not do
 *   any additional data writing to Tableau.
 *
 * @example <caption>Simple data retrieval</caption>
 * function dataCallbackForSomeTable() {
 *   var connector = this,
 *       filterVal = connector.getConnectionData().filter;
 *
 *   return $.when($.getJSON('/path/to/resource.json?filter=' + filterVal));
 * }
 *
 * @example <caption>Incremental refresh</caption>
 * function dataCallbackForSomeTable(lastRecordToken) {
 *   return $.when($.getJSON('/path/to/resource.json?afterRecord=' + lastRecordToken));
 * }
 *
 * @example <caption>Data retrieval for a table that depends on another</caption>
 * function dataCallbackForSomeTable(lastRecordToken, tableDependencyData) {
 *   var keysFromFirstTable = [];
 *
 *   // Aggregate some foreign key values from the dependency.
 *   tableDependencyData[0].forEach(function (row) {
 *     keysFromFirstTable = keysFromFirstTable.concat(row.other_ids);
 *   });
 *
 *   // Retrieve data based on those keys.
 *   return $.when($.getJSON('/path/to/resource.json?keysIn=' + keysFromFirstTable.join(',')));
 * }
 *
 * @example <caption>For extremely large data sets</caption>
 * function dataCallbackForSomeTable(lastRecordToken, tableDependencyData, appendRows) {
 *   var allRowsLoaded = [],
 *       i;
 *
 *   // Iterate through some huge amount of data.
 *   for (i=0; i < 10000; i++) {
 *     // Keep track of when each AJAX request completes.
 *     allRowsLoaded[i] = $.getJSON('/path/to/resource.json?page=' + i, function (response) {
 *       // As soon as we have the data, write it directly to Tableau.
 *       appendRows(response.data);
 *     });
 *   }
 *
 *   // Resolves a value-less "promise" once all page deferreds are resolved.
 *   return $.when(allRowsLoaded);
 * }
 */
