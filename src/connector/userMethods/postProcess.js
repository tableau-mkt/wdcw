
/**
 * Function called once all data for a given table has been retrieved. Can be
 * used to transform, filter, or append data for the given table. Should return
 * a promise that resolves to data in the format exactly as expected by Tableau
 * in the Table.appendRows method of the native Tableau WDC API.
 *
 * @callback wdcw~postProcess
 * @this Connector
 *
 * @param {Array<Array<any>>|null} tableData
 *   Contains data as resolved by your table's corresponding dataRetrieval
 *   method. In some exotic use-cases, you may wish for your dataRetrieval to
 *   resolve to "raw" data in a format not expected by Tableau, but then to
 *   process and re-shape the data here into the format expected by Tableau.
 *   This would allow any tables you've declared that depend on this table to
 *   base their data retrieval on the raw data while Tableau gets the properly
 *   formatted version.
 *
 * @return {Promise<Array<Array<any>>>|null}
 *   This promise should resolve with data in the format exactly as expected by
 *   Tableau in the Table.appendRows method of the native Tableau WDC API.
 *
 * @example <caption>Simple data filtering</caption>
 * function postProcessCallback(data) {
 *   var transformedData = [];
 *
 *   // Only write odd-indexed row data to Tableau.
 *   data.forEach(function (row, index) {
 *     if (index % 2) {
 *       transformedData.push(row);
 *     }
 *   });
 *
 *   return Promise.resolve(transformedData);
 * }
 *
 * @example <caption>Reverse your data</caption>
 * function postProcessCallback(data) {
 *   return Promise.resolve(data.reverse());
 * }
 */
