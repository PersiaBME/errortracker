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
  msg = msg || 'default msg';
  fileName = fileName || 'default fileName';
  lineNumber = lineNumber || 1;
  columnNumber = columnNumber || 1;
  errObject = errObject || {stack: 'stack'};

  return [
    msg,
    fileName,
    lineNumber,
    columnNumber,
    errObject    
  ];
}

function raseRandomError (err) {
  if (typeof err === 'undefined')
    errorObject = MockWindowError();
  else
    errorObject = err;
    errortracker.report('error', errorObject);
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

asyncTest("errortracker default properties are assigned correctly", function (assert) {
  errortracker.clearStorage();
  var errorObj = new MockWindowError('msg', 'url', 55, 66, {stack: 'stack'});
  raseRandomError(errorObj);

  setTimeout(function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs[0].Message, 'msg', "error message");
    assert.equal( errs[0].FileName, 'url', "file name or url");
    assert.equal( errs[0].LineNumber, 55, "line number");
    assert.equal( errs[0].ColumnNumber, 66, "column number");
    assert.ok( /stack/.test(errs[0].StackTrace[0]), "stack trace");
    QUnit.start();
  }, 0);

});


