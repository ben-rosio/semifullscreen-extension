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
            var videoElements = document.querySelectorAll('#player-api, #playerwrapp');

            var elements = videoElements;

            return elements;
        }
    };

    context.SemiscreenItem = function(element) {
        var isFullsized = false;
        var originalSize = null;
        var domWrapper = new context.StatefulDom();
        var cinemaizer = new context.Cinemaizer(element);

        this.fullSize = function() {
            isFullsized = true;

            originalSize = this.getSize();

            // Set the container element to absolute and a high zindex.
            domWrapper.style(element, {
                "z-index": 1000,
                "position": "absolute"
            });
            domWrapper.attribute(element, {
                "width": "auto",
                "height": "auto",
                "class": ''
            });

            // Find the video element and resize it and everything up to the given container method to 100%,
            // This way everything will refit to the correct size.
            var elementToCleanUp = element.querySelector("video, object");

            if (elementToCleanUp !== null) {
                do {
                    domWrapper.style(elementToCleanUp, {
                        "height": "100%",
                        "width": "100%",
                        "padding": "0",
                        "margin": "0",
                        "top": "0",
                        "left": "0",
                        "bottom": "0",
                        "right": "0"
                    });
                    domWrapper.attribute(elementToCleanUp, {
                        "height": null,
                        "width": null,
                        "class": ''
                    });
                } while ((elementToCleanUp = elementToCleanUp.parentNode) != element.parentNode);
            }

            // Create and start cinemaizer
            cinemaizer.start();

            // Register resize event and trigger a resize.
            context.Events.register('resize', this.resize);
            this.resize();
        };

        this.resetSize = function() {
            isFullsized = false;
            context.Events.unregister('resize', this.resize);
            domWrapper.revert();
            cinemaizer.stop();
        };

        this.resize = (function() {
            if (!this.isFullsized()) return;

            var size = this.getScaledSize();
            this.setSize(size);
            this.setPosition(context.Utilities.center(size, context.Utilities.getClientSize()));

            domWrapper.reenforce();
        }).bind(this);

        this.setSize = function(size) {
            domWrapper.style(element, {
                "width": size[0] + "px",
                "height": size[1] + "px"
            });
        };

        this.setPosition = function(position) {
            domWrapper.style(element, {
                "left": position[0] + "px",
                "top": position[1] + "px"
            });
        };

        this.isFullsized = function() {
            return isFullsized;
        };

        this.getScaledSize = function() {
            return context.Utilities.contain(originalSize, context.Utilities.getClientSize());
        };

        this.getSize = function() {
            return [
                element.offsetWidth || 0,
                element.offsetHeight || 0
            ];
        };
    };

    context.Cinemaizer = (function (element) {
        var domWrapper = new context.StatefulDom();

        var setStatefulDom = function(domWrapper) {
            domWrapper = domWrapper;
        }
        var start = function() {
            var body = document.body;

            // Hide all siblings of all parent elements
            var ancestor = element;
            do {
                var siblings = context.Utilities.getSiblings(ancestor);

                for (var sibling in siblings) {
                    domWrapper.style(siblings[sibling], { "display": "none" });
                }
            } while ((ancestor = ancestor.parentNode) != body);

            // Change bg to black
            domWrapper.style(body, { "background-color": "black" });
        };
        var stop = function() {
            domWrapper.revert();
        };


        return {
            setStatefulDom: setStatefulDom.bind(this),
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
    context.StatefulDom = function () {
        var elements = [];
        this.style = function(element, styles) {
            var wrap = wrapElement(element);

            for (var styleRule in styles) {
                wrap.setStyle(styleRule, styles[styleRule]);
            }
        };
        this.attribute = function(element, attributes) {
            var wrap = wrapElement(element);

            for (var attributeName in attributes) {
                wrap.setAttribute(attributeName, attributes[attributeName]);
            }
        };

        this.reenforce = function() {
            for (var i in elements)
                elements[i].reenforce();
        };

        this.revert = function() {
            for (var i in elements)
                elements[i].revert();
        };

        var wrapElement = function(element) {
            // Find element in elements if it exists
            for (var i in elements)
                if (elements[i].getElement() == element)
                    return elements[i];

            var elementWrap = new ElementWrap(element);

            elements.push(elementWrap);

            return elementWrap;
        };

        var ElementWrap = function (element) {
            var originalstyles = {};
            var originalattributes = {};
            var attributes = {};
            var styles = {};

            this.setStyle = function(ruleName, rule) {
                var camalCasedName = toCamalCase(ruleName);

                this.add('originalstyle', ruleName, this.getStyle(camalCasedName), false);
                this.add('style', ruleName, rule, true);

                if (rule === null)
                    element.style.removeProperty(ruleName); // Must use non-camalcased name for whatever reason.
                else
                    element.style[camalCasedName] = rule;
            };
            this.setAttribute = function(attributeName, attributeValue) {
                this.add('originalattribute', attributeName, this.getAttribute(attributeName), false);
                this.add('attribute', attributeName, attributeValue, true);

                if (attributeValue === null)
                    element.removeAttribute(attributeName);
                else
                    element.setAttribute(attributeName, attributeValue);
            };

            this.add = function (type, key, value, overwrite) {
                overwrite = typeof(overwrite) == "undefined" ? false : overwrite;

                if (!overwrite && getTypeObject(type).hasOwnProperty(key))
                    return;

                getTypeObject(type)[key] = value;
            };

            this.reenforce = function() {
                for (var rule in styles)
                    this.setStyle(rule, styles[rule]);

                for (var name in attributes)
                    this.setAttribute(name, attributes[name]);
            };

            this.revert = function() {
                for (var rule in originalstyles)
                    this.setStyle(rule, originalstyles[rule]);

                for (var name in originalattributes)
                    this.setAttribute(name, originalattributes[name]);
            };

            this.getStyle = function(ruleName) {
                var camalCasedName = toCamalCase(ruleName);

                if (typeof element.style != 'undefined' && element.style.hasOwnProperty(camalCasedName) && element.style[camalCasedName] != "")
                    return element.style[camalCasedName];

                return null;
            };
            this.getAttribute = function(attributeName) {
                if (element.hasAttribute(attributeName))
                    return element.getAttribute(attributeName);
                else
                    return null;
            };
            this.getElement = function() {
                return element;
            };

            var getTypeObject = function (type) {
                switch (type) {
                    case "originalstyle": return originalstyles;
                    case "style": return styles;
                    case "originalattribute": return originalattributes;
                    case "attribute": return attributes;
                };

                throw new Error("Could not find storage type '" + type + "'.");
            }
        };

        var toCamalCase = function (value) {
            var camalCase = "";
            value.split("-").forEach(function (part, i) {
                camalCase += ((i == 0) ? part : part[0].toUpperCase() + part.slice(1));
            });

            return camalCase;
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
