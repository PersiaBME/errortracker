QUnit.pending = function() {
   QUnit.test('(Pending...) ' + arguments[0], function() {
       QUnit.expect(0);//dont expect any tests
       var li = document.getElementById(QUnit.config.current.id);
       QUnit.done(function() {
           li.style.background = '#FFFF99';
       });
   });
};
pending = QUnit.pending;

function setup() {
  errortracker.initialize({
      storage: {
          maxSize: 100000,
          type: "localStorage"
      },
      addToServerDbUrl: "/api/to/add/errorReports"
  });
}

function resetToDefaults() {
  errortracker.clearStorage();
  setup();
}

function MockWindowError (msg, fileName, lineNumber, columnNumber, errObject) {
  msg = msg || "default msg";
  fileName = fileName || "default fileName";
  lineNumber = lineNumber || 1;
  columnNumber = columnNumber || 1;
  errObject = errObject || {stack: "stack"};

  return [
    msg,
    fileName,
    lineNumber,
    columnNumber,
    errObject    
  ];
}

function raseError (err, callback) {
  var errorObject;
  if (typeof err === "undefined")
    errorObject = MockWindowError();
  else
    errorObject = err;
  errortracker.report("error", errorObject, callback);
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
  raseError();
  raseError();
  raseError(undefined, function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs.length, 3, "A single error is found in storage");
    QUnit.start();
  });

});

asyncTest("error tracker clear storage when storage size hits the limit", function (assert) {
  errortracker.clearStorage();
  errortracker.initialize({
    storage: {
      maxSize: 1,
      type: 'localStorage'
    },
    addToServerDbUrl: '/api/to/add/errorReports'
  });

  var errorObj = new MockWindowError();
  raseError(errorObj, function () {
    assert.equal(errortracker.storageToJSON(), null, 'errors must be cleaned from storage');
    resetToDefaults();
    QUnit.start();
  });

});


asyncTest("errortracker default properties are assigned correctly", function (assert) {
  errortracker.clearStorage();
  var windowErrorObj = new MockWindowError("msg", "url", 55, 66, {stack: "stack"}),
      tryCatchError = new Error("msg");

  errortracker.report(errortracker.reporters.FATAL, 'msg');
  var err = errortracker.storageToJSON()[0];
  assert.equal( err.Message, "msg", "errmessage");
  assert.ok( typeof err.ViewType !== "undefined", "view type");
  assert.ok( typeof err.Agent !== "undefined", "agent");
  assert.ok( typeof err.DateTime !== "undefined", "date time");
  assert.ok( typeof err.Location !== "undefined", "location href");

  raseError(tryCatchError, function () {
    var err = errortracker.storageToJSON()[1];
    assert.equal( err.Message, "msg", "errmessage");
    assert.ok( typeof err.ViewType !== "undefined", "view type");
    assert.ok( typeof err.Agent !== "undefined", "agent");
    assert.ok( typeof err.DateTime !== "undefined", "date time");
    assert.ok( typeof err.Location !== "undefined", "location href");
    assert.ok( /stack|anonymous/.test(err.StackTrace[0]), "stack trace");
    QUnit.start();
  });
  
  raseError(windowErrorObj, function () {
    var err = errortracker.storageToJSON()[2];
    assert.equal( err.Message, "msg", "errmessage");
    assert.equal( err.FileName, "url", "file name or url");
    assert.equal( err.LineNumber, 55, "line number");
    assert.equal( err.ColumnNumber, 66, "column number");
    assert.ok( typeof err.ViewType !== "undefined", "view type");
    assert.ok( typeof err.Agent !== "undefined", "agent");
    assert.ok( typeof err.DateTime !== "undefined", "date time");
    assert.ok( typeof err.Location !== "undefined", "location href");
    assert.ok( /stack/.test(err.StackTrace[0]), "stack trace");
  });

});

asyncTest("errortracker custom sync properties are assigned correctly", function (assert) {
  errortracker.clearStorage();
  errortracker.addProperties({
    functionProp: function () {
      return 2 + 2;
    },
    valueProp: "Maybe a browser API call"
  });

  var errorObj = new MockWindowError("msg", "url", 55, 66, {stack: "stack"});
  raseError(errorObj, function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs[0].functionProp, 4, "functions must be supported");
    assert.equal( errs[0].valueProp, "Maybe a browser API call", "simple values must be supported");
    QUnit.start();
  });

});

asyncTest("errortracker custom async properties are assigned correctly", function (assert) {
  errortracker.clearStorage();
  errortracker.addProperties({
    asyncProp1: {
      async: true,
      value: function (pass) {
        setTimeout(function () {
          pass("asyncProp1", "ap1");
        }, 300);
      }
    },
    asyncProp2: {
      async: true,
      value: function (pass) {
        setTimeout(function () {
          pass("asyncProp2", "ap2");
        }, 200);
      }
    },
    valueProp: "Maybe a browser API call"
  });

  var errorObj = new MockWindowError("msg", "url", 55, 66, {stack: "stack"});
  raseError(errorObj, function () {
    var errs = errortracker.storageToJSON();
    assert.equal( errs[0].asyncProp1, "ap1", "functions must be supported");
    assert.equal( errs[0].asyncProp2, "ap2", "simple values must be supported");
    errortracker.resetPropeties();
    QUnit.start()
  });

});

