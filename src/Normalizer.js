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
        firefox: function (errorObject) {
            return {
                stackTrace: (function () {
                    return errorObject.stack.replace(/(?:\n@:0)?\s+$/m, '')
                        .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                        .split('\n');
                }()),
                lineNumber: errorObject.lineNumber,
                columnNumber: errorObject.columnNumber,
                fileName: errorObject.fileName
            }
        }
    }

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

    return {
        normalizeError: normalizeError
    }

})
