ModCon
=========

**ModCon** is a JavaScript Modular Framework &amp; Execution Controller. It provides an easy way to write scoped modules that can be fired at document ready and even re-fired during a significant DOM change event (like loading a view via AJAX within a dialog or modal window).

## Dependencies

  1. [Lo-Dash](https://lodash.com/)
  2. [jQuery](http://jquery.com)

## Usage

This library manages JavaScript modules, allowing APIs for each specific module to be created and registered within the ModCon framework. It also handles the execution of said modules in two ways:

  1. On Document Ready, similar to jQuery's infamous ```$(document).on('ready', ...)``` or ```$(function () { ... })```
  2. Whenever a significant portion of the DOM has been updated

The traditional example of the second type of execution is when a view is being served inside a dialog or modal window, like a quickview for a Product Detail page on an eCommerce site. In this example, you don't want to have two modules to maintain, one that handles the scope for the document, and one that handles the scope for the quickview itself. With ModCon you write your modules once and, by ensuring that everything is scoped properly, it will allow the re-execution of the same set of modules within the provided scope... but more on that later.

### Order of Operations

**modcon.js** or **modcon.min.js** must be before any of your client modules are loaded. At [WebLinc](http://weblinc.com) we use this library in our Ruby on Rails environment, loaded at the bottom of each page via a manifest file.

Here's an example of how our manifests are set up for our Rails sites:

```javascript
/* -----------------------------------------------------------------------------
1. Load third-party libraries (jQuery, jQuery Plugins, etc)
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
4. Load ModCon enabled modules
----------------------------------------------------------------------------- */

//= require modules/cookies
//= require modules/server_state
//= require modules/break_points
//= require modules/dialogs
// etc

/* -----------------------------------------------------------------------------
5. Fire all ModCon modules in the domReady queue
----------------------------------------------------------------------------- */

WEBLINC.modules.domReady();
```

This should give you an idea of how to adopt this for your project, even if you're not using the Rails Asset Pipeline for your project. Third-party libraries first, then ModCon, then all of your ModCon-dependent modules. Finally, you need to call the ```WEBLINC.modules.domReady()``` function to fire all of your modules that have been registered in the ```domReady``` queue.

If you haven't worked with Ruby on Rails before you might think it odd that all of the JavaScript for the entire project is loaded on every page. This is the default behavior for the Ruby on Rail Asset Pipeline. This naturally produces a heavy initial page load but in turn provides consistent functionality throughout the entire site. Once properly cached your single, minified, JavaScript file is all inclusive, giving you the exact same set of modules on every page.

### ModCon vs. jQuery

Given that we have every module loaded on every page, the ModCon-enabled Module is set up much differently from jQuery Plugins. You can think of it like this:

jQuery Plugins load their parent library's functionality and are called from a separate client script. For example, FancyBox's JavaScript, StyleSheets, and Images are all loaded and ready to go on every page whether or not a client JavaScript file ever uses the ```$('.selector').fancyBox()``` call.

ModCon modules act a bit differently. All modules are scoped to a property of ```window``` called ```WEBLINC```. Inside that property we have a collection of every module available to the front-end. You can even type ```window.WEBLINC``` into your console to see which modules are ready to go.

Every ModCon module makes use of the Function Expression, or ```var myFunction = function () { ... }```. Function Expressions reserve space in memory, but do not utilize that memory until they are called. For example, if I define a very large function as a Function Expression, but my module never calls it then the memory is never used.

The main thing to keep in mind is that you're essentially writing modules the exact opposite of how jQuery Plugins work. Instead of saying "Does this selector exist on-page? If so execute this functionality around this selector" you're saying "This functionality always exists. If this selector exists on page, then I would like to apply this functionality to this selector."

Another significant difference between ModCon Modules and jQuery Plugins is scope. Scope can be thought of as a "parent" element for the functionality of the module or plugin. In jQuery Plugins you are supplying the plugin with a starting point by writing ```$('.selector').pluginHook()```. At this point the Plugin takes over, defines what it thinks it's scope should be and rolls with it. That could be literally anything. It could be the selector's immediate ancestor. It could be the document. It could be that selector itself.

ModCon is always aware of a scope. By default, when ```WEBLINC.modules.domReady()``` is fired, the scope is ```$(document)```. That our equivalent to ```$(document).on('ready', '...')```. When any module changes the DOM significantly and wants to re-run all necessary scripts for that altered DOM, you call ```WEBLINC.modules.domUpdate($('.your-new-scope'))```. This does two things; it re-fires all modules that include the ```WEBLINC.modules.onDomUpdate(init)``` line in them, and it alters the scope of said modules with whatever is passed to the ```WEBLINC.modules.domUpdate()``` function.

This means that any ModCon module can announce to all of the other modules in the DOM Update queue that they should try and re-run themselves within this new supplied scope. It doesn't need to specifically call any other module. It just needs to announce that it's made a big change to the DOM and it's up to every other client module to see if it needs to re-run itself. This is possible by the unique way we construct our ```init()``` functions, as seen in the examples below.

### The Tao of ModCon

1. Each and every function performs one and only one task
2. Verbosely name your methods for self-documenting code and readability
3. ```$scope``` is everything. Make sure all traversal is scoped properly!

### The Queues

ModCon manages two queues for you, a "on DOM ready" queue, and a "when the DOM is updated" queue. You register your module to these queues by adding the following code to your module:

```javascript
WEBLINC.modules.onDomReady(init);
WEBLINC.modules.onDomUpdate(init);
```

The modules added to the ```onDomReady``` queue are fired via ```WEBLINC.modules.domReady()``` (which you can see in action at the bottom of the example in [this section](#order-of-operations)). This should only happen once, and only after each of your modules have been added to the page.

The modules added to the ```onDomUpdate``` queue are fired via ```WEBLINC.modules.domUpdate($('.some-new-scope'))```. This call is fired within any module that has significantly changed the markup on the page, requiring a set of modules the be rerun but within a limited scope (which the module itself can define).

### Triggering a Dom Update

From inside any module, at any time, you can re-run the modules that have been added to the ```onDomUpdate()``` queue by firing:

```javascript
WEBLINC.modules.domUpdate($('.some-scope'));
```

Once this "event" occurs, modules that include ```WEBLINC.modules.onDomUpdate(init)``` will be automatically re-run, but with the scope specified in the aforementioned code.

This is why it's very important to always give each of your jQuery queries a sense of scope though ```$.find()```, ```$.closest()```, ```$('.selector', $scope)```, etc.

### How to Write a ModCon Enabled Module

Here's an example of a basic ModCon enabled module structure.

All of your modules that pipe through ModCon should follow this basic structure:

```javascript
WEBLINC.myModuleName = (function () {
    'use strict';

    var doSomethingWithCollection = function ($collection) {

            // do something specific with collection. 
            // all of your functions should perform one task and one task only.
            $collection.each(function () {
                $(this).remove();
            });

        },

        init = function ($scope) {

            // set a collection variable that this module absolutely depends on
            // to function. This can be a class, an ID, a data-attribute, etc.
            // constructing the query like so will make sure that your selection
            // is scoped properly, since ModCon handles the scope for you.
            var $collection = $('.some-selector', $scope);

            // if that collection is empty, immediately return so the module
            // will stop running as quickly as possible. This saves memory.
            if (_.isEmpty($collection)) { return; }

            // pass your scoped collection to a function to begin working with it
            doSomethingWithCollection($collection);

        };

    // add this module to the queue that is processed when the document is ready
    WEBLINC.modules.onDomReady(init);

    // add this module to the queue that is processed when another module
    // announces a significant DOM change has occurred.
    WEBLINC.modules.onDomUpdate(init);

    // until now all of our functions have been "private" functions (local only
    // to the module itself). To publicize any of these functions, add them to 
    // the return object. This allows any other module to access them. If you
    // want this module to be fired when domReady() or domUpdate() is called, 
    // the following code is required at a minimum.
    return {
      init: init
    };

}());
```

A more complex module could be written like so:

```javascript
WEBLINC.myReallyComplexModule = (function () {
    'use strict';

    var doSomethingWithCollection = function (instance) {

            instance.$collection.each(function () {
                $(this).remove();
            });
        
        },

        createInstance = function ($scope, $collection) {

            // this code creates an 'instance', or a significant amount of
            // data that you'd like to use throughout your module. The best
            // use case for this pattern is when you're trying to track a 
            // lot of state. You can do it easily by always referencing this
            // instance variable across your module.
            return {
                $scope: $scope,
                $collection: $collection,
                $somethingElse: $('.some-other-element', $scope),
                someData: $('[data-attribute]').data('myData')
            };

        },

        consumeInstance = function (instance) {

            // here is the 'nerve center' of your module. From this function
            // you will declare what should happen every time this module is
            // initialized.
            doSomethingWithCollection(instance);

        },

        // using lo-dash's 'compose' method, we're able to pass the result of 
        // createInstance into consumeInstance easily.
        initInstance = _.compose(consumeInstance, createInstance),

        init = function ($scope) {
            var $collection = $('.some-selector', $scope);

            if (_.isEmpty($collection)) { return; }

            initInstance($scope, $collection);
        };

    WEBLINC.modules.onDomReady(init);
    WEBLINC.modules.onDomUpdate(init);

    return {
      init: init
    };
}());
```

Here's a real life example to help drive the point home. This module features the concepts we've discussed thus far, and also shows how each module can reference the public methods from any other module being managed by ModCon:

```javascript
WEBLINC.productDetailsZoom = (function () {
    'use strict';

    var MINIMUM_BREAK_POINT = 'medium',

        DIALOG_OPTIONS = { dialogClass: 'ui-dialog--product-zoom' },

        getImageSource = function (anchorElement) {
            return anchorElement.href;
        },

        getDialogContent = function (imageSource) {
            return $(JST['weblinc/store_front/templates/product_zoom_dialog']({ src: imageSource }));
        },

        gettingImage = function (imageSource, $dialogContent) {
            var gettingImage = $.Deferred(),
                $image = $('<img>');

            $image
            .on('load', function () {
                gettingImage.resolve($dialogContent);
            })
            .attr('src', imageSource);

            return gettingImage.promise();
        },

        openDialog = function (promise) {
            WEBLINC.dialogs.openDialog(promise, DIALOG_OPTIONS, false);
        },

        handleImageClick = function (anchorElement) {
            var imageSource = getImageSource(anchorElement),
                $dialogContent = getDialogContent(imageSource),
                promise = gettingImage(imageSource, $dialogContent);

            openDialog(promise);
        },

        listenForImageClick = function ($detailsContainers) {
            $detailsContainers.on('click', '.primary-image a', function (e) {
                if (WEBLINC.breakPoints.currentlyLessThan(MINIMUM_BREAK_POINT)) { return; }
                e.preventDefault();
                handleImageClick(this);
            });
        },

        init = function ($scope) {
            var $detailsContainers = $scope.is('.wl-product-details') ? $scope : $('.wl-product-details', $scope);

            if (_.isEmpty($detailsContainers)) { return; }

            listenForImageClick($detailsContainers);
        };

    WEBLINC.modules.onDomReady(init);
    WEBLINC.modules.onDomUpdate(init);

    return {
        init: init
    };
}());
```