asyncTest("errortracker should not fail if a custom property failes during execution", function (assert) {
  errortracker.clearStorage();
  errortracker.addProperties({
    badFunction: function () {
      noneExistingFunction();
      return 2 + 2;
    }
  });

  var errorObj = new MockWindowError("msg", "url", 55, 66, {stack: "stack"});
  raseError(errorObj, function () {
    var errs = errortracker.storageToJSON();
    assert.ok(/while creating this property/.test(errs[0].badFunction));
    QUnit.start();
  });

});

asyncTest("errors comming from try catch are counted and reported correctly", function (assert) {
  errortracker.clearStorage();
  var errorObj = {
    message: "error comming from try catch",
    stack: "stack trace"
  }

  raseError(errorObj, function () {
    var errs = errortracker.storageToJSON();
    assert.ok(/error comming from try catch/.test(errs[0].Message));
    assert.ok(/stack trace/.test(errs[0].StackTrace[0]));
    QUnit.start();
  });

});

asyncTest("manual reports wokr correctly", function (assert) {
  errortracker.clearStorage();
  errortracker.report("error", "A manual report", function () {
    var errs = errortracker.storageToJSON();
    assert.ok(/A manual report/.test(errs[0].Message))
    QUnit.start();
  });

});

asyncTest("Multiple error reports can be handled when errors rase together", function (assert) {
  errortracker.clearStorage();
  errortracker.report("error", "Error 1")
  errortracker.report("error", "Error 2")
  errortracker.report("error", "Error 3")
  errortracker.report("error", "Error 4")
  errortracker.report("error", "Error 5", function () {
    var errs = errortracker.storageToJSON();
    assert.ok(errs.length === 5);
    assert.ok(errs[0].Message === "Error 1");
    assert.ok(errs[1].Message === "Error 2");
    assert.ok(errs[2].Message === "Error 3");
    assert.ok(errs[3].Message === "Error 4");
    assert.ok(errs[4].Message === "Error 5");
    QUnit.start();

  });

});

asyncTest("exclude functionality basic test", function (assert) {
  errortracker.clearStorage();
  errortracker.initialize({
    storage: {
      maxSize: 1000,
      type: 'localStorage'
    },
    exclude: [
      { Message: /excluded error/ }
    ],
    addToServerDbUrl: '/api/to/add/errorReports'
  });

  var errorObj = new MockWindowError("this is an excluded error message", "url", 55, 66, {stack: "stack"});
  raseError(errorObj, function () {
    var errs = errortracker.storageToJSON();
    assert.ok(errs === null);
    QUnit.start();
  });

});

asyncTest("AND logic between rule properties are correct", function (assert) {
  errortracker.clearStorage();
  errortracker.initialize({
    storage: {
      maxSize: 1000,
      type: 'localStorage'
    },
    exclude: [
      { 
        Message: /excluded error/,
        FileName: /jquery/
      }
    ],
    addToServerDbUrl: '/api/to/add/errorReports'
  });

  var errorObj1 = new MockWindowError("this is an excluded error message", "jquery", 55, 66, {stack: "stack"});
  var errorObj2 = new MockWindowError("this is an excluded error message", "underscore", 55, 66, {stack: "stack"});

  raseError(errorObj1);
  raseError(errorObj2, function () {
    var errs = errortracker.storageToJSON();
    assert.ok(errs.length === 1);
    QUnit.start();
  });

});

asyncTest("OR logic between rule properties are correct", function (assert) {
  errortracker.clearStorage();
  errortracker.initialize({
    storage: {
      maxSize: 1000,
      type: 'localStorage'
    },
    exclude: [
      { 
        Message: /excluded/
      },
      {
        FileName: /jquery/
      }
    ],
    addToServerDbUrl: '/api/to/add/errorReports'
  });

  var errorObj1 = new MockWindowError("this is a  removed  error message", "jquery", 55, 66, {stack: "stack"});
  var errorObj2 = new MockWindowError("this is an excluded error message", "underscore", 55, 66, {stack: "stack"});

  raseError(errorObj1);
  raseError(errorObj2, function () {
    var errs = errortracker.storageToJSON();
    assert.ok(errs === null);
    QUnit.start();
  });

});

asyncTest("stack trace is an instance of array", function (assert) {
  errortracker.clearStorage();
  raseError(undefined, function () {
    var errs = errortracker.storageToJSON();
    var stackTrace = errs[0].StackTrace;
    assert.ok(stackTrace instanceof Array);
    QUnit.start();
  });

});