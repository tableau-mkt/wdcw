
/**
 * Should return a promise to an array of native Tableau TableInfo objects.
 *
 * @typeDef {Function} schemaRetrieval
 * @this Connector
 * @return {Promise<Array.TableInfo>}
 *
 * @example <caption>Simple, static schema declaration.</caption>
 * function schemaCallback() {
 *   return Promise.resolve([{
 *     "defaultAlias": "Table Name",
 *     "description": "Description of table.",
 *     "id": "tablename",
 *     "columns": [
 *       // Columns here...
 *     ]
 *   }]);
 * }
 *
 * @example <caption>Load schema from JSON asynchronously.</caption>
 * function schemaCallback() {
 *   return Promise.all([
 *     $.getJSON('/schema/for/table-name.json'),
 *     $.getJSON('/schema/for/another-table.json')
 *   ]);
 * }
 */
