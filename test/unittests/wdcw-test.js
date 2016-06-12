/**
 * @file wdcw Unit Test
 */

// jscs:disable disallowMultipleVarDecl
/*jshint expr: true*/
var wdcw = require('../../src/wdcw');

var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

var expect = chai.expect;

chai.use(sinonChai);
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('wdcw', function () {

  it('wraps custom init methods', function (done) {
    var wrapper = new wdcw();

    // We pass a custom setup method which immediately resolves.
    wrapper.registerInit(function customInitMethod(phase) {
      return Promise.resolve();
    });

    // Trigger the connectors's init method as if we were Tableau. Use the done
    // callback as if it were Tableau's init done callback. If the test completes,
    // then we know the method was successfully wrapped. If it failed, the test
    // would time out.
    wrapper.getConnector().init(done);
  });

  it('wraps custom shutdown methods', function (done) {
    var wrapper = new wdcw();

    // We pass a custom shutdown method which immediately resolves.
    wrapper.registerShutdown(function customShutdownMethod() {
      return Promise.resolve();
    });

    // Trigger the connectors's shutDown method as if we were Tableau. Use the
    // done callback as if it were Tableau's shutdown done callback. If the test
    // completes, then we know the method was successfully wrapped. If it failed,
    // the test would time out.
    wrapper.getConnector().shutdown(done);
  });

  it('wraps custom schema methods', function (done) {
    var wrapper = new wdcw(),
        expectedSchema = ['schema'];

    // We define a mock schemaCallback function which validates that our custom
    // getSchema implementation resolved with the expected schema and closes out
    // the test. If it failed, the test would time out.
    function schemaCallback(data) {
      expect(data).eql(expectedSchema);
      done();
    }

    // We pass a custom getSchema method which resolves with a mock schema.
    wrapper.registerSchema(function customSchemaMethod() {
      return Promise.resolve(expectedSchema);
    });

    // Triggerthe connector's getSchema method as if we were Tableau.
    wrapper.getConnector().getSchema(schemaCallback);
  });

  it('wraps custom getData methods', function (done) {
    var wrapper = new wdcw(),
        expectedTable = 'someTable',
        expectedData = ['data'],
        expectedIncrementValue = '123',
        mockTable;

    // We define a mock table.append function which validates that our custom
    // getData implementation resolved with expected data.
    function tableAppend(data) {
      expect(data).eql(expectedData);
    }

    // We define a mock Tableau table object which helps ensure our wrapped
    // getData method is called in the expected ways with expected arguments.
    mockTable = {
      tableInfo: {
        id: expectedTable,
      },
      incrementValue: expectedIncrementValue,
      appendRows: tableAppend,
    };

    // We pass a custom getData method which resolves with mock data.
    wrapper.registerData(expectedTable, function (lastToken) {
      // Also ensure the increment value is passed as expected.
      expect(lastToken).eql(expectedIncrementValue);
      return Promise.resolve(expectedData);
    });

    // Trigger the connector's getData method as if we were Tableau.
    wrapper.getConnector().getData(mockTable, done);
  });

  it('wraps custom postProcess methods', function (done) {
    var wrapper = new wdcw(),
        expectedTable = 'someTable',
        expectedData = 1,
        modifier = 5,
        mockTable;

    // We define a mock table.append function which validates that our custom
    // postProcess implementation resolved with expected modifications.
    function tableAppend(data) {
      expect(data).eql(expectedData + modifier);
    }

    // We define a mock Tableau table object which helps ensure our wrapped
    // postProcess method is called in the expected way.
    mockTable = {
      tableInfo: {
        id: expectedTable,
      },
      appendRows: tableAppend,
    };

    // We pass a custom getData method which resolves with mock data.
    wrapper.registerData(expectedTable, function () {
      return Promise.resolve(expectedData);
    });

    // We pass a custom postProcess method which modivies resolved data.
    wrapper.registerPostProcess(expectedTable, function (data) {
      return Promise.resolve(data + modifier);
    });

    // Trigger the connector's getData method as if we were Tableau.
    wrapper.getConnector().getData(mockTable, done);
  });

  it('binds submit handler to form', function (done) {
    var existingEngine = $.submit,
        wrapper;

    // We mock the jQuery.submit method to ensure a handler is bound to form
    // submit.
    $.prototype.submit = function (handler) {
      expect(typeof handler).eql('function');
      done();
    };

    // Initializing a new WDC wrapper should be sufficient to bind the handler.
    wrapper = new wdcw();

    // Revert the jQuery submit method to its original value.
    $.prototype.submit = existingEngine;
  });

});
