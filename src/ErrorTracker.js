require([
    'Normalizer',
    'Warehouse',
    'BrowserDetector',
    'Sender'
], function (Normalizer, Warehouse, BrowserDetector, Sender) {

    function ErrorObject (error) {
        for (var err in error) {
            // TODO: don't forget to check against hasOwnProperty
            this[err] = error[err];
        }
    }

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
        DateTime: function () { return new Date(); },
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
                error[d] = 'Error happened while creating this property' +
                  e.message;
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
                error[p] = 'Error happened while creating this property' +
                  e.message;
              }
            } else {
                error[p] = properties[p];
            }
        }
    }

    //Taking snapshot of DOM
    function takeSnapshot (callback) {
        html2canvas(document.body, {
            onrendered: function (snapshot) {
                callback(snapshot);
            }
        });
    }

    function isIgnoredError (errorObject) {
        var isIgnored = false;
        var finalResults = false;
        var partialResults = [];

        //make sure user has configured an exclude object
        if (typeof options.exclude !== 'object' || typeof options.exclude.length === 'undefinde')
            return false;

        var rules = options.exclude;
        var property;
        for (property in rules) {
            if (!rules.hasOwnProperty(property))
                continue;

            partialResults.push( validateRule (rules[property], errorObject) );
        }

        for (var i = 0; i < partialResults.length; i++) {
            finalResults = finalResults || partialResults[i];
        }

        return finalResults;

        function validateRule (validationObject, errorObject) {
            var finalResults = validationObject._consider === 'any' ? false : true;
            var partialResults = [];

            for (property in validationObject) {
                if (!validationObject.hasOwnProperty(property) || property.slice(0,1) === '_')
                    continue;

                var expression = new RegExp(validationObject[property]);
                partialResults.push( expression.test(errorObject[property]) );
                //console.log(validationObject[property], '-> ', errorObject[property]);
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

        var error = Normalizer.normalizeError(extraInfo);
        var errorObject = new ErrorObject(error);

        takeSnapshot(function (snapshot) {
            addProperties({ ViewType: reporterType, Snapshot: snapshot.toDataURL() });
            makeProperties(errorObject);
            stack.push(errorObject);

            if ( isIgnoredError(errorObject) ) {
                return;
            }

            Warehouse.save(errorObject);
            printError(reporterType, errorObject);
            refreshStorage();
        });
    }

    function clearStack() {
        while (stack.pop() != null);
        // we can also do this: stack = [];
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

});
