modcon.js
=========

**modcon.js** is a JavaScript Modular Framework &amp; Execution Controller. It provides an easy way to write and autoload, and even reload, JavaScript modules within your project.

## Dependencies

  1. jQuery

## Usage

We use this library to queue and execute JavaScript modules that use this framework at specific times. These times are:

  1. On Document Ready (similar to jQuery's infamous ```$(document).ready(...)```)
  2. Whenever a significant portion of the DOM has been updated

The traditional example of the second is when a view is being served inside a dialog box, like a quickview popup of a Product Detail's content. All of the scripts should work the same as they do on the parent page, but should be scoped specifically to that dialog popup... But more on this later on.

### Order of Operations

**modcon.js** or **modcon.min.js** must be before any of your other modules are loaded. At [WebLinc](http://weblinc.com) we use this library in our Ruby on Rails environments, loaded at the bottom of each page via a manifest file.

Here's an example of how our manifests are set up for our Rails sites:

```javascript
/* -----------------------------------------------------------------------------
1. Load third-party, non-modcon.js-enabled modules (jQuery, jQuery Plugins, etc)
----------------------------------------------------------------------------- */

//= require lo_dash
//= require jquery
//= require jquery_validate
// etc

/* -----------------------------------------------------------------------------
2. Load .jst.ejs templates (you may or may not have these in your project)
----------------------------------------------------------------------------- */

//= require_directory ./templates

/* -----------------------------------------------------------------------------
3. Initialize the modules controller
----------------------------------------------------------------------------- */

//= require modcon

/* -----------------------------------------------------------------------------
4. Load modcon.js enabled modules
----------------------------------------------------------------------------- */

//= require modules/cookies
//= require modules/server_state
//= require modules/break_points
//= require modules/dialogs
// etc

/* -----------------------------------------------------------------------------
5. Fire all modcon.js modules in the domReady queue
----------------------------------------------------------------------------- */

WEBLINC.modules.domReady();
```

This should give you an idea of how to adopt this for your project, even if you're not using the Rails Asset Pipeline for your project. Third-party and non-modcon.js-enabled scripts first, then modcon.js, then all of your modules. Finally you fire all of your modules registered in the domReady queue (managed by the library).

You might think it strange to load every script on every page, but that is the default realty of the Rails Asset Pipeline. You trade off a heavy initial page load for having every other page be cached. Your modules must be written in such a way that they are aware of a dependent element to enact upon.

### How to Write a modcon.js-Enabled Module

Here's an example of a basic modcon.js-enabled module structure.

All of your modules that pipe through modcon.js should follow this basic structure:

```javascript
WEBLINC.myModuleName = (function () {
    'use strict';

    var doSomethingWithCollection = function ($collection) {
            // do something specific with collection. all of your functions
            // should perform one task and one task only.
            $collection.each(function () {
                $(this).remove();
            });
        },

        init = function ($scope) {
            // set a collection variable that this module absolutely depends on
            // to function. This can be a class, an ID, a data-attribute, etc.
            // constructing the query like so will make sure that your selection
            // is scoped properly, since modcon.js handles scoping for you
            var $collection = $('.some-selector', $scope);

            // if that collection is empty, immediately return so the module
            // will stop running as quickly as possible. We prefer using lo_dash
            // to simplify as: (_.isEmpty($collection)) but lo_dash
            // is not a dependency for modcon.js to run
            if ($collection.length === 0) { return; }

            doSomethingWithCollection($collection);
        };

    // add this module to the "document is ready" queue
    WEBLINC.modules.onDomReady(init);
    // add this module to the "dom has been updated" queue
    WEBLINC.modules.onDomUpdate(init);

    // here is where you can open up 'private' methods as 'public methods'
    // by adding them to the object that is being returned. Any method added to
    // this object can be called by another module like so:
    // WEBLINC.myModuleName.someFunction()
    return {
      init: init
    };
}());
```

A more complex module could be written like so:

```javascript
WEBLINC.myCrazyHugeModule = (function () {
    'use strict';

    var doSomethingWithCollection = function ($collection) {
            $collection.each(function () {
                $(this).remove();
            });
        },

        consumeInstance = function (instance) {
            // this gives you the ability to pass specific pieces of the instance
            // around to other functions, or if a function requires two or more
            // pieces the instance, you could pass the entire instance object
            // to that function
            doSomethingWithCollection(instance.$collection);
        },

        createInstance = function ($scope, $collection) {
            return {
                $scope: $scope,
                $collection: $collection,
                $somethingElse: $('.some-other-element', $scope),
                someData: $('[data-attribute]').data('myData')
            };
        },

        init = function ($scope) {
            var $collection = $('.some-selector', $scope),
                instance;

            if ($collection.length === 0) { return; }

            instance = createInstance($scope, $collection);

            consumeInstance(instance);
        };

    WEBLINC.modules.onDomReady(init);
    WEBLINC.modules.onDomUpdate(init);

    return {
      init: init
    };
}());
```

### Triggering a Dom Update

From inside a module, at any time, you can rerun all of your scripts added to the **domUpdate** queue by firing:

```javascript
WEBLINC.modules.domUpdate($('.some-scope'));
```

Then all of the modules that include the call to the onDomUpdate() function will be rerun, replacing the $scope with whatever is passed in to the code above.
