define(['BrowserDetector'], function ( BrowserDetector ) {

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
                stackTrace: (function () {
                    return (errorObject.stack + '\n')
                        .replace(/^[\s\S]+?\s+at\s+/, ' at ') // remove message
                        .replace(/^\s+(at eval )?at\s+/gm, '') // remove 'at' and indentation
                        .replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2')
                        .replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)')
                        .replace(/^(.+) \((.+)\)$/gm, '$1@$2')
                        .split('\n')
                        .slice(0, -1);
                }())
            }
        },
        FirefoxBelow31: function (errorObject) {
            return {
                stackTrace: 'Firefox < 31 does not pass stack trace to error event',
                columnNumber: 'Firefox < 31 does not pass columnNumber to error event'
            }
        },
        FirefoxAbove31: function (errorObject) {
            return {
                stackTrace: (function () {
                    return errorObject.stack.replace(/(?:\n@:0)?\s+$/m, '')
                        .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                        .split('\n');
                }()),
                columnNumber: errorObject.columnNumber
            }
        }
    }

    /**
    * Normalize error object based on browser
    */
    function normalizeError(msg, url, lineNumber, columnNumber, errorObject) {
        // get error mode
        var errorMode = BrowserDetector.getBrowser(msg, url, lineNumber, columnNumber, errorObject);

        // normalize error based on browser
        var error = browsers[errorMode](errorObject);

        // add same properties to error object
        error.message = msg;
        error.fileName = url;
        error.lineNumber = lineNumber;
        error.columnNumber = error.columnNumber || columnNumber ;

        return error;
    }

    return {
        normalizeError: normalizeError
    }

})
