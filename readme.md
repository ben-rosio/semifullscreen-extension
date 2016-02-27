SemiScreen
==========

[![Circle CI](https://circleci.com/gh/ioben/semifullscreen-extension.svg?style=svg)](https://circleci.com/gh/ioben/semifullscreen-extension)

SemiScreen is a chrome extension which allows you to enlarge any embedded video player to the width/height of the browser, giving the most viewing area for the video given the window size.


Roadmap
-------

 - Implement a rules system to designate how to resize various different website video elements.  Youtube for example requires resizing #player-api and all ancestors between it and the video/embed object to be width/height 100%.  This keeps controls where you would expect them.  Being able to codify rules such as these, and more general ones, into a declaritive syntax would be good.  It would also make implementation on a arbitrary website trivial.
