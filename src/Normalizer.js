define(['BrowserDetector'], function ( BrowserDetector ) {

   /**
   * Different browsers have different behaviours in handling errors
   * We keep each browser with its own behaviour in a hash table
   *
   * Thanks to the stacktracejs library
   * url: https://github.com/stacktracejs/stacktrace.js/
   */
    var browsers = {
        Chrome: function (stack) {
            return (stack + '\n')
                .replace(/^[\s\S]+?\s+at\s+/, ' at ') // remove message
                .replace(/^\s+(at eval )?at\s+/gm, '') // remove 'at' and indentation
                .replace(/^([^\(]+?)([\n$])/gm, '{anonymous}() ($1)$2')
                .replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}() ($1)')
                .replace(/^(.+) \((.+)\)$/gm, '$1@$2')
                .split('\n')
                .slice(0, -1);
        },
        FirefoxBelow31: function (stack) {
            return 'Firefox < 31 does not pass stack trace to error event';
        },
        FirefoxAbove31: function (stack) {
            return stack.replace(/(?:\n@:0)?\s+$/m, '')
                .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                .split('\n');
        },
        defaultParser: function (stack) {
            return stack.replace(/(?:\n@:0)?\s+$/m, '')
                .replace(/^(?:\((\S*)\))?@/gm, '{anonymous}($1)@')
                .split('\n');
        }
    }

    function normalizeStackTrace(stackTrace) {
        var postFix = '',
            browserName = BrowserDetector.getBrowser().name;

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
            error.StackTrace = normalizeStackTrace( mixedError[4].stack );


            //TODO make sure you handle window errors of older verions of firefox,
            //they will arive here as arguments object but they don't have lenght of 5
        } else if (typeof mixedError === 'object') {
            //probably comming form a try catch statement and manually reported                     

            //add initial properties
            error.Message = mixedError.message;
            error.StackTrace = normalizeStackTrace( mixedError.stack );

        } else if (typeof mixedError === 'string') {
            //handels manual reports

            //add initial properties
            error.Message = mixedError;
        }

        return error;
    }

    return {
        normalizeError: normalizeError
    }

})
