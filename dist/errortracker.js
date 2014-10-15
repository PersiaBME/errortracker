;(function() {var BrowserDetector, Normalizer, whenthen, Warehouse, Sender, ErrorTracker;
BrowserDetector = function () {
  /**
  *   Thanks to Aniket Kulkarni from stackoverflow.com
  */
  function getBrowser() {
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browserName = navigator.appName;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;
    // In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = nAgt.indexOf('Opera')) != -1) {
      browserName = 'Opera';
      fullVersion = nAgt.substring(verOffset + 6);
      if ((verOffset = nAgt.indexOf('Version')) != -1)
        fullVersion = nAgt.substring(verOffset + 8);
    } else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
      browserName = 'Microsoft Internet Explorer';
      fullVersion = nAgt.substring(verOffset + 5);
    } else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
      browserName = 'Chrome';
      fullVersion = nAgt.substring(verOffset + 7);
    } else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
      browserName = 'Safari';
      fullVersion = nAgt.substring(verOffset + 7);
      if ((verOffset = nAgt.indexOf('Version')) != -1)
        fullVersion = nAgt.substring(verOffset + 8);
    } else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
      browserName = 'Firefox';
      fullVersion = nAgt.substring(verOffset + 8);
    } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
      browserName = nAgt.substring(nameOffset, verOffset);
      fullVersion = nAgt.substring(verOffset + 1);
      if (browserName.toLowerCase() == browserName.toUpperCase()) {
        browserName = navigator.appName;
      }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) != -1)
      fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(' ')) != -1)
      fullVersion = fullVersion.substring(0, ix);
    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
      fullVersion = '' + parseFloat(navigator.appVersion);
      majorVersion = parseInt(navigator.appVersion, 10);
    }
    return {
      name: browserName,
      version: majorVersion
    };
  }
  return { getBrowser: getBrowser };
}();
Normalizer = function (BrowserDetector) {
  /**
   * Different browsers have different behaviours in handling errors
   * We keep each browser with its own behaviour in a hash table
   *
   * Thanks to the stacktracejs library
   * url: https://github.com/stacktracejs/stacktrace.js/
   */
  var browsers = {
    Chrome: function (stack) {
      return (stack + '\n').replace(/^[\s\S]+?\s+at\s+/, ' at ').replace(/^\s+(at eval )?at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)').replace(/^(.+) \((.+)\)$/gm, '$1@$2').split('\n').slice(0, -1);
    },
    FirefoxBelow31: function (stack) {
      return 'Firefox < 31 does not pass stack trace to error event';
    },
    FirefoxAbove31: function (stack) {
      return stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@').split('\n');
    },
    defaultParser: function (stack) {
      return stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@').split('\n');
    }
  };
  function normalizeStackTrace(stackTrace) {
    var postFix = '', browserName = BrowserDetector.getBrowser().name;
    if (browserName === 'Firefox') {
      postFix = BrowserDetector.getBrowser().version < 31 ? 'Below31' : 'Above31';
    }
    var parsedStack;
    if (typeof browsers[browserName + postFix] === 'undefined')
      return browsers.defaultParser(stackTrace);
    return browsers[browserName + postFix](stackTrace);
  }
  /**
  * Normalize error object based on browser
  */
  function normalizeError(mixedError) {
    var error = {};
    //detect what type of extraInfo is passed in
    if (typeof mixedError === 'object' && mixedError.length === 5) {
      //probably comming form window.onerror
      //adding initial properties
      error.Message = mixedError[0];
      error.FileName = mixedError[1];
      error.LineNumber = mixedError[2];
      error.ColumnNumber = mixedError[3];
      error.StackTrace = normalizeStackTrace(mixedError[4].stack);
    } else if (typeof mixedError === 'object') {
      //probably comming form a try catch statement and manually reported                     
      //add initial properties
      error.Message = mixedError.message;
      error.StackTrace = normalizeStackTrace(mixedError.stack);
    } else if (typeof mixedError === 'string') {
      //handels manual reports
      //add initial properties
      error.Message = mixedError;
    }
    return error;
  }
  return { normalizeError: normalizeError };
}(BrowserDetector);
//Thanks to the author of when-then library, https://github.com/geuis/when-then
//License: MIT License(http://opensource.org/licenses/mit-license.php)
whenthen = function () {
  var when = function () {
    if (!(this instanceof when))
      return new when(arguments);
    //return new instance of itself
    var self = this;
    //cached so the syntax of code within the function is more readable
    self.pending = Array.prototype.slice.call(arguments[0]);
    //convert arguments passed in to array
    self.pending_length = self.pending.length;
    //cache length of the arguments array
    self.results = { length: 0 };
    //container for results of async functions
    (function () {
      // define pass() within this context so that the outer scope of self(this) is available when pass() is executed within the user's async functions
      self.pass = function () {
        //self.results.push(arguments); //push async results to cache array
        self.results[arguments[0]] = arguments[1];
        self.results.length++;
        if (self.results.length === self.pending_length)
          //if all async functions have finished, pass the results to .then(), which has been redefined to the user's completion function
          self.then.call(self, self.results);
      };
    }());
  };
  when.prototype = {
    then: function () {
      this.then = arguments[0];
      //reassign .then() to the user-defined function that is executed on completion. Also ensures that this() can only be called once per usage of when()
      while (this.pending[0]) {
        this.pending.shift().call(this, this.pass);
      }
    }
  };
  return { when: when };
}();
Warehouse = function (Async) {
  // 5 MB is 1048576 bytes
  // each char in javascript is byte so we need 524288 byte
  var MAX_STORAGE_SIZE = 500000;
  var storage = {};
  function initialize(userConfig) {
    storage = extend(storage, userConfig);
    initilizeStorageType();
  }
  function initilizeStorageType() {
    if (!storage.type) {
      storage.type = detectPereferdAvailableStorage();
    }
    MAX_STORAGE_SIZE = storage.maxSize || MAX_STORAGE_SIZE;
  }
  function detectPereferdAvailableStorage() {
    var pereferdStorageType;
    // preffered storage
    if ('localStorage' in window && window['localStorage'] !== null) {
      pereferdStorageType = 'localStorage';
    } else if (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) {
      // secondary storage
      // keep IndexedDB instance
      pereferdStorageType = 'indexedDb';
    } else {
      // fallback storage
      var pereferdStorageType = 'cookie';
    }
    return pereferdStorageType;
  }
  function getStorageStatus(passStatus) {
    Async.when(function (pass) {
      getSize(pass);
    }).then(function (results) {
      if (results.storageContentSize > MAX_STORAGE_SIZE)
        passStatus('storageStatus', 'full');
      else
        passStatus('storageStatus', 'notFull');
    });
  }
  var storageFunctionMap = {
    save: {
      'localStorage': saveInLocalStorage,
      'indexedDb': saveInIndexedDb,
      'cookie': saveInCookie
    },
    remove: {
      'localStorage': removeFromLocalStorage,
      'indexedDb': removeFromIndexedDb,
      'cookie': removeFromCookie
    },
    update: {
      'localStorage': updateInLocalStorage,
      'indexedDb': updateInIndexedDb,
      'cookie': updateInCookie
    },
    clear: {
      'localStorage': clearLocalStorage,
      'indexedDb': clearIndexedDb,
      'cookie': clearCookie
    },
    toJSON: {
      'localStorage': localStorageToJSON,
      'indexedDb': indexedDbToJSON,
      'cookie': cookieToJSON
    },
    getSize: {
      'localStorage': getLocalStorageSize,
      'indexedDb': getIndexedDbSize,
      'cookie': getCookieSize
    }
  };
  function save(item, namespacePostfix) {
    storageFunctionMap.save[storage.type](item, namespacePostfix);
  }
  function remove() {
    storageFunctionMap.remove[storage.type]();
  }
  function update() {
    storageFunctionMap.update[storage.type]();
  }
  function clear() {
    storageFunctionMap.clear[storage.type]();
  }
  function toJSON(storageName) {
    return storageFunctionMap.toJSON[storage.type](storageName);
  }
  function getSize(pass) {
    return storageFunctionMap.getSize[storage.type](pass);
  }
  // localStorage CRUD
  function saveInLocalStorage(content, namespacePostfix) {
    var items = [];
    namespacePostfix = namespacePostfix || '';
    if (localStorage.getItem(errortracker.getNamespace()) !== null)
      items = JSON.parse(localStorage.getItem(errortracker.getNamespace()));
    if (content instanceof Array)
      for (var i = 0; i < content.length; i++)
        items.push(content[i]);
    else
      items.push(content);
    localStorage.setItem(errortracker.getNamespace() + namespacePostfix, JSON.stringify(items));
  }
  function removeFromLocalStorage(item) {
    localStorage.removeItem(item);
  }
  function updateInLocalStorage() {
    console.log('localStorage: update, not implemented');
  }
  function clearLocalStorage() {
    localStorage.clear();
  }
  function localStorageToJSON(storageName) {
    storageName = storageName || errortracker.getNamespace();
    return JSON.parse(localStorage.getItem(storageName));
  }
  function getLocalStorageSize(pass) {
    var content = localStorage.getItem(errortracker.getNamespace()) || '';
    pass('storageContentSize', content.length || 0);
  }
  // indexedDb CRUD
  function saveInIndexedDb() {
    console.log('IndexedDb: save, not implemented');
  }
  function removeFromIndexedDb() {
    console.log('IndexedDb: remove, not implemented');
  }
  function updateInIndexedDb() {
    console.log('IndexedDb: update, not implemented');
  }
  function clearIndexedDb() {
    console.log('IndexedDb: clear, not implemented');
  }
  function indexedDbToJSON() {
    console.log('IndexedDb: toJSON, not implemented');
  }
  function getIndexedDbSize(pass) {
    console.log('IndexedDb: getSize, not implemented');
  }
  // cookie CRUD
  function saveInCookie() {
    console.log('Cookie: save, not implemented');
  }
  function removeFromCookie() {
    console.log('Cookie: remove, not implemented');
  }
  function updateInCookie() {
    console.log('Cookie: update, not implemented');
  }
  function clearCookie() {
    console.log('Cookie: clear, not implemented');
  }
  function cookieToJSON() {
    console.log('Cookie: toJSON, not implemented');
  }
  function getCookieSize(pass) {
    console.log('Cookie: getSize, not implemented');
  }
  //util extend
  function extend() {
    for (var i = 1; i < arguments.length; i++)
      for (var key in arguments[i])
        if (arguments[i].hasOwnProperty(key))
          arguments[0][key] = arguments[i][key];
    return arguments[0];
  }
  return {
    MAX_STORAGE_SIZE: function () {
      return MAX_STORAGE_SIZE;
    },
    save: save,
    remove: remove,
    update: update,
    clear: clear,
    toJSON: toJSON,
    getSize: getSize,
    getStorageStatus: getStorageStatus,
    initialize: initialize
  };
}(whenthen);
Sender = function () {
  var XMLHttpFactories = [
    function () {
      return new XMLHttpRequest();
    },
    function () {
      return new ActiveXObject('Msxml2.XMLHTTP');
    },
    function () {
      return new ActiveXObject('Msxml3.XMLHTTP');
    },
    function () {
      return new ActiveXObject('Microsoft.XMLHTTP');
    }
  ];
  function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i = 0; i < XMLHttpFactories.length; i++) {
      try {
        xmlhttp = XMLHttpFactories[i]();
      } catch (e) {
        continue;
      }
      break;
    }
    return xmlhttp;
  }
  function send(url, json, successCallback, failCallback) {
    var req = createXMLHTTPObject();
    var method = 'POST';
    req.open(method, url, true);
    req.setRequestHeader('Content-type', 'application/json');
    req.onreadystatechange = function () {
      if (req.readyState != 4) {
        failCallback();
        return;
      }
      if (req.status != 200 && req.status != 304) {
        failCallback();
        return;
      }
      successCallback(req);
    };
    if (req.readyState == 4)
      return;
    req.send(JSON.stringify(json));
  }
  return { send: send };
}();
(function (Normalizer, Warehouse, BrowserDetector, Sender, Async) {
  var options = {};
  var namespace = 'errortracker';
  //Determine whether errors should be logged to user or not
  var debugMode = false;
  //Keeps all errors in a stack structure
  var stack = [];
  var storageModificationInProgress = false;
  var storageConteinsUnmanagedItems = false;
  //these propeties are added by user during configuration
  var addedProperties = {};
  //Keeps errortracker storages
  var storages = {
    LOCAL_STORAGE: 'localStorage',
    INDEXED_DB: 'indexedDb',
    COOKIE: 'cookie'
  };
  /**
  * Keep track of different kind of reporters
  * A more abstract layer for console[log/warn/error/info]
  */
  var reporters = {
    LOG: 'log',
    WARN: 'warn',
    FATAL: 'error',
    INFO: 'info'
  };
  var defaultProperties = {
    DateTime: function () {
      return new Date();
    },
    Location: function () {
      return window.location.href;
    },
    Agent: navigator.userAgent
  };
  function Report(error, type, callback) {
    this.error = error;
    this.type = type || 'error';
    this.fieldProperties = {};
    this.callback = callback;
  }
  // Report.prototype.addProperties = addReportProperties;
  Report.prototype.fillProperties = fillErrorProperties;
  function ErrorObject(error) {
    for (var err in error) {
      if (!error.hasOwnProperty(err))
        continue;
      this[err] = error[err];
    }
  }
  //main function of errortracker
  function report(reporterType, extraInfo, callback) {
    if (typeof reporterType !== 'string') {
      console.warn('errortracker only accepts strings as first argument');
    }
    var error = Normalizer.normalizeError(extraInfo);
    var errorObject = new ErrorObject(error);
    var report = new Report(error, reporterType, callback);
    Async.when(function (pass) {
      report.fillProperties(pass);
    }).then(function (results) {
      results.length = undefined;
      var readyReport = results.fieldProperties;
      if (isIgnoredError(readyReport)) {
        if (typeof report.callback === 'function')
          callback();
        return;
      }
      stack.push(readyReport);
      Warehouse.save(readyReport);
      printError(reporterType, readyReport);
      storageConteinsUnmanagedItems = true;
      manageStorageSize();
      if (typeof report.callback === 'function')
        callback();
    });
  }
  function manageStorageSize() {
    Async.when(function (pass) {
      Warehouse.getStorageStatus(pass);
    }).then(function (results) {
      manageStorageStatus(results.storageStatus);
    });
  }
  function manageStorageStatus(status) {
    if (status === 'full') {
      if (!storageModificationInProgress && storageConteinsUnmanagedItems) {
        log('storage full!');
        storageModificationInProgress = true;
        Async.when(makeTempStorage).then(function () {
          var tempReports = Warehouse.toJSON(getNamespace() + '_temp');
          Sender.send(options.addToServerDbUrl, tempReports, function () {
            storageModificationInProgress = false;
            manageStorageSize();
          }, function () {
            log('failed to push temp storage to the server');
          });
        });
      }
      log('storage busy...');
    } else {
      log('storage has empty space.');
      storageModificationInProgress = false;
      storageConteinsUnmanagedItems = false;
    }
  }
  function makeTempStorage(pass) {
    //must be converted to when then structure
    var storageContetn = Warehouse.toJSON();
    clearStorage();
    storageConteinsUnmanagedItems = false;
    //make sure you have storage content at this point
    Warehouse.save(storageContetn, '_temp');
    pass();
  }
  function fillErrorProperties(pass) {
    var errorProperties = extend({}, addedProperties, defaultProperties), fieldProperties = {}, asyncFunctions = [], i, p;
    var _this = this;
    //categorize properties
    for (p in errorProperties) {
      if (!errorProperties.hasOwnProperty(p))
        continue;
      if (typeof errorProperties[p] === 'object' && errorProperties[p].async === true) {
        (function (p) {
          asyncFunctions.push(function (pass) {
            try {
              return errorProperties[p].value(pass);
            } catch (e) {
              return 'Error happened while creating this property' + e.message;
            }
          });
        }(p));
      } else if (typeof errorProperties[p] === 'function') {
        try {
          this.fieldProperties[p] = errorProperties[p]();
        } catch (e) {
          this.fieldProperties[p] = 'Error happened while creating this property' + e.message;
        }
      } else if (typeof errorProperties[p] !== 'function')
        this.fieldProperties[p] = errorProperties[p];
    }
    this.fieldProperties.ViewType = this.type;
    if (asyncFunctions.length === 0) {
      extend(this.fieldProperties, this.error);
      pass('fieldProperties', this.fieldProperties);
      return;
    }
    Async.when.apply(null, asyncFunctions).then(function (results) {
      //remove length property
      results.length = undefined;
      extend(_this.fieldProperties, results, _this.error);
      pass('fieldProperties', _this.fieldProperties);
    });
    return;
  }
  function isIgnoredError(errorObject) {
    var isIgnored = false;
    var finalResults = false;
    var partialResults = [];
    //make sure user has configured an exclude object
    if (typeof options.exclude !== 'object' || typeof options.exclude.length === 'undefined')
      return false;
    var rules = options.exclude;
    var property;
    for (property in rules) {
      if (!rules.hasOwnProperty(property))
        continue;
      partialResults.push(validateRule(rules[property], errorObject));
    }
    for (var i = 0; i < partialResults.length; i++) {
      finalResults = finalResults || partialResults[i];
    }
    return finalResults;
    function validateRule(validationObject, errorObject) {
      var finalResults = validationObject._consider === 'any' ? false : true;
      var partialResults = [];
      for (property in validationObject) {
        if (!validationObject.hasOwnProperty(property) || property.slice(0, 1) === '_')
          continue;
        var expression = new RegExp(validationObject[property]);
        partialResults.push(expression.test(errorObject[property]));  //log(validationObject[property], '-> ', errorObject[property]);
      }
      //log(partialResults);
      for (var i = 0; i < partialResults.length; i++) {
        if (validationObject._consider === 'any')
          finalResults = finalResults || partialResults[i];
        else
          finalResults = finalResults && partialResults[i];
      }
      return finalResults;
    }
  }
  //sync errors in storage with server database
  function syncStorage(successCallback, failCallback) {
    var storageJSON = storageToJSON();
    if (storageJSON) {
      // call a web service via ajax in order to save error object in server db
      Sender.send(options.addToServerDbUrl, storageJSON, function () {
        clearStorage();
        clearStack();
        if (typeof successCallback === 'function')
          successCallback();
      }, function () {
        if (typeof failCallback === 'function')
          failCallback();
      });
    } else {
      if (typeof successCallback === 'function')
        successCallback();
    }
  }
  function initialize(c) {
    options = c;
    Warehouse.initialize(c.storage);
  }
  //sync storage if storage is full
  function refreshStorage() {
    if (isGreaterThanMaxStorageSize()) {
      syncStorage();
    }
  }
  //checks if storage is full or not
  function isGreaterThanMaxStorageSize() {
    if (Warehouse.getSize() > Warehouse.MAX_STORAGE_SIZE()) {
      return true;
    } else {
      return false;
    }
  }
  //Add new property to errortracker report object
  function addProperties(propObj) {
    for (var prop in propObj) {
      addedProperties[prop] = propObj[prop];
    }
  }
  function resetPropeties() {
    addedProperties = {};
  }
  //prints error logs in console
  function printError(reporterType, error) {
    if (debugMode) {
      var reporter = console[reporterType];
      reporter.call(console, error);
    }
  }
  //remove all errors from storage
  function clearStorage() {
    Warehouse.clear();
  }
  function clearStack() {
    while (stack.pop() != null);
  }
  //retunrs all error objects as JSON
  function storageToJSON() {
    return Warehouse.toJSON();
  }
  //prints out a string version of stack into console
  function printStack() {
    stack.forEach(function (error) {
      log(error);
    });
  }
  //return namespace
  function getNamespace() {
    return namespace;
  }
  function enableDebugMode() {
    debugMode = true;
  }
  function disableDebugMode() {
    debugMode = false;
  }
  //Originally by Ryan Lynch 
  function extend() {
    for (var i = 1; i < arguments.length; i++)
      for (var key in arguments[i])
        if (arguments[i].hasOwnProperty(key))
          arguments[0][key] = arguments[i][key];
    return arguments[0];
  }
  function log() {
    if (options.enableLogging)
      console.log.apply(console, arguments);
  }
  //Our global object act as ErrorTracker
  window.errortracker = {
    initialize: initialize,
    getNamespace: getNamespace,
    enableDebugMode: enableDebugMode,
    disableDebugMode: disableDebugMode,
    report: report,
    storages: storages,
    reporters: reporters,
    clearStack: clearStack,
    printStack: printStack,
    clearStorage: clearStorage,
    storageToJSON: storageToJSON,
    syncStorage: syncStorage,
    addProperties: addProperties,
    resetPropeties: resetPropeties
  };
}(Normalizer, Warehouse, BrowserDetector, Sender, whenthen));
ErrorTracker = undefined;}());