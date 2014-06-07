define([], function () {


    /**
    * Get appropriate browser based on error object
    */
    function getBrowser( err ) {
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

    return {
        getBrowser: getBrowser
    }

});