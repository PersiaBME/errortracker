require([
    'Normalizer',
    'Warehouse',
    'BrowserDetector',
    'Sender'
], function (Normalizer, Warehouse, BrowserDetector, Sender) {

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
    }

    /**
    * Defualt error properties
    */
    var defaults = {
        dateTime: new Date(),
        location: window.location.href,
        agent: navigator.userAgent
    }

    /**
    * Keeps errortracker storages
    */
    var storages = {
        LOCAL_STORAGE: 'localStorage',
        INDEXED_DB: 'indexedDb',
        COOKIE: 'cookie'
    }

    /**
    * Enable debug Mode
    */
    function enableDebugMode() {
        debugMode = true;
    };

    /**
    * Disable debug mode
    */
    function disableDebugMode() {
        debugMode = false;
    };

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
            reporter.call(console, error)
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
            if (typeof properties[p] === 'function') {
                error[p] = properties[p]();
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
    function report(reporterType, err) {
        var error = getErrorBasedOnDataType(err);
        takeSnapshot(function (snapshot) {
            addProperties({ viewType: reporterType, snapshot: snapshot.toDataURL() });
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
        // we can also do this: stack = [];
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
    }

});
