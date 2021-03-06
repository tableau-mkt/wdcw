
/**
 * A configuration object used to instantiate wrapped Web Data Connectors. You
 * may choose to provide all details on this configuration object or omit them
 * and use the various methods on the wdcw class to build your connector.
 *
 * @typedef {Object} wdcw~config
 *
 * @property {string} name
 *   The name of your web data connector as it should appear in Tableau.
 *
 * @property {string} [authType]
 *   The type of authentication that your connector uses. One of:
 *   - none: this value is assumed if you don't provide one.
 *   - basic: this will cause Tableau to show a username/password connection
 *     dialogue to users in some refresh scenarios.
 *   - custom: this will let Tableau know to call your connector in an "auth"
 *     phase if it needs to (rather than showing the basic auth dialogue).
 *
 * @property {wdcw~connectorSetup} [setup]
 *   Callback method used to register custom initialization logic for your
 *   connector. If you do not provide one here, you may optionally provide one
 *   via {@link wdcw#conectorSetup}.
 *
 * @property {wdcw~connectorTeardown} [teardown]
 *   Callback method used to register custom shutdown logic for your connector.
 *   If you do not provide on here, you may optionally provide one via
 *   {@link wdcw#connectorTeardown}.
 *
 * @property {wdcw~schemaRetrieval} [schema]
 *   Callback method used to retrieve schema details for your connector. If you
 *   do not provide one here, you must provide one via {@link wdcw#registerSchema}.
 *
 * @property {Object} [tables]
 *   An object with as many properties as your data source provides tables. Its
 *   keys represent table IDs. Rather than declaring them here, you may wish to
 *   use the {@link wdcw#registerData} or {@link wdcw#registerPostProcess}
 *   methods.
 *
 * @property {Object} tables.tableId
 *   Here, "tableId" is just an example; it should be the actual ID used to
 *   identify a table in your connector's schema retrieval method via
 *   {@link wdcw#schemaRetrieval}. You should have as many keys here as your
 *   connector provides tables.
 *
 * @property {wdcw~dataRetrieval} tables.tableId.getData
 *   Nested under each table ID, you must provide a data retrieval method on the
 *   getData property.
 *
 * @property {wdcw~postProcess} [tables.tableId.postProcess]
 *   You may optionally provide a method for post-processing, filtering, and any
 *   other data transformation needs you may have on the postProcess method.
 *
 * @example <caption>All of the basics<caption>
 * wdcw({
 *   name: 'My Web Data Connector',
 *   authType: 'basic',
 *   schema: function () {},
 *   tables: {
 *     tableOne: {
 *       getData: function (lastRecordToken) {},
 *       postProcess: function (tableOneData) {}
 *     }
 *   }
 * });
 *
 * @example <caption>Using helper methods</caption>
 * wdcw({name: 'My Web Data Connector'})
 *   .registerSchema(function () {})
 *   .registerData('tableOne', function (lastRecordToken) {})
 *   .registerPostProcess('tableOne', function (tableOneData) {});
 */
