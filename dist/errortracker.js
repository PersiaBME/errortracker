;(function() {var BrowserDetector, Normalizer, Warehouse, Sender, ErrorTracker;
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
      }
    };
  function normalizeStackTrace(stackTrace) {
    var postFix = '', browserName = BrowserDetector.getBrowser().name;
    if (browserName === 'Firefox') {
      postFix = BrowserDetector.getBrowser().version < 31 ? 'Below31' : 'Above31';
    }
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
  var options = {};
  var namespace = 'errortracker';
  //Keeps error properties
  var properties = {};
  //Determine whether errors should be logged to user or not
  var debugMode = false;
  //Keeps all errors in a stack structure
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
  //Defualt error properties
  var defaults = {
      DateTime: function () {
        return new Date();
      },
      Location: window.location.href,
      Agent: navigator.userAgent
    };
  //Keeps errortracker storages
  var storages = {
      LOCAL_STORAGE: 'localStorage',
      INDEXED_DB: 'indexedDb',
      COOKIE: 'cookie'
    };
  function enableDebugMode() {
    debugMode = true;
  }
  function disableDebugMode() {
    debugMode = false;
  }
  //checks if storage is full or not
  function isGreaterThanMaxStorageSize() {
    if (Warehouse.getSize() > Warehouse.MAX_STORAGE_SIZE) {
      return true;
    } else {
      return false;
    }
  }
  //sync storage if storage is full
  function refreshStorage() {
    if (isGreaterThanMaxStorageSize()) {
      syncStorage();
    }
  }
  //prints error logs in console
  function printError(reporterType, error) {
    if (debugMode) {
      var reporter = console[reporterType];
      reporter.call(console, error);
    }
  }
  //Make error object properties
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
  //Taking snapshot of DOM
  function takeSnapshot(callback) {
    html2canvas(document.body, {
      onrendered: function (snapshot) {
        callback(snapshot);
      }
    });
  }
  function isIgnoredError(errorObject) {
    var isIgnored = false;
    var finalResults = false;
    var partialResults = [];
    //make sure user has configured an exclude object
    if (typeof options.exclude !== 'object' && options.exclude.length)
      return false;
    rules = options.exclude;
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
        partialResults.push(expression.test(errorObject[property]));  //console.log(validationObject[property], '-> ', errorObject[property]);
      }
      //console.log(partialResults);
      for (var i = 0; i < partialResults.length; i++) {
        if (validationObject._consider === 'any')
          finalResults = finalResults || partialResults[i];
        else
          finalResults = finalResults && partialResults[i];
      }
      return finalResults;
    }
  }
  //main function of errortracker
  function report(reporterType, extraInfo) {
    if (typeof reporterType !== 'string') {
      console.warn('errortracker only accepts strings as first argument');
    }
    error = Normalizer.normalizeError(extraInfo);
    takeSnapshot(function (snapshot) {
      addProperties({
        ViewType: reporterType,
        Snapshot: snapshot.toDataURL()
      });
      makeProperties(error);
      stack.push(error);
      if (isIgnoredError(error)) {
        return;
      }
      Warehouse.save(error);
      printError(reporterType, error);
      refreshStorage();
    });
  }
  function clearStack() {
    while (stack.pop() != null);
  }
  //prints out a string version of stack into console
  function printStack() {
    stack.forEach(function (error) {
      console.log(error);
    });
  }
  //return namespace
  function getNamespace() {
    return namespace;
  }
  //remove all errors from storage
  function clearStorage() {
    Warehouse.clear();
  }
  //retunrs all error objects as JSON
  function storageToJSON() {
    return Warehouse.toJSON();
  }
  //sync errors in storage with server database
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
  //Add new property to errortracker report object
  function addProperties(propObj) {
    for (var prop in propObj) {
      properties[prop] = propObj[prop];
    }
  }
  function initialize(c) {
    options = c;
    Warehouse.initialize(c.storage);
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
    addProperties: addProperties
  };
}(Normalizer, Warehouse, BrowserDetector, Sender));
ErrorTracker = undefined;}());