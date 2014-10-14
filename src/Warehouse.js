define(['whenthen'], function (Async) {

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
        MAX_STORAGE_SIZE = storage.maxSize || MAX_STORAGE_SIZE;
    };

    function detectPereferdAvailableStorage() {
        var pereferdStorageType;
        // preffered storage
        if ('localStorage' in window && window['localStorage'] !== null) {
            pereferdStorageType = 'localStorage';
        } else if (window.indexedDB || window.mozIndexedDB ||
            window.webkitIndexedDB || window.msIndexedDB) {         // secondary storage
            // keep IndexedDB instance
            pereferdStorageType = 'indexedDb';
        } else {
            // fallback storage
            var pereferdStorageType = 'cookie';
        }

        return pereferdStorageType;
    }

    function getStorageStatus (passStatus) {
        Async.when(function (pass) {
            getSize(pass);
        }).then(function (results) {
            if (results.storageContentSize > MAX_STORAGE_SIZE())
                passStatus('storageStatus', 'full');
            else
                passStatus('storageStatus', 'notFull');
        });
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
    }

    function save( item ) {
        storageFunctionMap.
                save[storage.type](item);
    }

    function remove() {
        storageFunctionMap.
                remove[storage.type]();
    }

    function update() {
        storageFunctionMap.
            update[storage.type]();
    }

    function clear() {
        storageFunctionMap.
            clear[storage.type]();
    }

    function toJSON() {
        return storageFunctionMap.
            toJSON[storage.type]();
    }

    function getSize(pass) {
        return storageFunctionMap.
            getSize[storage.type](pass);
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

    function getLocalStorageSize(pass) {
        pass('storageContentSize', localStorage.getItem(errortracker.getNamespace()).length);
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

    function getIndexedDbSize(pass) {
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

    function getCookieSize(pass) {
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
        MAX_STORAGE_SIZE: function () { return MAX_STORAGE_SIZE; },
        save: save,
        remove: remove,
        update: update,
        clear: clear,
        toJSON: toJSON,
        getSize: getSize,
        getStorageStatus: getStorageStatus,
        initialize: initialize
    }

});