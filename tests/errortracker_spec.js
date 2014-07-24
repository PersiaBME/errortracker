function MockError (msg, url, lineNumber, colNumbre, errorObj) {

  return this;
}

function setup() {
  errortracker.initialize({
      storage: {
          maxSize: 1000,
          type: 'localStorage'
      },
      addToServerDbUrl: '/api/to/add/errorReports'
  });
}

function MockWindowError (msg, fileName, lineNumber, columnNumber, errObject) {
  return [
    msg,
    fileName,
    lineNumber,
    columnNumber,
    errObject    
  ];
}

function raseRandomError () {
  try {
    callAFunctionThatDoesntExists();
  } catch (e) {
    
    errorObject = MockWindowError(e.message, e.fileName, e.lineNumber, e.columnNumber, e);

    errortracker.report('error', errorObject);
  }
}

/*
 *  Sadly we didn't start writing tests from the beggining of 
 *  writing this library, the tests below are written after version 1.3.2
 *  and you might find really dummy stuff in there, but we continue to 
 *  refactore both oure code and our tests and move them up in this file
 *  until the whole tests below will be removed.
 */
setup();

test("test framework, is ready to be used", function (assert) {
  assert.equal( 1, 1, "dummy test" );
});

asyncTest("storage to json retruns correct number of recorded errors", function (assert) {
  errortracker.clearStorage();
  raseRandomError();
  raseRandomError();
  raseRandomError();

  setTimeout(function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs.length, 3, "A single error is found in storage");
    QUnit.start();
  }, 0);

});

asyncTest("errortracker records lineNumber properly", function (assert) {
  errortracker.clearStorage();
  raseRandomError();
  raseRandomError();
  raseRandomError();

  setTimeout(function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs.length, 3, "A single error is found in storage");
    QUnit.start();
  }, 0);

});





