(function (context) {
    var Semiscreen = {
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
            var videoElements = context.getElementsByTagName("video");

            var elements = videoElements;

            return elements;
        }
    };

    var SemiscreenItem = function(element) {
        var isFullsized = false;

        this.fullSize = function() {
            isFullsized = true;
            // TODO
        };

        this.resetSize = function() {
            isFullsized = false;
            // TODO
        };

        this.getSize = function() {
            return [
                element.offsetWidth,
                element.offsetHeight
            ];
        };
    };

    var Utilities = {
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

            var elementRatio = Math.min(
                elementSize[0] / elementSize[1],
                elementSize[1] / elementSize[0]
            );

            return [
                Math.round(elementSize[0] * elementRatio),
                Math.round(elementSize[1] * elementRatio)
            ];
        }
    };

    Semiscreen.init();
})(document);
