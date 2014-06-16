errortracker
============

A Simple Library To Track Client Side Errors


#1.Abstract View of ErrorTracker.js?
Tracking client side errors is a time consuming and also a boring task. Sometimes we can’t trace what errors were raised and where they occurred. But if we have a library that operates alongside our application and track all errors, we are sure that we trace all of them. In fact, we need an independent library (doesn’t need any third party libraries such as jquery, or underscore) that works besides our main application. Its primary job should be gathering application errors and save them in an appropriate storage.
#2.How ErrorTracker.js works?
In order to use ErrorTracker.js in your application, you should first include it as follow:
<pre>
  <code>
    &lt;script src="path/to/errortracker.js"&gt;&lt;/script&gt;
  </code>
</pre>
After that, you should decide whether you want to see errors in browser console or not. If you want so, you should enable ErrorTracker debug mode like below:
<pre>
  <code>
    errortracker.enableDebugMode();
  </code>
</pre>
ErrorTracker also have a method to disable debug mode. You can guess its name 
<pre>
  <code>
    errortracker.disableDebugMode();  
  </code>
</pre>
And finally you can report an error with the following command:
<pre>
  <code>
    errortracker.report( reporterType, stringMessage/errrorObject );
  </code>
</pre>
##reportType: 
You should specify a report type such as ‘log’, ‘error’, ‘warn’, or ‘info’.
It’s just a wrapper for different types of console methods in order to create a better interface for other developers
##stringMessage/errorObject: 
You can either pass a simple string message or an error object to report method. But keep it in mind that if you pass an error object you have a stackTrace property.
#3.Setting up the configurations object

#4.Take a deeper look into ErrorTracker.js
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
#5.Adding custom fields
Every report object contains a few useful default parameters such as error type, date time and user agent. However you might need to add some custom fields that are specific to your application for example your client user name. Adding such fields is easy. Here is an example of adding user name to report objects.

<pre>
  <code>
    errortracker.addProperties({
    	userName: myCredentialModule.getCurrentUserName
    });
  </code>
</pre>

Now your report objects will contain a field called userName. 

Note: All of the default properties in the error report are chosen with this fact in mind that they will be present when a report object is being made, so you have to keep this important fact in mind when defining your custom fields otherwise they will be undefined or bad things might happen. Also keep that in mind that the error tracker will execute every custom property if they are function. The execution will be done when ever an error accures. 

#6.	Build process
As mentioned earlier our development and production process are two different modes. We develop ErrorTracker’s modules when we are in development mode and release it with our grunt task when we want to release a new version. In order to release new version of ErrorTracker you should install grunt in your system. Follow below steps to install it:

	1. Install NodeJs from node website http://nodejs.org.
	2. Then open nodejs terminal and enter following commands:
	  a. npm install grunt
	  b. npm install grunt-cli
	  c. npm install bower
	3. go to errortracker folder in your application and enter the following command:
	 a. npm install –g amdclean
	4. then enter the following command in order to make a new version of ErrorTracker
	  a. grunt
	7. ErrorTracker API

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
        <td>keep track of different kind of reporters</td>
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
	
	
	
	
	
	
	

	


