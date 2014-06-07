define([], function () {

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
        localStorage.setItem(errortracker.getNamespace(),  JSON.stringify(items));
    }
    function removeFromLocalStorage( item ) {
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
        if (window.indexedDB || window.mozIndexedDB ||
            window.webkitIndexedDB || window.msIndexedDB) {
            // keep IndexedDB instance
            storageType = 'indexedDb';
            factory(storageType);
            return
        }

        // fallback storage
        var storageType = 'cookie';
        factory(storageType);

    }(function (storageType) {

        storage.save = (function () {
            switch (storageType) {
                case 'localStorage':
                    return saveInLocalStorage;
                    break;
                case 'indexedDb':
                    return saveInIndexedDb;
                    break;
                default:
                    return saveInCookie
                    break;
            }
        }());

        storage.remove = (function () {
            switch (storageType) {
                case 'localStorage':
                    return removeFromLocalStorage;
                    break;
                case 'indexedDb':
                    return removeFromIndexedDb;
                    break;
                default:
                    return removeFromCookie
                    break;
            }
        }());

        storage.update = (function () {
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
        }());

        storage.clear = (function () {
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
        }());

        storage.toJSON = (function () {
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
        }());

        storage.getSize = (function () {
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
        }());

    }));


    function save( item ) {
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
    }

});