define([], function () {


    /**
    * Get appropriate browser based on error object
    */
    function getBrowser( msg, url, lineNumber, colNumber, errorObject ) {
        if (typeof errorObject === 'object' && typeof colNumber === 'number') {
            return 'chrome';
        }
        if (typeof errorObject === 'undefined' && typeof colNumber === 'undefined') {
            return 'FirefoxBelow31';
        }

        return 'chrome';
    }

    return {
        getBrowser: getBrowser
    }

});