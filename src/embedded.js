if (typeof window.SemiscreenExtension == 'undefined')
    window.SemiscreenExtension = {};

(function (context) {
    if (typeof context.initialized !== 'undefined') {
        context.Semiscreen.toggle();
        return;
    }
    context.initialized = true;

    context.Semiscreen = {
        semiscreen: null,

        /**
         * Initializes semiscreen on the current page and handles all display logic.
         */
        init: function () {
            if (this.semiscreen !== null) {
                this.toggle();
                return;
            }

            var elements = this.getElements();

            if (elements.length == 1) {
                this.semiscreen = new context.SemiscreenItem(elements[0]);
                this.semiscreen.fullSize();
            }
        },

        toggle: function() {
            if (this.semiscreen == null) return;

            if (this.semiscreen.isFullsized())
                this.semiscreen.resetSize();
            else
                this.semiscreen.fullSize();
        },

        /**
         * Gets all elements which semiscreen can interact with.
         * Add elements here to be recongized by semiscreen.
         */
        getElements: function () {
            //var videoElements = document.getElementsByTagName("video");
            var videoElements = document.querySelectorAll('#player-api');

            var elements = videoElements;

            return elements;
        }
    };

    context.SemiscreenItem = function(element) {
        var isFullsized = false;
        var originalElements = new context.OriginalElements();
        var cinemaizer = new context.Cinemaizer(element);

        this.fullSize = function() {
            isFullsized = true;

            // Set the container element to absolute and a high zindex.
            originalElements.push(element, { styles: ["z-index", "top", "left", "position", "width", "height"], attributes: ["width", "height"] });
            element.style.position = "absolute";
            element.style.zIndex = 1000;

            // Find the video element and resize it and everything up to the given container method to 100%,
            // This way everything will refit to the correct size.
            var elementToCleanUp = element.querySelector("video, embed");

            do {
                originalElements.push(elementToCleanUp, { styles: ["height", "width"], attributes: ["height", "width"] });
                elementToCleanUp.removeAttribute("width");
                elementToCleanUp.removeAttribute("height");
                elementToCleanUp.style.width = "100%";
                elementToCleanUp.style.height = "100%";
            } while ((elementToCleanUp = elementToCleanUp.parentNode) != element);

            // Create and start cinemaizer
            cinemaizer.start();

            // Register resize event and trigger a resize.
            context.Events.register('resize', this.resize);
            this.resize();
        };

        this.resetSize = function() {
            isFullsized = false;
            context.Events.unregister('resize', this.resize);
            originalElements.revert();
            cinemaizer.stop();
        };

        this.resize = (function() {
            if (!this.isFullsized()) return;

            var size = this.getScaledSize();
            this.setSize(size);
            this.setPosition(context.Utilities.center(size, context.Utilities.getClientSize()));
        }).bind(this);

        this.setSize = function(size) {
            element.style.width = size[0] + "px";
            element.style.height = size[1] + "px";
        };

        this.setPosition = function(position) {
            element.style.left = position[0] + "px";
            element.style.top = position[1] + "px";
        };

        this.isFullsized = function() {
            return isFullsized;
        };

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

    context.Cinemaizer = (function (element) {
        var originalElements = new context.OriginalElements();

        var setReverter = function(reverter) {
            originalElements = reverter;
        }
        var start = function() {
            var body = document.body;

            // Hide all siblings of all parent elements
            var ancestor = element;
            do {
                var siblings = context.Utilities.getSiblings(ancestor);

                for (var sibling in siblings) {
                    if (originalElements)
                        originalElements.push(siblings[sibling], { styles: ["display"] });

                    siblings[sibling].style.display = "none";
                }
            } while ((ancestor = ancestor.parentNode) != body);

            // Change bg to black
            originalElements.push(body, { styles: ["background-color"] });
            body.style.backgroundColor = "black";
        };
        var stop = function() {
            originalElements.revert();
        };


        return {
            setReverter: setReverter.bind(this),
            start: start.bind(this),
            stop: stop.bind(this)
        }
    });

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

    /**
     * Stores given elements and their values so they can be reverted.
     */
    context.OriginalElements = function () {
        var elements = [];
        /**
         * Add an element to store the values of.
         *
         * @param element Element
         * @param toStore Object Contains the keys attributes and styles.  Each has an array of items whose values should be stored.
         */
        this.push = function(element, toStore) {
            var attributes = {};
            var styles = {};
            var i = 0;

            if (toStore.hasOwnProperty('attributes')) {
                for (i in toStore.attributes) {
                    if (!element.hasAttribute(toStore.attributes[i]))
                        attributes[toStore.attributes[i]] = null;
                    else
                        attributes[toStore.attributes[i]] = element.getAttribute(toStore.attributes[i]);
                }
            }

            if (toStore.hasOwnProperty('styles')) {
                for (i in toStore.styles) {
                    if (typeof element.style == 'undefined' || !element.style.hasOwnProperty(toStore.styles[i]) || element.style[toStore.styles[i]] == "")
                        styles[toStore.styles[i]] = null;
                    else
                        styles[toStore.styles[i]] = element.style[toStore.styles[i]];
                }
            }

            elements.push({
                element: element,
                attributes: attributes,
                styles: styles
            });
        };

        this.revert = function() {
            for (var i in elements) {
                var element = elements[i].element;
                var attributes = elements[i].attributes;
                var styles = elements[i].styles;
                var j = 0;

                for (j in attributes) {
                    if (attributes[j] === null)
                        element.removeAttribute(j);
                    else
                        element.setAttribute(j, attributes[j]);
                }

                for (j in styles) {
                    if (styles[j] === null)
                        element.style.removeProperty(j);
                    else
                        element.style[j] = styles[j];
                }
            }

            elements = [];
        };
    };

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
        center: function(elementSize, realContainerSize, padding) {
            padding = padding || [0, 0];

            var containerSize = [
                realContainerSize[0] - padding[0],
                realContainerSize[1] - padding[1]
            ];

            return [
                (containerSize[0] / 2) - (elementSize[0] / 2),
                (containerSize[1] / 2) - (elementSize[1] / 2)
            ];
        },
        getClientSize: function() {
            return [
                window.innerWidth,
                window.innerHeight
            ];
        },
        getSiblings: function(element) {
            var siblings = [];
            var children = element.parentNode.children;

            for (var child = 0; child < children.length; child++) {
                if (children[child] == element)
                    continue;
                siblings.push(children[child]);
            }

            return siblings;
        }
    };

    context.Semiscreen.init();
})(window.SemiscreenExtension);
