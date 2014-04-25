window.WEBLINC = window.WEBLINC || {};

window.WEBLINC.modules = (function () {

    'use strict';

    var $document = $(document),

        validateArgs = function (args) {
            _.forEach(args, function (arg) {
                if (typeof arg !== 'function') {
                    throw new Error('WEBLINC.modules: Arguments must be functions');
                }
            });
        },

        addToQueue = function (queue) {
            return function () {
                validateArgs(arguments);
                [].push.apply(queue, arguments);
            };
        },

        initQueue = function (queue) {
            return function ($scope) {
                $scope = $scope || $document;

                _.forEach(queue, function (func) {
                    func($scope);
                });
            };
        },

        domReadyQueue = [],
        domUpdateQueue = [],

        onDomReady = addToQueue(domReadyQueue),
        onDomUpdate = addToQueue(domUpdateQueue),

        domReady = initQueue(domReadyQueue),
        domUpdate = initQueue(domUpdateQueue);

    return {
        onDomReady: onDomReady,
        onDomUpdate: onDomUpdate,
        domReady: domReady,
        domUpdate: domUpdate
    };
}());
