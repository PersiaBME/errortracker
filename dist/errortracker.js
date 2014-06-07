;(function() {var BrowserDetector, Normalizer, Warehouse, Sender, ErrorTracker;
BrowserDetector = function () {
    /**
    * Get appropriate browser based on error object
    */
    function getBrowser(err) {
        if ((err['arguments'] || !err.fileName) && err.stack) {
            return 'chrome';
        }
        if (err.stack && err.sourceURL) {
            return 'safari';
        }
        if (err.stack && err.number) {
            return 'ie';
        }
        if (err.stack && err.fileName) {
            return 'firefox';
        }
        return 'chrome';
    }
    return { getBrowser: getBrowser };
}();
Normalizer = function () {
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
                    stackTrace: function () {
                        return (errorObject.stack + '\n').replace(/^[\s\S]+?\s+at\s+/, ' at ').replace(/^\s+(at eval )?at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)').replace(/^(.+) \((.+)\)$/gm, '$1@$2').split('\n').slice(0, -1);
                    }()
                };
            },
            firefox: function (errorObject) {
                return {
                    stackTrace: function () {
                        return errorObject.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@').split('\n');
                    }(),
                    lineNumber: errorObject.lineNumber,
                    columnNumber: errorObject.columnNumber,
                    fileName: errorObject.fileName
                };
            }
        };
    /**
    * Normalize error object based on browser
    */
    function normalizeError(errorObject) {
        // get error mode
        var errorMode = BrowserDetector.getBrowser(errorObject);
        // normalize error based on browser
        var error = browsers[errorMode](errorObject);
        // add same properties to error object
        error.message = errorObject.message;
        return error;
    }
    return { normalizeError: normalizeError };
}();
Warehouse = function () {
    // 5 MB is 1048576 bytes
    // each char in javascript is byte so we need 524288 byte
    var MAX_STORAGE_SIZE = 500000;
    var storage = {};
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
        console.log('localStorage: update function');
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
        console.log('IndexedDb: save function');
    }
    function removeFromIndexedDb() {
        console.log('IndexedDb: remove function');
    }
    function updateFromIndexedDb() {
        console.log('IndexedDb: update function');
    }
    function clearIndexedDb() {
        console.log('IndexedDb: clear function');
    }
    function indexedDbToJSON() {
        console.log('IndexedDb: toJSON function');
    }
    function getIndexedDbSize() {
        console.log('IndexedDb: getSize function');
    }
    // cookie CRUD
    function saveInCookie() {
        console.log('Cookie: save function');
    }
    function removeFromCookie() {
        console.log('Cookie: remove function');
    }
    function updateFromCookie() {
        console.log('Cookie: update function');
    }
    function clearCookie() {
        console.log('Cookie: clear function');
    }
    function cookieToJSON() {
        console.log('Cookie: toJSON function');
    }
    function getCookieSize() {
        console.log('Cookie: getSize function');
    }
    (function (factory) {
        // preffered storage
        if ('localStorage' in window && window['localStorage'] !== null) {
            storageType = 'localStorage';
            factory(storageType);
            return;
        }
        // secondary storage
        if (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) {
            // keep IndexedDB instance
            storageType = 'indexedDb';
            factory(storageType);
            return;
        }
        // fallback storage
        var storageType = 'cookie';
        factory(storageType);
    }(function (storageType) {
        storage.save = function () {
            switch (storageType) {
            case 'localStorage':
                return saveInLocalStorage;
                break;
            case 'indexedDb':
                return saveInIndexedDb;
                break;
            default:
                return saveInCookie;
                break;
            }
        }();
        storage.remove = function () {
            switch (storageType) {
            case 'localStorage':
                return removeFromLocalStorage;
                break;
            case 'indexedDb':
                return removeFromIndexedDb;
                break;
            default:
                return removeFromCookie;
                break;
            }
        }();
        storage.update = function () {
            switch (storageType) {
            case 'localStorage':
                return updateInLocalStorage;
                break;
            case 'indexedDb':
                return updateInIndexedDb;
                break;
            default:
                return updateInCookie;
                break;
            }
        }();
        storage.clear = function () {
            switch (storageType) {
            case 'localStorage':
                return clearLocalStorage;
                break;
            case 'indexedDb':
                return clearIndexedDb;
                break;
            default:
                return clearCookie;
                break;
            }
        }();
        storage.toJSON = function () {
            switch (storageType) {
            case 'localStorage':
                return localStorageToJSON;
                break;
            case 'indexedDb':
                return indexedDbToJSON;
                break;
            default:
                return cookieToJSON;
                break;
            }
        }();
        storage.getSize = function () {
            switch (storageType) {
            case 'localStorage':
                return getLocalStorageSize;
                break;
            case 'indexedDb':
                return getIndexedDbSize;
                break;
            default:
                return getCookieSize;
                break;
            }
        }();
    }));
    function save(item) {
        storage.save(item);
    }
    function remove() {
        storage.remove();
    }
    function update() {
        storage.update();
    }
    function clear() {
        storage.clear();
    }
    function toJSON() {
        return storage.toJSON();
    }
    function getSize() {
        return storage.getSize();
    }
    return {
        MAX_STORAGE_SIZE: MAX_STORAGE_SIZE,
        save: save,
        remove: remove,
        update: update,
        clear: clear,
        toJSON: toJSON,
        getSize: getSize
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
        if (json) {
            // req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
            req.setRequestHeader('Content-type', 'application/json');
        }
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
(function () {
    /**
    * ErrorTracker namespace
    */
    var namespace = 'errortracker';
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
            dateTime: new Date(),
            location: window.location.href,
            agent: navigator.userAgent
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
    function getErrorBasedOnDataType(err) {
        var error = {};
        if (typeof err === 'string') {
            error.message = err;
        } else {
            error = Normalizer.normalizeError(err);
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
            error[d] = defaults[d];
        }
        for (var p in properties) {
            error[p] = properties[p];
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
    function report(reporterType, err) {
        var error = getErrorBasedOnDataType(err);
        takeSnapshot(function (snapshot) {
            addProperties({
                viewType: reporterType,
                snapshot: snapshot.toDataURL()
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
        // call a web service via ajax in order to save error object in server db
        Sender.send('/api/ErrorLoggerApi/Add/', storageJSON, function () {
            clearStorage();
            clearStack();
            if (typeof successCallback === 'function')
                successCallback();
        }, function () {
            if (typeof failCallback === 'function')
                failCallback();
        });
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
    * Our global object act as ErrorTracker
    */
    window.errortracker = {
        getNamespace: getNamespace,
        enableDebugMode: enableDebugMode,
        disableDebugMode: disableDebugMode,
        report: report,
        reporters: reporters,
        clearStack: clearStack,
        printStack: printStack,
        clearStorage: clearStorage,
        storageToJSON: storageToJSON,
        syncStorage: syncStorage,
        addProperties: addProperties
    };
}());
ErrorTracker = undefined;}());