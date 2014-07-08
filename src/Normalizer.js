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
                StackTrace: (function () {
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
                StackTrace: 'Firefox < 31 does not pass stack trace to error event',
                ColumnNumber: 'Firefox < 31 does not pass columnNumber to error event'
            }
        },
        FirefoxAbove31: function (errorObject) {
            return {
                StackTrace: (function () {
                    return errorObject.stack.replace(/(?:\n@:0)?\s+$/m, '')
                        .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                        .split('\n');
                }()),
                ColumnNumber: errorObject.columnNumber
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
        error.Message = msg;
        error.FileName = url;
        error.LineNumber = lineNumber;
        error.ColumnNumber = error.ColumnNumber || columnNumber ;

        return error;
    }

    return {
        normalizeError: normalizeError
    }

})
