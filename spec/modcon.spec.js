// TODO: See if we can eliminate or at least inject these dependencies.
global.window = {};
global.document = {};
global.$ = function() {};
global._ = require('underscore')

require('../modcon.js');

describe("onDomReady", function() {
    it("should throw an exception when called with a non-function ", function() {
        expect(function() { window.WEBLINC.modules.onDomReady({}); }).toThrow(new Error('WEBLINC.modules: Arguments must be functions'));
    });
});

describe("onDomUpdate", function() {
    it("should throw an exception when called with a non-function ", function() {
        expect(function() { window.WEBLINC.modules.onDomUpdate({}); }).toThrow(new Error('WEBLINC.modules: Arguments must be functions'));
    });
});

describe("domReady", function() {
    it("should call a function added with onDomReady", function() {
        var calls = 0,
            myFunc = function() { calls++; };
            
        window.WEBLINC.modules.onDomReady(myFunc);

        window.WEBLINC.modules.domReady();
        
        expect(calls).toBe(1);
    });
});

describe("domUpdate", function() {
    it("should call a function added with onDomUpdate", function() {
        var calls = 0,
            myFunc = function() { calls++; };
            
        window.WEBLINC.modules.onDomUpdate(myFunc);

        window.WEBLINC.modules.domUpdate();
        
        expect(calls).toBe(1);
    });
});
