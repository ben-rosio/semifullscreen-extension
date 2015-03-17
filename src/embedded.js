var SemiscreenExtension = {};

(function (context) {
    context.Semiscreen = {
        /**
         * Initializes semiscreen on the current page and handles all display logic.
         */
        init: function () {
            var elements = this.getElements();
            console.log(elements);
        },

        /**
         * Gets all elements which semiscreen can interact with.
         * Add elements here to be recongized by semiscreen.
         */
        getElements: function () {
            var videoElements = document.getElementsByTagName("video");

            var elements = videoElements;

            return elements;
        },

        /**
         * Given an element return a semiscreen object for it.
         * @param element
         * @return SemiscreenItem
         */
        semiscreenElement: function(element) {
            // TODO
        }
    };

    context.SemiscreenItem = function(element) {
        var isFullsized = false;

        this.fullSize = function() {
            isFullsized = true;
            context.Events.register('resize', this.resize);
        };

        this.resetSize = function() {
            isFullsized = false;
            context.Events.unregister('resize', this.resize);
        };

        this.resize = (function() {
            var size = this.getScaledSize();
            console.log(this.getSize(), size, context.Utilities.getClientSize());
        }).bind(this);

        this.getScaledSize = function() {
            return context.Utilities.contain(this.getSize(), context.Utilities.getClientSize());
        };

        this.getSize = function() {
            return [
                element.offsetWidth,
                element.offsetHeight
            ];
        };
    };

    context.Events = (function () {
        var registered = {};

        var fire = function(eventType, event, context) {
            context = context || window;

            if (!registered.hasOwnProperty('resize'))
                return;

            for (var i = 0; i < registered[eventType].length; i++)
                registered[eventType][i].call(context, event);
        };

        window.addEventListener('resize', (function (event) {
            fire('resize', event);
        }).bind(this));

        return {
            register: function (eventType, eventHandler) {
                if (!registered.hasOwnProperty(eventType))
                    registered[eventType] = [];

                registered[eventType].push(eventHandler);
            },
            unregister: function(eventType, eventHandler) {
                if (!registered.hasOwnProperty(eventType))
                    return;

                var index = registered[eventType].indexOf(eventHandler);
                if (index == -1)
                    return;

                registered[eventType].splice(index, 1);
            }
        };
    })();

    context.Utilities = {
        /**
         * Given a container and element size, return an element size
         * proportionally resized to fit in container.
         * @param elementSize Size of the element to resize in array format [width, height].
         * @param realContainerSize Size of the container to fit the element in in array format [width, height].
         * @param padding Inner padding for the container.
         *
         * @return array In the form of [width, height].
         */
        contain: function(elementSize, realContainerSize, padding) {
            padding = padding || [0, 0];

            var containerSize = [
                realContainerSize[0] - padding[0],
                realContainerSize[1] - padding[1]
            ];

            var widthRatio = containerSize[0] / elementSize[0];
            var heightRatio = containerSize[1] / elementSize[1];
            var elementRatio = Math.min(widthRatio, heightRatio);

            return [
                Math.round(elementSize[0] * elementRatio),
                Math.round(elementSize[1] * elementRatio)
            ];
        },
        getClientSize: function() {
            return [
                window.innerWidth,
                window.innerHeight
            ];
        }
    };

    context.Semiscreen.init();
})(SemiscreenExtension);
