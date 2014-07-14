errortracker
============

A Simple Library To Track Client Side Errors

#1.Quick start
Include errortracker.js and htmlToConvas.js(https://github.com/niklasvh/html2canvas.git) at the very beginning of your scripts
```javascript
    <script src="errortracker/dist/htmlToConvas.js" />
    <script src="errortracker/dist/errortracker.js" />
```
Then initialize it and start listening for errors that bubble up:
```javascript
    //initialize it
    errortracker.initialize({
        storage: {
            maxSize: 1000,
            type: 'localStorage'
        },
        addToServerDbUrl: '/api/to/add/errorReports'
    });

    //catch errors
    $(document).ready(function(){
        window.onerror = function () {
            errortracker.report('error', arguments);
        }
    });
```
Now the error tracker will track your clients javascript errors and store them in their localstorage, these errors will be sent to server as soon as they reach the maximum size (1000 characters).

##reportType:
You should specify a report type such as ‘log’, ‘error’, ‘warn’, or ‘info’. These report types are also stored in an objet inside error tracker and you can access them via reporters object (e.g errortracker.reporters.FATAL).
It’s just a wrapper for different types of console methods in order to create a better interface for other developers
##stringMessage/errorObject:
You can either pass a simple string message or an error object to report method. But keep it in mind that if you pass an error object you will have a stackTrace property in your reports.

#2.Abstract View of ErrorTracker.js?
Tracking client side errors is a time consuming and also a boring task. Sometimes we can’t trace what errors were raised and where they occurred. But if we have a library that operates alongside our application and track all errors, we are sure that we trace all of them. In fact, we need an independent library (doesn’t need any third party libraries such as jquery, or underscore) that works besides our main application. Its primary job should be gathering application errors and save them in an appropriate storage.

#3.Dealing with caught exceptions
You might want to log your caught exeptions as well, in that case the error event would not bubble up and using window.onerror would not record all errors. There is an alternative though. You can manually use report method to record errors:
```javascript
    try {
        someFunctionalityHere();
    } catch (err) {
        errortracker.report( errortracker.reporters.FATAL, err );
        handleTheError();
    }
```

#4.Debug mode
You might want to enable or disable debug mode based on your application enviroment, debug mode will print out reported errors to your console
```javascript
    //enable it like this
    errortracker.enableDebugMode();
    //or just turn it off
    errortracker.disableDebugMode();  
```

#5.Adding custom fields
Every report object contains a few useful default parameters such as error type, date time and user agent. However you might need to add some custom fields that are specific to your application for example your client user name. Adding such fields is easy. Here is an example of adding user name to report objects.

```javascript
errortracker.addProperties({
	userName: function () { return myCredentialModule.getCurrentUserName() }
});
```
Now your report objects will contain a field called userName.

Note: All of the default properties in the error report are chosen with this fact in mind that they will be present when a report object is being made, so you have to keep this important fact in mind when defining your custom fields otherwise they will be undefined. Also keep that in mind that the error tracker will execute every custom property if they are function. The execution will be done when ever an error occurs.

#6.Reporting
You can also use error tracker to report thing like a script beeing executed. This can come in handy when you want to track if your users are using a new feature of your application or not. 
```javascript
    function ourNewButtonHandler () {
        errortracker.report( errortracker.reporters.INFO, 'Clint has clicked on that new button' );
        doSomeCoolThing();
    }
```
#7.Customizing error exclude

#8.Take a deeper look into ErrorTracker.js
To simplify development process of ErrorTracker library, we break it into separated modules as follow:
ErrorTracker
it contains basic properties and behaviors of tracking errors.
Warehouse
it is responsible for retrieving and storing data in desired storage such localStorage, IndexedDB, or cookie.
BrowserDetector
a small module in order to detect what browser we are dealing with.
Normalizer
normalize error object so that all browsers share the same look and feel of their errors.
Sender
a module to communicate with server via Ajax calls in order to send error objects.
In the development mode we are working on these modules, but whenever we want to release a new version of ErrorTracker, a grunt task runs and delete all define and require statements of ErrorTracker. In fact, our production mode just have a single file called errortracker.js that contains all other modules functionality.

#9.Build process
As mentioned earlier our development and production process are two different modes. We develop ErrorTracker’s modules when we are in development mode and release it with our grunt task when we want to release a new version. In order to release new version of ErrorTracker you should install grunt in your system. Follow below steps to install it:

	1. Install NodeJs (instructions here http://nodejs.org).
	2. Then open nodejs terminal and enter following commands:
	  a. npm install grunt -g
	  b. npm install grunt-cli -g
	  c. npm install bower -g
	3. go to errortracker folder in your application and enter the following command:
	 a. npm install
	4. then enter the following command in order to make a new version of ErrorTracker
	  a. grunt

#10.API
<table>
    <tr>
        <td>MethodName</td>
        <td>Descriptions</td>
    </tr>
    <tr>
        <td>getNamespace</td>
        <td>return errortracker namespace to use in storage</td>
    </tr>
    <tr>
        <td>enableDebugMode</td>
        <td>enable debug Mode</td>
    </tr>
    <tr>
        <td>disableDebugMode</td>
        <td>disable debug mode</td>
    </tr>
    <tr>
        <td>report</td>
        <td>report errors based on reporter type</td>
    </tr>
    <tr>
        <td>reporters</td>
        <td>contains different types of reports</td>
    </tr>
    <tr>
        <td>clearStack</td>
        <td>remove all errors from stack</td>
    </tr>
    <tr>
        <td>printStack</td>
        <td>print all errors in stack</td>
    </tr>
    <tr>
        <td>clearStorage</td>
        <td>remove all errors from storage</td>
    </tr>
    <tr>
        <td>syncStorage</td>
        <td>sync errors in storage with server database</td>
    </tr>
</table>
