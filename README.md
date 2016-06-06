# Web Data Connector Wrapper

[![Build Status](https://travis-ci.org/tableau-mkt/wdcw.svg?branch=master)](https://travis-ci.org/tableau-mkt/wdcw)[![npm version](https://badge.fury.io/js/wdcw.svg)](https://badge.fury.io/js/wdcw)

Write an awesome description for your new module here. You can edit this file and its contents for
your final README.md file. This template will go through the "replace:dist" step of the Gruntfile
which replaces 3 variables in this file (you can add more if you like).

1. wdcw.2.0.0.standalone.js : your unminimized library as produced by the "browserify:standalone" step in Gruntfile.js
2. wdcw.2.0.0.standalone.min.js : your minimized library as produced by the "uglify:all" step in Gruntfile.js
3. 2.0.0 : the package version which is read from package.json.

Below, there is a sample "Downloads" section to show you how to use these 3 variables.

The output of "replace:dist" is your README.md file. The "markdown:all" step will also produce the html
equivalent of your README.md so that you can put this on your own website.

## Downloads ##

* [Version 2.0.0, minimized, 4.4K : https://github.com/tableau-mkt/wdcw/wdcw.2.0.0.standalone.min.js](https://github.com/tableau-mkt/wdcw/wdcw.2.0.0.standalone.min.js)
* [Version 2.0.0, un-minimized, 13K : https://github.com/tableau-mkt/wdcw/wdcw.2.0.0.standalone.js](https://github.com/tableau-mkt/wdcw/wdcw.2.0.0.standalone.js)

## Usage ##

### Browser ###

In any web page:
```html
<script src="http://web-data-connector-wrapper.com/wdcw.2.0.0.standalone.min.js)"></script>
<script>
  var wdcw = require('web-data-connector-wrapper');
  var example = new wdcw();

  example.hello();
</script>
  ```

### Node.js ###

```js
var wdcw = require('./src/web-data-connector-wrapper.js');
var example = new wdcw();

example.hello();
```

# License

[Apache 2.0 License](LICENSE.md) - &copy; 2015 Eric Peterson
