;(function() {var BrowserDetector, Normalizer, Warehouse, Sender, ErrorTracker;
BrowserDetector = function () {
  /**
  * Get appropriate browser based on error object
  */
  function getBrowser(msg, url, lineNumber, colNumber, errorObject) {
    if (typeof errorObject === 'object' && typeof colNumber === 'number') {
      return 'chrome';
    }
    if (typeof errorObject === 'undefined' && typeof colNumber === 'undefined') {
      return 'FirefoxBelow31';
    }
    return 'chrome';
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
      chrome: function (errorObject) {
        return {
          StackTrace: function () {
            return (errorObject.stack + '\n').replace(/^[\s\S]+?\s+at\s+/, ' at ').replace(/^\s+(at eval )?at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)').replace(/^(.+) \((.+)\)$/gm, '$1@$2').split('\n').slice(0, -1);
          }()
        };
      },
      FirefoxBelow31: function (errorObject) {
        return {
          StackTrace: 'Firefox < 31 does not pass stack trace to error event',
          ColumnNumber: 'Firefox < 31 does not pass columnNumber to error event'
        };
      },
      FirefoxAbove31: function (errorObject) {
        return {
          StackTrace: function () {
            return errorObject.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@').split('\n');
          }(),
          ColumnNumber: errorObject.columnNumber
        };
      }
    };
  /**
  * Normalize error object based on browser
  */
  function normalizeError(msg, url, lineNumber, columnNumber, errorObject) {
    // get error mode
    var errorMode = BrowserDetector.getBrowser(msg, url, lineNumber, columnNumber, errorObject);
    // normalize error based on browser
    var error = browsers[errorMode](errorObject);
    // add same properties to error object
    error.Message = msg;
    error.FileName = url;
    error.LineNumber = lineNumber;
    error.ColumnNumber = error.ColumnNumber || columnNumber;
    return error;
  }
  return { normalizeError: normalizeError };
}(BrowserDetector);
Warehouse = function () {
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
  function save(item) {
    storageFunctionMap.save[storage.type](item);
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
  function toJSON() {
    return storageFunctionMap.toJSON[storage.type]();
  }
  function getSize() {
    return storageFunctionMap.getSize[storage.type]();
  }
  // localStorage CRUD
  function saveInLocalStorage(item) {
    var items = [];
    if (localStorage.getItem(errortracker.getNamespace()) !== null) {
      items = JSON.parse(localStorage.getItem(errortracker.getNamespace()));
    }
    items.push(item);
    localStorage.setItem(errortracker.getNamespace(), JSON.stringify(items));
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
  function localStorageToJSON() {
    return JSON.parse(localStorage.getItem(errortracker.getNamespace()));
  }
  function getLocalStorageSize() {
    return localStorage.getItem(errortracker.getNamespace()).length;
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
  function getIndexedDbSize() {
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
  function getCookieSize() {
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
    MAX_STORAGE_SIZE: MAX_STORAGE_SIZE,
    save: save,
    remove: remove,
    update: update,
    clear: clear,
    toJSON: toJSON,
    getSize: getSize,
    initialize: initialize
  };
}();
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
(function (Normalizer, Warehouse, BrowserDetector, Sender) {
  /**
  * ErrorTracker namespace
  */
  var namespace = 'errortracker';
  /**
  * Keeps errortracker configs
  */
  //var config = window.errConfig || {};
  /**
  * Keeps errortracker properties
  */
  var properties = {};
  /**
  * Determine whether errors should be logged to user or not
  */
  var debugMode = false;
  /**
  * Keeps all errors in a stack structure
  */
  var stack = [];
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
  /**
  * Defualt error properties
  */
  var defaults = {
      DateTime: function () {
        return new Date();
      },
      Location: window.location.href,
      Agent: navigator.userAgent
    };
  /**
  * Keeps errortracker storages
  */
  var storages = {
      LOCAL_STORAGE: 'localStorage',
      INDEXED_DB: 'indexedDb',
      COOKIE: 'cookie'
    };
  /**
  * Enable debug Mode
  */
  function enableDebugMode() {
    debugMode = true;
  }
  /**
  * Disable debug mode
  */
  function disableDebugMode() {
    debugMode = false;
  }
  /**
  * Check whether error is string or object
  */
  function getErrorBasedOnDataType(msg, url, lineNumber, colNumber, errorObject) {
    var error = {};
    if (typeof errorObject !== 'undefinde') {
      error = Normalizer.normalizeError(msg, url, lineNumber, colNumber, errorObject);
    } else {
      error.Message = msg;
    }
    return error;
  }
  /**
  * Check storage size
  */
  function isGreaterThanMaxStorageSize() {
    if (Warehouse.getSize() > Warehouse.MAX_STORAGE_SIZE) {
      return true;
    } else {
      return false;
    }
  }
  /**
  * Refresh storage
  */
  function refreshStorage() {
    if (isGreaterThanMaxStorageSize()) {
      syncStorage();
    }
  }
  /**
  * Show error logs to user
  */
  function printError(reporterType, error) {
    if (debugMode) {
      var reporter = console[reporterType];
      reporter.call(console, error);
    }
  }
  /**
  * Make error object properties
  */
  function makeProperties(error) {
    for (var d in defaults) {
      if (typeof defaults[d] === 'function') {
        try {
          error[d] = defaults[d]();
        } catch (e) {
          error[d] = 'Error happened while creating this property' + e.message;
        }
      } else {
        error[d] = defaults[d];
      }
    }
    for (var p in properties) {
      if (typeof properties[p] === 'function') {
        try {
          error[p] = properties[p]();
        } catch (e) {
          error[p] = 'Error happened while creating this property' + e.message;
        }
      } else {
        error[p] = properties[p];
      }
    }
  }
  /**
  * Taking snapshot of DOM
  */
  function takeSnapshot(callback) {
    html2canvas(document.body, {
      onrendered: function (snapshot) {
        callback(snapshot);
      }
    });
  }
  /**
  * Report errors based on reporter type
  */
  function report(reporterType, errorArgs) {
    var msg, url, lineNumber, colNumber, errorObject;
    if (typeof errorArgs === 'object') {
      msg = errorArgs[0];
      url = errorArgs[1];
      lineNumber = errorArgs[2];
      colNumber = errorArgs[3];
      errorObject = errorArgs[4];
    } else if (typeof errorArgs === 'string') {
      //handels manual reports
      msg = errorArgs, url = undefinde, lineNumber = undefinde, colNumber = undefinde;
      errorObject = undefinde;
    }
    var error = getErrorBasedOnDataType(msg, url, lineNumber, colNumber, errorObject);
    takeSnapshot(function (snapshot) {
      addProperties({
        ViewType: reporterType,
        Snapshot: snapshot.toDataURL()
      });
      makeProperties(error);
      stack.push(error);
      Warehouse.save(error);
      printError(reporterType, error);
      refreshStorage();
    });
  }
  /**
  * Remove all errors from stack
  */
  function clearStack() {
    while (stack.pop() != null);
  }
  /**
  * Print stack as string
  */
  function printStack() {
    stack.forEach(function (error) {
      console.log(error);
    });
  }
  /**
  * Return namespace
  */
  function getNamespace() {
    return namespace;
  }
  /**
  * Remove all errors from storage
  */
  function clearStorage() {
    Warehouse.clear();
  }
  /**
  * Return all error objects as JSON
  */
  function storageToJSON() {
    return Warehouse.toJSON();
  }
  /**
  * Sync errors in storage with server database
  */
  function syncStorage(successCallback, failCallback) {
    var storageJSON = storageToJSON();
    if (storageJSON) {
      // call a web service via ajax in order to save error object in server db
      Sender.send(errConfig.addToServerDbUrl, storageJSON, function () {
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
  /**
  * Add new property to errortracker report object
  */
  function addProperties(propObj) {
    for (var prop in propObj) {
      properties[prop] = propObj[prop];
    }
  }
  /**
  * Initialize errortracker
  */
  function initialize(c) {
    errConfig = c;
    Warehouse.initialize(c.storage);
  }
  /**
  * Our global object act as ErrorTracker
  */
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
    addProperties: addProperties
  };
}(Normalizer, Warehouse, BrowserDetector, Sender));
ErrorTracker = undefined;}());