define([], function () {


    var XMLHttpFactories = [
	    function () { return new XMLHttpRequest() },
	    function () { return new ActiveXObject("Msxml2.XMLHTTP") },
	    function () { return new ActiveXObject("Msxml3.XMLHTTP") },
	    function () { return new ActiveXObject("Microsoft.XMLHTTP") }
    ];

    function createXMLHTTPObject() {
        var xmlhttp = false;
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
            }
            catch (e) {
                continue;
            }
            break;
        }
        return xmlhttp;
    }

    function send(url, json, successCallback, failCallback) {
        var req = createXMLHTTPObject();
        var method = "POST";
	    req.open(method,url,true);
	    if (json) {
	        req.setRequestHeader('Content-type', 'application/json');
	    }
	    req.onreadystatechange = function () {
	        if (req.readyState != 4) {
	            failCallback();
	            return;
	        }
	        if (req.status != 200 && req.status != 304) {
	            failCallback();
			    return;
		    }
		    successCallback(req);
	    }
	    if (req.readyState == 4) return;
	    req.send(JSON.stringify(json));
    }


    return {
        send: send
    }

});