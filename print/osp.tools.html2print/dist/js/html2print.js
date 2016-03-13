/*!
 * Less - Leaner CSS v2.6.1
 * http://lesscss.org
 *
 * Copyright (c) 2009-2016, Alexis Sellier <self@cloudhead.net>
 * Licensed under the  License.
 *
 */

 /** * @license 
 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.less = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var addDataAttr = require("./utils").addDataAttr,
    browser = require("./browser");

module.exports = function(window, options) {

    // use options from the current script tag data attribues
    addDataAttr(options, browser.currentScript(window));

    if (options.isFileProtocol === undefined) {
        options.isFileProtocol = /^(file|(chrome|safari)(-extension)?|resource|qrc|app):/.test(window.location.protocol);
    }

    // Load styles asynchronously (default: false)
    //
    // This is set to `false` by default, so that the body
    // doesn't start loading before the stylesheets are parsed.
    // Setting this to `true` can result in flickering.
    //
    options.async = options.async || false;
    options.fileAsync = options.fileAsync || false;

    // Interval between watch polls
    options.poll = options.poll || (options.isFileProtocol ? 1000 : 1500);

    options.env = options.env || (window.location.hostname == '127.0.0.1' ||
        window.location.hostname == '0.0.0.0'   ||
        window.location.hostname == 'localhost' ||
        (window.location.port &&
            window.location.port.length > 0)      ||
        options.isFileProtocol                   ? 'development'
        : 'production');

    var dumpLineNumbers = /!dumpLineNumbers:(comments|mediaquery|all)/.exec(window.location.hash);
    if (dumpLineNumbers) {
        options.dumpLineNumbers = dumpLineNumbers[1];
    }

    if (options.useFileCache === undefined) {
        options.useFileCache = true;
    }

    if (options.onReady === undefined) {
        options.onReady = true;
    }

};

},{"./browser":3,"./utils":10}],2:[function(require,module,exports){
/**
 * Kicks off less and compiles any stylesheets
 * used in the browser distributed version of less
 * to kick-start less using the browser api
 */
/*global window, document */

// shim Promise if required
require('promise/polyfill.js');

var options = window.less || {};
require("./add-default-options")(window, options);

var less = module.exports = require("./index")(window, options);

window.less = less;

var css, head, style;

// Always restore page visibility
function resolveOrReject(data) {
    if (data.filename) {
        console.warn(data);
    }
    if (!options.async) {
        head.removeChild(style);
    }
}

if (options.onReady) {
    if (/!watch/.test(window.location.hash)) {
        less.watch();
    }
    // Simulate synchronous stylesheet loading by blocking page rendering
    if (!options.async) {
        css = 'body { display: none !important }';
        head = document.head || document.getElementsByTagName('head')[0];
        style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
    }
    less.registerStylesheetsImmediately();
    less.pageLoadFinished = less.refresh(less.env === 'development').then(resolveOrReject, resolveOrReject);
}

},{"./add-default-options":1,"./index":8,"promise/polyfill.js":97}],3:[function(require,module,exports){
var utils = require("./utils");
module.exports = {
    createCSS: function (document, styles, sheet) {
        // Strip the query-string
        var href = sheet.href || '';

        // If there is no title set, use the filename, minus the extension
        var id = 'less:' + (sheet.title || utils.extractId(href));

        // If this has already been inserted into the DOM, we may need to replace it
        var oldStyleNode = document.getElementById(id);
        var keepOldStyleNode = false;

        // Create a new stylesheet node for insertion or (if necessary) replacement
        var styleNode = document.createElement('style');
        styleNode.setAttribute('type', 'text/css');
        if (sheet.media) {
            styleNode.setAttribute('media', sheet.media);
        }
        styleNode.id = id;

        if (!styleNode.styleSheet) {
            styleNode.appendChild(document.createTextNode(styles));

            // If new contents match contents of oldStyleNode, don't replace oldStyleNode
            keepOldStyleNode = (oldStyleNode !== null && oldStyleNode.childNodes.length > 0 && styleNode.childNodes.length > 0 &&
                oldStyleNode.firstChild.nodeValue === styleNode.firstChild.nodeValue);
        }

        var head = document.getElementsByTagName('head')[0];

        // If there is no oldStyleNode, just append; otherwise, only append if we need
        // to replace oldStyleNode with an updated stylesheet
        if (oldStyleNode === null || keepOldStyleNode === false) {
            var nextEl = sheet && sheet.nextSibling || null;
            if (nextEl) {
                nextEl.parentNode.insertBefore(styleNode, nextEl);
            } else {
                head.appendChild(styleNode);
            }
        }
        if (oldStyleNode && keepOldStyleNode === false) {
            oldStyleNode.parentNode.removeChild(oldStyleNode);
        }

        // For IE.
        // This needs to happen *after* the style element is added to the DOM, otherwise IE 7 and 8 may crash.
        // See http://social.msdn.microsoft.com/Forums/en-US/7e081b65-878a-4c22-8e68-c10d39c2ed32/internet-explorer-crashes-appending-style-element-to-head
        if (styleNode.styleSheet) {
            try {
                styleNode.styleSheet.cssText = styles;
            } catch (e) {
                throw new Error("Couldn't reassign styleSheet.cssText.");
            }
        }
    },
    currentScript: function(window) {
        var document = window.document;
        return document.currentScript || (function() {
            var scripts = document.getElementsByTagName("script");
            return scripts[scripts.length - 1];
        })();
    }
};

},{"./utils":10}],4:[function(require,module,exports){
// Cache system is a bit outdated and could do with work

module.exports = function(window, options, logger) {
    var cache = null;
    if (options.env !== 'development') {
        try {
            cache = (typeof window.localStorage === 'undefined') ? null : window.localStorage;
        } catch (_) {}
    }
    return {
        setCSS: function(path, lastModified, modifyVars, styles) {
            if (cache) {
                logger.info('saving ' + path + ' to cache.');
                try {
                    cache.setItem(path, styles);
                    cache.setItem(path + ':timestamp', lastModified);
                    if (modifyVars) {
                        cache.setItem(path + ':vars', JSON.stringify(modifyVars));
                    }
                } catch(e) {
                    //TODO - could do with adding more robust error handling
                    logger.error('failed to save "' + path + '" to local storage for caching.');
                }
            }
        },
        getCSS: function(path, webInfo, modifyVars) {
            var css       = cache && cache.getItem(path),
                timestamp = cache && cache.getItem(path + ':timestamp'),
                vars      = cache && cache.getItem(path + ':vars');

            modifyVars = modifyVars || {};

            if (timestamp && webInfo.lastModified &&
                (new Date(webInfo.lastModified).valueOf() ===
                    new Date(timestamp).valueOf()) &&
                (!modifyVars && !vars || JSON.stringify(modifyVars) === vars)) {
                // Use local copy
                return css;
            }
        }
    };
};

},{}],5:[function(require,module,exports){
var utils = require("./utils"),
    browser = require("./browser");

module.exports = function(window, less, options) {

    function errorHTML(e, rootHref) {
        var id = 'less-error-message:' + utils.extractId(rootHref || "");
        var template = '<li><label>{line}</label><pre class="{class}">{content}</pre></li>';
        var elem = window.document.createElement('div'), timer, content, errors = [];
        var filename = e.filename || rootHref;
        var filenameNoPath = filename.match(/([^\/]+(\?.*)?)$/)[1];

        elem.id        = id;
        elem.className = "less-error-message";

        content = '<h3>'  + (e.type || "Syntax") + "Error: " + (e.message || 'There is an error in your .less file') +
            '</h3>' + '<p>in <a href="' + filename   + '">' + filenameNoPath + "</a> ";

        var errorline = function (e, i, classname) {
            if (e.extract[i] !== undefined) {
                errors.push(template.replace(/\{line\}/, (parseInt(e.line, 10) || 0) + (i - 1))
                    .replace(/\{class\}/, classname)
                    .replace(/\{content\}/, e.extract[i]));
            }
        };

        if (e.extract) {
            errorline(e, 0, '');
            errorline(e, 1, 'line');
            errorline(e, 2, '');
            content += 'on line ' + e.line + ', column ' + (e.column + 1) + ':</p>' +
                '<ul>' + errors.join('') + '</ul>';
        }
        if (e.stack && (e.extract || options.logLevel >= 4)) {
            content += '<br/>Stack Trace</br />' + e.stack.split('\n').slice(1).join('<br/>');
        }
        elem.innerHTML = content;

        // CSS for error messages
        browser.createCSS(window.document, [
            '.less-error-message ul, .less-error-message li {',
            'list-style-type: none;',
            'margin-right: 15px;',
            'padding: 4px 0;',
            'margin: 0;',
            '}',
            '.less-error-message label {',
            'font-size: 12px;',
            'margin-right: 15px;',
            'padding: 4px 0;',
            'color: #cc7777;',
            '}',
            '.less-error-message pre {',
            'color: #dd6666;',
            'padding: 4px 0;',
            'margin: 0;',
            'display: inline-block;',
            '}',
            '.less-error-message pre.line {',
            'color: #ff0000;',
            '}',
            '.less-error-message h3 {',
            'font-size: 20px;',
            'font-weight: bold;',
            'padding: 15px 0 5px 0;',
            'margin: 0;',
            '}',
            '.less-error-message a {',
            'color: #10a',
            '}',
            '.less-error-message .error {',
            'color: red;',
            'font-weight: bold;',
            'padding-bottom: 2px;',
            'border-bottom: 1px dashed red;',
            '}'
        ].join('\n'), { title: 'error-message' });

        elem.style.cssText = [
            "font-family: Arial, sans-serif",
            "border: 1px solid #e00",
            "background-color: #eee",
            "border-radius: 5px",
            "-webkit-border-radius: 5px",
            "-moz-border-radius: 5px",
            "color: #e00",
            "padding: 15px",
            "margin-bottom: 15px"
        ].join(';');

        if (options.env === 'development') {
            timer = setInterval(function () {
                var document = window.document,
                    body = document.body;
                if (body) {
                    if (document.getElementById(id)) {
                        body.replaceChild(elem, document.getElementById(id));
                    } else {
                        body.insertBefore(elem, body.firstChild);
                    }
                    clearInterval(timer);
                }
            }, 10);
        }
    }

    function removeErrorHTML(path) {
        var node = window.document.getElementById('less-error-message:' + utils.extractId(path));
        if (node) {
            node.parentNode.removeChild(node);
        }
    }

    function removeErrorConsole(path) {
        //no action
    }

    function removeError(path) {
        if (!options.errorReporting || options.errorReporting === "html") {
            removeErrorHTML(path);
        } else if (options.errorReporting === "console") {
            removeErrorConsole(path);
        } else if (typeof options.errorReporting === 'function') {
            options.errorReporting("remove", path);
        }
    }

    function errorConsole(e, rootHref) {
        var template = '{line} {content}';
        var filename = e.filename || rootHref;
        var errors = [];
        var content = (e.type || "Syntax") + "Error: " + (e.message || 'There is an error in your .less file') +
            " in " + filename + " ";

        var errorline = function (e, i, classname) {
            if (e.extract[i] !== undefined) {
                errors.push(template.replace(/\{line\}/, (parseInt(e.line, 10) || 0) + (i - 1))
                    .replace(/\{class\}/, classname)
                    .replace(/\{content\}/, e.extract[i]));
            }
        };

        if (e.extract) {
            errorline(e, 0, '');
            errorline(e, 1, 'line');
            errorline(e, 2, '');
            content += 'on line ' + e.line + ', column ' + (e.column + 1) + ':\n' +
                errors.join('\n');
        }
        if (e.stack && (e.extract || options.logLevel >= 4)) {
            content += '\nStack Trace\n' + e.stack;
        }
        less.logger.error(content);
    }

    function error(e, rootHref) {
        if (!options.errorReporting || options.errorReporting === "html") {
            errorHTML(e, rootHref);
        } else if (options.errorReporting === "console") {
            errorConsole(e, rootHref);
        } else if (typeof options.errorReporting === 'function') {
            options.errorReporting("add", e, rootHref);
        }
    }

    return {
        add: error,
        remove: removeError
    };
};

},{"./browser":3,"./utils":10}],6:[function(require,module,exports){
/*global window, XMLHttpRequest */

module.exports = function(options, logger) {

    var AbstractFileManager = require("../less/environment/abstract-file-manager.js");

    var fileCache = {};

    //TODOS - move log somewhere. pathDiff and doing something similar in node. use pathDiff in the other browser file for the initial load

    function getXMLHttpRequest() {
        if (window.XMLHttpRequest && (window.location.protocol !== "file:" || !("ActiveXObject" in window))) {
            return new XMLHttpRequest();
        } else {
            try {
                /*global ActiveXObject */
                return new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                logger.error("browser doesn't support AJAX.");
                return null;
            }
        }
    }

    var FileManager = function() {
    };

    FileManager.prototype = new AbstractFileManager();

    FileManager.prototype.alwaysMakePathsAbsolute = function alwaysMakePathsAbsolute() {
        return true;
    };
    FileManager.prototype.join = function join(basePath, laterPath) {
        if (!basePath) {
            return laterPath;
        }
        return this.extractUrlParts(laterPath, basePath).path;
    };
    FileManager.prototype.doXHR = function doXHR(url, type, callback, errback) {

        var xhr = getXMLHttpRequest();
        var async = options.isFileProtocol ? options.fileAsync : true;

        if (typeof xhr.overrideMimeType === 'function') {
            xhr.overrideMimeType('text/css');
        }
        logger.debug("XHR: Getting '" + url + "'");
        xhr.open('GET', url, async);
        xhr.setRequestHeader('Accept', type || 'text/x-less, text/css; q=0.9, */*; q=0.5');
        xhr.send(null);

        function handleResponse(xhr, callback, errback) {
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(xhr.responseText,
                    xhr.getResponseHeader("Last-Modified"));
            } else if (typeof errback === 'function') {
                errback(xhr.status, url);
            }
        }

        if (options.isFileProtocol && !options.fileAsync) {
            if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                callback(xhr.responseText);
            } else {
                errback(xhr.status, url);
            }
        } else if (async) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    handleResponse(xhr, callback, errback);
                }
            };
        } else {
            handleResponse(xhr, callback, errback);
        }
    };
    FileManager.prototype.supports = function(filename, currentDirectory, options, environment) {
        return true;
    };

    FileManager.prototype.clearFileCache = function() {
        fileCache = {};
    };

    FileManager.prototype.loadFile = function loadFile(filename, currentDirectory, options, environment, callback) {
        if (currentDirectory && !this.isPathAbsolute(filename)) {
            filename = currentDirectory + filename;
        }

        options = options || {};

        // sheet may be set to the stylesheet for the initial load or a collection of properties including
        // some context variables for imports
        var hrefParts = this.extractUrlParts(filename, window.location.href);
        var href      = hrefParts.url;

        if (options.useFileCache && fileCache[href]) {
            try {
                var lessText = fileCache[href];
                callback(null, { contents: lessText, filename: href, webInfo: { lastModified: new Date() }});
            } catch (e) {
                callback({filename: href, message: "Error loading file " + href + " error was " + e.message});
            }
            return;
        }

        this.doXHR(href, options.mime, function doXHRCallback(data, lastModified) {
            // per file cache
            fileCache[href] = data;

            // Use remote copy (re-parse)
            callback(null, { contents: data, filename: href, webInfo: { lastModified: lastModified }});
        }, function doXHRError(status, url) {
            callback({ type: 'File', message: "'" + url + "' wasn't found (" + status + ")", href: href });
        });
    };

    return FileManager;
};

},{"../less/environment/abstract-file-manager.js":15}],7:[function(require,module,exports){
module.exports = function() {

    var functionRegistry = require("./../less/functions/function-registry");

    function imageSize() {
        throw {
            type: "Runtime",
            message: "Image size functions are not supported in browser version of less"
        };
    }

    var imageFunctions = {
        "image-size": function(filePathNode) {
            imageSize(this, filePathNode);
            return -1;
        },
        "image-width": function(filePathNode) {
            imageSize(this, filePathNode);
            return -1;
        },
        "image-height": function(filePathNode) {
            imageSize(this, filePathNode);
            return -1;
        }
    };

    functionRegistry.addMultiple(imageFunctions);
};

},{"./../less/functions/function-registry":22}],8:[function(require,module,exports){
//
// index.js
// Should expose the additional browser functions on to the less object
//
var addDataAttr = require("./utils").addDataAttr,
    browser = require("./browser");

module.exports = function(window, options) {
    var document = window.document;
    var less = require('../less')();

    //module.exports = less;
    less.options = options;
    var environment = less.environment,
        FileManager = require("./file-manager")(options, less.logger),
        fileManager = new FileManager();
    environment.addFileManager(fileManager);
    less.FileManager = FileManager;

    require("./log-listener")(less, options);
    var errors = require("./error-reporting")(window, less, options);
    var cache = less.cache = options.cache || require("./cache")(window, options, less.logger);
    require('./image-size')(less.environment);

    //Setup user functions
    if (options.functions) {
        less.functions.functionRegistry.addMultiple(options.functions);
    }

    var typePattern = /^text\/(x-)?less$/;

    function postProcessCSS(styles) { // deprecated, use a plugin for postprocesstasks
        if (options.postProcessor && typeof options.postProcessor === 'function') {
            styles = options.postProcessor.call(styles, styles) || styles;
        }
        return styles;
    }

    function clone(obj) {
        var cloned = {};
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                cloned[prop] = obj[prop];
            }
        }
        return cloned;
    }

    // only really needed for phantom
    function bind(func, thisArg) {
        var curryArgs = Array.prototype.slice.call(arguments, 2);
        return function() {
            var args = curryArgs.concat(Array.prototype.slice.call(arguments, 0));
            return func.apply(thisArg, args);
        };
    }

    function loadStyles(modifyVars) {
        var styles = document.getElementsByTagName('style'),
            style;

        for (var i = 0; i < styles.length; i++) {
            style = styles[i];
            if (style.type.match(typePattern)) {
                var instanceOptions = clone(options);
                instanceOptions.modifyVars = modifyVars;
                var lessText = style.innerHTML || '';
                instanceOptions.filename = document.location.href.replace(/#.*$/, '');

                /*jshint loopfunc:true */
                // use closure to store current style
                less.render(lessText, instanceOptions,
                        bind(function(style, e, result) {
                            if (e) {
                                errors.add(e, "inline");
                            } else {
                                style.type = 'text/css';
                                if (style.styleSheet) {
                                    style.styleSheet.cssText = result.css;
                                } else {
                                    style.innerHTML = result.css;
                                }
                            }
                        }, null, style));
            }
        }
    }

    function loadStyleSheet(sheet, callback, reload, remaining, modifyVars) {

        var instanceOptions = clone(options);
        addDataAttr(instanceOptions, sheet);
        instanceOptions.mime = sheet.type;

        if (modifyVars) {
            instanceOptions.modifyVars = modifyVars;
        }

        function loadInitialFileCallback(loadedFile) {

            var data = loadedFile.contents,
                path = loadedFile.filename,
                webInfo = loadedFile.webInfo;

            var newFileInfo = {
                currentDirectory: fileManager.getPath(path),
                filename: path,
                rootFilename: path,
                relativeUrls: instanceOptions.relativeUrls};

            newFileInfo.entryPath = newFileInfo.currentDirectory;
            newFileInfo.rootpath = instanceOptions.rootpath || newFileInfo.currentDirectory;

            if (webInfo) {
                webInfo.remaining = remaining;

                var css = cache.getCSS(path, webInfo, instanceOptions.modifyVars);
                if (!reload && css) {
                    webInfo.local = true;
                    callback(null, css, data, sheet, webInfo, path);
                    return;
                }

            }

            //TODO add tests around how this behaves when reloading
            errors.remove(path);

            instanceOptions.rootFileInfo = newFileInfo;
            less.render(data, instanceOptions, function(e, result) {
                if (e) {
                    e.href = path;
                    callback(e);
                } else {
                    result.css = postProcessCSS(result.css);
                    cache.setCSS(sheet.href, webInfo.lastModified, instanceOptions.modifyVars, result.css);
                    callback(null, result.css, data, sheet, webInfo, path);
                }
            });
        }

        fileManager.loadFile(sheet.href, null, instanceOptions, environment, function(e, loadedFile) {
            if (e) {
                callback(e);
                return;
            }
            loadInitialFileCallback(loadedFile);
        });
    }

    function loadStyleSheets(callback, reload, modifyVars) {
        for (var i = 0; i < less.sheets.length; i++) {
            loadStyleSheet(less.sheets[i], callback, reload, less.sheets.length - (i + 1), modifyVars);
        }
    }

    function initRunningMode() {
        if (less.env === 'development') {
            less.watchTimer = setInterval(function () {
                if (less.watchMode) {
                    fileManager.clearFileCache();
                    loadStyleSheets(function (e, css, _, sheet, webInfo) {
                        if (e) {
                            errors.add(e, e.href || sheet.href);
                        } else if (css) {
                            browser.createCSS(window.document, css, sheet);
                        }
                    });
                }
            }, options.poll);
        }
    }

    //
    // Watch mode
    //
    less.watch   = function () {
        if (!less.watchMode ) {
            less.env = 'development';
            initRunningMode();
        }
        this.watchMode = true;
        return true;
    };

    less.unwatch = function () {clearInterval(less.watchTimer); this.watchMode = false; return false; };

    //
    // Synchronously get all <link> tags with the 'rel' attribute set to
    // "stylesheet/less".
    //
    less.registerStylesheetsImmediately = function() {
        var links = document.getElementsByTagName('link');
        less.sheets = [];

        for (var i = 0; i < links.length; i++) {
            if (links[i].rel === 'stylesheet/less' || (links[i].rel.match(/stylesheet/) &&
                (links[i].type.match(typePattern)))) {
                less.sheets.push(links[i]);
            }
        }
    };

    //
    // Asynchronously get all <link> tags with the 'rel' attribute set to
    // "stylesheet/less", returning a Promise.
    //
    less.registerStylesheets = function() {
        return new Promise(function(resolve, reject) {
            less.registerStylesheetsImmediately();
            resolve();
        });
    };

    //
    // With this function, it's possible to alter variables and re-render
    // CSS without reloading less-files
    //
    less.modifyVars = function(record) {
        return less.refresh(true, record, false);
    };

    less.refresh = function (reload, modifyVars, clearFileCache) {
        if ((reload || clearFileCache) && clearFileCache !== false) {
            fileManager.clearFileCache();
        }
        return new Promise(function (resolve, reject) {
            var startTime, endTime, totalMilliseconds;
            startTime = endTime = new Date();

            loadStyleSheets(function (e, css, _, sheet, webInfo) {
                if (e) {
                    errors.add(e, e.href || sheet.href);
                    reject(e);
                    return;
                }
                if (webInfo.local) {
                    less.logger.info("loading " + sheet.href + " from cache.");
                } else {
                    less.logger.info("rendered " + sheet.href + " successfully.");
                }
                browser.createCSS(window.document, css, sheet);
                less.logger.info("css for " + sheet.href + " generated in " + (new Date() - endTime) + 'ms');
                if (webInfo.remaining === 0) {
                    totalMilliseconds = new Date() - startTime;
                    less.logger.info("less has finished. css generated in " + totalMilliseconds + 'ms');
                    resolve({
                        startTime: startTime,
                        endTime: endTime,
                        totalMilliseconds: totalMilliseconds,
                        sheets: less.sheets.length
                    });
                }
                endTime = new Date();
            }, reload, modifyVars);

            loadStyles(modifyVars);
        });
    };

    less.refreshStyles = loadStyles;
    return less;
};

},{"../less":31,"./browser":3,"./cache":4,"./error-reporting":5,"./file-manager":6,"./image-size":7,"./log-listener":9,"./utils":10}],9:[function(require,module,exports){
module.exports = function(less, options) {

    var logLevel_debug = 4,
        logLevel_info = 3,
        logLevel_warn = 2,
        logLevel_error = 1;

    // The amount of logging in the javascript console.
    // 3 - Debug, information and errors
    // 2 - Information and errors
    // 1 - Errors
    // 0 - None
    // Defaults to 2
    options.logLevel = typeof options.logLevel !== 'undefined' ? options.logLevel : (options.env === 'development' ?  logLevel_info : logLevel_error);

    if (!options.loggers) {
        options.loggers = [{
            debug: function(msg) {
                if (options.logLevel >= logLevel_debug) {
                    console.log(msg);
                }
            },
            info: function(msg) {
                if (options.logLevel >= logLevel_info) {
                    console.log(msg);
                }
            },
            warn: function(msg) {
                if (options.logLevel >= logLevel_warn) {
                    console.warn(msg);
                }
            },
            error: function(msg) {
                if (options.logLevel >= logLevel_error) {
                    console.error(msg);
                }
            }
        }];
    }
    for (var i = 0; i < options.loggers.length; i++) {
        less.logger.addListener(options.loggers[i]);
    }
};

},{}],10:[function(require,module,exports){
module.exports = {
    extractId: function(href) {
        return href.replace(/^[a-z-]+:\/+?[^\/]+/, '')  // Remove protocol & domain
            .replace(/[\?\&]livereload=\w+/, '')        // Remove LiveReload cachebuster
            .replace(/^\//, '')                         // Remove root /
            .replace(/\.[a-zA-Z]+$/, '')                // Remove simple extension
            .replace(/[^\.\w-]+/g, '-')                 // Replace illegal characters
            .replace(/\./g, ':');                       // Replace dots with colons(for valid id)
    },
    addDataAttr: function(options, tag) {
        for (var opt in tag.dataset) {
            if (tag.dataset.hasOwnProperty(opt)) {
                if (opt === "env" || opt === "dumpLineNumbers" || opt === "rootpath" || opt === "errorReporting") {
                    options[opt] = tag.dataset[opt];
                } else {
                    try {
                        options[opt] = JSON.parse(tag.dataset[opt]);
                    }
                    catch(_) {}
                }
            }
        }
    }
};

},{}],11:[function(require,module,exports){
var contexts = {};
module.exports = contexts;

var copyFromOriginal = function copyFromOriginal(original, destination, propertiesToCopy) {
    if (!original) { return; }

    for (var i = 0; i < propertiesToCopy.length; i++) {
        if (original.hasOwnProperty(propertiesToCopy[i])) {
            destination[propertiesToCopy[i]] = original[propertiesToCopy[i]];
        }
    }
};

/*
 parse is used whilst parsing
 */
var parseCopyProperties = [
    // options
    'paths',            // option - unmodified - paths to search for imports on
    'relativeUrls',     // option - whether to adjust URL's to be relative
    'rootpath',         // option - rootpath to append to URL's
    'strictImports',    // option -
    'insecure',         // option - whether to allow imports from insecure ssl hosts
    'dumpLineNumbers',  // option - whether to dump line numbers
    'compress',         // option - whether to compress
    'syncImport',       // option - whether to import synchronously
    'chunkInput',       // option - whether to chunk input. more performant but causes parse issues.
    'mime',             // browser only - mime type for sheet import
    'useFileCache',     // browser only - whether to use the per file session cache
    // context
    'processImports',   // option & context - whether to process imports. if false then imports will not be imported.
                        // Used by the import manager to stop multiple import visitors being created.
    'pluginManager'     // Used as the plugin manager for the session
];

contexts.Parse = function(options) {
    copyFromOriginal(options, this, parseCopyProperties);

    if (typeof this.paths === "string") { this.paths = [this.paths]; }
};

var evalCopyProperties = [
    'paths',          // additional include paths
    'compress',       // whether to compress
    'ieCompat',       // whether to enforce IE compatibility (IE8 data-uri)
    'strictMath',     // whether math has to be within parenthesis
    'strictUnits',    // whether units need to evaluate correctly
    'sourceMap',      // whether to output a source map
    'importMultiple', // whether we are currently importing multiple copies
    'urlArgs',        // whether to add args into url tokens
    'javascriptEnabled',// option - whether JavaScript is enabled. if undefined, defaults to true
    'pluginManager',  // Used as the plugin manager for the session
    'importantScope'  // used to bubble up !important statements
    ];

contexts.Eval = function(options, frames) {
    copyFromOriginal(options, this, evalCopyProperties);

    if (typeof this.paths === "string") { this.paths = [this.paths]; }

    this.frames = frames || [];
    this.importantScope = this.importantScope || [];
};

contexts.Eval.prototype.inParenthesis = function () {
    if (!this.parensStack) {
        this.parensStack = [];
    }
    this.parensStack.push(true);
};

contexts.Eval.prototype.outOfParenthesis = function () {
    this.parensStack.pop();
};

contexts.Eval.prototype.isMathOn = function () {
    return this.strictMath ? (this.parensStack && this.parensStack.length) : true;
};

contexts.Eval.prototype.isPathRelative = function (path) {
    return !/^(?:[a-z-]+:|\/|#)/i.test(path);
};

contexts.Eval.prototype.normalizePath = function( path ) {
    var
      segments = path.split("/").reverse(),
      segment;

    path = [];
    while (segments.length !== 0 ) {
        segment = segments.pop();
        switch( segment ) {
            case ".":
                break;
            case "..":
                if ((path.length === 0) || (path[path.length - 1] === "..")) {
                    path.push( segment );
                } else {
                    path.pop();
                }
                break;
            default:
                path.push( segment );
                break;
        }
    }

    return path.join("/");
};

//todo - do the same for the toCSS ?

},{}],12:[function(require,module,exports){
module.exports = {
    'aliceblue':'#f0f8ff',
    'antiquewhite':'#faebd7',
    'aqua':'#00ffff',
    'aquamarine':'#7fffd4',
    'azure':'#f0ffff',
    'beige':'#f5f5dc',
    'bisque':'#ffe4c4',
    'black':'#000000',
    'blanchedalmond':'#ffebcd',
    'blue':'#0000ff',
    'blueviolet':'#8a2be2',
    'brown':'#a52a2a',
    'burlywood':'#deb887',
    'cadetblue':'#5f9ea0',
    'chartreuse':'#7fff00',
    'chocolate':'#d2691e',
    'coral':'#ff7f50',
    'cornflowerblue':'#6495ed',
    'cornsilk':'#fff8dc',
    'crimson':'#dc143c',
    'cyan':'#00ffff',
    'darkblue':'#00008b',
    'darkcyan':'#008b8b',
    'darkgoldenrod':'#b8860b',
    'darkgray':'#a9a9a9',
    'darkgrey':'#a9a9a9',
    'darkgreen':'#006400',
    'darkkhaki':'#bdb76b',
    'darkmagenta':'#8b008b',
    'darkolivegreen':'#556b2f',
    'darkorange':'#ff8c00',
    'darkorchid':'#9932cc',
    'darkred':'#8b0000',
    'darksalmon':'#e9967a',
    'darkseagreen':'#8fbc8f',
    'darkslateblue':'#483d8b',
    'darkslategray':'#2f4f4f',
    'darkslategrey':'#2f4f4f',
    'darkturquoise':'#00ced1',
    'darkviolet':'#9400d3',
    'deeppink':'#ff1493',
    'deepskyblue':'#00bfff',
    'dimgray':'#696969',
    'dimgrey':'#696969',
    'dodgerblue':'#1e90ff',
    'firebrick':'#b22222',
    'floralwhite':'#fffaf0',
    'forestgreen':'#228b22',
    'fuchsia':'#ff00ff',
    'gainsboro':'#dcdcdc',
    'ghostwhite':'#f8f8ff',
    'gold':'#ffd700',
    'goldenrod':'#daa520',
    'gray':'#808080',
    'grey':'#808080',
    'green':'#008000',
    'greenyellow':'#adff2f',
    'honeydew':'#f0fff0',
    'hotpink':'#ff69b4',
    'indianred':'#cd5c5c',
    'indigo':'#4b0082',
    'ivory':'#fffff0',
    'khaki':'#f0e68c',
    'lavender':'#e6e6fa',
    'lavenderblush':'#fff0f5',
    'lawngreen':'#7cfc00',
    'lemonchiffon':'#fffacd',
    'lightblue':'#add8e6',
    'lightcoral':'#f08080',
    'lightcyan':'#e0ffff',
    'lightgoldenrodyellow':'#fafad2',
    'lightgray':'#d3d3d3',
    'lightgrey':'#d3d3d3',
    'lightgreen':'#90ee90',
    'lightpink':'#ffb6c1',
    'lightsalmon':'#ffa07a',
    'lightseagreen':'#20b2aa',
    'lightskyblue':'#87cefa',
    'lightslategray':'#778899',
    'lightslategrey':'#778899',
    'lightsteelblue':'#b0c4de',
    'lightyellow':'#ffffe0',
    'lime':'#00ff00',
    'limegreen':'#32cd32',
    'linen':'#faf0e6',
    'magenta':'#ff00ff',
    'maroon':'#800000',
    'mediumaquamarine':'#66cdaa',
    'mediumblue':'#0000cd',
    'mediumorchid':'#ba55d3',
    'mediumpurple':'#9370d8',
    'mediumseagreen':'#3cb371',
    'mediumslateblue':'#7b68ee',
    'mediumspringgreen':'#00fa9a',
    'mediumturquoise':'#48d1cc',
    'mediumvioletred':'#c71585',
    'midnightblue':'#191970',
    'mintcream':'#f5fffa',
    'mistyrose':'#ffe4e1',
    'moccasin':'#ffe4b5',
    'navajowhite':'#ffdead',
    'navy':'#000080',
    'oldlace':'#fdf5e6',
    'olive':'#808000',
    'olivedrab':'#6b8e23',
    'orange':'#ffa500',
    'orangered':'#ff4500',
    'orchid':'#da70d6',
    'palegoldenrod':'#eee8aa',
    'palegreen':'#98fb98',
    'paleturquoise':'#afeeee',
    'palevioletred':'#d87093',
    'papayawhip':'#ffefd5',
    'peachpuff':'#ffdab9',
    'peru':'#cd853f',
    'pink':'#ffc0cb',
    'plum':'#dda0dd',
    'powderblue':'#b0e0e6',
    'purple':'#800080',
    'rebeccapurple':'#663399',
    'red':'#ff0000',
    'rosybrown':'#bc8f8f',
    'royalblue':'#4169e1',
    'saddlebrown':'#8b4513',
    'salmon':'#fa8072',
    'sandybrown':'#f4a460',
    'seagreen':'#2e8b57',
    'seashell':'#fff5ee',
    'sienna':'#a0522d',
    'silver':'#c0c0c0',
    'skyblue':'#87ceeb',
    'slateblue':'#6a5acd',
    'slategray':'#708090',
    'slategrey':'#708090',
    'snow':'#fffafa',
    'springgreen':'#00ff7f',
    'steelblue':'#4682b4',
    'tan':'#d2b48c',
    'teal':'#008080',
    'thistle':'#d8bfd8',
    'tomato':'#ff6347',
    'turquoise':'#40e0d0',
    'violet':'#ee82ee',
    'wheat':'#f5deb3',
    'white':'#ffffff',
    'whitesmoke':'#f5f5f5',
    'yellow':'#ffff00',
    'yellowgreen':'#9acd32'
};
},{}],13:[function(require,module,exports){
module.exports = {
    colors: require("./colors"),
    unitConversions: require("./unit-conversions")
};

},{"./colors":12,"./unit-conversions":14}],14:[function(require,module,exports){
module.exports = {
    length: {
        'm': 1,
        'cm': 0.01,
        'mm': 0.001,
        'in': 0.0254,
        'px': 0.0254 / 96,
        'pt': 0.0254 / 72,
        'pc': 0.0254 / 72 * 12
    },
    duration: {
        's': 1,
        'ms': 0.001
    },
    angle: {
        'rad': 1 / (2 * Math.PI),
        'deg': 1 / 360,
        'grad': 1 / 400,
        'turn': 1
    }
};
},{}],15:[function(require,module,exports){
var abstractFileManager = function() {
};

abstractFileManager.prototype.getPath = function (filename) {
    var j = filename.lastIndexOf('?');
    if (j > 0) {
        filename = filename.slice(0, j);
    }
    j = filename.lastIndexOf('/');
    if (j < 0) {
        j = filename.lastIndexOf('\\');
    }
    if (j < 0) {
        return "";
    }
    return filename.slice(0, j + 1);
};

abstractFileManager.prototype.tryAppendExtension = function(path, ext) {
    return /(\.[a-z]*$)|([\?;].*)$/.test(path) ? path : path + ext;
};

abstractFileManager.prototype.tryAppendLessExtension = function(path) {
    return this.tryAppendExtension(path, '.less');
};

abstractFileManager.prototype.supportsSync = function() {
    return false;
};

abstractFileManager.prototype.alwaysMakePathsAbsolute = function() {
    return false;
};

abstractFileManager.prototype.isPathAbsolute = function(filename) {
    return (/^(?:[a-z-]+:|\/|\\|#)/i).test(filename);
};

abstractFileManager.prototype.join = function(basePath, laterPath) {
    if (!basePath) {
        return laterPath;
    }
    return basePath + laterPath;
};
abstractFileManager.prototype.pathDiff = function pathDiff(url, baseUrl) {
    // diff between two paths to create a relative path

    var urlParts = this.extractUrlParts(url),
        baseUrlParts = this.extractUrlParts(baseUrl),
        i, max, urlDirectories, baseUrlDirectories, diff = "";
    if (urlParts.hostPart !== baseUrlParts.hostPart) {
        return "";
    }
    max = Math.max(baseUrlParts.directories.length, urlParts.directories.length);
    for (i = 0; i < max; i++) {
        if (baseUrlParts.directories[i] !== urlParts.directories[i]) { break; }
    }
    baseUrlDirectories = baseUrlParts.directories.slice(i);
    urlDirectories = urlParts.directories.slice(i);
    for (i = 0; i < baseUrlDirectories.length - 1; i++) {
        diff += "../";
    }
    for (i = 0; i < urlDirectories.length - 1; i++) {
        diff += urlDirectories[i] + "/";
    }
    return diff;
};
// helper function, not part of API
abstractFileManager.prototype.extractUrlParts = function extractUrlParts(url, baseUrl) {
    // urlParts[1] = protocol&hostname || /
    // urlParts[2] = / if path relative to host base
    // urlParts[3] = directories
    // urlParts[4] = filename
    // urlParts[5] = parameters

    var urlPartsRegex = /^((?:[a-z-]+:)?\/+?(?:[^\/\?#]*\/)|([\/\\]))?((?:[^\/\\\?#]*[\/\\])*)([^\/\\\?#]*)([#\?].*)?$/i,
        urlParts = url.match(urlPartsRegex),
        returner = {}, directories = [], i, baseUrlParts;

    if (!urlParts) {
        throw new Error("Could not parse sheet href - '" + url + "'");
    }

    // Stylesheets in IE don't always return the full path
    if (baseUrl && (!urlParts[1] || urlParts[2])) {
        baseUrlParts = baseUrl.match(urlPartsRegex);
        if (!baseUrlParts) {
            throw new Error("Could not parse page url - '" + baseUrl + "'");
        }
        urlParts[1] = urlParts[1] || baseUrlParts[1] || "";
        if (!urlParts[2]) {
            urlParts[3] = baseUrlParts[3] + urlParts[3];
        }
    }

    if (urlParts[3]) {
        directories = urlParts[3].replace(/\\/g, "/").split("/");

        // extract out . before .. so .. doesn't absorb a non-directory
        for (i = 0; i < directories.length; i++) {
            if (directories[i] === ".") {
                directories.splice(i, 1);
                i -= 1;
            }
        }

        for (i = 0; i < directories.length; i++) {
            if (directories[i] === ".." && i > 0) {
                directories.splice(i - 1, 2);
                i -= 2;
            }
        }
    }

    returner.hostPart = urlParts[1];
    returner.directories = directories;
    returner.path = (urlParts[1] || "") + directories.join("/");
    returner.fileUrl = returner.path + (urlParts[4] || "");
    returner.url = returner.fileUrl + (urlParts[5] || "");
    return returner;
};

module.exports = abstractFileManager;

},{}],16:[function(require,module,exports){
var logger = require("../logger");
var environment = function(externalEnvironment, fileManagers) {
    this.fileManagers = fileManagers || [];
    externalEnvironment = externalEnvironment || {};

    var optionalFunctions = ["encodeBase64", "mimeLookup", "charsetLookup", "getSourceMapGenerator"],
        requiredFunctions = [],
        functions = requiredFunctions.concat(optionalFunctions);

    for (var i = 0; i < functions.length; i++) {
        var propName = functions[i],
            environmentFunc = externalEnvironment[propName];
        if (environmentFunc) {
            this[propName] = environmentFunc.bind(externalEnvironment);
        } else if (i < requiredFunctions.length) {
            this.warn("missing required function in environment - " + propName);
        }
    }
};

environment.prototype.getFileManager = function (filename, currentDirectory, options, environment, isSync) {

    if (!filename) {
        logger.warn("getFileManager called with no filename.. Please report this issue. continuing.");
    }
    if (currentDirectory == null) {
        logger.warn("getFileManager called with null directory.. Please report this issue. continuing.");
    }

    var fileManagers = this.fileManagers;
    if (options.pluginManager) {
        fileManagers = [].concat(fileManagers).concat(options.pluginManager.getFileManagers());
    }
    for (var i = fileManagers.length - 1; i >= 0 ; i--) {
        var fileManager = fileManagers[i];
        if (fileManager[isSync ? "supportsSync" : "supports"](filename, currentDirectory, options, environment)) {
            return fileManager;
        }
    }
    return null;
};

environment.prototype.addFileManager = function (fileManager) {
    this.fileManagers.push(fileManager);
};

environment.prototype.clearFileManagers = function () {
    this.fileManagers = [];
};

module.exports = environment;

},{"../logger":33}],17:[function(require,module,exports){
var Color = require("../tree/color"),
    functionRegistry = require("./function-registry");

// Color Blending
// ref: http://www.w3.org/TR/compositing-1

function colorBlend(mode, color1, color2) {
    var ab = color1.alpha, cb, // backdrop
        as = color2.alpha, cs, // source
        ar, cr, r = [];        // result

    ar = as + ab * (1 - as);
    for (var i = 0; i < 3; i++) {
        cb = color1.rgb[i] / 255;
        cs = color2.rgb[i] / 255;
        cr = mode(cb, cs);
        if (ar) {
            cr = (as * cs + ab * (cb -
                  as * (cb + cs - cr))) / ar;
        }
        r[i] = cr * 255;
    }

    return new Color(r, ar);
}

var colorBlendModeFunctions = {
    multiply: function(cb, cs) {
        return cb * cs;
    },
    screen: function(cb, cs) {
        return cb + cs - cb * cs;
    },
    overlay: function(cb, cs) {
        cb *= 2;
        return (cb <= 1) ?
            colorBlendModeFunctions.multiply(cb, cs) :
            colorBlendModeFunctions.screen(cb - 1, cs);
    },
    softlight: function(cb, cs) {
        var d = 1, e = cb;
        if (cs > 0.5) {
            e = 1;
            d = (cb > 0.25) ? Math.sqrt(cb)
                : ((16 * cb - 12) * cb + 4) * cb;
        }
        return cb - (1 - 2 * cs) * e * (d - cb);
    },
    hardlight: function(cb, cs) {
        return colorBlendModeFunctions.overlay(cs, cb);
    },
    difference: function(cb, cs) {
        return Math.abs(cb - cs);
    },
    exclusion: function(cb, cs) {
        return cb + cs - 2 * cb * cs;
    },

    // non-w3c functions:
    average: function(cb, cs) {
        return (cb + cs) / 2;
    },
    negation: function(cb, cs) {
        return 1 - Math.abs(cb + cs - 1);
    }
};

for (var f in colorBlendModeFunctions) {
    if (colorBlendModeFunctions.hasOwnProperty(f)) {
        colorBlend[f] = colorBlend.bind(null, colorBlendModeFunctions[f]);
    }
}

functionRegistry.addMultiple(colorBlend);

},{"../tree/color":50,"./function-registry":22}],18:[function(require,module,exports){
var Dimension = require("../tree/dimension"),
    Color = require("../tree/color"),
    Quoted = require("../tree/quoted"),
    Anonymous = require("../tree/anonymous"),
    functionRegistry = require("./function-registry"),
    colorFunctions;

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}
function hsla(color) {
    return colorFunctions.hsla(color.h, color.s, color.l, color.a);
}
function number(n) {
    if (n instanceof Dimension) {
        return parseFloat(n.unit.is('%') ? n.value / 100 : n.value);
    } else if (typeof n === 'number') {
        return n;
    } else {
        throw {
            type: "Argument",
            message: "color functions take numbers as parameters"
        };
    }
}
function scaled(n, size) {
    if (n instanceof Dimension && n.unit.is('%')) {
        return parseFloat(n.value * size / 100);
    } else {
        return number(n);
    }
}
colorFunctions = {
    rgb: function (r, g, b) {
        return colorFunctions.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return scaled(c, 255); });
        a = number(a);
        return new Color(rgb, a);
    },
    hsl: function (h, s, l) {
        return colorFunctions.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {

        var m1, m2;

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if (h * 6 < 1) {
                return m1 + (m2 - m1) * h * 6;
            }
            else if (h * 2 < 1) {
                return m2;
            }
            else if (h * 3 < 2) {
                return m1 + (m2 - m1) * (2 / 3 - h) * 6;
            }
            else {
                return m1;
            }
        }

        h = (number(h) % 360) / 360;
        s = clamp(number(s)); l = clamp(number(l)); a = clamp(number(a));

        m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;

        return colorFunctions.rgba(hue(h + 1 / 3) * 255,
            hue(h)       * 255,
            hue(h - 1 / 3) * 255,
            a);
    },

    hsv: function(h, s, v) {
        return colorFunctions.hsva(h, s, v, 1.0);
    },

    hsva: function(h, s, v, a) {
        h = ((number(h) % 360) / 360) * 360;
        s = number(s); v = number(v); a = number(a);

        var i, f;
        i = Math.floor((h / 60) % 6);
        f = (h / 60) - i;

        var vs = [v,
            v * (1 - s),
            v * (1 - f * s),
            v * (1 - (1 - f) * s)];
        var perm = [[0, 3, 1],
            [2, 0, 1],
            [1, 0, 3],
            [1, 2, 0],
            [3, 1, 0],
            [0, 1, 2]];

        return colorFunctions.rgba(vs[perm[i][0]] * 255,
            vs[perm[i][1]] * 255,
            vs[perm[i][2]] * 255,
            a);
    },

    hue: function (color) {
        return new Dimension(color.toHSL().h);
    },
    saturation: function (color) {
        return new Dimension(color.toHSL().s * 100, '%');
    },
    lightness: function (color) {
        return new Dimension(color.toHSL().l * 100, '%');
    },
    hsvhue: function(color) {
        return new Dimension(color.toHSV().h);
    },
    hsvsaturation: function (color) {
        return new Dimension(color.toHSV().s * 100, '%');
    },
    hsvvalue: function (color) {
        return new Dimension(color.toHSV().v * 100, '%');
    },
    red: function (color) {
        return new Dimension(color.rgb[0]);
    },
    green: function (color) {
        return new Dimension(color.rgb[1]);
    },
    blue: function (color) {
        return new Dimension(color.rgb[2]);
    },
    alpha: function (color) {
        return new Dimension(color.toHSL().a);
    },
    luma: function (color) {
        return new Dimension(color.luma() * color.alpha * 100, '%');
    },
    luminance: function (color) {
        var luminance =
            (0.2126 * color.rgb[0] / 255) +
                (0.7152 * color.rgb[1] / 255) +
                (0.0722 * color.rgb[2] / 255);

        return new Dimension(luminance * color.alpha * 100, '%');
    },
    saturate: function (color, amount, method) {
        // filter: saturate(3.2);
        // should be kept as is, so check for color
        if (!color.rgb) {
            return null;
        }
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.s +=  hsl.s * amount.value / 100;
        }
        else {
            hsl.s += amount.value / 100;
        }
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount, method) {
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.s -=  hsl.s * amount.value / 100;
        }
        else {
            hsl.s -= amount.value / 100;
        }
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount, method) {
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.l +=  hsl.l * amount.value / 100;
        }
        else {
            hsl.l += amount.value / 100;
        }
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount, method) {
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.l -=  hsl.l * amount.value / 100;
        }
        else {
            hsl.l -= amount.value / 100;
        }
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount, method) {
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.a +=  hsl.a * amount.value / 100;
        }
        else {
            hsl.a += amount.value / 100;
        }
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount, method) {
        var hsl = color.toHSL();

        if (typeof method !== "undefined" && method.value === "relative") {
            hsl.a -=  hsl.a * amount.value / 100;
        }
        else {
            hsl.a -= amount.value / 100;
        }
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fade: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a = amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        if (!color1.toHSL || !color2.toHSL) {
            console.log(color2.type);
            console.dir(color2);
        }
        if (!weight) {
            weight = new Dimension(50);
        }
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a == -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
            color1.rgb[1] * w1 + color2.rgb[1] * w2,
            color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new Color(rgb, alpha);
    },
    greyscale: function (color) {
        return colorFunctions.desaturate(color, new Dimension(100));
    },
    contrast: function (color, dark, light, threshold) {
        // filter: contrast(3.2);
        // should be kept as is, so check for color
        if (!color.rgb) {
            return null;
        }
        if (typeof light === 'undefined') {
            light = colorFunctions.rgba(255, 255, 255, 1.0);
        }
        if (typeof dark === 'undefined') {
            dark = colorFunctions.rgba(0, 0, 0, 1.0);
        }
        //Figure out which is actually light and dark!
        if (dark.luma() > light.luma()) {
            var t = light;
            light = dark;
            dark = t;
        }
        if (typeof threshold === 'undefined') {
            threshold = 0.43;
        } else {
            threshold = number(threshold);
        }
        if (color.luma() < threshold) {
            return light;
        } else {
            return dark;
        }
    },
    argb: function (color) {
        return new Anonymous(color.toARGB());
    },
    color: function(c) {
        if ((c instanceof Quoted) &&
            (/^#([a-f0-9]{6}|[a-f0-9]{3})$/i.test(c.value))) {
            return new Color(c.value.slice(1));
        }
        if ((c instanceof Color) || (c = Color.fromKeyword(c.value))) {
            c.value = undefined;
            return c;
        }
        throw {
            type:    "Argument",
            message: "argument must be a color keyword or 3/6 digit hex e.g. #FFF"
        };
    },
    tint: function(color, amount) {
        return colorFunctions.mix(colorFunctions.rgb(255, 255, 255), color, amount);
    },
    shade: function(color, amount) {
        return colorFunctions.mix(colorFunctions.rgb(0, 0, 0), color, amount);
    }
};
functionRegistry.addMultiple(colorFunctions);

},{"../tree/anonymous":46,"../tree/color":50,"../tree/dimension":56,"../tree/quoted":73,"./function-registry":22}],19:[function(require,module,exports){
module.exports = function(environment) {
    var Quoted = require("../tree/quoted"),
        URL = require("../tree/url"),
        functionRegistry = require("./function-registry"),
        fallback = function(functionThis, node) {
            return new URL(node, functionThis.index, functionThis.currentFileInfo).eval(functionThis.context);
        },
        logger = require('../logger');

    functionRegistry.add("data-uri", function(mimetypeNode, filePathNode) {

        if (!filePathNode) {
            filePathNode = mimetypeNode;
            mimetypeNode = null;
        }

        var mimetype = mimetypeNode && mimetypeNode.value;
        var filePath = filePathNode.value;
        var currentFileInfo = this.currentFileInfo;
        var currentDirectory = currentFileInfo.relativeUrls ?
            currentFileInfo.currentDirectory : currentFileInfo.entryPath;

        var fragmentStart = filePath.indexOf('#');
        var fragment = '';
        if (fragmentStart !== -1) {
            fragment = filePath.slice(fragmentStart);
            filePath = filePath.slice(0, fragmentStart);
        }

        var fileManager = environment.getFileManager(filePath, currentDirectory, this.context, environment, true);

        if (!fileManager) {
            return fallback(this, filePathNode);
        }

        var useBase64 = false;

        // detect the mimetype if not given
        if (!mimetypeNode) {

            mimetype = environment.mimeLookup(filePath);

            if (mimetype === "image/svg+xml") {
                useBase64 = false;
            } else {
                // use base 64 unless it's an ASCII or UTF-8 format
                var charset = environment.charsetLookup(mimetype);
                useBase64 = ['US-ASCII', 'UTF-8'].indexOf(charset) < 0;
            }
            if (useBase64) { mimetype += ';base64'; }
        }
        else {
            useBase64 = /;base64$/.test(mimetype);
        }

        var fileSync = fileManager.loadFileSync(filePath, currentDirectory, this.context, environment);
        if (!fileSync.contents) {
            logger.warn("Skipped data-uri embedding of " + filePath + " because file not found");
            return fallback(this, filePathNode || mimetypeNode);
        }
        var buf = fileSync.contents;
        if (useBase64 && !environment.encodeBase64) {
            return fallback(this, filePathNode);
        }

        buf = useBase64 ? environment.encodeBase64(buf) : encodeURIComponent(buf);

        var uri = "data:" + mimetype + ',' + buf + fragment;

        // IE8 cannot handle a data-uri larger than 32,768 characters. If this is exceeded
        // and the --ieCompat flag is enabled, return a normal url() instead.
        var DATA_URI_MAX = 32768;
        if (uri.length >= DATA_URI_MAX) {

            if (this.context.ieCompat !== false) {
                logger.warn("Skipped data-uri embedding of " + filePath + " because its size (" + uri.length +
                    " characters) exceeds IE8-safe " + DATA_URI_MAX + " characters!");

                return fallback(this, filePathNode || mimetypeNode);
            }
        }

        return new URL(new Quoted('"' + uri + '"', uri, false, this.index, this.currentFileInfo), this.index, this.currentFileInfo);
    });
};

},{"../logger":33,"../tree/quoted":73,"../tree/url":80,"./function-registry":22}],20:[function(require,module,exports){
var Keyword = require("../tree/keyword"),
    functionRegistry = require("./function-registry");

var defaultFunc = {
    eval: function () {
        var v = this.value_, e = this.error_;
        if (e) {
            throw e;
        }
        if (v != null) {
            return v ? Keyword.True : Keyword.False;
        }
    },
    value: function (v) {
        this.value_ = v;
    },
    error: function (e) {
        this.error_ = e;
    },
    reset: function () {
        this.value_ = this.error_ = null;
    }
};

functionRegistry.add("default", defaultFunc.eval.bind(defaultFunc));

module.exports = defaultFunc;

},{"../tree/keyword":65,"./function-registry":22}],21:[function(require,module,exports){
var Expression = require("../tree/expression");

var functionCaller = function(name, context, index, currentFileInfo) {
    this.name = name.toLowerCase();
    this.index = index;
    this.context = context;
    this.currentFileInfo = currentFileInfo;

    this.func = context.frames[0].functionRegistry.get(this.name);
};
functionCaller.prototype.isValid = function() {
    return Boolean(this.func);
};
functionCaller.prototype.call = function(args) {

    // This code is terrible and should be replaced as per this issue...
    // https://github.com/less/less.js/issues/2477
    if (Array.isArray(args)) {
        args = args.filter(function (item) {
            if (item.type === "Comment") {
                return false;
            }
            return true;
        })
        .map(function(item) {
            if (item.type === "Expression") {
                var subNodes = item.value.filter(function (item) {
                    if (item.type === "Comment") {
                        return false;
                    }
                    return true;
                });
                if (subNodes.length === 1) {
                    return subNodes[0];
                } else {
                    return new Expression(subNodes);
                }
            }
            return item;
        });
    }

    return this.func.apply(this, args);
};

module.exports = functionCaller;

},{"../tree/expression":59}],22:[function(require,module,exports){
function makeRegistry( base ) {
    return {
        _data: {},
        add: function(name, func) {
            // precautionary case conversion, as later querying of
            // the registry by function-caller uses lower case as well.
            name = name.toLowerCase();

            if (this._data.hasOwnProperty(name)) {
                //TODO warn
            }
            this._data[name] = func;
        },
        addMultiple: function(functions) {
            Object.keys(functions).forEach(
                function(name) {
                    this.add(name, functions[name]);
                }.bind(this));
        },
        get: function(name) {
            return this._data[name] || ( base && base.get( name ));
        },
        inherit : function() {
            return makeRegistry( this );
        }
    };
}

module.exports = makeRegistry( null );
},{}],23:[function(require,module,exports){
module.exports = function(environment) {
    var functions = {
        functionRegistry: require("./function-registry"),
        functionCaller: require("./function-caller")
    };

    //register functions
    require("./default");
    require("./color");
    require("./color-blending");
    require("./data-uri")(environment);
    require("./math");
    require("./number");
    require("./string");
    require("./svg")(environment);
    require("./types");

    return functions;
};

},{"./color":18,"./color-blending":17,"./data-uri":19,"./default":20,"./function-caller":21,"./function-registry":22,"./math":25,"./number":26,"./string":27,"./svg":28,"./types":29}],24:[function(require,module,exports){
var Dimension = require("../tree/dimension");

var MathHelper = function() {
};
MathHelper._math = function (fn, unit, n) {
    if (!(n instanceof Dimension)) {
        throw { type: "Argument", message: "argument must be a number" };
    }
    if (unit == null) {
        unit = n.unit;
    } else {
        n = n.unify();
    }
    return new Dimension(fn(parseFloat(n.value)), unit);
};
module.exports = MathHelper;
},{"../tree/dimension":56}],25:[function(require,module,exports){
var functionRegistry = require("./function-registry"),
    mathHelper = require("./math-helper.js");

var mathFunctions = {
    // name,  unit
    ceil:  null,
    floor: null,
    sqrt:  null,
    abs:   null,
    tan:   "",
    sin:   "",
    cos:   "",
    atan:  "rad",
    asin:  "rad",
    acos:  "rad"
};

for (var f in mathFunctions) {
    if (mathFunctions.hasOwnProperty(f)) {
        mathFunctions[f] = mathHelper._math.bind(null, Math[f], mathFunctions[f]);
    }
}

mathFunctions.round = function (n, f) {
    var fraction = typeof f === "undefined" ? 0 : f.value;
    return mathHelper._math(function(num) { return num.toFixed(fraction); }, null, n);
};

functionRegistry.addMultiple(mathFunctions);

},{"./function-registry":22,"./math-helper.js":24}],26:[function(require,module,exports){
var Dimension = require("../tree/dimension"),
    Anonymous = require("../tree/anonymous"),
    functionRegistry = require("./function-registry"),
    mathHelper = require("./math-helper.js");

var minMax = function (isMin, args) {
    args = Array.prototype.slice.call(args);
    switch(args.length) {
        case 0: throw { type: "Argument", message: "one or more arguments required" };
    }
    var i, j, current, currentUnified, referenceUnified, unit, unitStatic, unitClone,
        order  = [], // elems only contains original argument values.
        values = {}; // key is the unit.toString() for unified Dimension values,
    // value is the index into the order array.
    for (i = 0; i < args.length; i++) {
        current = args[i];
        if (!(current instanceof Dimension)) {
            if (Array.isArray(args[i].value)) {
                Array.prototype.push.apply(args, Array.prototype.slice.call(args[i].value));
            }
            continue;
        }
        currentUnified = current.unit.toString() === "" && unitClone !== undefined ? new Dimension(current.value, unitClone).unify() : current.unify();
        unit = currentUnified.unit.toString() === "" && unitStatic !== undefined ? unitStatic : currentUnified.unit.toString();
        unitStatic = unit !== "" && unitStatic === undefined || unit !== "" && order[0].unify().unit.toString() === "" ? unit : unitStatic;
        unitClone = unit !== "" && unitClone === undefined ? current.unit.toString() : unitClone;
        j = values[""] !== undefined && unit !== "" && unit === unitStatic ? values[""] : values[unit];
        if (j === undefined) {
            if (unitStatic !== undefined && unit !== unitStatic) {
                throw{ type: "Argument", message: "incompatible types" };
            }
            values[unit] = order.length;
            order.push(current);
            continue;
        }
        referenceUnified = order[j].unit.toString() === "" && unitClone !== undefined ? new Dimension(order[j].value, unitClone).unify() : order[j].unify();
        if ( isMin && currentUnified.value < referenceUnified.value ||
            !isMin && currentUnified.value > referenceUnified.value) {
            order[j] = current;
        }
    }
    if (order.length == 1) {
        return order[0];
    }
    args = order.map(function (a) { return a.toCSS(this.context); }).join(this.context.compress ? "," : ", ");
    return new Anonymous((isMin ? "min" : "max") + "(" + args + ")");
};
functionRegistry.addMultiple({
    min: function () {
        return minMax(true, arguments);
    },
    max: function () {
        return minMax(false, arguments);
    },
    convert: function (val, unit) {
        return val.convertTo(unit.value);
    },
    pi: function () {
        return new Dimension(Math.PI);
    },
    mod: function(a, b) {
        return new Dimension(a.value % b.value, a.unit);
    },
    pow: function(x, y) {
        if (typeof x === "number" && typeof y === "number") {
            x = new Dimension(x);
            y = new Dimension(y);
        } else if (!(x instanceof Dimension) || !(y instanceof Dimension)) {
            throw { type: "Argument", message: "arguments must be numbers" };
        }

        return new Dimension(Math.pow(x.value, y.value), x.unit);
    },
    percentage: function (n) {
        var result = mathHelper._math(function(num) {
            return num * 100;
        }, '%', n);

        return result;
    }
});

},{"../tree/anonymous":46,"../tree/dimension":56,"./function-registry":22,"./math-helper.js":24}],27:[function(require,module,exports){
var Quoted = require("../tree/quoted"),
    Anonymous = require("../tree/anonymous"),
    JavaScript = require("../tree/javascript"),
    functionRegistry = require("./function-registry");

functionRegistry.addMultiple({
    e: function (str) {
        return new Anonymous(str instanceof JavaScript ? str.evaluated : str.value);
    },
    escape: function (str) {
        return new Anonymous(
            encodeURI(str.value).replace(/=/g, "%3D").replace(/:/g, "%3A").replace(/#/g, "%23").replace(/;/g, "%3B")
                .replace(/\(/g, "%28").replace(/\)/g, "%29"));
    },
    replace: function (string, pattern, replacement, flags) {
        var result = string.value;
        replacement = (replacement.type === "Quoted") ?
            replacement.value : replacement.toCSS();
        result = result.replace(new RegExp(pattern.value, flags ? flags.value : ''), replacement);
        return new Quoted(string.quote || '', result, string.escaped);
    },
    '%': function (string /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            result = string.value;

        for (var i = 0; i < args.length; i++) {
            /*jshint loopfunc:true */
            result = result.replace(/%[sda]/i, function(token) {
                var value = ((args[i].type === "Quoted") &&
                    token.match(/s/i)) ? args[i].value : args[i].toCSS();
                return token.match(/[A-Z]$/) ? encodeURIComponent(value) : value;
            });
        }
        result = result.replace(/%%/g, '%');
        return new Quoted(string.quote || '', result, string.escaped);
    }
});

},{"../tree/anonymous":46,"../tree/javascript":63,"../tree/quoted":73,"./function-registry":22}],28:[function(require,module,exports){
module.exports = function(environment) {
    var Dimension = require("../tree/dimension"),
        Color = require("../tree/color"),
        Expression = require("../tree/expression"),
        Quoted = require("../tree/quoted"),
        URL = require("../tree/url"),
        functionRegistry = require("./function-registry");

    functionRegistry.add("svg-gradient", function(direction) {

        var stops,
            gradientDirectionSvg,
            gradientType = "linear",
            rectangleDimension = 'x="0" y="0" width="1" height="1"',
            renderEnv = {compress: false},
            returner,
            directionValue = direction.toCSS(renderEnv),
			i, color, position, positionValue, alpha;

        function throwArgumentDescriptor() {
            throw { type: "Argument",
					message: "svg-gradient expects direction, start_color [start_position], [color position,]...," +
							" end_color [end_position] or direction, color list" };
        }

        if (arguments.length == 2) {
            if (arguments[1].value.length < 2) {
                throwArgumentDescriptor();
            }
            stops = arguments[1].value;
        } else if (arguments.length < 3) {
            throwArgumentDescriptor();
        } else {
            stops = Array.prototype.slice.call(arguments, 1);
        }

        switch (directionValue) {
            case "to bottom":
                gradientDirectionSvg = 'x1="0%" y1="0%" x2="0%" y2="100%"';
                break;
            case "to right":
                gradientDirectionSvg = 'x1="0%" y1="0%" x2="100%" y2="0%"';
                break;
            case "to bottom right":
                gradientDirectionSvg = 'x1="0%" y1="0%" x2="100%" y2="100%"';
                break;
            case "to top right":
                gradientDirectionSvg = 'x1="0%" y1="100%" x2="100%" y2="0%"';
                break;
            case "ellipse":
            case "ellipse at center":
                gradientType = "radial";
                gradientDirectionSvg = 'cx="50%" cy="50%" r="75%"';
                rectangleDimension = 'x="-50" y="-50" width="101" height="101"';
                break;
            default:
                throw { type: "Argument", message: "svg-gradient direction must be 'to bottom', 'to right'," +
                    " 'to bottom right', 'to top right' or 'ellipse at center'" };
        }
        returner = '<?xml version="1.0" ?>' +
            '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">' +
            '<' + gradientType + 'Gradient id="gradient" gradientUnits="userSpaceOnUse" ' + gradientDirectionSvg + '>';

        for (i = 0; i < stops.length; i+= 1) {
            if (stops[i] instanceof Expression) {
                color = stops[i].value[0];
                position = stops[i].value[1];
            } else {
                color = stops[i];
                position = undefined;
            }

            if (!(color instanceof Color) || (!((i === 0 || i + 1 === stops.length) && position === undefined) && !(position instanceof Dimension))) {
                throwArgumentDescriptor();
            }
            positionValue = position ? position.toCSS(renderEnv) : i === 0 ? "0%" : "100%";
            alpha = color.alpha;
            returner += '<stop offset="' + positionValue + '" stop-color="' + color.toRGB() + '"' + (alpha < 1 ? ' stop-opacity="' + alpha + '"' : '') + '/>';
        }
        returner += '</' + gradientType + 'Gradient>' +
            '<rect ' + rectangleDimension + ' fill="url(#gradient)" /></svg>';

        returner = encodeURIComponent(returner);

        returner = "data:image/svg+xml," + returner;
        return new URL(new Quoted("'" + returner + "'", returner, false, this.index, this.currentFileInfo), this.index, this.currentFileInfo);
    });
};

},{"../tree/color":50,"../tree/dimension":56,"../tree/expression":59,"../tree/quoted":73,"../tree/url":80,"./function-registry":22}],29:[function(require,module,exports){
var Keyword = require("../tree/keyword"),
    DetachedRuleset = require("../tree/detached-ruleset"),
    Dimension = require("../tree/dimension"),
    Color = require("../tree/color"),
    Quoted = require("../tree/quoted"),
    Anonymous = require("../tree/anonymous"),
    URL = require("../tree/url"),
    Operation = require("../tree/operation"),
    functionRegistry = require("./function-registry");

var isa = function (n, Type) {
        return (n instanceof Type) ? Keyword.True : Keyword.False;
    },
    isunit = function (n, unit) {
        if (unit === undefined) {
            throw { type: "Argument", message: "missing the required second argument to isunit." };
        }
        unit = typeof unit.value === "string" ? unit.value : unit;
        if (typeof unit !== "string") {
            throw { type: "Argument", message: "Second argument to isunit should be a unit or a string." };
        }
        return (n instanceof Dimension) && n.unit.is(unit) ? Keyword.True : Keyword.False;
    },
    getItemsFromNode = function(node) {
        // handle non-array values as an array of length 1
        // return 'undefined' if index is invalid
        var items = Array.isArray(node.value) ?
            node.value : Array(node);

        return items;
    };
functionRegistry.addMultiple({
    isruleset: function (n) {
        return isa(n, DetachedRuleset);
    },
    iscolor: function (n) {
        return isa(n, Color);
    },
    isnumber: function (n) {
        return isa(n, Dimension);
    },
    isstring: function (n) {
        return isa(n, Quoted);
    },
    iskeyword: function (n) {
        return isa(n, Keyword);
    },
    isurl: function (n) {
        return isa(n, URL);
    },
    ispixel: function (n) {
        return isunit(n, 'px');
    },
    ispercentage: function (n) {
        return isunit(n, '%');
    },
    isem: function (n) {
        return isunit(n, 'em');
    },
    isunit: isunit,
    unit: function (val, unit) {
        if (!(val instanceof Dimension)) {
            throw { type: "Argument",
                message: "the first argument to unit must be a number" +
                    (val instanceof Operation ? ". Have you forgotten parenthesis?" : "") };
        }
        if (unit) {
            if (unit instanceof Keyword) {
                unit = unit.value;
            } else {
                unit = unit.toCSS();
            }
        } else {
            unit = "";
        }
        return new Dimension(val.value, unit);
    },
    "get-unit": function (n) {
        return new Anonymous(n.unit);
    },
    extract: function(values, index) {
        index = index.value - 1; // (1-based index)

        return getItemsFromNode(values)[index];
    },
    length: function(values) {
        return new Dimension(getItemsFromNode(values).length);
    }
});

},{"../tree/anonymous":46,"../tree/color":50,"../tree/detached-ruleset":55,"../tree/dimension":56,"../tree/keyword":65,"../tree/operation":71,"../tree/quoted":73,"../tree/url":80,"./function-registry":22}],30:[function(require,module,exports){
var contexts = require("./contexts"),
    Parser = require('./parser/parser'),
    FunctionImporter = require('./plugins/function-importer');

module.exports = function(environment) {

    // FileInfo = {
    //  'relativeUrls' - option - whether to adjust URL's to be relative
    //  'filename' - full resolved filename of current file
    //  'rootpath' - path to append to normal URLs for this node
    //  'currentDirectory' - path to the current file, absolute
    //  'rootFilename' - filename of the base file
    //  'entryPath' - absolute path to the entry file
    //  'reference' - whether the file should not be output and only output parts that are referenced

    var ImportManager = function(context, rootFileInfo) {
        this.rootFilename = rootFileInfo.filename;
        this.paths = context.paths || [];  // Search paths, when importing
        this.contents = {};             // map - filename to contents of all the files
        this.contentsIgnoredChars = {}; // map - filename to lines at the beginning of each file to ignore
        this.mime = context.mime;
        this.error = null;
        this.context = context;
        // Deprecated? Unused outside of here, could be useful.
        this.queue = [];        // Files which haven't been imported yet
        this.files = {};        // Holds the imported parse trees.
    };
    /**
     * Add an import to be imported
     * @param path - the raw path
     * @param tryAppendLessExtension - whether to try appending the less extension (if the path has no extension)
     * @param currentFileInfo - the current file info (used for instance to work out relative paths)
     * @param importOptions - import options
     * @param callback - callback for when it is imported
     */
    ImportManager.prototype.push = function (path, tryAppendLessExtension, currentFileInfo, importOptions, callback) {
        var importManager = this;
        this.queue.push(path);

        var fileParsedFunc = function (e, root, fullPath) {
            importManager.queue.splice(importManager.queue.indexOf(path), 1); // Remove the path from the queue

            var importedEqualsRoot = fullPath === importManager.rootFilename;
            if (importOptions.optional && e) {
                callback(null, {rules:[]}, false, null);
            }
            else {
                importManager.files[fullPath] = root;
                if (e && !importManager.error) { importManager.error = e; }
                callback(e, root, importedEqualsRoot, fullPath);
            }
        };

        var newFileInfo = {
            relativeUrls: this.context.relativeUrls,
            entryPath: currentFileInfo.entryPath,
            rootpath: currentFileInfo.rootpath,
            rootFilename: currentFileInfo.rootFilename
        };

        var fileManager = environment.getFileManager(path, currentFileInfo.currentDirectory, this.context, environment);

        if (!fileManager) {
            fileParsedFunc({ message: "Could not find a file-manager for " + path });
            return;
        }

        if (tryAppendLessExtension) {
            path = fileManager.tryAppendExtension(path, importOptions.plugin ? ".js" : ".less");
        }

        var loadFileCallback = function(loadedFile) {
            var resolvedFilename = loadedFile.filename,
                contents = loadedFile.contents.replace(/^\uFEFF/, '');

            // Pass on an updated rootpath if path of imported file is relative and file
            // is in a (sub|sup) directory
            //
            // Examples:
            // - If path of imported file is 'module/nav/nav.less' and rootpath is 'less/',
            //   then rootpath should become 'less/module/nav/'
            // - If path of imported file is '../mixins.less' and rootpath is 'less/',
            //   then rootpath should become 'less/../'
            newFileInfo.currentDirectory = fileManager.getPath(resolvedFilename);
            if (newFileInfo.relativeUrls) {
                newFileInfo.rootpath = fileManager.join(
                    (importManager.context.rootpath || ""),
                    fileManager.pathDiff(newFileInfo.currentDirectory, newFileInfo.entryPath));

                if (!fileManager.isPathAbsolute(newFileInfo.rootpath) && fileManager.alwaysMakePathsAbsolute()) {
                    newFileInfo.rootpath = fileManager.join(newFileInfo.entryPath, newFileInfo.rootpath);
                }
            }
            newFileInfo.filename = resolvedFilename;

            var newEnv = new contexts.Parse(importManager.context);

            newEnv.processImports = false;
            importManager.contents[resolvedFilename] = contents;

            if (currentFileInfo.reference || importOptions.reference) {
                newFileInfo.reference = true;
            }

            if (importOptions.plugin) {
                new FunctionImporter(newEnv, newFileInfo).eval(contents, function (e, root) {
                    fileParsedFunc(e, root, resolvedFilename);
                });
            } else if (importOptions.inline) {
                fileParsedFunc(null, contents, resolvedFilename);
            } else {
                new Parser(newEnv, importManager, newFileInfo).parse(contents, function (e, root) {
                    fileParsedFunc(e, root, resolvedFilename);
                });
            }
        };

        var promise = fileManager.loadFile(path, currentFileInfo.currentDirectory, this.context, environment,
            function(err, loadedFile) {
            if (err) {
                fileParsedFunc(err);
            } else {
                loadFileCallback(loadedFile);
            }
        });
        if (promise) {
            promise.then(loadFileCallback, fileParsedFunc);
        }
    };
    return ImportManager;
};

},{"./contexts":11,"./parser/parser":38,"./plugins/function-importer":40}],31:[function(require,module,exports){
module.exports = function(environment, fileManagers) {
    var SourceMapOutput, SourceMapBuilder, ParseTree, ImportManager, Environment;

    var less = {
        version: [2, 6, 1],
        data: require('./data'),
        tree: require('./tree'),
        Environment: (Environment = require("./environment/environment")),
        AbstractFileManager: require("./environment/abstract-file-manager"),
        environment: (environment = new Environment(environment, fileManagers)),
        visitors: require('./visitors'),
        Parser: require('./parser/parser'),
        functions: require('./functions')(environment),
        contexts: require("./contexts"),
        SourceMapOutput: (SourceMapOutput = require('./source-map-output')(environment)),
        SourceMapBuilder: (SourceMapBuilder = require('./source-map-builder')(SourceMapOutput, environment)),
        ParseTree: (ParseTree = require('./parse-tree')(SourceMapBuilder)),
        ImportManager: (ImportManager = require('./import-manager')(environment)),
        render: require("./render")(environment, ParseTree, ImportManager),
        parse: require("./parse")(environment, ParseTree, ImportManager),
        LessError: require('./less-error'),
        transformTree: require('./transform-tree'),
        utils: require('./utils'),
        PluginManager: require('./plugin-manager'),
        logger: require('./logger')
    };

    return less;
};

},{"./contexts":11,"./data":13,"./environment/abstract-file-manager":15,"./environment/environment":16,"./functions":23,"./import-manager":30,"./less-error":32,"./logger":33,"./parse":35,"./parse-tree":34,"./parser/parser":38,"./plugin-manager":39,"./render":41,"./source-map-builder":42,"./source-map-output":43,"./transform-tree":44,"./tree":62,"./utils":83,"./visitors":87}],32:[function(require,module,exports){
var utils = require("./utils");

var LessError = module.exports = function LessError(e, importManager, currentFilename) {

    Error.call(this);

    var filename = e.filename || currentFilename;

    if (importManager && filename) {
        var input = importManager.contents[filename],
            loc = utils.getLocation(e.index, input),
            line = loc.line,
            col  = loc.column,
            callLine = e.call && utils.getLocation(e.call, input).line,
            lines = input.split('\n');

        this.type = e.type || 'Syntax';
        this.filename = filename;
        this.index = e.index;
        this.line = typeof line === 'number' ? line + 1 : null;
        this.callLine = callLine + 1;
        this.callExtract = lines[callLine];
        this.column = col;
        this.extract = [
            lines[line - 1],
            lines[line],
            lines[line + 1]
        ];
    }
    this.message = e.message;
    this.stack = e.stack;
};

if (typeof Object.create === 'undefined') {
    var F = function () {};
    F.prototype = Error.prototype;
    LessError.prototype = new F();
} else {
    LessError.prototype = Object.create(Error.prototype);
}

LessError.prototype.constructor = LessError;

},{"./utils":83}],33:[function(require,module,exports){
module.exports = {
    error: function(msg) {
        this._fireEvent("error", msg);
    },
    warn: function(msg) {
        this._fireEvent("warn", msg);
    },
    info: function(msg) {
        this._fireEvent("info", msg);
    },
    debug: function(msg) {
        this._fireEvent("debug", msg);
    },
    addListener: function(listener) {
        this._listeners.push(listener);
    },
    removeListener: function(listener) {
        for (var i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i] === listener) {
                this._listeners.splice(i, 1);
                return;
            }
        }
    },
    _fireEvent: function(type, msg) {
        for (var i = 0; i < this._listeners.length; i++) {
            var logFunction = this._listeners[i][type];
            if (logFunction) {
                logFunction(msg);
            }
        }
    },
    _listeners: []
};

},{}],34:[function(require,module,exports){
var LessError = require('./less-error'),
    transformTree = require("./transform-tree"),
    logger = require("./logger");

module.exports = function(SourceMapBuilder) {
    var ParseTree = function(root, imports) {
        this.root = root;
        this.imports = imports;
    };

    ParseTree.prototype.toCSS = function(options) {
        var evaldRoot, result = {}, sourceMapBuilder;
        try {
            evaldRoot = transformTree(this.root, options);
        } catch (e) {
            throw new LessError(e, this.imports);
        }

        try {
            var compress = Boolean(options.compress);
            if (compress) {
                logger.warn("The compress option has been deprecated. We recommend you use a dedicated css minifier, for instance see less-plugin-clean-css.");
            }

            var toCSSOptions = {
                compress: compress,
                dumpLineNumbers: options.dumpLineNumbers,
                strictUnits: Boolean(options.strictUnits),
                numPrecision: 8};

            if (options.sourceMap) {
                sourceMapBuilder = new SourceMapBuilder(options.sourceMap);
                result.css = sourceMapBuilder.toCSS(evaldRoot, toCSSOptions, this.imports);
            } else {
                result.css = evaldRoot.toCSS(toCSSOptions);
            }
        } catch (e) {
            throw new LessError(e, this.imports);
        }

        if (options.pluginManager) {
            var postProcessors = options.pluginManager.getPostProcessors();
            for (var i = 0; i < postProcessors.length; i++) {
                result.css = postProcessors[i].process(result.css, { sourceMap: sourceMapBuilder, options: options, imports: this.imports });
            }
        }
        if (options.sourceMap) {
            result.map = sourceMapBuilder.getExternalSourceMap();
        }

        result.imports = [];
        for (var file in this.imports.files) {
            if (this.imports.files.hasOwnProperty(file) && file !== this.imports.rootFilename) {
                result.imports.push(file);
            }
        }
        return result;
    };
    return ParseTree;
};

},{"./less-error":32,"./logger":33,"./transform-tree":44}],35:[function(require,module,exports){
var PromiseConstructor,
    contexts = require("./contexts"),
    Parser = require('./parser/parser'),
    PluginManager = require('./plugin-manager');

module.exports = function(environment, ParseTree, ImportManager) {
    var parse = function (input, options, callback) {
        options = options || {};

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        if (!callback) {
            if (!PromiseConstructor) {
                PromiseConstructor = typeof Promise === 'undefined' ? require('promise') : Promise;
            }
            var self = this;
            return new PromiseConstructor(function (resolve, reject) {
                parse.call(self, input, options, function(err, output) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(output);
                    }
                });
            });
        } else {
            var context,
                rootFileInfo,
                pluginManager = new PluginManager(this);

            pluginManager.addPlugins(options.plugins);
            options.pluginManager = pluginManager;

            context = new contexts.Parse(options);

            if (options.rootFileInfo) {
                rootFileInfo = options.rootFileInfo;
            } else {
                var filename = options.filename || "input";
                var entryPath = filename.replace(/[^\/\\]*$/, "");
                rootFileInfo = {
                    filename: filename,
                    relativeUrls: context.relativeUrls,
                    rootpath: context.rootpath || "",
                    currentDirectory: entryPath,
                    entryPath: entryPath,
                    rootFilename: filename
                };
                // add in a missing trailing slash
                if (rootFileInfo.rootpath && rootFileInfo.rootpath.slice(-1) !== "/") {
                    rootFileInfo.rootpath += "/";
                }
            }

            var imports = new ImportManager(context, rootFileInfo);

            new Parser(context, imports, rootFileInfo)
                .parse(input, function (e, root) {
                if (e) { return callback(e); }
                callback(null, root, imports, options);
            }, options);
        }
    };
    return parse;
};

},{"./contexts":11,"./parser/parser":38,"./plugin-manager":39,"promise":undefined}],36:[function(require,module,exports){
// Split the input into chunks.
module.exports = function (input, fail) {
    var len = input.length, level = 0, parenLevel = 0,
        lastOpening, lastOpeningParen, lastMultiComment, lastMultiCommentEndBrace,
        chunks = [], emitFrom = 0,
        chunkerCurrentIndex, currentChunkStartIndex, cc, cc2, matched;

    function emitChunk(force) {
        var len = chunkerCurrentIndex - emitFrom;
        if (((len < 512) && !force) || !len) {
            return;
        }
        chunks.push(input.slice(emitFrom, chunkerCurrentIndex + 1));
        emitFrom = chunkerCurrentIndex + 1;
    }

    for (chunkerCurrentIndex = 0; chunkerCurrentIndex < len; chunkerCurrentIndex++) {
        cc = input.charCodeAt(chunkerCurrentIndex);
        if (((cc >= 97) && (cc <= 122)) || (cc < 34)) {
            // a-z or whitespace
            continue;
        }

        switch (cc) {
            case 40:                        // (
                parenLevel++;
                lastOpeningParen = chunkerCurrentIndex;
                continue;
            case 41:                        // )
                if (--parenLevel < 0) {
                    return fail("missing opening `(`", chunkerCurrentIndex);
                }
                continue;
            case 59:                        // ;
                if (!parenLevel) { emitChunk(); }
                continue;
            case 123:                       // {
                level++;
                lastOpening = chunkerCurrentIndex;
                continue;
            case 125:                       // }
                if (--level < 0) {
                    return fail("missing opening `{`", chunkerCurrentIndex);
                }
                if (!level && !parenLevel) { emitChunk(); }
                continue;
            case 92:                        // \
                if (chunkerCurrentIndex < len - 1) { chunkerCurrentIndex++; continue; }
                return fail("unescaped `\\`", chunkerCurrentIndex);
            case 34:
            case 39:
            case 96:                        // ", ' and `
                matched = 0;
                currentChunkStartIndex = chunkerCurrentIndex;
                for (chunkerCurrentIndex = chunkerCurrentIndex + 1; chunkerCurrentIndex < len; chunkerCurrentIndex++) {
                    cc2 = input.charCodeAt(chunkerCurrentIndex);
                    if (cc2 > 96) { continue; }
                    if (cc2 == cc) { matched = 1; break; }
                    if (cc2 == 92) {        // \
                        if (chunkerCurrentIndex == len - 1) {
                            return fail("unescaped `\\`", chunkerCurrentIndex);
                        }
                        chunkerCurrentIndex++;
                    }
                }
                if (matched) { continue; }
                return fail("unmatched `" + String.fromCharCode(cc) + "`", currentChunkStartIndex);
            case 47:                        // /, check for comment
                if (parenLevel || (chunkerCurrentIndex == len - 1)) { continue; }
                cc2 = input.charCodeAt(chunkerCurrentIndex + 1);
                if (cc2 == 47) {
                    // //, find lnfeed
                    for (chunkerCurrentIndex = chunkerCurrentIndex + 2; chunkerCurrentIndex < len; chunkerCurrentIndex++) {
                        cc2 = input.charCodeAt(chunkerCurrentIndex);
                        if ((cc2 <= 13) && ((cc2 == 10) || (cc2 == 13))) { break; }
                    }
                } else if (cc2 == 42) {
                    // /*, find */
                    lastMultiComment = currentChunkStartIndex = chunkerCurrentIndex;
                    for (chunkerCurrentIndex = chunkerCurrentIndex + 2; chunkerCurrentIndex < len - 1; chunkerCurrentIndex++) {
                        cc2 = input.charCodeAt(chunkerCurrentIndex);
                        if (cc2 == 125) { lastMultiCommentEndBrace = chunkerCurrentIndex; }
                        if (cc2 != 42) { continue; }
                        if (input.charCodeAt(chunkerCurrentIndex + 1) == 47) { break; }
                    }
                    if (chunkerCurrentIndex == len - 1) {
                        return fail("missing closing `*/`", currentChunkStartIndex);
                    }
                    chunkerCurrentIndex++;
                }
                continue;
            case 42:                       // *, check for unmatched */
                if ((chunkerCurrentIndex < len - 1) && (input.charCodeAt(chunkerCurrentIndex + 1) == 47)) {
                    return fail("unmatched `/*`", chunkerCurrentIndex);
                }
                continue;
        }
    }

    if (level !== 0) {
        if ((lastMultiComment > lastOpening) && (lastMultiCommentEndBrace > lastMultiComment)) {
            return fail("missing closing `}` or `*/`", lastOpening);
        } else {
            return fail("missing closing `}`", lastOpening);
        }
    } else if (parenLevel !== 0) {
        return fail("missing closing `)`", lastOpeningParen);
    }

    emitChunk(true);
    return chunks;
};

},{}],37:[function(require,module,exports){
var chunker = require('./chunker');

module.exports = function() {
    var input,       // LeSS input string
        j,           // current chunk
        saveStack = [],   // holds state for backtracking
        furthest,    // furthest index the parser has gone to
        furthestPossibleErrorMessage,// if this is furthest we got to, this is the probably cause
        chunks,      // chunkified input
        current,     // current chunk
        currentPos,  // index of current chunk, in `input`
        parserInput = {};

    var CHARCODE_SPACE = 32,
        CHARCODE_TAB = 9,
        CHARCODE_LF = 10,
        CHARCODE_CR = 13,
        CHARCODE_PLUS = 43,
        CHARCODE_COMMA = 44,
        CHARCODE_FORWARD_SLASH = 47,
        CHARCODE_9 = 57;

    function skipWhitespace(length) {
        var oldi = parserInput.i, oldj = j,
            curr = parserInput.i - currentPos,
            endIndex = parserInput.i + current.length - curr,
            mem = (parserInput.i += length),
            inp = input,
            c, nextChar, comment;

        for (; parserInput.i < endIndex; parserInput.i++) {
            c = inp.charCodeAt(parserInput.i);

            if (parserInput.autoCommentAbsorb && c === CHARCODE_FORWARD_SLASH) {
                nextChar = inp.charAt(parserInput.i + 1);
                if (nextChar === '/') {
                    comment = {index: parserInput.i, isLineComment: true};
                    var nextNewLine = inp.indexOf("\n", parserInput.i + 2);
                    if (nextNewLine < 0) {
                        nextNewLine = endIndex;
                    }
                    parserInput.i = nextNewLine;
                    comment.text = inp.substr(comment.i, parserInput.i - comment.i);
                    parserInput.commentStore.push(comment);
                    continue;
                } else if (nextChar === '*') {
                    var nextStarSlash = inp.indexOf("*/", parserInput.i + 2);
                    if (nextStarSlash >= 0) {
                        comment = {
                            index: parserInput.i,
                            text: inp.substr(parserInput.i, nextStarSlash + 2 - parserInput.i),
                            isLineComment: false
                        };
                        parserInput.i += comment.text.length - 1;
                        parserInput.commentStore.push(comment);
                        continue;
                    }
                }
                break;
            }

            if ((c !== CHARCODE_SPACE) && (c !== CHARCODE_LF) && (c !== CHARCODE_TAB) && (c !== CHARCODE_CR)) {
                break;
            }
        }

        current = current.slice(length + parserInput.i - mem + curr);
        currentPos = parserInput.i;

        if (!current.length) {
            if (j < chunks.length - 1) {
                current = chunks[++j];
                skipWhitespace(0); // skip space at the beginning of a chunk
                return true; // things changed
            }
            parserInput.finished = true;
        }

        return oldi !== parserInput.i || oldj !== j;
    }

    parserInput.save = function() {
        currentPos = parserInput.i;
        saveStack.push( { current: current, i: parserInput.i, j: j });
    };
    parserInput.restore = function(possibleErrorMessage) {

        if (parserInput.i > furthest || (parserInput.i === furthest && possibleErrorMessage && !furthestPossibleErrorMessage)) {
            furthest = parserInput.i;
            furthestPossibleErrorMessage = possibleErrorMessage;
        }
        var state = saveStack.pop();
        current = state.current;
        currentPos = parserInput.i = state.i;
        j = state.j;
    };
    parserInput.forget = function() {
        saveStack.pop();
    };
    parserInput.isWhitespace = function (offset) {
        var pos = parserInput.i + (offset || 0),
            code = input.charCodeAt(pos);
        return (code === CHARCODE_SPACE || code === CHARCODE_CR || code === CHARCODE_TAB || code === CHARCODE_LF);
    };

    // Specialization of $(tok)
    parserInput.$re = function(tok) {
        if (parserInput.i > currentPos) {
            current = current.slice(parserInput.i - currentPos);
            currentPos = parserInput.i;
        }

        var m = tok.exec(current);
        if (!m) {
            return null;
        }

        skipWhitespace(m[0].length);
        if (typeof m === "string") {
            return m;
        }

        return m.length === 1 ? m[0] : m;
    };

    parserInput.$char = function(tok) {
        if (input.charAt(parserInput.i) !== tok) {
            return null;
        }
        skipWhitespace(1);
        return tok;
    };

    parserInput.$str = function(tok) {
        var tokLength = tok.length;

        // https://jsperf.com/string-startswith/21
        for (var i = 0; i < tokLength; i++) {
            if (input.charAt(parserInput.i + i) !== tok.charAt(i)) {
                return null;
            }
        }

        skipWhitespace(tokLength);
        return tok;
    };

    parserInput.$quoted = function() {

        var startChar = input.charAt(parserInput.i);
        if (startChar !== "'" && startChar !== '"') {
            return;
        }
        var length = input.length,
            currentPosition = parserInput.i;

        for (var i = 1; i + currentPosition < length; i++) {
            var nextChar = input.charAt(i + currentPosition);
            switch(nextChar) {
                case "\\":
                    i++;
                    continue;
                case "\r":
                case "\n":
                    break;
                case startChar:
                    var str = input.substr(currentPosition, i + 1);
                    skipWhitespace(i + 1);
                    return str;
                default:
            }
        }
        return null;
    };

    parserInput.autoCommentAbsorb = true;
    parserInput.commentStore = [];
    parserInput.finished = false;

    // Same as $(), but don't change the state of the parser,
    // just return the match.
    parserInput.peek = function(tok) {
        if (typeof tok === 'string') {
            // https://jsperf.com/string-startswith/21
            for (var i = 0; i < tok.length; i++) {
                if (input.charAt(parserInput.i + i) !== tok.charAt(i)) {
                    return false;
                }
            }
            return true;
        } else {
            return tok.test(current);
        }
    };

    // Specialization of peek()
    // TODO remove or change some currentChar calls to peekChar
    parserInput.peekChar = function(tok) {
        return input.charAt(parserInput.i) === tok;
    };

    parserInput.currentChar = function() {
        return input.charAt(parserInput.i);
    };

    parserInput.getInput = function() {
        return input;
    };

    parserInput.peekNotNumeric = function() {
        var c = input.charCodeAt(parserInput.i);
        //Is the first char of the dimension 0-9, '.', '+' or '-'
        return (c > CHARCODE_9 || c < CHARCODE_PLUS) || c === CHARCODE_FORWARD_SLASH || c === CHARCODE_COMMA;
    };

    parserInput.start = function(str, chunkInput, failFunction) {
        input = str;
        parserInput.i = j = currentPos = furthest = 0;

        // chunking apparantly makes things quicker (but my tests indicate
        // it might actually make things slower in node at least)
        // and it is a non-perfect parse - it can't recognise
        // unquoted urls, meaning it can't distinguish comments
        // meaning comments with quotes or {}() in them get 'counted'
        // and then lead to parse errors.
        // In addition if the chunking chunks in the wrong place we might
        // not be able to parse a parser statement in one go
        // this is officially deprecated but can be switched on via an option
        // in the case it causes too much performance issues.
        if (chunkInput) {
            chunks = chunker(str, failFunction);
        } else {
            chunks = [str];
        }

        current = chunks[0];

        skipWhitespace(0);
    };

    parserInput.end = function() {
        var message,
            isFinished = parserInput.i >= input.length;

        if (parserInput.i < furthest) {
            message = furthestPossibleErrorMessage;
            parserInput.i = furthest;
        }
        return {
            isFinished: isFinished,
            furthest: parserInput.i,
            furthestPossibleErrorMessage: message,
            furthestReachedEnd: parserInput.i >= input.length - 1,
            furthestChar: input[parserInput.i]
        };
    };

    return parserInput;
};

},{"./chunker":36}],38:[function(require,module,exports){
var LessError = require('../less-error'),
    tree = require("../tree"),
    visitors = require("../visitors"),
    getParserInput = require("./parser-input"),
    utils = require("../utils");

//
// less.js - parser
//
//    A relatively straight-forward predictive parser.
//    There is no tokenization/lexing stage, the input is parsed
//    in one sweep.
//
//    To make the parser fast enough to run in the browser, several
//    optimization had to be made:
//
//    - Matching and slicing on a huge input is often cause of slowdowns.
//      The solution is to chunkify the input into smaller strings.
//      The chunks are stored in the `chunks` var,
//      `j` holds the current chunk index, and `currentPos` holds
//      the index of the current chunk in relation to `input`.
//      This gives us an almost 4x speed-up.
//
//    - In many cases, we don't need to match individual tokens;
//      for example, if a value doesn't hold any variables, operations
//      or dynamic references, the parser can effectively 'skip' it,
//      treating it as a literal.
//      An example would be '1px solid #000' - which evaluates to itself,
//      we don't need to know what the individual components are.
//      The drawback, of course is that you don't get the benefits of
//      syntax-checking on the CSS. This gives us a 50% speed-up in the parser,
//      and a smaller speed-up in the code-gen.
//
//
//    Token matching is done with the `$` function, which either takes
//    a terminal string or regexp, or a non-terminal function to call.
//    It also takes care of moving all the indices forwards.
//`
//
var Parser = function Parser(context, imports, fileInfo) {
    var parsers,
        parserInput = getParserInput();

    function error(msg, type) {
        throw new LessError(
            {
                index: parserInput.i,
                filename: fileInfo.filename,
                type: type || 'Syntax',
                message: msg
            },
            imports
        );
    }

    function expect(arg, msg, index) {
        // some older browsers return typeof 'function' for RegExp
        var result = (arg instanceof Function) ? arg.call(parsers) : parserInput.$re(arg);
        if (result) {
            return result;
        }
        error(msg || (typeof arg === 'string' ? "expected '" + arg + "' got '" + parserInput.currentChar() + "'"
                                               : "unexpected token"));
    }

    // Specialization of expect()
    function expectChar(arg, msg) {
        if (parserInput.$char(arg)) {
            return arg;
        }
        error(msg || "expected '" + arg + "' got '" + parserInput.currentChar() + "'");
    }

    function getDebugInfo(index) {
        var filename = fileInfo.filename;

        return {
            lineNumber: utils.getLocation(index, parserInput.getInput()).line + 1,
            fileName: filename
        };
    }

    //
    // The Parser
    //
    return {

        //
        // Parse an input string into an abstract syntax tree,
        // @param str A string containing 'less' markup
        // @param callback call `callback` when done.
        // @param [additionalData] An optional map which can contains vars - a map (key, value) of variables to apply
        //
        parse: function (str, callback, additionalData) {
            var root, error = null, globalVars, modifyVars, ignored, preText = "";

            globalVars = (additionalData && additionalData.globalVars) ? Parser.serializeVars(additionalData.globalVars) + '\n' : '';
            modifyVars = (additionalData && additionalData.modifyVars) ? '\n' + Parser.serializeVars(additionalData.modifyVars) : '';

            if (context.pluginManager) {
                var preProcessors = context.pluginManager.getPreProcessors();
                for (var i = 0; i < preProcessors.length; i++) {
                    str = preProcessors[i].process(str, { context: context, imports: imports, fileInfo: fileInfo });
                }
            }

            if (globalVars || (additionalData && additionalData.banner)) {
                preText = ((additionalData && additionalData.banner) ? additionalData.banner : "") + globalVars;
                ignored = imports.contentsIgnoredChars;
                ignored[fileInfo.filename] = ignored[fileInfo.filename] || 0;
                ignored[fileInfo.filename] += preText.length;
            }

            str = str.replace(/\r\n?/g, '\n');
            // Remove potential UTF Byte Order Mark
            str = preText + str.replace(/^\uFEFF/, '') + modifyVars;
            imports.contents[fileInfo.filename] = str;

            // Start with the primary rule.
            // The whole syntax tree is held under a Ruleset node,
            // with the `root` property set to true, so no `{}` are
            // output. The callback is called when the input is parsed.
            try {
                parserInput.start(str, context.chunkInput, function fail(msg, index) {
                    throw new LessError({
                        index: index,
                        type: 'Parse',
                        message: msg,
                        filename: fileInfo.filename
                    }, imports);
                });

                root = new(tree.Ruleset)(null, this.parsers.primary());
                root.root = true;
                root.firstRoot = true;
            } catch (e) {
                return callback(new LessError(e, imports, fileInfo.filename));
            }

            // If `i` is smaller than the `input.length - 1`,
            // it means the parser wasn't able to parse the whole
            // string, so we've got a parsing error.
            //
            // We try to extract a \n delimited string,
            // showing the line where the parse error occurred.
            // We split it up into two parts (the part which parsed,
            // and the part which didn't), so we can color them differently.
            var endInfo = parserInput.end();
            if (!endInfo.isFinished) {

                var message = endInfo.furthestPossibleErrorMessage;

                if (!message) {
                    message = "Unrecognised input";
                    if (endInfo.furthestChar === '}') {
                        message += ". Possibly missing opening '{'";
                    } else if (endInfo.furthestChar === ')') {
                        message += ". Possibly missing opening '('";
                    } else if (endInfo.furthestReachedEnd) {
                        message += ". Possibly missing something";
                    }
                }

                error = new LessError({
                    type: "Parse",
                    message: message,
                    index: endInfo.furthest,
                    filename: fileInfo.filename
                }, imports);
            }

            var finish = function (e) {
                e = error || e || imports.error;

                if (e) {
                    if (!(e instanceof LessError)) {
                        e = new LessError(e, imports, fileInfo.filename);
                    }

                    return callback(e);
                }
                else {
                    return callback(null, root);
                }
            };

            if (context.processImports !== false) {
                new visitors.ImportVisitor(imports, finish)
                    .run(root);
            } else {
                return finish();
            }
        },

        //
        // Here in, the parsing rules/functions
        //
        // The basic structure of the syntax tree generated is as follows:
        //
        //   Ruleset ->  Rule -> Value -> Expression -> Entity
        //
        // Here's some Less code:
        //
        //    .class {
        //      color: #fff;
        //      border: 1px solid #000;
        //      width: @w + 4px;
        //      > .child {...}
        //    }
        //
        // And here's what the parse tree might look like:
        //
        //     Ruleset (Selector '.class', [
        //         Rule ("color",  Value ([Expression [Color #fff]]))
        //         Rule ("border", Value ([Expression [Dimension 1px][Keyword "solid"][Color #000]]))
        //         Rule ("width",  Value ([Expression [Operation " + " [Variable "@w"][Dimension 4px]]]))
        //         Ruleset (Selector [Element '>', '.child'], [...])
        //     ])
        //
        //  In general, most rules will try to parse a token with the `$re()` function, and if the return
        //  value is truly, will return a new node, of the relevant type. Sometimes, we need to check
        //  first, before parsing, that's when we use `peek()`.
        //
        parsers: parsers = {
            //
            // The `primary` rule is the *entry* and *exit* point of the parser.
            // The rules here can appear at any level of the parse tree.
            //
            // The recursive nature of the grammar is an interplay between the `block`
            // rule, which represents `{ ... }`, the `ruleset` rule, and this `primary` rule,
            // as represented by this simplified grammar:
            //
            //     primary  →  (ruleset | rule)+
            //     ruleset  →  selector+ block
            //     block    →  '{' primary '}'
            //
            // Only at one point is the primary rule not called from the
            // block rule: at the root level.
            //
            primary: function () {
                var mixin = this.mixin, root = [], node;

                while (true) {
                    while (true) {
                        node = this.comment();
                        if (!node) { break; }
                        root.push(node);
                    }
                    // always process comments before deciding if finished
                    if (parserInput.finished) {
                        break;
                    }
                    if (parserInput.peek('}')) {
                        break;
                    }

                    node = this.extendRule();
                    if (node) {
                        root = root.concat(node);
                        continue;
                    }

                    node = mixin.definition() || this.rule() || this.ruleset() ||
                        mixin.call() || this.rulesetCall() || this.directive();
                    if (node) {
                        root.push(node);
                    } else {
                        var foundSemiColon = false;
                        while (parserInput.$char(";")) {
                            foundSemiColon = true;
                        }
                        if (!foundSemiColon) {
                            break;
                        }
                    }
                }

                return root;
            },

            // comments are collected by the main parsing mechanism and then assigned to nodes
            // where the current structure allows it
            comment: function () {
                if (parserInput.commentStore.length) {
                    var comment = parserInput.commentStore.shift();
                    return new(tree.Comment)(comment.text, comment.isLineComment, comment.index, fileInfo);
                }
            },

            //
            // Entities are tokens which can be found inside an Expression
            //
            entities: {
                //
                // A string, which supports escaping " and '
                //
                //     "milky way" 'he\'s the one!'
                //
                quoted: function () {
                    var str, index = parserInput.i, isEscaped = false;

                    parserInput.save();
                    if (parserInput.$char("~")) {
                        isEscaped = true;
                    }
                    str = parserInput.$quoted();
                    if (!str) {
                        parserInput.restore();
                        return;
                    }
                    parserInput.forget();

                    return new(tree.Quoted)(str.charAt(0), str.substr(1, str.length - 2), isEscaped, index, fileInfo);
                },

                //
                // A catch-all word, such as:
                //
                //     black border-collapse
                //
                keyword: function () {
                    var k = parserInput.$char("%") || parserInput.$re(/^[_A-Za-z-][_A-Za-z0-9-]*/);
                    if (k) {
                        return tree.Color.fromKeyword(k) || new(tree.Keyword)(k);
                    }
                },

                //
                // A function call
                //
                //     rgb(255, 0, 255)
                //
                // We also try to catch IE's `alpha()`, but let the `alpha` parser
                // deal with the details.
                //
                // The arguments are parsed with the `entities.arguments` parser.
                //
                call: function () {
                    var name, nameLC, args, alpha, index = parserInput.i;

                    // http://jsperf.com/case-insensitive-regex-vs-strtolower-then-regex/18
                    if (parserInput.peek(/^url\(/i)) {
                        return;
                    }

                    parserInput.save();

                    name = parserInput.$re(/^([\w-]+|%|progid:[\w\.]+)\(/);
                    if (!name) { parserInput.forget(); return; }

                    name = name[1];
                    nameLC = name.toLowerCase();

                    if (nameLC === 'alpha') {
                        alpha = parsers.alpha();
                        if (alpha) {
                            parserInput.forget();
                            return alpha;
                        }
                    }

                    args = this.arguments();

                    if (! parserInput.$char(')')) {
                        parserInput.restore("Could not parse call arguments or missing ')'");
                        return;
                    }

                    parserInput.forget();
                    return new(tree.Call)(name, args, index, fileInfo);
                },
                arguments: function () {
                    var args = [], arg;

                    while (true) {
                        arg = this.assignment() || parsers.expression();
                        if (!arg) {
                            break;
                        }
                        args.push(arg);
                        if (! parserInput.$char(',')) {
                            break;
                        }
                    }
                    return args;
                },
                literal: function () {
                    return this.dimension() ||
                           this.color() ||
                           this.quoted() ||
                           this.unicodeDescriptor();
                },

                // Assignments are argument entities for calls.
                // They are present in ie filter properties as shown below.
                //
                //     filter: progid:DXImageTransform.Microsoft.Alpha( *opacity=50* )
                //

                assignment: function () {
                    var key, value;
                    parserInput.save();
                    key = parserInput.$re(/^\w+(?=\s?=)/i);
                    if (!key) {
                        parserInput.restore();
                        return;
                    }
                    if (!parserInput.$char('=')) {
                        parserInput.restore();
                        return;
                    }
                    value = parsers.entity();
                    if (value) {
                        parserInput.forget();
                        return new(tree.Assignment)(key, value);
                    } else {
                        parserInput.restore();
                    }
                },

                //
                // Parse url() tokens
                //
                // We use a specific rule for urls, because they don't really behave like
                // standard function calls. The difference is that the argument doesn't have
                // to be enclosed within a string, so it can't be parsed as an Expression.
                //
                url: function () {
                    var value, index = parserInput.i;

                    parserInput.autoCommentAbsorb = false;

                    if (!parserInput.$str("url(")) {
                        parserInput.autoCommentAbsorb = true;
                        return;
                    }

                    value = this.quoted() || this.variable() ||
                            parserInput.$re(/^(?:(?:\\[\(\)'"])|[^\(\)'"])+/) || "";

                    parserInput.autoCommentAbsorb = true;

                    expectChar(')');

                    return new(tree.URL)((value.value != null || value instanceof tree.Variable) ?
                                        value : new(tree.Anonymous)(value), index, fileInfo);
                },

                //
                // A Variable entity, such as `@fink`, in
                //
                //     width: @fink + 2px
                //
                // We use a different parser for variable definitions,
                // see `parsers.variable`.
                //
                variable: function () {
                    var name, index = parserInput.i;

                    if (parserInput.currentChar() === '@' && (name = parserInput.$re(/^@@?[\w-]+/))) {
                        return new(tree.Variable)(name, index, fileInfo);
                    }
                },

                // A variable entity useing the protective {} e.g. @{var}
                variableCurly: function () {
                    var curly, index = parserInput.i;

                    if (parserInput.currentChar() === '@' && (curly = parserInput.$re(/^@\{([\w-]+)\}/))) {
                        return new(tree.Variable)("@" + curly[1], index, fileInfo);
                    }
                },

                //
                // A Hexadecimal color
                //
                //     #4F3C2F
                //
                // `rgb` and `hsl` colors are parsed through the `entities.call` parser.
                //
                color: function () {
                    var rgb;

                    if (parserInput.currentChar() === '#' && (rgb = parserInput.$re(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/))) {
                        // strip colons, brackets, whitespaces and other characters that should not
                        // definitely be part of color string
                        var colorCandidateString = rgb.input.match(/^#([\w]+).*/);
                        colorCandidateString = colorCandidateString[1];
                        if (!colorCandidateString.match(/^[A-Fa-f0-9]+$/)) { // verify if candidate consists only of allowed HEX characters
                            error("Invalid HEX color code");
                        }
                        return new(tree.Color)(rgb[1], undefined, '#' + colorCandidateString);
                    }
                },

                colorKeyword: function () {
                    parserInput.save();
                    var autoCommentAbsorb = parserInput.autoCommentAbsorb;
                    parserInput.autoCommentAbsorb = false;
                    var k = parserInput.$re(/^[A-Za-z]+/);
                    parserInput.autoCommentAbsorb = autoCommentAbsorb;
                    if (!k) {
                        parserInput.forget();
                        return;
                    }
                    parserInput.restore();
                    var color = tree.Color.fromKeyword(k);
                    if (color) {
                        parserInput.$str(k);
                        return color;
                    }
                },

                //
                // A Dimension, that is, a number and a unit
                //
                //     0.5em 95%
                //
                dimension: function () {
                    if (parserInput.peekNotNumeric()) {
                        return;
                    }

                    var value = parserInput.$re(/^([+-]?\d*\.?\d+)(%|[a-z_]+)?/i);
                    if (value) {
                        return new(tree.Dimension)(value[1], value[2]);
                    }
                },

                //
                // A unicode descriptor, as is used in unicode-range
                //
                // U+0??  or U+00A1-00A9
                //
                unicodeDescriptor: function () {
                    var ud;

                    ud = parserInput.$re(/^U\+[0-9a-fA-F?]+(\-[0-9a-fA-F?]+)?/);
                    if (ud) {
                        return new(tree.UnicodeDescriptor)(ud[0]);
                    }
                },

                //
                // JavaScript code to be evaluated
                //
                //     `window.location.href`
                //
                javascript: function () {
                    var js, index = parserInput.i;

                    parserInput.save();

                    var escape = parserInput.$char("~");
                    var jsQuote = parserInput.$char("`");

                    if (!jsQuote) {
                        parserInput.restore();
                        return;
                    }

                    js = parserInput.$re(/^[^`]*`/);
                    if (js) {
                        parserInput.forget();
                        return new(tree.JavaScript)(js.substr(0, js.length - 1), Boolean(escape), index, fileInfo);
                    }
                    parserInput.restore("invalid javascript definition");
                }
            },

            //
            // The variable part of a variable definition. Used in the `rule` parser
            //
            //     @fink:
            //
            variable: function () {
                var name;

                if (parserInput.currentChar() === '@' && (name = parserInput.$re(/^(@[\w-]+)\s*:/))) { return name[1]; }
            },

            //
            // The variable part of a variable definition. Used in the `rule` parser
            //
            //     @fink();
            //
            rulesetCall: function () {
                var name;

                if (parserInput.currentChar() === '@' && (name = parserInput.$re(/^(@[\w-]+)\(\s*\)\s*;/))) {
                    return new tree.RulesetCall(name[1]);
                }
            },

            //
            // extend syntax - used to extend selectors
            //
            extend: function(isRule) {
                var elements, e, index = parserInput.i, option, extendList, extend;

                if (!parserInput.$str(isRule ? "&:extend(" : ":extend(")) {
                    return;
                }

                do {
                    option = null;
                    elements = null;
                    while (! (option = parserInput.$re(/^(all)(?=\s*(\)|,))/))) {
                        e = this.element();
                        if (!e) {
                            break;
                        }
                        if (elements) {
                            elements.push(e);
                        } else {
                            elements = [ e ];
                        }
                    }

                    option = option && option[1];
                    if (!elements) {
                        error("Missing target selector for :extend().");
                    }
                    extend = new(tree.Extend)(new(tree.Selector)(elements), option, index, fileInfo);
                    if (extendList) {
                        extendList.push(extend);
                    } else {
                        extendList = [ extend ];
                    }
                } while (parserInput.$char(","));

                expect(/^\)/);

                if (isRule) {
                    expect(/^;/);
                }

                return extendList;
            },

            //
            // extendRule - used in a rule to extend all the parent selectors
            //
            extendRule: function() {
                return this.extend(true);
            },

            //
            // Mixins
            //
            mixin: {
                //
                // A Mixin call, with an optional argument list
                //
                //     #mixins > .square(#fff);
                //     .rounded(4px, black);
                //     .button;
                //
                // The `while` loop is there because mixins can be
                // namespaced, but we only support the child and descendant
                // selector for now.
                //
                call: function () {
                    var s = parserInput.currentChar(), important = false, index = parserInput.i, elemIndex,
                        elements, elem, e, c, args;

                    if (s !== '.' && s !== '#') { return; }

                    parserInput.save(); // stop us absorbing part of an invalid selector

                    while (true) {
                        elemIndex = parserInput.i;
                        e = parserInput.$re(/^[#.](?:[\w-]|\\(?:[A-Fa-f0-9]{1,6} ?|[^A-Fa-f0-9]))+/);
                        if (!e) {
                            break;
                        }
                        elem = new(tree.Element)(c, e, elemIndex, fileInfo);
                        if (elements) {
                            elements.push(elem);
                        } else {
                            elements = [ elem ];
                        }
                        c = parserInput.$char('>');
                    }

                    if (elements) {
                        if (parserInput.$char('(')) {
                            args = this.args(true).args;
                            expectChar(')');
                        }

                        if (parsers.important()) {
                            important = true;
                        }

                        if (parsers.end()) {
                            parserInput.forget();
                            return new(tree.mixin.Call)(elements, args, index, fileInfo, important);
                        }
                    }

                    parserInput.restore();
                },
                args: function (isCall) {
                    var entities = parsers.entities,
                        returner = { args:null, variadic: false },
                        expressions = [], argsSemiColon = [], argsComma = [],
                        isSemiColonSeparated, expressionContainsNamed, name, nameLoop,
                        value, arg, expand;

                    parserInput.save();

                    while (true) {
                        if (isCall) {
                            arg = parsers.detachedRuleset() || parsers.expression();
                        } else {
                            parserInput.commentStore.length = 0;
                            if (parserInput.$str("...")) {
                                returner.variadic = true;
                                if (parserInput.$char(";") && !isSemiColonSeparated) {
                                    isSemiColonSeparated = true;
                                }
                                (isSemiColonSeparated ? argsSemiColon : argsComma)
                                    .push({ variadic: true });
                                break;
                            }
                            arg = entities.variable() || entities.literal() || entities.keyword();
                        }

                        if (!arg) {
                            break;
                        }

                        nameLoop = null;
                        if (arg.throwAwayComments) {
                            arg.throwAwayComments();
                        }
                        value = arg;
                        var val = null;

                        if (isCall) {
                            // Variable
                            if (arg.value && arg.value.length == 1) {
                                val = arg.value[0];
                            }
                        } else {
                            val = arg;
                        }

                        if (val && val instanceof tree.Variable) {
                            if (parserInput.$char(':')) {
                                if (expressions.length > 0) {
                                    if (isSemiColonSeparated) {
                                        error("Cannot mix ; and , as delimiter types");
                                    }
                                    expressionContainsNamed = true;
                                }

                                value = parsers.detachedRuleset() || parsers.expression();

                                if (!value) {
                                    if (isCall) {
                                        error("could not understand value for named argument");
                                    } else {
                                        parserInput.restore();
                                        returner.args = [];
                                        return returner;
                                    }
                                }
                                nameLoop = (name = val.name);
                            } else if (parserInput.$str("...")) {
                                if (!isCall) {
                                    returner.variadic = true;
                                    if (parserInput.$char(";") && !isSemiColonSeparated) {
                                        isSemiColonSeparated = true;
                                    }
                                    (isSemiColonSeparated ? argsSemiColon : argsComma)
                                        .push({ name: arg.name, variadic: true });
                                    break;
                                } else {
                                    expand = true;
                                }
                            } else if (!isCall) {
                                name = nameLoop = val.name;
                                value = null;
                            }
                        }

                        if (value) {
                            expressions.push(value);
                        }

                        argsComma.push({ name:nameLoop, value:value, expand:expand });

                        if (parserInput.$char(',')) {
                            continue;
                        }

                        if (parserInput.$char(';') || isSemiColonSeparated) {

                            if (expressionContainsNamed) {
                                error("Cannot mix ; and , as delimiter types");
                            }

                            isSemiColonSeparated = true;

                            if (expressions.length > 1) {
                                value = new(tree.Value)(expressions);
                            }
                            argsSemiColon.push({ name:name, value:value, expand:expand });

                            name = null;
                            expressions = [];
                            expressionContainsNamed = false;
                        }
                    }

                    parserInput.forget();
                    returner.args = isSemiColonSeparated ? argsSemiColon : argsComma;
                    return returner;
                },
                //
                // A Mixin definition, with a list of parameters
                //
                //     .rounded (@radius: 2px, @color) {
                //        ...
                //     }
                //
                // Until we have a finer grained state-machine, we have to
                // do a look-ahead, to make sure we don't have a mixin call.
                // See the `rule` function for more information.
                //
                // We start by matching `.rounded (`, and then proceed on to
                // the argument list, which has optional default values.
                // We store the parameters in `params`, with a `value` key,
                // if there is a value, such as in the case of `@radius`.
                //
                // Once we've got our params list, and a closing `)`, we parse
                // the `{...}` block.
                //
                definition: function () {
                    var name, params = [], match, ruleset, cond, variadic = false;
                    if ((parserInput.currentChar() !== '.' && parserInput.currentChar() !== '#') ||
                        parserInput.peek(/^[^{]*\}/)) {
                        return;
                    }

                    parserInput.save();

                    match = parserInput.$re(/^([#.](?:[\w-]|\\(?:[A-Fa-f0-9]{1,6} ?|[^A-Fa-f0-9]))+)\s*\(/);
                    if (match) {
                        name = match[1];

                        var argInfo = this.args(false);
                        params = argInfo.args;
                        variadic = argInfo.variadic;

                        // .mixincall("@{a}");
                        // looks a bit like a mixin definition..
                        // also
                        // .mixincall(@a: {rule: set;});
                        // so we have to be nice and restore
                        if (!parserInput.$char(')')) {
                            parserInput.restore("Missing closing ')'");
                            return;
                        }

                        parserInput.commentStore.length = 0;

                        if (parserInput.$str("when")) { // Guard
                            cond = expect(parsers.conditions, 'expected condition');
                        }

                        ruleset = parsers.block();

                        if (ruleset) {
                            parserInput.forget();
                            return new(tree.mixin.Definition)(name, params, ruleset, cond, variadic);
                        } else {
                            parserInput.restore();
                        }
                    } else {
                        parserInput.forget();
                    }
                }
            },

            //
            // Entities are the smallest recognized token,
            // and can be found inside a rule's value.
            //
            entity: function () {
                var entities = this.entities;

                return this.comment() || entities.literal() || entities.variable() || entities.url() ||
                       entities.call()    || entities.keyword()  || entities.javascript();
            },

            //
            // A Rule terminator. Note that we use `peek()` to check for '}',
            // because the `block` rule will be expecting it, but we still need to make sure
            // it's there, if ';' was ommitted.
            //
            end: function () {
                return parserInput.$char(';') || parserInput.peek('}');
            },

            //
            // IE's alpha function
            //
            //     alpha(opacity=88)
            //
            alpha: function () {
                var value;

                // http://jsperf.com/case-insensitive-regex-vs-strtolower-then-regex/18
                if (! parserInput.$re(/^opacity=/i)) { return; }
                value = parserInput.$re(/^\d+/);
                if (!value) {
                    value = expect(this.entities.variable, "Could not parse alpha");
                }
                expectChar(')');
                return new(tree.Alpha)(value);
            },

            //
            // A Selector Element
            //
            //     div
            //     + h1
            //     #socks
            //     input[type="text"]
            //
            // Elements are the building blocks for Selectors,
            // they are made out of a `Combinator` (see combinator rule),
            // and an element name, such as a tag a class, or `*`.
            //
            element: function () {
                var e, c, v, index = parserInput.i;

                c = this.combinator();

                e = parserInput.$re(/^(?:\d+\.\d+|\d+)%/) ||
                    parserInput.$re(/^(?:[.#]?|:*)(?:[\w-]|[^\x00-\x9f]|\\(?:[A-Fa-f0-9]{1,6} ?|[^A-Fa-f0-9]))+/) ||
                    parserInput.$char('*') || parserInput.$char('&') || this.attribute() ||
                    parserInput.$re(/^\([^&()@]+\)/) ||  parserInput.$re(/^[\.#:](?=@)/) ||
                    this.entities.variableCurly();

                if (! e) {
                    parserInput.save();
                    if (parserInput.$char('(')) {
                        if ((v = this.selector()) && parserInput.$char(')')) {
                            e = new(tree.Paren)(v);
                            parserInput.forget();
                        } else {
                            parserInput.restore("Missing closing ')'");
                        }
                    } else {
                        parserInput.forget();
                    }
                }

                if (e) { return new(tree.Element)(c, e, index, fileInfo); }
            },

            //
            // Combinators combine elements together, in a Selector.
            //
            // Because our parser isn't white-space sensitive, special care
            // has to be taken, when parsing the descendant combinator, ` `,
            // as it's an empty space. We have to check the previous character
            // in the input, to see if it's a ` ` character. More info on how
            // we deal with this in *combinator.js*.
            //
            combinator: function () {
                var c = parserInput.currentChar();

                if (c === '/') {
                    parserInput.save();
                    var slashedCombinator = parserInput.$re(/^\/[a-z]+\//i);
                    if (slashedCombinator) {
                        parserInput.forget();
                        return new(tree.Combinator)(slashedCombinator);
                    }
                    parserInput.restore();
                }

                if (c === '>' || c === '+' || c === '~' || c === '|' || c === '^') {
                    parserInput.i++;
                    if (c === '^' && parserInput.currentChar() === '^') {
                        c = '^^';
                        parserInput.i++;
                    }
                    while (parserInput.isWhitespace()) { parserInput.i++; }
                    return new(tree.Combinator)(c);
                } else if (parserInput.isWhitespace(-1)) {
                    return new(tree.Combinator)(" ");
                } else {
                    return new(tree.Combinator)(null);
                }
            },
            //
            // A CSS selector (see selector below)
            // with less extensions e.g. the ability to extend and guard
            //
            lessSelector: function () {
                return this.selector(true);
            },
            //
            // A CSS Selector
            //
            //     .class > div + h1
            //     li a:hover
            //
            // Selectors are made out of one or more Elements, see above.
            //
            selector: function (isLess) {
                var index = parserInput.i, elements, extendList, c, e, allExtends, when, condition;

                while ((isLess && (extendList = this.extend())) || (isLess && (when = parserInput.$str("when"))) || (e = this.element())) {
                    if (when) {
                        condition = expect(this.conditions, 'expected condition');
                    } else if (condition) {
                        error("CSS guard can only be used at the end of selector");
                    } else if (extendList) {
                        if (allExtends) {
                            allExtends = allExtends.concat(extendList);
                        } else {
                            allExtends = extendList;
                        }
                    } else {
                        if (allExtends) { error("Extend can only be used at the end of selector"); }
                        c = parserInput.currentChar();
                        if (elements) {
                            elements.push(e);
                        } else {
                            elements = [ e ];
                        }
                        e = null;
                    }
                    if (c === '{' || c === '}' || c === ';' || c === ',' || c === ')') {
                        break;
                    }
                }

                if (elements) { return new(tree.Selector)(elements, allExtends, condition, index, fileInfo); }
                if (allExtends) { error("Extend must be used to extend a selector, it cannot be used on its own"); }
            },
            attribute: function () {
                if (! parserInput.$char('[')) { return; }

                var entities = this.entities,
                    key, val, op;

                if (!(key = entities.variableCurly())) {
                    key = expect(/^(?:[_A-Za-z0-9-\*]*\|)?(?:[_A-Za-z0-9-]|\\.)+/);
                }

                op = parserInput.$re(/^[|~*$^]?=/);
                if (op) {
                    val = entities.quoted() || parserInput.$re(/^[0-9]+%/) || parserInput.$re(/^[\w-]+/) || entities.variableCurly();
                }

                expectChar(']');

                return new(tree.Attribute)(key, op, val);
            },

            //
            // The `block` rule is used by `ruleset` and `mixin.definition`.
            // It's a wrapper around the `primary` rule, with added `{}`.
            //
            block: function () {
                var content;
                if (parserInput.$char('{') && (content = this.primary()) && parserInput.$char('}')) {
                    return content;
                }
            },

            blockRuleset: function() {
                var block = this.block();

                if (block) {
                    block = new tree.Ruleset(null, block);
                }
                return block;
            },

            detachedRuleset: function() {
                var blockRuleset = this.blockRuleset();
                if (blockRuleset) {
                    return new tree.DetachedRuleset(blockRuleset);
                }
            },

            //
            // div, .class, body > p {...}
            //
            ruleset: function () {
                var selectors, s, rules, debugInfo;

                parserInput.save();

                if (context.dumpLineNumbers) {
                    debugInfo = getDebugInfo(parserInput.i);
                }

                while (true) {
                    s = this.lessSelector();
                    if (!s) {
                        break;
                    }
                    if (selectors) {
                        selectors.push(s);
                    } else {
                        selectors = [ s ];
                    }
                    parserInput.commentStore.length = 0;
                    if (s.condition && selectors.length > 1) {
                        error("Guards are only currently allowed on a single selector.");
                    }
                    if (! parserInput.$char(',')) { break; }
                    if (s.condition) {
                        error("Guards are only currently allowed on a single selector.");
                    }
                    parserInput.commentStore.length = 0;
                }

                if (selectors && (rules = this.block())) {
                    parserInput.forget();
                    var ruleset = new(tree.Ruleset)(selectors, rules, context.strictImports);
                    if (context.dumpLineNumbers) {
                        ruleset.debugInfo = debugInfo;
                    }
                    return ruleset;
                } else {
                    parserInput.restore();
                }
            },
            rule: function (tryAnonymous) {
                var name, value, startOfRule = parserInput.i, c = parserInput.currentChar(), important, merge, isVariable;

                if (c === '.' || c === '#' || c === '&' || c === ':') { return; }

                parserInput.save();

                name = this.variable() || this.ruleProperty();
                if (name) {
                    isVariable = typeof name === "string";

                    if (isVariable) {
                        value = this.detachedRuleset();
                    }

                    parserInput.commentStore.length = 0;
                    if (!value) {
                        // a name returned by this.ruleProperty() is always an array of the form:
                        // [string-1, ..., string-n, ""] or [string-1, ..., string-n, "+"]
                        // where each item is a tree.Keyword or tree.Variable
                        merge = !isVariable && name.length > 1 && name.pop().value;

                        // prefer to try to parse first if its a variable or we are compressing
                        // but always fallback on the other one
                        var tryValueFirst = !tryAnonymous && (context.compress || isVariable);

                        if (tryValueFirst) {
                            value = this.value();
                        }
                        if (!value) {
                            value = this.anonymousValue();
                            if (value) {
                                parserInput.forget();
                                // anonymous values absorb the end ';' which is required for them to work
                                return new (tree.Rule)(name, value, false, merge, startOfRule, fileInfo);
                            }
                        }
                        if (!tryValueFirst && !value) {
                            value = this.value();
                        }

                        important = this.important();
                    }

                    if (value && this.end()) {
                        parserInput.forget();
                        return new (tree.Rule)(name, value, important, merge, startOfRule, fileInfo);
                    } else {
                        parserInput.restore();
                        if (value && !tryAnonymous) {
                            return this.rule(true);
                        }
                    }
                } else {
                    parserInput.forget();
                }
            },
            anonymousValue: function () {
                var match = parserInput.$re(/^([^@+\/'"*`(;{}-]*);/);
                if (match) {
                    return new(tree.Anonymous)(match[1]);
                }
            },

            //
            // An @import directive
            //
            //     @import "lib";
            //
            // Depending on our environment, importing is done differently:
            // In the browser, it's an XHR request, in Node, it would be a
            // file-system operation. The function used for importing is
            // stored in `import`, which we pass to the Import constructor.
            //
            "import": function () {
                var path, features, index = parserInput.i;

                var dir = parserInput.$re(/^@import?\s+/);

                if (dir) {
                    var options = (dir ? this.importOptions() : null) || {};

                    if ((path = this.entities.quoted() || this.entities.url())) {
                        features = this.mediaFeatures();

                        if (!parserInput.$char(';')) {
                            parserInput.i = index;
                            error("missing semi-colon or unrecognised media features on import");
                        }
                        features = features && new(tree.Value)(features);
                        return new(tree.Import)(path, features, options, index, fileInfo);
                    }
                    else {
                        parserInput.i = index;
                        error("malformed import statement");
                    }
                }
            },

            importOptions: function() {
                var o, options = {}, optionName, value;

                // list of options, surrounded by parens
                if (! parserInput.$char('(')) { return null; }
                do {
                    o = this.importOption();
                    if (o) {
                        optionName = o;
                        value = true;
                        switch(optionName) {
                            case "css":
                                optionName = "less";
                                value = false;
                                break;
                            case "once":
                                optionName = "multiple";
                                value = false;
                                break;
                        }
                        options[optionName] = value;
                        if (! parserInput.$char(',')) { break; }
                    }
                } while (o);
                expectChar(')');
                return options;
            },

            importOption: function() {
                var opt = parserInput.$re(/^(less|css|multiple|once|inline|reference|optional)/);
                if (opt) {
                    return opt[1];
                }
            },

            mediaFeature: function () {
                var entities = this.entities, nodes = [], e, p;
                parserInput.save();
                do {
                    e = entities.keyword() || entities.variable();
                    if (e) {
                        nodes.push(e);
                    } else if (parserInput.$char('(')) {
                        p = this.property();
                        e = this.value();
                        if (parserInput.$char(')')) {
                            if (p && e) {
                                nodes.push(new(tree.Paren)(new(tree.Rule)(p, e, null, null, parserInput.i, fileInfo, true)));
                            } else if (e) {
                                nodes.push(new(tree.Paren)(e));
                            } else {
                                error("badly formed media feature definition");
                            }
                        } else {
                            error("Missing closing ')'", "Parse");
                        }
                    }
                } while (e);

                parserInput.forget();
                if (nodes.length > 0) {
                    return new(tree.Expression)(nodes);
                }
            },

            mediaFeatures: function () {
                var entities = this.entities, features = [], e;
                do {
                    e = this.mediaFeature();
                    if (e) {
                        features.push(e);
                        if (! parserInput.$char(',')) { break; }
                    } else {
                        e = entities.variable();
                        if (e) {
                            features.push(e);
                            if (! parserInput.$char(',')) { break; }
                        }
                    }
                } while (e);

                return features.length > 0 ? features : null;
            },

            media: function () {
                var features, rules, media, debugInfo;

                if (context.dumpLineNumbers) {
                    debugInfo = getDebugInfo(parserInput.i);
                }

                parserInput.save();

                if (parserInput.$str("@media")) {
                    features = this.mediaFeatures();

                    rules = this.block();

                    if (!rules) {
                        error("media definitions require block statements after any features");
                    }

                    parserInput.forget();

                    media = new(tree.Media)(rules, features, parserInput.i, fileInfo);
                    if (context.dumpLineNumbers) {
                        media.debugInfo = debugInfo;
                    }

                    return media;
                }

                parserInput.restore();
            },

            //
            // A @plugin directive, used to import compiler extensions dynamically.
            //
            //     @plugin "lib";
            //
            // Depending on our environment, importing is done differently:
            // In the browser, it's an XHR request, in Node, it would be a
            // file-system operation. The function used for importing is
            // stored in `import`, which we pass to the Import constructor.
            //
            plugin: function () {
                var path,
                    index = parserInput.i,
                    dir   = parserInput.$re(/^@plugin?\s+/);

                if (dir) {
                    var options = { plugin : true };

                    if ((path = this.entities.quoted() || this.entities.url())) {

                        if (!parserInput.$char(';')) {
                            parserInput.i = index;
                            error("missing semi-colon on plugin");
                        }

                        return new(tree.Import)(path, null, options, index, fileInfo);
                    }
                    else {
                        parserInput.i = index;
                        error("malformed plugin statement");
                    }
                }
            },

            //
            // A CSS Directive
            //
            //     @charset "utf-8";
            //
            directive: function () {
                var index = parserInput.i, name, value, rules, nonVendorSpecificName,
                    hasIdentifier, hasExpression, hasUnknown, hasBlock = true, isRooted = true;

                if (parserInput.currentChar() !== '@') { return; }

                value = this['import']() || this.plugin() || this.media();
                if (value) {
                    return value;
                }

                parserInput.save();

                name = parserInput.$re(/^@[a-z-]+/);

                if (!name) { return; }

                nonVendorSpecificName = name;
                if (name.charAt(1) == '-' && name.indexOf('-', 2) > 0) {
                    nonVendorSpecificName = "@" + name.slice(name.indexOf('-', 2) + 1);
                }

                switch(nonVendorSpecificName) {
                    case "@charset":
                        hasIdentifier = true;
                        hasBlock = false;
                        break;
                    case "@namespace":
                        hasExpression = true;
                        hasBlock = false;
                        break;
                    case "@keyframes":
                    case "@counter-style":
                        hasIdentifier = true;
                        break;
                    case "@document":
                    case "@supports":
                        hasUnknown = true;
                        isRooted = false;
                        break;
                    default:
                        hasUnknown = true;
                        break;
                }

                parserInput.commentStore.length = 0;

                if (hasIdentifier) {
                    value = this.entity();
                    if (!value) {
                        error("expected " + name + " identifier");
                    }
                } else if (hasExpression) {
                    value = this.expression();
                    if (!value) {
                        error("expected " + name + " expression");
                    }
                } else if (hasUnknown) {
                    value = (parserInput.$re(/^[^{;]+/) || '').trim();
                    hasBlock = (parserInput.currentChar() == '{');
                    if (value) {
                        value = new(tree.Anonymous)(value);
                    }
                }

                if (hasBlock) {
                    rules = this.blockRuleset();
                }

                if (rules || (!hasBlock && value && parserInput.$char(';'))) {
                    parserInput.forget();
                    return new (tree.Directive)(name, value, rules, index, fileInfo,
                        context.dumpLineNumbers ? getDebugInfo(index) : null,
                        isRooted
                    );
                }

                parserInput.restore("directive options not recognised");
            },

            //
            // A Value is a comma-delimited list of Expressions
            //
            //     font-family: Baskerville, Georgia, serif;
            //
            // In a Rule, a Value represents everything after the `:`,
            // and before the `;`.
            //
            value: function () {
                var e, expressions = [];

                do {
                    e = this.expression();
                    if (e) {
                        expressions.push(e);
                        if (! parserInput.$char(',')) { break; }
                    }
                } while (e);

                if (expressions.length > 0) {
                    return new(tree.Value)(expressions);
                }
            },
            important: function () {
                if (parserInput.currentChar() === '!') {
                    return parserInput.$re(/^! *important/);
                }
            },
            sub: function () {
                var a, e;

                parserInput.save();
                if (parserInput.$char('(')) {
                    a = this.addition();
                    if (a && parserInput.$char(')')) {
                        parserInput.forget();
                        e = new(tree.Expression)([a]);
                        e.parens = true;
                        return e;
                    }
                    parserInput.restore("Expected ')'");
                    return;
                }
                parserInput.restore();
            },
            multiplication: function () {
                var m, a, op, operation, isSpaced;
                m = this.operand();
                if (m) {
                    isSpaced = parserInput.isWhitespace(-1);
                    while (true) {
                        if (parserInput.peek(/^\/[*\/]/)) {
                            break;
                        }

                        parserInput.save();

                        op = parserInput.$char('/') || parserInput.$char('*');

                        if (!op) { parserInput.forget(); break; }

                        a = this.operand();

                        if (!a) { parserInput.restore(); break; }
                        parserInput.forget();

                        m.parensInOp = true;
                        a.parensInOp = true;
                        operation = new(tree.Operation)(op, [operation || m, a], isSpaced);
                        isSpaced = parserInput.isWhitespace(-1);
                    }
                    return operation || m;
                }
            },
            addition: function () {
                var m, a, op, operation, isSpaced;
                m = this.multiplication();
                if (m) {
                    isSpaced = parserInput.isWhitespace(-1);
                    while (true) {
                        op = parserInput.$re(/^[-+]\s+/) || (!isSpaced && (parserInput.$char('+') || parserInput.$char('-')));
                        if (!op) {
                            break;
                        }
                        a = this.multiplication();
                        if (!a) {
                            break;
                        }

                        m.parensInOp = true;
                        a.parensInOp = true;
                        operation = new(tree.Operation)(op, [operation || m, a], isSpaced);
                        isSpaced = parserInput.isWhitespace(-1);
                    }
                    return operation || m;
                }
            },
            conditions: function () {
                var a, b, index = parserInput.i, condition;

                a = this.condition();
                if (a) {
                    while (true) {
                        if (!parserInput.peek(/^,\s*(not\s*)?\(/) || !parserInput.$char(',')) {
                            break;
                        }
                        b = this.condition();
                        if (!b) {
                            break;
                        }
                        condition = new(tree.Condition)('or', condition || a, b, index);
                    }
                    return condition || a;
                }
            },
            condition: function () {
                var result, logical, next;
                function or() {
                    return parserInput.$str("or");
                }

                result = this.conditionAnd(this);
                if (!result) {
                    return ;
                }
                logical = or();
                if (logical) {
                    next = this.condition();
                    if (next) {
                        result = new(tree.Condition)(logical, result, next);
                    } else {
                        return ;
                    }
                }
                return result;
            },
            conditionAnd: function () {
                var result, logical, next;
                function insideCondition(me) {
                    return me.negatedCondition() || me.parenthesisCondition();
                }
                function and() {
                    return parserInput.$str("and");
                }

                result = insideCondition(this);
                if (!result) {
                    return ;
                }
                logical = and();
                if (logical) {
                    next = this.conditionAnd();
                    if (next) {
                        result = new(tree.Condition)(logical, result, next);
                    } else {
                        return ;
                    }
                }
                return result;
            },
            negatedCondition: function () {
                if (parserInput.$str("not")) {
                    var result = this.parenthesisCondition();
                    if (result) {
                        result.negate = !result.negate;
                    }
                    return result;
                }
            },
            parenthesisCondition: function () {
                function tryConditionFollowedByParenthesis(me) {
                    var body;
                    parserInput.save();
                    body = me.condition();
                    if (!body) {
                        parserInput.restore();
                        return ;
                    }
                    if (!parserInput.$char(')')) {
                        parserInput.restore();
                        return ;
                    }
                    parserInput.forget();
                    return body;
                }

                var body;
                parserInput.save();
                if (!parserInput.$str("(")) {
                    parserInput.restore();
                    return ;
                }
                body = tryConditionFollowedByParenthesis(this);
                if (body) {
                    parserInput.forget();
                    return body;
                }

                body = this.atomicCondition();
                if (!body) {
                    parserInput.restore();
                    return ;
                }
                if (!parserInput.$char(')')) {
                    parserInput.restore("expected ')' got '" + parserInput.currentChar() + "'");
                    return ;
                }
                parserInput.forget();
                return body;
            },
            atomicCondition: function () {
                var entities = this.entities, index = parserInput.i, a, b, c, op;

                a = this.addition() || entities.keyword() || entities.quoted();
                if (a) {
                    if (parserInput.$char('>')) {
                        if (parserInput.$char('=')) {
                            op = ">=";
                        } else {
                            op = '>';
                        }
                    } else
                    if (parserInput.$char('<')) {
                        if (parserInput.$char('=')) {
                            op = "<=";
                        } else {
                            op = '<';
                        }
                    } else
                    if (parserInput.$char('=')) {
                        if (parserInput.$char('>')) {
                            op = "=>";
                        } else if (parserInput.$char('<')) {
                            op = '=<';
                        } else {
                            op = '=';
                        }
                    }
                    if (op) {
                        b = this.addition() || entities.keyword() || entities.quoted();
                        if (b) {
                            c = new(tree.Condition)(op, a, b, index, false);
                        } else {
                            error('expected expression');
                        }
                    } else {
                        c = new(tree.Condition)('=', a, new(tree.Keyword)('true'), index, false);
                    }
                    return c;
                }
            },

            //
            // An operand is anything that can be part of an operation,
            // such as a Color, or a Variable
            //
            operand: function () {
                var entities = this.entities, negate;

                if (parserInput.peek(/^-[@\(]/)) {
                    negate = parserInput.$char('-');
                }

                var o = this.sub() || entities.dimension() ||
                        entities.color() || entities.variable() ||
                        entities.call() || entities.colorKeyword();

                if (negate) {
                    o.parensInOp = true;
                    o = new(tree.Negative)(o);
                }

                return o;
            },

            //
            // Expressions either represent mathematical operations,
            // or white-space delimited Entities.
            //
            //     1px solid black
            //     @var * 2
            //
            expression: function () {
                var entities = [], e, delim;

                do {
                    e = this.comment();
                    if (e) {
                        entities.push(e);
                        continue;
                    }
                    e = this.addition() || this.entity();
                    if (e) {
                        entities.push(e);
                        // operations do not allow keyword "/" dimension (e.g. small/20px) so we support that here
                        if (!parserInput.peek(/^\/[\/*]/)) {
                            delim = parserInput.$char('/');
                            if (delim) {
                                entities.push(new(tree.Anonymous)(delim));
                            }
                        }
                    }
                } while (e);
                if (entities.length > 0) {
                    return new(tree.Expression)(entities);
                }
            },
            property: function () {
                var name = parserInput.$re(/^(\*?-?[_a-zA-Z0-9-]+)\s*:/);
                if (name) {
                    return name[1];
                }
            },
            ruleProperty: function () {
                var name = [], index = [], s, k;

                parserInput.save();

                var simpleProperty = parserInput.$re(/^([_a-zA-Z0-9-]+)\s*:/);
                if (simpleProperty) {
                    name = [new(tree.Keyword)(simpleProperty[1])];
                    parserInput.forget();
                    return name;
                }

                function match(re) {
                    var i = parserInput.i,
                        chunk = parserInput.$re(re);
                    if (chunk) {
                        index.push(i);
                        return name.push(chunk[1]);
                    }
                }

                match(/^(\*?)/);
                while (true) {
                    if (!match(/^((?:[\w-]+)|(?:@\{[\w-]+\}))/)) {
                        break;
                    }
                }

                if ((name.length > 1) && match(/^((?:\+_|\+)?)\s*:/)) {
                    parserInput.forget();

                    // at last, we have the complete match now. move forward,
                    // convert name particles to tree objects and return:
                    if (name[0] === '') {
                        name.shift();
                        index.shift();
                    }
                    for (k = 0; k < name.length; k++) {
                        s = name[k];
                        name[k] = (s.charAt(0) !== '@') ?
                            new(tree.Keyword)(s) :
                            new(tree.Variable)('@' + s.slice(2, -1),
                                index[k], fileInfo);
                    }
                    return name;
                }
                parserInput.restore();
            }
        }
    };
};
Parser.serializeVars = function(vars) {
    var s = '';

    for (var name in vars) {
        if (Object.hasOwnProperty.call(vars, name)) {
            var value = vars[name];
            s += ((name[0] === '@') ? '' : '@') + name + ': ' + value +
                ((String(value).slice(-1) === ';') ? '' : ';');
        }
    }

    return s;
};

module.exports = Parser;

},{"../less-error":32,"../tree":62,"../utils":83,"../visitors":87,"./parser-input":37}],39:[function(require,module,exports){
/**
 * Plugin Manager
 */
var PluginManager = function(less) {
    this.less = less;
    this.visitors = [];
    this.preProcessors = [];
    this.postProcessors = [];
    this.installedPlugins = [];
    this.fileManagers = [];
};
/**
 * Adds all the plugins in the array
 * @param {Array} plugins
 */
PluginManager.prototype.addPlugins = function(plugins) {
    if (plugins) {
        for (var i = 0; i < plugins.length; i++) {
            this.addPlugin(plugins[i]);
        }
    }
};
/**
 *
 * @param plugin
 */
PluginManager.prototype.addPlugin = function(plugin) {
    this.installedPlugins.push(plugin);
    plugin.install(this.less, this);
};
/**
 * Adds a visitor. The visitor object has options on itself to determine
 * when it should run.
 * @param visitor
 */
PluginManager.prototype.addVisitor = function(visitor) {
    this.visitors.push(visitor);
};
/**
 * Adds a pre processor object
 * @param {object} preProcessor
 * @param {number} priority - guidelines 1 = before import, 1000 = import, 2000 = after import
 */
PluginManager.prototype.addPreProcessor = function(preProcessor, priority) {
    var indexToInsertAt;
    for (indexToInsertAt = 0; indexToInsertAt < this.preProcessors.length; indexToInsertAt++) {
        if (this.preProcessors[indexToInsertAt].priority >= priority) {
            break;
        }
    }
    this.preProcessors.splice(indexToInsertAt, 0, {preProcessor: preProcessor, priority: priority});
};
/**
 * Adds a post processor object
 * @param {object} postProcessor
 * @param {number} priority - guidelines 1 = before compression, 1000 = compression, 2000 = after compression
 */
PluginManager.prototype.addPostProcessor = function(postProcessor, priority) {
    var indexToInsertAt;
    for (indexToInsertAt = 0; indexToInsertAt < this.postProcessors.length; indexToInsertAt++) {
        if (this.postProcessors[indexToInsertAt].priority >= priority) {
            break;
        }
    }
    this.postProcessors.splice(indexToInsertAt, 0, {postProcessor: postProcessor, priority: priority});
};
/**
 *
 * @param manager
 */
PluginManager.prototype.addFileManager = function(manager) {
    this.fileManagers.push(manager);
};
/**
 *
 * @returns {Array}
 * @private
 */
PluginManager.prototype.getPreProcessors = function() {
    var preProcessors = [];
    for (var i = 0; i < this.preProcessors.length; i++) {
        preProcessors.push(this.preProcessors[i].preProcessor);
    }
    return preProcessors;
};
/**
 *
 * @returns {Array}
 * @private
 */
PluginManager.prototype.getPostProcessors = function() {
    var postProcessors = [];
    for (var i = 0; i < this.postProcessors.length; i++) {
        postProcessors.push(this.postProcessors[i].postProcessor);
    }
    return postProcessors;
};
/**
 *
 * @returns {Array}
 * @private
 */
PluginManager.prototype.getVisitors = function() {
    return this.visitors;
};
/**
 *
 * @returns {Array}
 * @private
 */
PluginManager.prototype.getFileManagers = function() {
    return this.fileManagers;
};
module.exports = PluginManager;

},{}],40:[function(require,module,exports){
var LessError = require('../less-error'),
    tree = require("../tree");

var FunctionImporter = module.exports = function FunctionImporter(context, fileInfo) {
    this.fileInfo = fileInfo;
};

FunctionImporter.prototype.eval = function(contents, callback) {
    var loaded = {},
        loader,
        registry;

    registry = {
        add: function(name, func) {
            loaded[name] = func;
        },
        addMultiple: function(functions) {
            Object.keys(functions).forEach(function(name) {
                loaded[name] = functions[name];
            });
        }
    };

    try {
        loader = new Function("functions", "tree", "fileInfo", contents);
        loader(registry, tree, this.fileInfo);
    } catch(e) {
        callback(new LessError({
            message: "Plugin evaluation error: '" + e.name + ': ' + e.message.replace(/["]/g, "'") + "'" ,
            filename: this.fileInfo.filename
        }), null );
    }

    callback(null, { functions: loaded });
};

},{"../less-error":32,"../tree":62}],41:[function(require,module,exports){
var PromiseConstructor;

module.exports = function(environment, ParseTree, ImportManager) {
    var render = function (input, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        if (!callback) {
            if (!PromiseConstructor) {
                PromiseConstructor = typeof Promise === 'undefined' ? require('promise') : Promise;
            }
            var self = this;
            return new PromiseConstructor(function (resolve, reject) {
                render.call(self, input, options, function(err, output) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(output);
                    }
                });
            });
        } else {
            this.parse(input, options, function(err, root, imports, options) {
                if (err) { return callback(err); }

                var result;
                try {
                    var parseTree = new ParseTree(root, imports);
                    result = parseTree.toCSS(options);
                }
                catch (err) { return callback(err); }

                callback(null, result);
            });
        }
    };

    return render;
};

},{"promise":undefined}],42:[function(require,module,exports){
module.exports = function (SourceMapOutput, environment) {

    var SourceMapBuilder = function (options) {
        this.options = options;
    };

    SourceMapBuilder.prototype.toCSS = function(rootNode, options, imports) {
        var sourceMapOutput = new SourceMapOutput(
            {
                contentsIgnoredCharsMap: imports.contentsIgnoredChars,
                rootNode: rootNode,
                contentsMap: imports.contents,
                sourceMapFilename: this.options.sourceMapFilename,
                sourceMapURL: this.options.sourceMapURL,
                outputFilename: this.options.sourceMapOutputFilename,
                sourceMapBasepath: this.options.sourceMapBasepath,
                sourceMapRootpath: this.options.sourceMapRootpath,
                outputSourceFiles: this.options.outputSourceFiles,
                sourceMapGenerator: this.options.sourceMapGenerator,
                sourceMapFileInline: this.options.sourceMapFileInline
            });

        var css = sourceMapOutput.toCSS(options);
        this.sourceMap = sourceMapOutput.sourceMap;
        this.sourceMapURL = sourceMapOutput.sourceMapURL;
        if (this.options.sourceMapInputFilename) {
            this.sourceMapInputFilename = sourceMapOutput.normalizeFilename(this.options.sourceMapInputFilename);
        }
        return css + this.getCSSAppendage();
    };

    SourceMapBuilder.prototype.getCSSAppendage = function() {

        var sourceMapURL = this.sourceMapURL;
        if (this.options.sourceMapFileInline) {
            if (this.sourceMap === undefined) {
                return "";
            }
            sourceMapURL = "data:application/json;base64," + environment.encodeBase64(this.sourceMap);
        }

        if (sourceMapURL) {
            return "/*# sourceMappingURL=" + sourceMapURL + " */";
        }
        return "";
    };

    SourceMapBuilder.prototype.getExternalSourceMap = function() {
        return this.sourceMap;
    };
    SourceMapBuilder.prototype.setExternalSourceMap = function(sourceMap) {
        this.sourceMap = sourceMap;
    };

    SourceMapBuilder.prototype.isInline = function() {
        return this.options.sourceMapFileInline;
    };
    SourceMapBuilder.prototype.getSourceMapURL = function() {
        return this.sourceMapURL;
    };
    SourceMapBuilder.prototype.getOutputFilename = function() {
        return this.options.sourceMapOutputFilename;
    };
    SourceMapBuilder.prototype.getInputFilename = function() {
        return this.sourceMapInputFilename;
    };

    return SourceMapBuilder;
};

},{}],43:[function(require,module,exports){
module.exports = function (environment) {

    var SourceMapOutput = function (options) {
        this._css = [];
        this._rootNode = options.rootNode;
        this._contentsMap = options.contentsMap;
        this._contentsIgnoredCharsMap = options.contentsIgnoredCharsMap;
        if (options.sourceMapFilename) {
            this._sourceMapFilename = options.sourceMapFilename.replace(/\\/g, '/');
        }
        this._outputFilename = options.outputFilename;
        this.sourceMapURL = options.sourceMapURL;
        if (options.sourceMapBasepath) {
            this._sourceMapBasepath = options.sourceMapBasepath.replace(/\\/g, '/');
        }
        if (options.sourceMapRootpath) {
            this._sourceMapRootpath = options.sourceMapRootpath.replace(/\\/g, '/');
            if (this._sourceMapRootpath.charAt(this._sourceMapRootpath.length - 1) !== '/') {
                this._sourceMapRootpath += '/';
            }
        } else {
            this._sourceMapRootpath = "";
        }
        this._outputSourceFiles = options.outputSourceFiles;
        this._sourceMapGeneratorConstructor = environment.getSourceMapGenerator();

        this._lineNumber = 0;
        this._column = 0;
    };

    SourceMapOutput.prototype.normalizeFilename = function(filename) {
        filename = filename.replace(/\\/g, '/');

        if (this._sourceMapBasepath && filename.indexOf(this._sourceMapBasepath) === 0) {
            filename = filename.substring(this._sourceMapBasepath.length);
            if (filename.charAt(0) === '\\' || filename.charAt(0) === '/') {
                filename = filename.substring(1);
            }
        }
        return (this._sourceMapRootpath || "") + filename;
    };

    SourceMapOutput.prototype.add = function(chunk, fileInfo, index, mapLines) {

        //ignore adding empty strings
        if (!chunk) {
            return;
        }

        var lines,
            sourceLines,
            columns,
            sourceColumns,
            i;

        if (fileInfo) {
            var inputSource = this._contentsMap[fileInfo.filename];

            // remove vars/banner added to the top of the file
            if (this._contentsIgnoredCharsMap[fileInfo.filename]) {
                // adjust the index
                index -= this._contentsIgnoredCharsMap[fileInfo.filename];
                if (index < 0) { index = 0; }
                // adjust the source
                inputSource = inputSource.slice(this._contentsIgnoredCharsMap[fileInfo.filename]);
            }
            inputSource = inputSource.substring(0, index);
            sourceLines = inputSource.split("\n");
            sourceColumns = sourceLines[sourceLines.length - 1];
        }

        lines = chunk.split("\n");
        columns = lines[lines.length - 1];

        if (fileInfo) {
            if (!mapLines) {
                this._sourceMapGenerator.addMapping({ generated: { line: this._lineNumber + 1, column: this._column},
                    original: { line: sourceLines.length, column: sourceColumns.length},
                    source: this.normalizeFilename(fileInfo.filename)});
            } else {
                for (i = 0; i < lines.length; i++) {
                    this._sourceMapGenerator.addMapping({ generated: { line: this._lineNumber + i + 1, column: i === 0 ? this._column : 0},
                        original: { line: sourceLines.length + i, column: i === 0 ? sourceColumns.length : 0},
                        source: this.normalizeFilename(fileInfo.filename)});
                }
            }
        }

        if (lines.length === 1) {
            this._column += columns.length;
        } else {
            this._lineNumber += lines.length - 1;
            this._column = columns.length;
        }

        this._css.push(chunk);
    };

    SourceMapOutput.prototype.isEmpty = function() {
        return this._css.length === 0;
    };

    SourceMapOutput.prototype.toCSS = function(context) {
        this._sourceMapGenerator = new this._sourceMapGeneratorConstructor({ file: this._outputFilename, sourceRoot: null });

        if (this._outputSourceFiles) {
            for (var filename in this._contentsMap) {
                if (this._contentsMap.hasOwnProperty(filename)) {
                    var source = this._contentsMap[filename];
                    if (this._contentsIgnoredCharsMap[filename]) {
                        source = source.slice(this._contentsIgnoredCharsMap[filename]);
                    }
                    this._sourceMapGenerator.setSourceContent(this.normalizeFilename(filename), source);
                }
            }
        }

        this._rootNode.genCSS(context, this);

        if (this._css.length > 0) {
            var sourceMapURL,
                sourceMapContent = JSON.stringify(this._sourceMapGenerator.toJSON());

            if (this.sourceMapURL) {
                sourceMapURL = this.sourceMapURL;
            } else if (this._sourceMapFilename) {
                sourceMapURL = this._sourceMapFilename;
            }
            this.sourceMapURL = sourceMapURL;

            this.sourceMap = sourceMapContent;
        }

        return this._css.join('');
    };

    return SourceMapOutput;
};

},{}],44:[function(require,module,exports){
var contexts = require("./contexts"),
    visitor = require("./visitors"),
    tree = require("./tree");

module.exports = function(root, options) {
    options = options || {};
    var evaldRoot,
        variables = options.variables,
        evalEnv = new contexts.Eval(options);

    //
    // Allows setting variables with a hash, so:
    //
    //   `{ color: new tree.Color('#f01') }` will become:
    //
    //   new tree.Rule('@color',
    //     new tree.Value([
    //       new tree.Expression([
    //         new tree.Color('#f01')
    //       ])
    //     ])
    //   )
    //
    if (typeof variables === 'object' && !Array.isArray(variables)) {
        variables = Object.keys(variables).map(function (k) {
            var value = variables[k];

            if (! (value instanceof tree.Value)) {
                if (! (value instanceof tree.Expression)) {
                    value = new tree.Expression([value]);
                }
                value = new tree.Value([value]);
            }
            return new tree.Rule('@' + k, value, false, null, 0);
        });
        evalEnv.frames = [new tree.Ruleset(null, variables)];
    }

    var preEvalVisitors = [],
        visitors = [
            new visitor.JoinSelectorVisitor(),
            new visitor.MarkVisibleSelectorsVisitor(true),
            new visitor.ExtendVisitor(),
            new visitor.ToCSSVisitor({compress: Boolean(options.compress)})
        ], i;

    if (options.pluginManager) {
        var pluginVisitors = options.pluginManager.getVisitors();
        for (i = 0; i < pluginVisitors.length; i++) {
            var pluginVisitor = pluginVisitors[i];
            if (pluginVisitor.isPreEvalVisitor) {
                preEvalVisitors.push(pluginVisitor);
            } else {
                if (pluginVisitor.isPreVisitor) {
                    visitors.splice(0, 0, pluginVisitor);
                } else {
                    visitors.push(pluginVisitor);
                }
            }
        }
    }

    for (i = 0; i < preEvalVisitors.length; i++) {
        preEvalVisitors[i].run(root);
    }

    evaldRoot = root.eval(evalEnv);

    for (i = 0; i < visitors.length; i++) {
        visitors[i].run(evaldRoot);
    }

    return evaldRoot;
};

},{"./contexts":11,"./tree":62,"./visitors":87}],45:[function(require,module,exports){
var Node = require("./node");

var Alpha = function (val) {
    this.value = val;
};
Alpha.prototype = new Node();
Alpha.prototype.type = "Alpha";

Alpha.prototype.accept = function (visitor) {
    this.value = visitor.visit(this.value);
};
Alpha.prototype.eval = function (context) {
    if (this.value.eval) { return new Alpha(this.value.eval(context)); }
    return this;
};
Alpha.prototype.genCSS = function (context, output) {
    output.add("alpha(opacity=");

    if (this.value.genCSS) {
        this.value.genCSS(context, output);
    } else {
        output.add(this.value);
    }

    output.add(")");
};

module.exports = Alpha;

},{"./node":70}],46:[function(require,module,exports){
var Node = require("./node");

var Anonymous = function (value, index, currentFileInfo, mapLines, rulesetLike, visibilityInfo) {
    this.value = value;
    this.index = index;
    this.mapLines = mapLines;
    this.currentFileInfo = currentFileInfo;
    this.rulesetLike = (typeof rulesetLike === 'undefined') ? false : rulesetLike;

    this.copyVisibilityInfo(visibilityInfo);
};
Anonymous.prototype = new Node();
Anonymous.prototype.type = "Anonymous";
Anonymous.prototype.eval = function () {
    return new Anonymous(this.value, this.index, this.currentFileInfo, this.mapLines, this.rulesetLike, this.visibilityInfo());
};
Anonymous.prototype.compare = function (other) {
    return other.toCSS && this.toCSS() === other.toCSS() ? 0 : undefined;
};
Anonymous.prototype.isRulesetLike = function() {
    return this.rulesetLike;
};
Anonymous.prototype.genCSS = function (context, output) {
    output.add(this.value, this.currentFileInfo, this.index, this.mapLines);
};
module.exports = Anonymous;

},{"./node":70}],47:[function(require,module,exports){
var Node = require("./node");

var Assignment = function (key, val) {
    this.key = key;
    this.value = val;
};

Assignment.prototype = new Node();
Assignment.prototype.type = "Assignment";
Assignment.prototype.accept = function (visitor) {
    this.value = visitor.visit(this.value);
};
Assignment.prototype.eval = function (context) {
    if (this.value.eval) {
        return new Assignment(this.key, this.value.eval(context));
    }
    return this;
};
Assignment.prototype.genCSS = function (context, output) {
    output.add(this.key + '=');
    if (this.value.genCSS) {
        this.value.genCSS(context, output);
    } else {
        output.add(this.value);
    }
};
module.exports = Assignment;

},{"./node":70}],48:[function(require,module,exports){
var Node = require("./node");

var Attribute = function (key, op, value) {
    this.key = key;
    this.op = op;
    this.value = value;
};
Attribute.prototype = new Node();
Attribute.prototype.type = "Attribute";
Attribute.prototype.eval = function (context) {
    return new Attribute(this.key.eval ? this.key.eval(context) : this.key,
        this.op, (this.value && this.value.eval) ? this.value.eval(context) : this.value);
};
Attribute.prototype.genCSS = function (context, output) {
    output.add(this.toCSS(context));
};
Attribute.prototype.toCSS = function (context) {
    var value = this.key.toCSS ? this.key.toCSS(context) : this.key;

    if (this.op) {
        value += this.op;
        value += (this.value.toCSS ? this.value.toCSS(context) : this.value);
    }

    return '[' + value + ']';
};
module.exports = Attribute;

},{"./node":70}],49:[function(require,module,exports){
var Node = require("./node"),
    FunctionCaller = require("../functions/function-caller");
//
// A function call node.
//
var Call = function (name, args, index, currentFileInfo) {
    this.name = name;
    this.args = args;
    this.index = index;
    this.currentFileInfo = currentFileInfo;
};
Call.prototype = new Node();
Call.prototype.type = "Call";
Call.prototype.accept = function (visitor) {
    if (this.args) {
        this.args = visitor.visitArray(this.args);
    }
};
//
// When evaluating a function call,
// we either find the function in the functionRegistry,
// in which case we call it, passing the  evaluated arguments,
// if this returns null or we cannot find the function, we
// simply print it out as it appeared originally [2].
//
// The reason why we evaluate the arguments, is in the case where
// we try to pass a variable to a function, like: `saturate(@color)`.
// The function should receive the value, not the variable.
//
Call.prototype.eval = function (context) {
    var args = this.args.map(function (a) { return a.eval(context); }),
        result, funcCaller = new FunctionCaller(this.name, context, this.index, this.currentFileInfo);

    if (funcCaller.isValid()) { // 1.
        try {
            result = funcCaller.call(args);
            if (result != null) {
                return result;
            }
        } catch (e) {
            throw { type: e.type || "Runtime",
                    message: "error evaluating function `" + this.name + "`" +
                             (e.message ? ': ' + e.message : ''),
                    index: this.index, filename: this.currentFileInfo.filename };
        }
    }

    return new Call(this.name, args, this.index, this.currentFileInfo);
};
Call.prototype.genCSS = function (context, output) {
    output.add(this.name + "(", this.currentFileInfo, this.index);

    for (var i = 0; i < this.args.length; i++) {
        this.args[i].genCSS(context, output);
        if (i + 1 < this.args.length) {
            output.add(", ");
        }
    }

    output.add(")");
};
module.exports = Call;

},{"../functions/function-caller":21,"./node":70}],50:[function(require,module,exports){
var Node = require("./node"),
    colors = require("../data/colors");

//
// RGB Colors - #ff0014, #eee
//
var Color = function (rgb, a, originalForm) {
    //
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    //
    if (Array.isArray(rgb)) {
        this.rgb = rgb;
    } else if (rgb.length == 6) {
        this.rgb = rgb.match(/.{2}/g).map(function (c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function (c) {
            return parseInt(c + c, 16);
        });
    }
    this.alpha = typeof a === 'number' ? a : 1;
    if (typeof originalForm !== 'undefined') {
        this.value = originalForm;
    }
};

Color.prototype = new Node();
Color.prototype.type = "Color";

function clamp(v, max) {
    return Math.min(Math.max(v, 0), max);
}

function toHex(v) {
    return '#' + v.map(function (c) {
        c = clamp(Math.round(c), 255);
        return (c < 16 ? '0' : '') + c.toString(16);
    }).join('');
}

Color.prototype.luma = function () {
    var r = this.rgb[0] / 255,
        g = this.rgb[1] / 255,
        b = this.rgb[2] / 255;

    r = (r <= 0.03928) ? r / 12.92 : Math.pow(((r + 0.055) / 1.055), 2.4);
    g = (g <= 0.03928) ? g / 12.92 : Math.pow(((g + 0.055) / 1.055), 2.4);
    b = (b <= 0.03928) ? b / 12.92 : Math.pow(((b + 0.055) / 1.055), 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
Color.prototype.genCSS = function (context, output) {
    output.add(this.toCSS(context));
};
Color.prototype.toCSS = function (context, doNotCompress) {
    var compress = context && context.compress && !doNotCompress, color, alpha;

    // `value` is set if this color was originally
    // converted from a named color string so we need
    // to respect this and try to output named color too.
    if (this.value) {
        return this.value;
    }

    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    alpha = this.fround(context, this.alpha);
    if (alpha < 1) {
        return "rgba(" + this.rgb.map(function (c) {
            return clamp(Math.round(c), 255);
        }).concat(clamp(alpha, 1))
            .join(',' + (compress ? '' : ' ')) + ")";
    }

    color = this.toRGB();

    if (compress) {
        var splitcolor = color.split('');

        // Convert color to short format
        if (splitcolor[1] === splitcolor[2] && splitcolor[3] === splitcolor[4] && splitcolor[5] === splitcolor[6]) {
            color = '#' + splitcolor[1] + splitcolor[3] + splitcolor[5];
        }
    }

    return color;
};

//
// Operations have to be done per-channel, if not,
// channels will spill onto each other. Once we have
// our result, in the form of an integer triplet,
// we create a new Color node to hold the result.
//
Color.prototype.operate = function (context, op, other) {
    var rgb = [];
    var alpha = this.alpha * (1 - other.alpha) + other.alpha;
    for (var c = 0; c < 3; c++) {
        rgb[c] = this._operate(context, op, this.rgb[c], other.rgb[c]);
    }
    return new Color(rgb, alpha);
};
Color.prototype.toRGB = function () {
    return toHex(this.rgb);
};
Color.prototype.toHSL = function () {
    var r = this.rgb[0] / 255,
        g = this.rgb[1] / 255,
        b = this.rgb[2] / 255,
        a = this.alpha;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2, d = max - min;

    if (max === min) {
        h = s = 0;
    } else {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2;               break;
            case b: h = (r - g) / d + 4;               break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s, l: l, a: a };
};
//Adapted from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
Color.prototype.toHSV = function () {
    var r = this.rgb[0] / 255,
        g = this.rgb[1] / 255,
        b = this.rgb[2] / 255,
        a = this.alpha;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    if (max === 0) {
        s = 0;
    } else {
        s = d / max;
    }

    if (max === min) {
        h = 0;
    } else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s, v: v, a: a };
};
Color.prototype.toARGB = function () {
    return toHex([this.alpha * 255].concat(this.rgb));
};
Color.prototype.compare = function (x) {
    return (x.rgb &&
        x.rgb[0] === this.rgb[0] &&
        x.rgb[1] === this.rgb[1] &&
        x.rgb[2] === this.rgb[2] &&
        x.alpha  === this.alpha) ? 0 : undefined;
};

Color.fromKeyword = function(keyword) {
    var c, key = keyword.toLowerCase();
    if (colors.hasOwnProperty(key)) {
        c = new Color(colors[key].slice(1));
    }
    else if (key === "transparent") {
        c = new Color([0, 0, 0], 0);
    }

    if (c) {
        c.value = keyword;
        return c;
    }
};
module.exports = Color;

},{"../data/colors":12,"./node":70}],51:[function(require,module,exports){
var Node = require("./node");

var Combinator = function (value) {
    if (value === ' ') {
        this.value = ' ';
        this.emptyOrWhitespace = true;
    } else {
        this.value = value ? value.trim() : "";
        this.emptyOrWhitespace = this.value === "";
    }
};
Combinator.prototype = new Node();
Combinator.prototype.type = "Combinator";
var _noSpaceCombinators = {
    '': true,
    ' ': true,
    '|': true
};
Combinator.prototype.genCSS = function (context, output) {
    var spaceOrEmpty = (context.compress || _noSpaceCombinators[this.value]) ? '' : ' ';
    output.add(spaceOrEmpty + this.value + spaceOrEmpty);
};
module.exports = Combinator;

},{"./node":70}],52:[function(require,module,exports){
var Node = require("./node"),
    getDebugInfo = require("./debug-info");

var Comment = function (value, isLineComment, index, currentFileInfo) {
    this.value = value;
    this.isLineComment = isLineComment;
    this.currentFileInfo = currentFileInfo;
};
Comment.prototype = new Node();
Comment.prototype.type = "Comment";
Comment.prototype.genCSS = function (context, output) {
    if (this.debugInfo) {
        output.add(getDebugInfo(context, this), this.currentFileInfo, this.index);
    }
    output.add(this.value);
};
Comment.prototype.isSilent = function(context) {
    var isCompressed = context.compress && this.value[2] !== "!";
    return this.isLineComment || isCompressed;
};
module.exports = Comment;

},{"./debug-info":54,"./node":70}],53:[function(require,module,exports){
var Node = require("./node");

var Condition = function (op, l, r, i, negate) {
    this.op = op.trim();
    this.lvalue = l;
    this.rvalue = r;
    this.index = i;
    this.negate = negate;
};
Condition.prototype = new Node();
Condition.prototype.type = "Condition";
Condition.prototype.accept = function (visitor) {
    this.lvalue = visitor.visit(this.lvalue);
    this.rvalue = visitor.visit(this.rvalue);
};
Condition.prototype.eval = function (context) {
    var result = (function (op, a, b) {
        switch (op) {
            case 'and': return a && b;
            case 'or':  return a || b;
            default:
                switch (Node.compare(a, b)) {
                    case -1:
                        return op === '<' || op === '=<' || op === '<=';
                    case 0:
                        return op === '=' || op === '>=' || op === '=<' || op === '<=';
                    case 1:
                        return op === '>' || op === '>=';
                    default:
                        return false;
                }
        }
    })(this.op, this.lvalue.eval(context), this.rvalue.eval(context));

    return this.negate ? !result : result;
};
module.exports = Condition;

},{"./node":70}],54:[function(require,module,exports){
var debugInfo = function(context, ctx, lineSeparator) {
    var result = "";
    if (context.dumpLineNumbers && !context.compress) {
        switch(context.dumpLineNumbers) {
            case 'comments':
                result = debugInfo.asComment(ctx);
                break;
            case 'mediaquery':
                result = debugInfo.asMediaQuery(ctx);
                break;
            case 'all':
                result = debugInfo.asComment(ctx) + (lineSeparator || "") + debugInfo.asMediaQuery(ctx);
                break;
        }
    }
    return result;
};

debugInfo.asComment = function(ctx) {
    return '/* line ' + ctx.debugInfo.lineNumber + ', ' + ctx.debugInfo.fileName + ' */\n';
};

debugInfo.asMediaQuery = function(ctx) {
    var filenameWithProtocol = ctx.debugInfo.fileName;
    if (!/^[a-z]+:\/\//i.test(filenameWithProtocol)) {
        filenameWithProtocol = 'file://' + filenameWithProtocol;
    }
    return '@media -sass-debug-info{filename{font-family:' +
        filenameWithProtocol.replace(/([.:\/\\])/g, function (a) {
            if (a == '\\') {
                a = '\/';
            }
            return '\\' + a;
        }) +
        '}line{font-family:\\00003' + ctx.debugInfo.lineNumber + '}}\n';
};

module.exports = debugInfo;

},{}],55:[function(require,module,exports){
var Node = require("./node"),
    contexts = require("../contexts");

var DetachedRuleset = function (ruleset, frames) {
    this.ruleset = ruleset;
    this.frames = frames;
};
DetachedRuleset.prototype = new Node();
DetachedRuleset.prototype.type = "DetachedRuleset";
DetachedRuleset.prototype.evalFirst = true;
DetachedRuleset.prototype.accept = function (visitor) {
    this.ruleset = visitor.visit(this.ruleset);
};
DetachedRuleset.prototype.eval = function (context) {
    var frames = this.frames || context.frames.slice(0);
    return new DetachedRuleset(this.ruleset, frames);
};
DetachedRuleset.prototype.callEval = function (context) {
    return this.ruleset.eval(this.frames ? new contexts.Eval(context, this.frames.concat(context.frames)) : context);
};
module.exports = DetachedRuleset;

},{"../contexts":11,"./node":70}],56:[function(require,module,exports){
var Node = require("./node"),
    unitConversions = require("../data/unit-conversions"),
    Unit = require("./unit"),
    Color = require("./color");

//
// A number with a unit
//
var Dimension = function (value, unit) {
    this.value = parseFloat(value);
    this.unit = (unit && unit instanceof Unit) ? unit :
      new Unit(unit ? [unit] : undefined);
};

Dimension.prototype = new Node();
Dimension.prototype.type = "Dimension";
Dimension.prototype.accept = function (visitor) {
    this.unit = visitor.visit(this.unit);
};
Dimension.prototype.eval = function (context) {
    return this;
};
Dimension.prototype.toColor = function () {
    return new Color([this.value, this.value, this.value]);
};
Dimension.prototype.genCSS = function (context, output) {
    if ((context && context.strictUnits) && !this.unit.isSingular()) {
        throw new Error("Multiple units in dimension. Correct the units or use the unit function. Bad unit: " + this.unit.toString());
    }

    var value = this.fround(context, this.value),
        strValue = String(value);

    if (value !== 0 && value < 0.000001 && value > -0.000001) {
        // would be output 1e-6 etc.
        strValue = value.toFixed(20).replace(/0+$/, "");
    }

    if (context && context.compress) {
        // Zero values doesn't need a unit
        if (value === 0 && this.unit.isLength()) {
            output.add(strValue);
            return;
        }

        // Float values doesn't need a leading zero
        if (value > 0 && value < 1) {
            strValue = (strValue).substr(1);
        }
    }

    output.add(strValue);
    this.unit.genCSS(context, output);
};

// In an operation between two Dimensions,
// we default to the first Dimension's unit,
// so `1px + 2` will yield `3px`.
Dimension.prototype.operate = function (context, op, other) {
    /*jshint noempty:false */
    var value = this._operate(context, op, this.value, other.value),
        unit = this.unit.clone();

    if (op === '+' || op === '-') {
        if (unit.numerator.length === 0 && unit.denominator.length === 0) {
            unit = other.unit.clone();
            if (this.unit.backupUnit) {
                unit.backupUnit = this.unit.backupUnit;
            }
        } else if (other.unit.numerator.length === 0 && unit.denominator.length === 0) {
            // do nothing
        } else {
            other = other.convertTo(this.unit.usedUnits());

            if (context.strictUnits && other.unit.toString() !== unit.toString()) {
                throw new Error("Incompatible units. Change the units or use the unit function. Bad units: '" + unit.toString() +
                    "' and '" + other.unit.toString() + "'.");
            }

            value = this._operate(context, op, this.value, other.value);
        }
    } else if (op === '*') {
        unit.numerator = unit.numerator.concat(other.unit.numerator).sort();
        unit.denominator = unit.denominator.concat(other.unit.denominator).sort();
        unit.cancel();
    } else if (op === '/') {
        unit.numerator = unit.numerator.concat(other.unit.denominator).sort();
        unit.denominator = unit.denominator.concat(other.unit.numerator).sort();
        unit.cancel();
    }
    return new Dimension(value, unit);
};
Dimension.prototype.compare = function (other) {
    var a, b;

    if (!(other instanceof Dimension)) {
        return undefined;
    }

    if (this.unit.isEmpty() || other.unit.isEmpty()) {
        a = this;
        b = other;
    } else {
        a = this.unify();
        b = other.unify();
        if (a.unit.compare(b.unit) !== 0) {
            return undefined;
        }
    }

    return Node.numericCompare(a.value, b.value);
};
Dimension.prototype.unify = function () {
    return this.convertTo({ length: 'px', duration: 's', angle: 'rad' });
};
Dimension.prototype.convertTo = function (conversions) {
    var value = this.value, unit = this.unit.clone(),
        i, groupName, group, targetUnit, derivedConversions = {}, applyUnit;

    if (typeof conversions === 'string') {
        for (i in unitConversions) {
            if (unitConversions[i].hasOwnProperty(conversions)) {
                derivedConversions = {};
                derivedConversions[i] = conversions;
            }
        }
        conversions = derivedConversions;
    }
    applyUnit = function (atomicUnit, denominator) {
        /* jshint loopfunc:true */
        if (group.hasOwnProperty(atomicUnit)) {
            if (denominator) {
                value = value / (group[atomicUnit] / group[targetUnit]);
            } else {
                value = value * (group[atomicUnit] / group[targetUnit]);
            }

            return targetUnit;
        }

        return atomicUnit;
    };

    for (groupName in conversions) {
        if (conversions.hasOwnProperty(groupName)) {
            targetUnit = conversions[groupName];
            group = unitConversions[groupName];

            unit.map(applyUnit);
        }
    }

    unit.cancel();

    return new Dimension(value, unit);
};
module.exports = Dimension;

},{"../data/unit-conversions":14,"./color":50,"./node":70,"./unit":79}],57:[function(require,module,exports){
var Node = require("./node"),
    Selector = require("./selector"),
    Ruleset = require("./ruleset");

var Directive = function (name, value, rules, index, currentFileInfo, debugInfo, isRooted, visibilityInfo) {
    var i;

    this.name  = name;
    this.value = value;
    if (rules) {
        if (Array.isArray(rules)) {
            this.rules = rules;
        } else {
            this.rules = [rules];
            this.rules[0].selectors = (new Selector([], null, null, this.index, currentFileInfo)).createEmptySelectors();
        }
        for (i = 0; i < this.rules.length; i++) {
            this.rules[i].allowImports = true;
        }
    }
    this.index = index;
    this.currentFileInfo = currentFileInfo;
    this.debugInfo = debugInfo;
    this.isRooted = isRooted || false;
    this.copyVisibilityInfo(visibilityInfo);
};

Directive.prototype = new Node();
Directive.prototype.type = "Directive";
Directive.prototype.accept = function (visitor) {
    var value = this.value, rules = this.rules;
    if (rules) {
        this.rules = visitor.visitArray(rules);
    }
    if (value) {
        this.value = visitor.visit(value);
    }
};
Directive.prototype.isRulesetLike = function() {
    return this.rules || !this.isCharset();
};
Directive.prototype.isCharset = function() {
    return "@charset" === this.name;
};
Directive.prototype.genCSS = function (context, output) {
    var value = this.value, rules = this.rules;
    output.add(this.name, this.currentFileInfo, this.index);
    if (value) {
        output.add(' ');
        value.genCSS(context, output);
    }
    if (rules) {
        this.outputRuleset(context, output, rules);
    } else {
        output.add(';');
    }
};
Directive.prototype.eval = function (context) {
    var mediaPathBackup, mediaBlocksBackup, value = this.value, rules = this.rules;

    //media stored inside other directive should not bubble over it
    //backpup media bubbling information
    mediaPathBackup = context.mediaPath;
    mediaBlocksBackup = context.mediaBlocks;
    //deleted media bubbling information
    context.mediaPath = [];
    context.mediaBlocks = [];

    if (value) {
        value = value.eval(context);
    }
    if (rules) {
        // assuming that there is only one rule at this point - that is how parser constructs the rule
        rules = [rules[0].eval(context)];
        rules[0].root = true;
    }
    //restore media bubbling information
    context.mediaPath = mediaPathBackup;
    context.mediaBlocks = mediaBlocksBackup;

    return new Directive(this.name, value, rules,
        this.index, this.currentFileInfo, this.debugInfo, this.isRooted, this.visibilityInfo());
};
Directive.prototype.variable = function (name) {
    if (this.rules) {
        // assuming that there is only one rule at this point - that is how parser constructs the rule
        return Ruleset.prototype.variable.call(this.rules[0], name);
    }
};
Directive.prototype.find = function () {
    if (this.rules) {
        // assuming that there is only one rule at this point - that is how parser constructs the rule
        return Ruleset.prototype.find.apply(this.rules[0], arguments);
    }
};
Directive.prototype.rulesets = function () {
    if (this.rules) {
        // assuming that there is only one rule at this point - that is how parser constructs the rule
        return Ruleset.prototype.rulesets.apply(this.rules[0]);
    }
};
Directive.prototype.outputRuleset = function (context, output, rules) {
    var ruleCnt = rules.length, i;
    context.tabLevel = (context.tabLevel | 0) + 1;

    // Compressed
    if (context.compress) {
        output.add('{');
        for (i = 0; i < ruleCnt; i++) {
            rules[i].genCSS(context, output);
        }
        output.add('}');
        context.tabLevel--;
        return;
    }

    // Non-compressed
    var tabSetStr = '\n' + Array(context.tabLevel).join("  "), tabRuleStr = tabSetStr + "  ";
    if (!ruleCnt) {
        output.add(" {" + tabSetStr + '}');
    } else {
        output.add(" {" + tabRuleStr);
        rules[0].genCSS(context, output);
        for (i = 1; i < ruleCnt; i++) {
            output.add(tabRuleStr);
            rules[i].genCSS(context, output);
        }
        output.add(tabSetStr + '}');
    }

    context.tabLevel--;
};
module.exports = Directive;

},{"./node":70,"./ruleset":76,"./selector":77}],58:[function(require,module,exports){
var Node = require("./node"),
    Paren = require("./paren"),
    Combinator = require("./combinator");

var Element = function (combinator, value, index, currentFileInfo, info) {
    this.combinator = combinator instanceof Combinator ?
                      combinator : new Combinator(combinator);

    if (typeof value === 'string') {
        this.value = value.trim();
    } else if (value) {
        this.value = value;
    } else {
        this.value = "";
    }
    this.index = index;
    this.currentFileInfo = currentFileInfo;
    this.copyVisibilityInfo(info);
};
Element.prototype = new Node();
Element.prototype.type = "Element";
Element.prototype.accept = function (visitor) {
    var value = this.value;
    this.combinator = visitor.visit(this.combinator);
    if (typeof value === "object") {
        this.value = visitor.visit(value);
    }
};
Element.prototype.eval = function (context) {
    return new Element(this.combinator,
                             this.value.eval ? this.value.eval(context) : this.value,
                             this.index,
                             this.currentFileInfo, this.visibilityInfo());
};
Element.prototype.clone = function () {
    return new Element(this.combinator,
        this.value,
        this.index,
        this.currentFileInfo, this.visibilityInfo());
};
Element.prototype.genCSS = function (context, output) {
    output.add(this.toCSS(context), this.currentFileInfo, this.index);
};
Element.prototype.toCSS = function (context) {
    context = context || {};
    var value = this.value, firstSelector = context.firstSelector;
    if (value instanceof Paren) {
        // selector in parens should not be affected by outer selector
        // flags (breaks only interpolated selectors - see #1973)
        context.firstSelector = true;
    }
    value = value.toCSS ? value.toCSS(context) : value;
    context.firstSelector = firstSelector;
    if (value === '' && this.combinator.value.charAt(0) === '&') {
        return '';
    } else {
        return this.combinator.toCSS(context) + value;
    }
};
module.exports = Element;

},{"./combinator":51,"./node":70,"./paren":72}],59:[function(require,module,exports){
var Node = require("./node"),
    Paren = require("./paren"),
    Comment = require("./comment");

var Expression = function (value) {
    this.value = value;
    if (!value) {
        throw new Error("Expression requires an array parameter");
    }
};
Expression.prototype = new Node();
Expression.prototype.type = "Expression";
Expression.prototype.accept = function (visitor) {
    this.value = visitor.visitArray(this.value);
};
Expression.prototype.eval = function (context) {
    var returnValue,
        inParenthesis = this.parens && !this.parensInOp,
        doubleParen = false;
    if (inParenthesis) {
        context.inParenthesis();
    }
    if (this.value.length > 1) {
        returnValue = new Expression(this.value.map(function (e) {
            return e.eval(context);
        }));
    } else if (this.value.length === 1) {
        if (this.value[0].parens && !this.value[0].parensInOp) {
            doubleParen = true;
        }
        returnValue = this.value[0].eval(context);
    } else {
        returnValue = this;
    }
    if (inParenthesis) {
        context.outOfParenthesis();
    }
    if (this.parens && this.parensInOp && !(context.isMathOn()) && !doubleParen) {
        returnValue = new Paren(returnValue);
    }
    return returnValue;
};
Expression.prototype.genCSS = function (context, output) {
    for (var i = 0; i < this.value.length; i++) {
        this.value[i].genCSS(context, output);
        if (i + 1 < this.value.length) {
            output.add(" ");
        }
    }
};
Expression.prototype.throwAwayComments = function () {
    this.value = this.value.filter(function(v) {
        return !(v instanceof Comment);
    });
};
module.exports = Expression;

},{"./comment":52,"./node":70,"./paren":72}],60:[function(require,module,exports){
var Node = require("./node"),
    Selector = require("./selector");

var Extend = function Extend(selector, option, index, currentFileInfo, visibilityInfo) {
    this.selector = selector;
    this.option = option;
    this.index = index;
    this.object_id = Extend.next_id++;
    this.parent_ids = [this.object_id];
    this.currentFileInfo = currentFileInfo || {};
    this.copyVisibilityInfo(visibilityInfo);

    switch(option) {
        case "all":
            this.allowBefore = true;
            this.allowAfter = true;
            break;
        default:
            this.allowBefore = false;
            this.allowAfter = false;
            break;
    }
};
Extend.next_id = 0;

Extend.prototype = new Node();
Extend.prototype.type = "Extend";
Extend.prototype.accept = function (visitor) {
    this.selector = visitor.visit(this.selector);
};
Extend.prototype.eval = function (context) {
    return new Extend(this.selector.eval(context), this.option, this.index, this.currentFileInfo, this.visibilityInfo());
};
Extend.prototype.clone = function (context) {
    return new Extend(this.selector, this.option, this.index, this.currentFileInfo, this.visibilityInfo());
};
//it concatenates (joins) all selectors in selector array
Extend.prototype.findSelfSelectors = function (selectors) {
    var selfElements = [],
        i,
        selectorElements;

    for (i = 0; i < selectors.length; i++) {
        selectorElements = selectors[i].elements;
        // duplicate the logic in genCSS function inside the selector node.
        // future TODO - move both logics into the selector joiner visitor
        if (i > 0 && selectorElements.length && selectorElements[0].combinator.value === "") {
            selectorElements[0].combinator.value = ' ';
        }
        selfElements = selfElements.concat(selectors[i].elements);
    }

    this.selfSelectors = [new Selector(selfElements)];
    this.selfSelectors[0].copyVisibilityInfo(this.visibilityInfo());
};
module.exports = Extend;

},{"./node":70,"./selector":77}],61:[function(require,module,exports){
var Node = require("./node"),
    Media = require("./media"),
    URL = require("./url"),
    Quoted = require("./quoted"),
    Ruleset = require("./ruleset"),
    Anonymous = require("./anonymous");

//
// CSS @import node
//
// The general strategy here is that we don't want to wait
// for the parsing to be completed, before we start importing
// the file. That's because in the context of a browser,
// most of the time will be spent waiting for the server to respond.
//
// On creation, we push the import path to our import queue, though
// `import,push`, we also pass it a callback, which it'll call once
// the file has been fetched, and parsed.
//
var Import = function (path, features, options, index, currentFileInfo, visibilityInfo) {
    this.options = options;
    this.index = index;
    this.path = path;
    this.features = features;
    this.currentFileInfo = currentFileInfo;

    if (this.options.less !== undefined || this.options.inline) {
        this.css = !this.options.less || this.options.inline;
    } else {
        var pathValue = this.getPath();
        if (pathValue && /[#\.\&\?\/]css([\?;].*)?$/.test(pathValue)) {
            this.css = true;
        }
    }
    this.copyVisibilityInfo(visibilityInfo);
};

//
// The actual import node doesn't return anything, when converted to CSS.
// The reason is that it's used at the evaluation stage, so that the rules
// it imports can be treated like any other rules.
//
// In `eval`, we make sure all Import nodes get evaluated, recursively, so
// we end up with a flat structure, which can easily be imported in the parent
// ruleset.
//
Import.prototype = new Node();
Import.prototype.type = "Import";
Import.prototype.accept = function (visitor) {
    if (this.features) {
        this.features = visitor.visit(this.features);
    }
    this.path = visitor.visit(this.path);
    if (!this.options.plugin && !this.options.inline && this.root) {
        this.root = visitor.visit(this.root);
    }
};
Import.prototype.genCSS = function (context, output) {
    if (this.css && this.path.currentFileInfo.reference === undefined) {
        output.add("@import ", this.currentFileInfo, this.index);
        this.path.genCSS(context, output);
        if (this.features) {
            output.add(" ");
            this.features.genCSS(context, output);
        }
        output.add(';');
    }
};
Import.prototype.getPath = function () {
    return (this.path instanceof URL) ?
        this.path.value.value : this.path.value;
};
Import.prototype.isVariableImport = function () {
    var path = this.path;
    if (path instanceof URL) {
        path = path.value;
    }
    if (path instanceof Quoted) {
        return path.containsVariables();
    }

    return true;
};
Import.prototype.evalForImport = function (context) {
    var path = this.path;

    if (path instanceof URL) {
        path = path.value;
    }

    return new Import(path.eval(context), this.features, this.options, this.index, this.currentFileInfo, this.visibilityInfo());
};
Import.prototype.evalPath = function (context) {
    var path = this.path.eval(context);
    var rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;

    if (!(path instanceof URL)) {
        if (rootpath) {
            var pathValue = path.value;
            // Add the base path if the import is relative
            if (pathValue && context.isPathRelative(pathValue)) {
                path.value = rootpath + pathValue;
            }
        }
        path.value = context.normalizePath(path.value);
    }

    return path;
};
Import.prototype.eval = function (context) {
    var result = this.doEval(context);
    if (this.options.reference || this.blocksVisibility()) {
        if (result.length || result.length === 0) {
            result.forEach(function (node) {
                    node.addVisibilityBlock();
                }
            );
        } else {
            result.addVisibilityBlock();
        }
    }
    return result;
};
Import.prototype.doEval = function (context) {
    var ruleset, registry,
        features = this.features && this.features.eval(context);

    if (this.options.plugin) {
        registry = context.frames[0] && context.frames[0].functionRegistry;
        if ( registry && this.root && this.root.functions ) {
            registry.addMultiple( this.root.functions );
        }
        return [];
    }

    if (this.skip) {
        if (typeof this.skip === "function") {
            this.skip = this.skip();
        }
        if (this.skip) {
            return [];
        }
    }
    if (this.options.inline) {
        var contents = new Anonymous(this.root, 0,
          {
              filename: this.importedFilename,
              reference: this.path.currentFileInfo && this.path.currentFileInfo.reference
          }, true, true);

        return this.features ? new Media([contents], this.features.value) : [contents];
    } else if (this.css) {
        var newImport = new Import(this.evalPath(context), features, this.options, this.index);
        if (!newImport.css && this.error) {
            throw this.error;
        }
        return newImport;
    } else {
        ruleset = new Ruleset(null, this.root.rules.slice(0));
        ruleset.evalImports(context);

        return this.features ? new Media(ruleset.rules, this.features.value) : ruleset.rules;
    }
};
module.exports = Import;

},{"./anonymous":46,"./media":66,"./node":70,"./quoted":73,"./ruleset":76,"./url":80}],62:[function(require,module,exports){
var tree = {};

tree.Node = require('./node');
tree.Alpha = require('./alpha');
tree.Color = require('./color');
tree.Directive = require('./directive');
tree.DetachedRuleset = require('./detached-ruleset');
tree.Operation = require('./operation');
tree.Dimension = require('./dimension');
tree.Unit = require('./unit');
tree.Keyword = require('./keyword');
tree.Variable = require('./variable');
tree.Ruleset = require('./ruleset');
tree.Element = require('./element');
tree.Attribute = require('./attribute');
tree.Combinator = require('./combinator');
tree.Selector = require('./selector');
tree.Quoted = require('./quoted');
tree.Expression = require('./expression');
tree.Rule = require('./rule');
tree.Call = require('./call');
tree.URL = require('./url');
tree.Import = require('./import');
tree.mixin = {
    Call: require('./mixin-call'),
    Definition: require('./mixin-definition')
};
tree.Comment = require('./comment');
tree.Anonymous = require('./anonymous');
tree.Value = require('./value');
tree.JavaScript = require('./javascript');
tree.Assignment = require('./assignment');
tree.Condition = require('./condition');
tree.Paren = require('./paren');
tree.Media = require('./media');
tree.UnicodeDescriptor = require('./unicode-descriptor');
tree.Negative = require('./negative');
tree.Extend = require('./extend');
tree.RulesetCall = require('./ruleset-call');

module.exports = tree;

},{"./alpha":45,"./anonymous":46,"./assignment":47,"./attribute":48,"./call":49,"./color":50,"./combinator":51,"./comment":52,"./condition":53,"./detached-ruleset":55,"./dimension":56,"./directive":57,"./element":58,"./expression":59,"./extend":60,"./import":61,"./javascript":63,"./keyword":65,"./media":66,"./mixin-call":67,"./mixin-definition":68,"./negative":69,"./node":70,"./operation":71,"./paren":72,"./quoted":73,"./rule":74,"./ruleset":76,"./ruleset-call":75,"./selector":77,"./unicode-descriptor":78,"./unit":79,"./url":80,"./value":81,"./variable":82}],63:[function(require,module,exports){
var JsEvalNode = require("./js-eval-node"),
    Dimension = require("./dimension"),
    Quoted = require("./quoted"),
    Anonymous = require("./anonymous");

var JavaScript = function (string, escaped, index, currentFileInfo) {
    this.escaped = escaped;
    this.expression = string;
    this.index = index;
    this.currentFileInfo = currentFileInfo;
};
JavaScript.prototype = new JsEvalNode();
JavaScript.prototype.type = "JavaScript";
JavaScript.prototype.eval = function(context) {
    var result = this.evaluateJavaScript(this.expression, context);

    if (typeof result === 'number') {
        return new Dimension(result);
    } else if (typeof result === 'string') {
        return new Quoted('"' + result + '"', result, this.escaped, this.index);
    } else if (Array.isArray(result)) {
        return new Anonymous(result.join(', '));
    } else {
        return new Anonymous(result);
    }
};

module.exports = JavaScript;

},{"./anonymous":46,"./dimension":56,"./js-eval-node":64,"./quoted":73}],64:[function(require,module,exports){
var Node = require("./node"),
    Variable = require("./variable");

var JsEvalNode = function() {
};
JsEvalNode.prototype = new Node();

JsEvalNode.prototype.evaluateJavaScript = function (expression, context) {
    var result,
        that = this,
        evalContext = {};

    if (context.javascriptEnabled !== undefined && !context.javascriptEnabled) {
        throw { message: "You are using JavaScript, which has been disabled.",
            filename: this.currentFileInfo.filename,
            index: this.index };
    }

    expression = expression.replace(/@\{([\w-]+)\}/g, function (_, name) {
        return that.jsify(new Variable('@' + name, that.index, that.currentFileInfo).eval(context));
    });

    try {
        expression = new Function('return (' + expression + ')');
    } catch (e) {
        throw { message: "JavaScript evaluation error: " + e.message + " from `" + expression + "`" ,
            filename: this.currentFileInfo.filename,
            index: this.index };
    }

    var variables = context.frames[0].variables();
    for (var k in variables) {
        if (variables.hasOwnProperty(k)) {
            /*jshint loopfunc:true */
            evalContext[k.slice(1)] = {
                value: variables[k].value,
                toJS: function () {
                    return this.value.eval(context).toCSS();
                }
            };
        }
    }

    try {
        result = expression.call(evalContext);
    } catch (e) {
        throw { message: "JavaScript evaluation error: '" + e.name + ': ' + e.message.replace(/["]/g, "'") + "'" ,
            filename: this.currentFileInfo.filename,
            index: this.index };
    }
    return result;
};
JsEvalNode.prototype.jsify = function (obj) {
    if (Array.isArray(obj.value) && (obj.value.length > 1)) {
        return '[' + obj.value.map(function (v) { return v.toCSS(); }).join(', ') + ']';
    } else {
        return obj.toCSS();
    }
};

module.exports = JsEvalNode;

},{"./node":70,"./variable":82}],65:[function(require,module,exports){
var Node = require("./node");

var Keyword = function (value) { this.value = value; };
Keyword.prototype = new Node();
Keyword.prototype.type = "Keyword";
Keyword.prototype.genCSS = function (context, output) {
    if (this.value === '%') { throw { type: "Syntax", message: "Invalid % without number" }; }
    output.add(this.value);
};

Keyword.True = new Keyword('true');
Keyword.False = new Keyword('false');

module.exports = Keyword;

},{"./node":70}],66:[function(require,module,exports){
var Ruleset = require("./ruleset"),
    Value = require("./value"),
    Selector = require("./selector"),
    Anonymous = require("./anonymous"),
    Expression = require("./expression"),
    Directive = require("./directive");

var Media = function (value, features, index, currentFileInfo, visibilityInfo) {
    this.index = index;
    this.currentFileInfo = currentFileInfo;

    var selectors = (new Selector([], null, null, this.index, this.currentFileInfo)).createEmptySelectors();

    this.features = new Value(features);
    this.rules = [new Ruleset(selectors, value)];
    this.rules[0].allowImports = true;
    this.copyVisibilityInfo(visibilityInfo);
};
Media.prototype = new Directive();
Media.prototype.type = "Media";
Media.prototype.isRulesetLike = true;
Media.prototype.accept = function (visitor) {
    if (this.features) {
        this.features = visitor.visit(this.features);
    }
    if (this.rules) {
        this.rules = visitor.visitArray(this.rules);
    }
};
Media.prototype.genCSS = function (context, output) {
    output.add('@media ', this.currentFileInfo, this.index);
    this.features.genCSS(context, output);
    this.outputRuleset(context, output, this.rules);
};
Media.prototype.eval = function (context) {
    if (!context.mediaBlocks) {
        context.mediaBlocks = [];
        context.mediaPath = [];
    }

    var media = new Media(null, [], this.index, this.currentFileInfo, this.visibilityInfo());
    if (this.debugInfo) {
        this.rules[0].debugInfo = this.debugInfo;
        media.debugInfo = this.debugInfo;
    }
    var strictMathBypass = false;
    if (!context.strictMath) {
        strictMathBypass = true;
        context.strictMath = true;
    }
    try {
        media.features = this.features.eval(context);
    }
    finally {
        if (strictMathBypass) {
            context.strictMath = false;
        }
    }

    context.mediaPath.push(media);
    context.mediaBlocks.push(media);

    this.rules[0].functionRegistry = context.frames[0].functionRegistry.inherit();
    context.frames.unshift(this.rules[0]);
    media.rules = [this.rules[0].eval(context)];
    context.frames.shift();

    context.mediaPath.pop();

    return context.mediaPath.length === 0 ? media.evalTop(context) :
                media.evalNested(context);
};
Media.prototype.evalTop = function (context) {
    var result = this;

    // Render all dependent Media blocks.
    if (context.mediaBlocks.length > 1) {
        var selectors = (new Selector([], null, null, this.index, this.currentFileInfo)).createEmptySelectors();
        result = new Ruleset(selectors, context.mediaBlocks);
        result.multiMedia = true;
        result.copyVisibilityInfo(this.visibilityInfo());
    }

    delete context.mediaBlocks;
    delete context.mediaPath;

    return result;
};
Media.prototype.evalNested = function (context) {
    var i, value,
        path = context.mediaPath.concat([this]);

    // Extract the media-query conditions separated with `,` (OR).
    for (i = 0; i < path.length; i++) {
        value = path[i].features instanceof Value ?
                    path[i].features.value : path[i].features;
        path[i] = Array.isArray(value) ? value : [value];
    }

    // Trace all permutations to generate the resulting media-query.
    //
    // (a, b and c) with nested (d, e) ->
    //    a and d
    //    a and e
    //    b and c and d
    //    b and c and e
    this.features = new Value(this.permute(path).map(function (path) {
        path = path.map(function (fragment) {
            return fragment.toCSS ? fragment : new Anonymous(fragment);
        });

        for (i = path.length - 1; i > 0; i--) {
            path.splice(i, 0, new Anonymous("and"));
        }

        return new Expression(path);
    }));

    // Fake a tree-node that doesn't output anything.
    return new Ruleset([], []);
};
Media.prototype.permute = function (arr) {
    if (arr.length === 0) {
        return [];
    } else if (arr.length === 1) {
        return arr[0];
    } else {
        var result = [];
        var rest = this.permute(arr.slice(1));
        for (var i = 0; i < rest.length; i++) {
            for (var j = 0; j < arr[0].length; j++) {
                result.push([arr[0][j]].concat(rest[i]));
            }
        }
        return result;
    }
};
Media.prototype.bubbleSelectors = function (selectors) {
    if (!selectors) {
        return;
    }
    this.rules = [new Ruleset(selectors.slice(0), [this.rules[0]])];
};
module.exports = Media;

},{"./anonymous":46,"./directive":57,"./expression":59,"./ruleset":76,"./selector":77,"./value":81}],67:[function(require,module,exports){
var Node = require("./node"),
    Selector = require("./selector"),
    MixinDefinition = require("./mixin-definition"),
    defaultFunc = require("../functions/default");

var MixinCall = function (elements, args, index, currentFileInfo, important) {
    this.selector = new Selector(elements);
    this.arguments = args || [];
    this.index = index;
    this.currentFileInfo = currentFileInfo;
    this.important = important;
};
MixinCall.prototype = new Node();
MixinCall.prototype.type = "MixinCall";
MixinCall.prototype.accept = function (visitor) {
    if (this.selector) {
        this.selector = visitor.visit(this.selector);
    }
    if (this.arguments.length) {
        this.arguments = visitor.visitArray(this.arguments);
    }
};
MixinCall.prototype.eval = function (context) {
    var mixins, mixin, mixinPath, args = [], arg, argValue,
        rules = [], match = false, i, m, f, isRecursive, isOneFound,
        candidates = [], candidate, conditionResult = [], defaultResult, defFalseEitherCase = -1,
        defNone = 0, defTrue = 1, defFalse = 2, count, originalRuleset, noArgumentsFilter;

    function calcDefGroup(mixin, mixinPath) {
        var f, p, namespace;

        for (f = 0; f < 2; f++) {
            conditionResult[f] = true;
            defaultFunc.value(f);
            for (p = 0; p < mixinPath.length && conditionResult[f]; p++) {
                namespace = mixinPath[p];
                if (namespace.matchCondition) {
                    conditionResult[f] = conditionResult[f] && namespace.matchCondition(null, context);
                }
            }
            if (mixin.matchCondition) {
                conditionResult[f] = conditionResult[f] && mixin.matchCondition(args, context);
            }
        }
        if (conditionResult[0] || conditionResult[1]) {
            if (conditionResult[0] != conditionResult[1]) {
                return conditionResult[1] ?
                    defTrue : defFalse;
            }

            return defNone;
        }
        return defFalseEitherCase;
    }

    for (i = 0; i < this.arguments.length; i++) {
        arg = this.arguments[i];
        argValue = arg.value.eval(context);
        if (arg.expand && Array.isArray(argValue.value)) {
            argValue = argValue.value;
            for (m = 0; m < argValue.length; m++) {
                args.push({value: argValue[m]});
            }
        } else {
            args.push({name: arg.name, value: argValue});
        }
    }

    noArgumentsFilter = function(rule) {return rule.matchArgs(null, context);};

    for (i = 0; i < context.frames.length; i++) {
        if ((mixins = context.frames[i].find(this.selector, null, noArgumentsFilter)).length > 0) {
            isOneFound = true;

            // To make `default()` function independent of definition order we have two "subpasses" here.
            // At first we evaluate each guard *twice* (with `default() == true` and `default() == false`),
            // and build candidate list with corresponding flags. Then, when we know all possible matches,
            // we make a final decision.

            for (m = 0; m < mixins.length; m++) {
                mixin = mixins[m].rule;
                mixinPath = mixins[m].path;
                isRecursive = false;
                for (f = 0; f < context.frames.length; f++) {
                    if ((!(mixin instanceof MixinDefinition)) && mixin === (context.frames[f].originalRuleset || context.frames[f])) {
                        isRecursive = true;
                        break;
                    }
                }
                if (isRecursive) {
                    continue;
                }

                if (mixin.matchArgs(args, context)) {
                    candidate = {mixin: mixin, group: calcDefGroup(mixin, mixinPath)};

                    if (candidate.group !== defFalseEitherCase) {
                        candidates.push(candidate);
                    }

                    match = true;
                }
            }

            defaultFunc.reset();

            count = [0, 0, 0];
            for (m = 0; m < candidates.length; m++) {
                count[candidates[m].group]++;
            }

            if (count[defNone] > 0) {
                defaultResult = defFalse;
            } else {
                defaultResult = defTrue;
                if ((count[defTrue] + count[defFalse]) > 1) {
                    throw { type: 'Runtime',
                        message: 'Ambiguous use of `default()` found when matching for `' + this.format(args) + '`',
                        index: this.index, filename: this.currentFileInfo.filename };
                }
            }

            for (m = 0; m < candidates.length; m++) {
                candidate = candidates[m].group;
                if ((candidate === defNone) || (candidate === defaultResult)) {
                    try {
                        mixin = candidates[m].mixin;
                        if (!(mixin instanceof MixinDefinition)) {
                            originalRuleset = mixin.originalRuleset || mixin;
                            mixin = new MixinDefinition("", [], mixin.rules, null, false, null, originalRuleset.visibilityInfo());
                            mixin.originalRuleset = originalRuleset;
                        }
                        var newRules = mixin.evalCall(context, args, this.important).rules;
                        this._setVisibilityToReplacement(newRules);
                        Array.prototype.push.apply(rules, newRules);
                    } catch (e) {
                        throw { message: e.message, index: this.index, filename: this.currentFileInfo.filename, stack: e.stack };
                    }
                }
            }

            if (match) {
                return rules;
            }
        }
    }
    if (isOneFound) {
        throw { type:    'Runtime',
            message: 'No matching definition was found for `' + this.format(args) + '`',
            index:   this.index, filename: this.currentFileInfo.filename };
    } else {
        throw { type:    'Name',
            message: this.selector.toCSS().trim() + " is undefined",
            index:   this.index, filename: this.currentFileInfo.filename };
    }
};

MixinCall.prototype._setVisibilityToReplacement = function (replacement) {
    var i, rule;
    if (this.blocksVisibility()) {
        for (i = 0; i < replacement.length; i++) {
            rule = replacement[i];
            rule.addVisibilityBlock();
        }
    }
};
MixinCall.prototype.format = function (args) {
    return this.selector.toCSS().trim() + '(' +
        (args ? args.map(function (a) {
            var argValue = "";
            if (a.name) {
                argValue += a.name + ":";
            }
            if (a.value.toCSS) {
                argValue += a.value.toCSS();
            } else {
                argValue += "???";
            }
            return argValue;
        }).join(', ') : "") + ")";
};
module.exports = MixinCall;

},{"../functions/default":20,"./mixin-definition":68,"./node":70,"./selector":77}],68:[function(require,module,exports){
var Selector = require("./selector"),
    Element = require("./element"),
    Ruleset = require("./ruleset"),
    Rule = require("./rule"),
    Expression = require("./expression"),
    contexts = require("../contexts");

var Definition = function (name, params, rules, condition, variadic, frames, visibilityInfo) {
    this.name = name;
    this.selectors = [new Selector([new Element(null, name, this.index, this.currentFileInfo)])];
    this.params = params;
    this.condition = condition;
    this.variadic = variadic;
    this.arity = params.length;
    this.rules = rules;
    this._lookups = {};
    var optionalParameters = [];
    this.required = params.reduce(function (count, p) {
        if (!p.name || (p.name && !p.value)) {
            return count + 1;
        }
        else {
            optionalParameters.push(p.name);
            return count;
        }
    }, 0);
    this.optionalParameters = optionalParameters;
    this.frames = frames;
    this.copyVisibilityInfo(visibilityInfo);
};
Definition.prototype = new Ruleset();
Definition.prototype.type = "MixinDefinition";
Definition.prototype.evalFirst = true;
Definition.prototype.accept = function (visitor) {
    if (this.params && this.params.length) {
        this.params = visitor.visitArray(this.params);
    }
    this.rules = visitor.visitArray(this.rules);
    if (this.condition) {
        this.condition = visitor.visit(this.condition);
    }
};
Definition.prototype.evalParams = function (context, mixinEnv, args, evaldArguments) {
    /*jshint boss:true */
    var frame = new Ruleset(null, null),
        varargs, arg,
        params = this.params.slice(0),
        i, j, val, name, isNamedFound, argIndex, argsLength = 0;

    if (mixinEnv.frames && mixinEnv.frames[0] && mixinEnv.frames[0].functionRegistry) {
        frame.functionRegistry = mixinEnv.frames[0].functionRegistry.inherit();
    }
    mixinEnv = new contexts.Eval(mixinEnv, [frame].concat(mixinEnv.frames));

    if (args) {
        args = args.slice(0);
        argsLength = args.length;

        for (i = 0; i < argsLength; i++) {
            arg = args[i];
            if (name = (arg && arg.name)) {
                isNamedFound = false;
                for (j = 0; j < params.length; j++) {
                    if (!evaldArguments[j] && name === params[j].name) {
                        evaldArguments[j] = arg.value.eval(context);
                        frame.prependRule(new Rule(name, arg.value.eval(context)));
                        isNamedFound = true;
                        break;
                    }
                }
                if (isNamedFound) {
                    args.splice(i, 1);
                    i--;
                    continue;
                } else {
                    throw { type: 'Runtime', message: "Named argument for " + this.name +
                        ' ' + args[i].name + ' not found' };
                }
            }
        }
    }
    argIndex = 0;
    for (i = 0; i < params.length; i++) {
        if (evaldArguments[i]) { continue; }

        arg = args && args[argIndex];

        if (name = params[i].name) {
            if (params[i].variadic) {
                varargs = [];
                for (j = argIndex; j < argsLength; j++) {
                    varargs.push(args[j].value.eval(context));
                }
                frame.prependRule(new Rule(name, new Expression(varargs).eval(context)));
            } else {
                val = arg && arg.value;
                if (val) {
                    val = val.eval(context);
                } else if (params[i].value) {
                    val = params[i].value.eval(mixinEnv);
                    frame.resetCache();
                } else {
                    throw { type: 'Runtime', message: "wrong number of arguments for " + this.name +
                        ' (' + argsLength + ' for ' + this.arity + ')' };
                }

                frame.prependRule(new Rule(name, val));
                evaldArguments[i] = val;
            }
        }

        if (params[i].variadic && args) {
            for (j = argIndex; j < argsLength; j++) {
                evaldArguments[j] = args[j].value.eval(context);
            }
        }
        argIndex++;
    }

    return frame;
};
Definition.prototype.makeImportant = function() {
    var rules = !this.rules ? this.rules : this.rules.map(function (r) {
        if (r.makeImportant) {
            return r.makeImportant(true);
        } else {
            return r;
        }
    });
    var result = new Definition(this.name, this.params, rules, this.condition, this.variadic, this.frames);
    return result;
};
Definition.prototype.eval = function (context) {
    return new Definition(this.name, this.params, this.rules, this.condition, this.variadic, this.frames || context.frames.slice(0));
};
Definition.prototype.evalCall = function (context, args, important) {
    var _arguments = [],
        mixinFrames = this.frames ? this.frames.concat(context.frames) : context.frames,
        frame = this.evalParams(context, new contexts.Eval(context, mixinFrames), args, _arguments),
        rules, ruleset;

    frame.prependRule(new Rule('@arguments', new Expression(_arguments).eval(context)));

    rules = this.rules.slice(0);

    ruleset = new Ruleset(null, rules);
    ruleset.originalRuleset = this;
    ruleset = ruleset.eval(new contexts.Eval(context, [this, frame].concat(mixinFrames)));
    if (important) {
        ruleset = ruleset.makeImportant();
    }
    return ruleset;
};
Definition.prototype.matchCondition = function (args, context) {
    if (this.condition && !this.condition.eval(
        new contexts.Eval(context,
            [this.evalParams(context, /* the parameter variables*/
                new contexts.Eval(context, this.frames ? this.frames.concat(context.frames) : context.frames), args, [])]
            .concat(this.frames || []) // the parent namespace/mixin frames
            .concat(context.frames)))) { // the current environment frames
        return false;
    }
    return true;
};
Definition.prototype.matchArgs = function (args, context) {
    var allArgsCnt = (args && args.length) || 0, len, optionalParameters = this.optionalParameters;
    var requiredArgsCnt = !args ? 0 : args.reduce(function (count, p) {
        if (optionalParameters.indexOf(p.name) < 0) {
            return count + 1;
        } else {
            return count;
        }
    }, 0);

    if (! this.variadic) {
        if (requiredArgsCnt < this.required) {
            return false;
        }
        if (allArgsCnt > this.params.length) {
            return false;
        }
    } else {
        if (requiredArgsCnt < (this.required - 1)) {
            return false;
        }
    }

    // check patterns
    len = Math.min(requiredArgsCnt, this.arity);

    for (var i = 0; i < len; i++) {
        if (!this.params[i].name && !this.params[i].variadic) {
            if (args[i].value.eval(context).toCSS() != this.params[i].value.eval(context).toCSS()) {
                return false;
            }
        }
    }
    return true;
};
module.exports = Definition;

},{"../contexts":11,"./element":58,"./expression":59,"./rule":74,"./ruleset":76,"./selector":77}],69:[function(require,module,exports){
var Node = require("./node"),
    Operation = require("./operation"),
    Dimension = require("./dimension");

var Negative = function (node) {
    this.value = node;
};
Negative.prototype = new Node();
Negative.prototype.type = "Negative";
Negative.prototype.genCSS = function (context, output) {
    output.add('-');
    this.value.genCSS(context, output);
};
Negative.prototype.eval = function (context) {
    if (context.isMathOn()) {
        return (new Operation('*', [new Dimension(-1), this.value])).eval(context);
    }
    return new Negative(this.value.eval(context));
};
module.exports = Negative;

},{"./dimension":56,"./node":70,"./operation":71}],70:[function(require,module,exports){
var Node = function() {
};
Node.prototype.toCSS = function (context) {
    var strs = [];
    this.genCSS(context, {
        add: function(chunk, fileInfo, index) {
            strs.push(chunk);
        },
        isEmpty: function () {
            return strs.length === 0;
        }
    });
    return strs.join('');
};
Node.prototype.genCSS = function (context, output) {
    output.add(this.value);
};
Node.prototype.accept = function (visitor) {
    this.value = visitor.visit(this.value);
};
Node.prototype.eval = function () { return this; };
Node.prototype._operate = function (context, op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
    }
};
Node.prototype.fround = function(context, value) {
    var precision = context && context.numPrecision;
    //add "epsilon" to ensure numbers like 1.000000005 (represented as 1.000000004999....) are properly rounded...
    return (precision == null) ? value : Number((value + 2e-16).toFixed(precision));
};
Node.compare = function (a, b) {
    /* returns:
     -1: a < b
     0: a = b
     1: a > b
     and *any* other value for a != b (e.g. undefined, NaN, -2 etc.) */

    if ((a.compare) &&
        // for "symmetric results" force toCSS-based comparison
        // of Quoted or Anonymous if either value is one of those
        !(b.type === "Quoted" || b.type === "Anonymous")) {
        return a.compare(b);
    } else if (b.compare) {
        return -b.compare(a);
    } else if (a.type !== b.type) {
        return undefined;
    }

    a = a.value;
    b = b.value;
    if (!Array.isArray(a)) {
        return a === b ? 0 : undefined;
    }
    if (a.length !== b.length) {
        return undefined;
    }
    for (var i = 0; i < a.length; i++) {
        if (Node.compare(a[i], b[i]) !== 0) {
            return undefined;
        }
    }
    return 0;
};

Node.numericCompare = function (a, b) {
    return a  <  b ? -1
        : a === b ?  0
        : a  >  b ?  1 : undefined;
};
// Returns true if this node represents root of ast imported by reference
Node.prototype.blocksVisibility = function () {
    if (this.visibilityBlocks == null) {
        this.visibilityBlocks = 0;
    }
    return this.visibilityBlocks !== 0;
};
Node.prototype.addVisibilityBlock = function () {
    if (this.visibilityBlocks == null) {
        this.visibilityBlocks = 0;
    }
    this.visibilityBlocks = this.visibilityBlocks + 1;
};
Node.prototype.removeVisibilityBlock = function () {
    if (this.visibilityBlocks == null) {
        this.visibilityBlocks = 0;
    }
    this.visibilityBlocks = this.visibilityBlocks - 1;
};
//Turns on node visibility - if called node will be shown in output regardless
//of whether it comes from import by reference or not
Node.prototype.ensureVisibility = function () {
    this.nodeVisible = true;
};
//Turns off node visibility - if called node will NOT be shown in output regardless
//of whether it comes from import by reference or not
Node.prototype.ensureInvisibility = function () {
    this.nodeVisible = false;
};
// return values:
// false - the node must not be visible
// true - the node must be visible
// undefined or null - the node has the same visibility as its parent
Node.prototype.isVisible = function () {
    return this.nodeVisible;
};
Node.prototype.visibilityInfo = function() {
    return {
        visibilityBlocks: this.visibilityBlocks,
        nodeVisible: this.nodeVisible
    };
};
Node.prototype.copyVisibilityInfo = function(info) {
    if (!info) {
        return;
    }
    this.visibilityBlocks = info.visibilityBlocks;
    this.nodeVisible = info.nodeVisible;
};
module.exports = Node;

},{}],71:[function(require,module,exports){
var Node = require("./node"),
    Color = require("./color"),
    Dimension = require("./dimension");

var Operation = function (op, operands, isSpaced) {
    this.op = op.trim();
    this.operands = operands;
    this.isSpaced = isSpaced;
};
Operation.prototype = new Node();
Operation.prototype.type = "Operation";
Operation.prototype.accept = function (visitor) {
    this.operands = visitor.visit(this.operands);
};
Operation.prototype.eval = function (context) {
    var a = this.operands[0].eval(context),
        b = this.operands[1].eval(context);

    if (context.isMathOn()) {
        if (a instanceof Dimension && b instanceof Color) {
            a = a.toColor();
        }
        if (b instanceof Dimension && a instanceof Color) {
            b = b.toColor();
        }
        if (!a.operate) {
            throw { type: "Operation",
                    message: "Operation on an invalid type" };
        }

        return a.operate(context, this.op, b);
    } else {
        return new Operation(this.op, [a, b], this.isSpaced);
    }
};
Operation.prototype.genCSS = function (context, output) {
    this.operands[0].genCSS(context, output);
    if (this.isSpaced) {
        output.add(" ");
    }
    output.add(this.op);
    if (this.isSpaced) {
        output.add(" ");
    }
    this.operands[1].genCSS(context, output);
};

module.exports = Operation;

},{"./color":50,"./dimension":56,"./node":70}],72:[function(require,module,exports){
var Node = require("./node");

var Paren = function (node) {
    this.value = node;
};
Paren.prototype = new Node();
Paren.prototype.type = "Paren";
Paren.prototype.genCSS = function (context, output) {
    output.add('(');
    this.value.genCSS(context, output);
    output.add(')');
};
Paren.prototype.eval = function (context) {
    return new Paren(this.value.eval(context));
};
module.exports = Paren;

},{"./node":70}],73:[function(require,module,exports){
var Node = require("./node"),
    JsEvalNode = require("./js-eval-node"),
    Variable = require("./variable");

var Quoted = function (str, content, escaped, index, currentFileInfo) {
    this.escaped = (escaped == null) ? true : escaped;
    this.value = content || '';
    this.quote = str.charAt(0);
    this.index = index;
    this.currentFileInfo = currentFileInfo;
};
Quoted.prototype = new JsEvalNode();
Quoted.prototype.type = "Quoted";
Quoted.prototype.genCSS = function (context, output) {
    if (!this.escaped) {
        output.add(this.quote, this.currentFileInfo, this.index);
    }
    output.add(this.value);
    if (!this.escaped) {
        output.add(this.quote);
    }
};
Quoted.prototype.containsVariables = function() {
    return this.value.match(/(`([^`]+)`)|@\{([\w-]+)\}/);
};
Quoted.prototype.eval = function (context) {
    var that = this, value = this.value;
    var javascriptReplacement = function (_, exp) {
        return String(that.evaluateJavaScript(exp, context));
    };
    var interpolationReplacement = function (_, name) {
        var v = new Variable('@' + name, that.index, that.currentFileInfo).eval(context, true);
        return (v instanceof Quoted) ? v.value : v.toCSS();
    };
    function iterativeReplace(value, regexp, replacementFnc) {
        var evaluatedValue = value;
        do {
            value = evaluatedValue;
            evaluatedValue = value.replace(regexp, replacementFnc);
        } while (value !== evaluatedValue);
        return evaluatedValue;
    }
    value = iterativeReplace(value, /`([^`]+)`/g, javascriptReplacement);
    value = iterativeReplace(value, /@\{([\w-]+)\}/g, interpolationReplacement);
    return new Quoted(this.quote + value + this.quote, value, this.escaped, this.index, this.currentFileInfo);
};
Quoted.prototype.compare = function (other) {
    // when comparing quoted strings allow the quote to differ
    if (other.type === "Quoted" && !this.escaped && !other.escaped) {
        return Node.numericCompare(this.value, other.value);
    } else {
        return other.toCSS && this.toCSS() === other.toCSS() ? 0 : undefined;
    }
};
module.exports = Quoted;

},{"./js-eval-node":64,"./node":70,"./variable":82}],74:[function(require,module,exports){
var Node = require("./node"),
    Value = require("./value"),
    Keyword = require("./keyword");

var Rule = function (name, value, important, merge, index, currentFileInfo, inline, variable) {
    this.name = name;
    this.value = (value instanceof Node) ? value : new Value([value]); //value instanceof tree.Value || value instanceof tree.Ruleset ??
    this.important = important ? ' ' + important.trim() : '';
    this.merge = merge;
    this.index = index;
    this.currentFileInfo = currentFileInfo;
    this.inline = inline || false;
    this.variable = (variable !== undefined) ? variable
        : (name.charAt && (name.charAt(0) === '@'));
};

function evalName(context, name) {
    var value = "", i, n = name.length,
        output = {add: function (s) {value += s;}};
    for (i = 0; i < n; i++) {
        name[i].eval(context).genCSS(context, output);
    }
    return value;
}

Rule.prototype = new Node();
Rule.prototype.type = "Rule";
Rule.prototype.genCSS = function (context, output) {
    output.add(this.name + (context.compress ? ':' : ': '), this.currentFileInfo, this.index);
    try {
        this.value.genCSS(context, output);
    }
    catch(e) {
        e.index = this.index;
        e.filename = this.currentFileInfo.filename;
        throw e;
    }
    output.add(this.important + ((this.inline || (context.lastRule && context.compress)) ? "" : ";"), this.currentFileInfo, this.index);
};
Rule.prototype.eval = function (context) {
    var strictMathBypass = false, name = this.name, evaldValue, variable = this.variable;
    if (typeof name !== "string") {
        // expand 'primitive' name directly to get
        // things faster (~10% for benchmark.less):
        name = (name.length === 1) && (name[0] instanceof Keyword) ?
                name[0].value : evalName(context, name);
        variable = false; // never treat expanded interpolation as new variable name
    }
    if (name === "font" && !context.strictMath) {
        strictMathBypass = true;
        context.strictMath = true;
    }
    try {
        context.importantScope.push({});
        evaldValue = this.value.eval(context);

        if (!this.variable && evaldValue.type === "DetachedRuleset") {
            throw { message: "Rulesets cannot be evaluated on a property.",
                    index: this.index, filename: this.currentFileInfo.filename };
        }
        var important = this.important,
            importantResult = context.importantScope.pop();
        if (!important && importantResult.important) {
            important = importantResult.important;
        }

        return new Rule(name,
                          evaldValue,
                          important,
                          this.merge,
                          this.index, this.currentFileInfo, this.inline,
                              variable);
    }
    catch(e) {
        if (typeof e.index !== 'number') {
            e.index = this.index;
            e.filename = this.currentFileInfo.filename;
        }
        throw e;
    }
    finally {
        if (strictMathBypass) {
            context.strictMath = false;
        }
    }
};
Rule.prototype.makeImportant = function () {
    return new Rule(this.name,
                          this.value,
                          "!important",
                          this.merge,
                          this.index, this.currentFileInfo, this.inline);
};

module.exports = Rule;
},{"./keyword":65,"./node":70,"./value":81}],75:[function(require,module,exports){
var Node = require("./node"),
    Variable = require("./variable");

var RulesetCall = function (variable) {
    this.variable = variable;
};
RulesetCall.prototype = new Node();
RulesetCall.prototype.type = "RulesetCall";
RulesetCall.prototype.eval = function (context) {
    var detachedRuleset = new Variable(this.variable).eval(context);
    return detachedRuleset.callEval(context);
};
module.exports = RulesetCall;

},{"./node":70,"./variable":82}],76:[function(require,module,exports){
var Node = require("./node"),
    Rule = require("./rule"),
    Selector = require("./selector"),
    Element = require("./element"),
    Paren = require("./paren"),
    contexts = require("../contexts"),
    globalFunctionRegistry = require("../functions/function-registry"),
    defaultFunc = require("../functions/default"),
    getDebugInfo = require("./debug-info");

var Ruleset = function (selectors, rules, strictImports, visibilityInfo) {
    this.selectors = selectors;
    this.rules = rules;
    this._lookups = {};
    this.strictImports = strictImports;
    this.copyVisibilityInfo(visibilityInfo);
};
Ruleset.prototype = new Node();
Ruleset.prototype.type = "Ruleset";
Ruleset.prototype.isRuleset = true;
Ruleset.prototype.isRulesetLike = true;
Ruleset.prototype.accept = function (visitor) {
    if (this.paths) {
        this.paths = visitor.visitArray(this.paths, true);
    } else if (this.selectors) {
        this.selectors = visitor.visitArray(this.selectors);
    }
    if (this.rules && this.rules.length) {
        this.rules = visitor.visitArray(this.rules);
    }
};
Ruleset.prototype.eval = function (context) {
    var thisSelectors = this.selectors, selectors,
        selCnt, selector, i, hasOnePassingSelector = false;

    if (thisSelectors && (selCnt = thisSelectors.length)) {
        selectors = [];
        defaultFunc.error({
            type: "Syntax",
            message: "it is currently only allowed in parametric mixin guards,"
        });
        for (i = 0; i < selCnt; i++) {
            selector = thisSelectors[i].eval(context);
            selectors.push(selector);
            if (selector.evaldCondition) {
                hasOnePassingSelector = true;
            }
        }
        defaultFunc.reset();
    } else {
        hasOnePassingSelector = true;
    }

    var rules = this.rules ? this.rules.slice(0) : null,
        ruleset = new Ruleset(selectors, rules, this.strictImports, this.visibilityInfo()),
        rule, subRule;

    ruleset.originalRuleset = this;
    ruleset.root = this.root;
    ruleset.firstRoot = this.firstRoot;
    ruleset.allowImports = this.allowImports;

    if (this.debugInfo) {
        ruleset.debugInfo = this.debugInfo;
    }

    if (!hasOnePassingSelector) {
        rules.length = 0;
    }

    // inherit a function registry from the frames stack when possible;
    // otherwise from the global registry
    ruleset.functionRegistry = (function (frames) {
        var i = 0,
            n = frames.length,
            found;
        for ( ; i !== n ; ++i ) {
            found = frames[ i ].functionRegistry;
            if ( found ) { return found; }
        }
        return globalFunctionRegistry;
    }(context.frames)).inherit();

    // push the current ruleset to the frames stack
    var ctxFrames = context.frames;
    ctxFrames.unshift(ruleset);

    // currrent selectors
    var ctxSelectors = context.selectors;
    if (!ctxSelectors) {
        context.selectors = ctxSelectors = [];
    }
    ctxSelectors.unshift(this.selectors);

    // Evaluate imports
    if (ruleset.root || ruleset.allowImports || !ruleset.strictImports) {
        ruleset.evalImports(context);
    }

    // Store the frames around mixin definitions,
    // so they can be evaluated like closures when the time comes.
    var rsRules = ruleset.rules, rsRuleCnt = rsRules ? rsRules.length : 0;
    for (i = 0; i < rsRuleCnt; i++) {
        if (rsRules[i].evalFirst) {
            rsRules[i] = rsRules[i].eval(context);
        }
    }

    var mediaBlockCount = (context.mediaBlocks && context.mediaBlocks.length) || 0;

    // Evaluate mixin calls.
    for (i = 0; i < rsRuleCnt; i++) {
        if (rsRules[i].type === "MixinCall") {
            /*jshint loopfunc:true */
            rules = rsRules[i].eval(context).filter(function(r) {
                if ((r instanceof Rule) && r.variable) {
                    // do not pollute the scope if the variable is
                    // already there. consider returning false here
                    // but we need a way to "return" variable from mixins
                    return !(ruleset.variable(r.name));
                }
                return true;
            });
            rsRules.splice.apply(rsRules, [i, 1].concat(rules));
            rsRuleCnt += rules.length - 1;
            i += rules.length - 1;
            ruleset.resetCache();
        } else if (rsRules[i].type === "RulesetCall") {
            /*jshint loopfunc:true */
            rules = rsRules[i].eval(context).rules.filter(function(r) {
                if ((r instanceof Rule) && r.variable) {
                    // do not pollute the scope at all
                    return false;
                }
                return true;
            });
            rsRules.splice.apply(rsRules, [i, 1].concat(rules));
            rsRuleCnt += rules.length - 1;
            i += rules.length - 1;
            ruleset.resetCache();
        }
    }

    // Evaluate everything else
    for (i = 0; i < rsRules.length; i++) {
        rule = rsRules[i];
        if (!rule.evalFirst) {
            rsRules[i] = rule = rule.eval ? rule.eval(context) : rule;
        }
    }

    // Evaluate everything else
    for (i = 0; i < rsRules.length; i++) {
        rule = rsRules[i];
        // for rulesets, check if it is a css guard and can be removed
        if (rule instanceof Ruleset && rule.selectors && rule.selectors.length === 1) {
            // check if it can be folded in (e.g. & where)
            if (rule.selectors[0].isJustParentSelector()) {
                rsRules.splice(i--, 1);

                for (var j = 0; j < rule.rules.length; j++) {
                    subRule = rule.rules[j];
                    subRule.copyVisibilityInfo(rule.visibilityInfo());
                    if (!(subRule instanceof Rule) || !subRule.variable) {
                        rsRules.splice(++i, 0, subRule);
                    }
                }
            }
        }
    }

    // Pop the stack
    ctxFrames.shift();
    ctxSelectors.shift();

    if (context.mediaBlocks) {
        for (i = mediaBlockCount; i < context.mediaBlocks.length; i++) {
            context.mediaBlocks[i].bubbleSelectors(selectors);
        }
    }

    return ruleset;
};
Ruleset.prototype.evalImports = function(context) {
    var rules = this.rules, i, importRules;
    if (!rules) { return; }

    for (i = 0; i < rules.length; i++) {
        if (rules[i].type === "Import") {
            importRules = rules[i].eval(context);
            if (importRules && (importRules.length || importRules.length === 0)) {
                rules.splice.apply(rules, [i, 1].concat(importRules));
                i+= importRules.length - 1;
            } else {
                rules.splice(i, 1, importRules);
            }
            this.resetCache();
        }
    }
};
Ruleset.prototype.makeImportant = function() {
    var result = new Ruleset(this.selectors, this.rules.map(function (r) {
        if (r.makeImportant) {
            return r.makeImportant();
        } else {
            return r;
        }
    }), this.strictImports, this.visibilityInfo());

    return result;
};
Ruleset.prototype.matchArgs = function (args) {
    return !args || args.length === 0;
};
// lets you call a css selector with a guard
Ruleset.prototype.matchCondition = function (args, context) {
    var lastSelector = this.selectors[this.selectors.length - 1];
    if (!lastSelector.evaldCondition) {
        return false;
    }
    if (lastSelector.condition &&
        !lastSelector.condition.eval(
            new contexts.Eval(context,
                context.frames))) {
        return false;
    }
    return true;
};
Ruleset.prototype.resetCache = function () {
    this._rulesets = null;
    this._variables = null;
    this._lookups = {};
};
Ruleset.prototype.variables = function () {
    if (!this._variables) {
        this._variables = !this.rules ? {} : this.rules.reduce(function (hash, r) {
            if (r instanceof Rule && r.variable === true) {
                hash[r.name] = r;
            }
            // when evaluating variables in an import statement, imports have not been eval'd
            // so we need to go inside import statements.
            // guard against root being a string (in the case of inlined less)
            if (r.type === "Import" && r.root && r.root.variables) {
                var vars = r.root.variables();
                for (var name in vars) {
                    if (vars.hasOwnProperty(name)) {
                        hash[name] = vars[name];
                    }
                }
            }
            return hash;
        }, {});
    }
    return this._variables;
};
Ruleset.prototype.variable = function (name) {
    return this.variables()[name];
};
Ruleset.prototype.rulesets = function () {
    if (!this.rules) { return []; }

    var filtRules = [], rules = this.rules, cnt = rules.length,
        i, rule;

    for (i = 0; i < cnt; i++) {
        rule = rules[i];
        if (rule.isRuleset) {
            filtRules.push(rule);
        }
    }

    return filtRules;
};
Ruleset.prototype.prependRule = function (rule) {
    var rules = this.rules;
    if (rules) {
        rules.unshift(rule);
    } else {
        this.rules = [ rule ];
    }
};
Ruleset.prototype.find = function (selector, self, filter) {
    self = self || this;
    var rules = [], match, foundMixins,
        key = selector.toCSS();

    if (key in this._lookups) { return this._lookups[key]; }

    this.rulesets().forEach(function (rule) {
        if (rule !== self) {
            for (var j = 0; j < rule.selectors.length; j++) {
                match = selector.match(rule.selectors[j]);
                if (match) {
                    if (selector.elements.length > match) {
                        if (!filter || filter(rule)) {
                            foundMixins = rule.find(new Selector(selector.elements.slice(match)), self, filter);
                            for (var i = 0; i < foundMixins.length; ++i) {
                                foundMixins[i].path.push(rule);
                            }
                            Array.prototype.push.apply(rules, foundMixins);
                        }
                    } else {
                        rules.push({ rule: rule, path: []});
                    }
                    break;
                }
            }
        }
    });
    this._lookups[key] = rules;
    return rules;
};
Ruleset.prototype.genCSS = function (context, output) {
    var i, j,
        charsetRuleNodes = [],
        ruleNodes = [],
        debugInfo,     // Line number debugging
        rule,
        path;

    context.tabLevel = (context.tabLevel || 0);

    if (!this.root) {
        context.tabLevel++;
    }

    var tabRuleStr = context.compress ? '' : Array(context.tabLevel + 1).join("  "),
        tabSetStr = context.compress ? '' : Array(context.tabLevel).join("  "),
        sep;

    function isRulesetLikeNode(rule) {
        // if it has nested rules, then it should be treated like a ruleset
        // medias and comments do not have nested rules, but should be treated like rulesets anyway
        // some directives and anonymous nodes are ruleset like, others are not
        if (typeof rule.isRulesetLike === "boolean") {
            return rule.isRulesetLike;
        } else if (typeof rule.isRulesetLike === "function") {
            return rule.isRulesetLike();
        }

        //anything else is assumed to be a rule
        return false;
    }

    var charsetNodeIndex = 0;
    var importNodeIndex = 0;
    for (i = 0; i < this.rules.length; i++) {
        rule = this.rules[i];
        if (rule.type === "Comment") {
            if (importNodeIndex === i) {
                importNodeIndex++;
            }
            ruleNodes.push(rule);
        } else if (rule.isCharset && rule.isCharset()) {
            ruleNodes.splice(charsetNodeIndex, 0, rule);
            charsetNodeIndex++;
            importNodeIndex++;
        } else if (rule.type === "Import") {
            ruleNodes.splice(importNodeIndex, 0, rule);
            importNodeIndex++;
        } else {
            ruleNodes.push(rule);
        }
    }
    ruleNodes = charsetRuleNodes.concat(ruleNodes);

    // If this is the root node, we don't render
    // a selector, or {}.
    if (!this.root) {
        debugInfo = getDebugInfo(context, this, tabSetStr);

        if (debugInfo) {
            output.add(debugInfo);
            output.add(tabSetStr);
        }

        var paths = this.paths, pathCnt = paths.length,
            pathSubCnt;

        sep = context.compress ? ',' : (',\n' + tabSetStr);

        for (i = 0; i < pathCnt; i++) {
            path = paths[i];
            if (!(pathSubCnt = path.length)) { continue; }
            if (i > 0) { output.add(sep); }

            context.firstSelector = true;
            path[0].genCSS(context, output);

            context.firstSelector = false;
            for (j = 1; j < pathSubCnt; j++) {
                path[j].genCSS(context, output);
            }
        }

        output.add((context.compress ? '{' : ' {\n') + tabRuleStr);
    }

    // Compile rules and rulesets
    for (i = 0; i < ruleNodes.length; i++) {
        rule = ruleNodes[i];

        if (i + 1 === ruleNodes.length) {
            context.lastRule = true;
        }

        var currentLastRule = context.lastRule;
        if (isRulesetLikeNode(rule)) {
            context.lastRule = false;
        }

        if (rule.genCSS) {
            rule.genCSS(context, output);
        } else if (rule.value) {
            output.add(rule.value.toString());
        }

        context.lastRule = currentLastRule;

        if (!context.lastRule) {
            output.add(context.compress ? '' : ('\n' + tabRuleStr));
        } else {
            context.lastRule = false;
        }
    }

    if (!this.root) {
        output.add((context.compress ? '}' : '\n' + tabSetStr + '}'));
        context.tabLevel--;
    }

    if (!output.isEmpty() && !context.compress && this.firstRoot) {
        output.add('\n');
    }
};

Ruleset.prototype.joinSelectors = function (paths, context, selectors) {
    for (var s = 0; s < selectors.length; s++) {
        this.joinSelector(paths, context, selectors[s]);
    }
};

Ruleset.prototype.joinSelector = function (paths, context, selector) {

    function createParenthesis(elementsToPak, originalElement) {
        var replacementParen, j;
        if (elementsToPak.length === 0) {
            replacementParen = new Paren(elementsToPak[0]);
        } else {
            var insideParent = [];
            for (j = 0; j < elementsToPak.length; j++) {
                insideParent.push(new Element(null, elementsToPak[j], originalElement.index, originalElement.currentFileInfo));
            }
            replacementParen = new Paren(new Selector(insideParent));
        }
        return replacementParen;
    }

    function createSelector(containedElement, originalElement) {
        var element, selector;
        element = new Element(null, containedElement, originalElement.index, originalElement.currentFileInfo);
        selector = new Selector([element]);
        return selector;
    }

    // joins selector path from `beginningPath` with selector path in `addPath`
    // `replacedElement` contains element that is being replaced by `addPath`
    // returns concatenated path
    function addReplacementIntoPath(beginningPath, addPath, replacedElement, originalSelector) {
        var newSelectorPath, lastSelector, newJoinedSelector;
        // our new selector path
        newSelectorPath = [];

        //construct the joined selector - if & is the first thing this will be empty,
        // if not newJoinedSelector will be the last set of elements in the selector
        if (beginningPath.length > 0) {
            newSelectorPath = beginningPath.slice(0);
            lastSelector = newSelectorPath.pop();
            newJoinedSelector = originalSelector.createDerived(lastSelector.elements.slice(0));
        }
        else {
            newJoinedSelector = originalSelector.createDerived([]);
        }

        if (addPath.length > 0) {
            // /deep/ is a combinator that is valid without anything in front of it
            // so if the & does not have a combinator that is "" or " " then
            // and there is a combinator on the parent, then grab that.
            // this also allows + a { & .b { .a & { ... though not sure why you would want to do that
            var combinator = replacedElement.combinator, parentEl = addPath[0].elements[0];
            if (combinator.emptyOrWhitespace && !parentEl.combinator.emptyOrWhitespace) {
                combinator = parentEl.combinator;
            }
            // join the elements so far with the first part of the parent
            newJoinedSelector.elements.push(new Element(combinator, parentEl.value, replacedElement.index, replacedElement.currentFileInfo));
            newJoinedSelector.elements = newJoinedSelector.elements.concat(addPath[0].elements.slice(1));
        }

        // now add the joined selector - but only if it is not empty
        if (newJoinedSelector.elements.length !== 0) {
            newSelectorPath.push(newJoinedSelector);
        }

        //put together the parent selectors after the join (e.g. the rest of the parent)
        if (addPath.length > 1) {
            var restOfPath = addPath.slice(1);
            restOfPath = restOfPath.map(function (selector) {
                return selector.createDerived(selector.elements, []);
            });
            newSelectorPath = newSelectorPath.concat(restOfPath);
        }
        return newSelectorPath;
    }

    // joins selector path from `beginningPath` with every selector path in `addPaths` array
    // `replacedElement` contains element that is being replaced by `addPath`
    // returns array with all concatenated paths
    function addAllReplacementsIntoPath( beginningPath, addPaths, replacedElement, originalSelector, result) {
        var j;
        for (j = 0; j < beginningPath.length; j++) {
            var newSelectorPath = addReplacementIntoPath(beginningPath[j], addPaths, replacedElement, originalSelector);
            result.push(newSelectorPath);
        }
        return result;
    }

    function mergeElementsOnToSelectors(elements, selectors) {
        var i, sel;

        if (elements.length === 0) {
            return ;
        }
        if (selectors.length === 0) {
            selectors.push([ new Selector(elements) ]);
            return;
        }

        for (i = 0; i < selectors.length; i++) {
            sel = selectors[i];

            // if the previous thing in sel is a parent this needs to join on to it
            if (sel.length > 0) {
                sel[sel.length - 1] = sel[sel.length - 1].createDerived(sel[sel.length - 1].elements.concat(elements));
            }
            else {
                sel.push(new Selector(elements));
            }
        }
    }

    // replace all parent selectors inside `inSelector` by content of `context` array
    // resulting selectors are returned inside `paths` array
    // returns true if `inSelector` contained at least one parent selector
    function replaceParentSelector(paths, context, inSelector) {
        // The paths are [[Selector]]
        // The first list is a list of comma separated selectors
        // The inner list is a list of inheritance separated selectors
        // e.g.
        // .a, .b {
        //   .c {
        //   }
        // }
        // == [[.a] [.c]] [[.b] [.c]]
        //
        var i, j, k, currentElements, newSelectors, selectorsMultiplied, sel, el, hadParentSelector = false, length, lastSelector;
        function findNestedSelector(element) {
            var maybeSelector;
            if (element.value.type !== 'Paren') {
                return null;
            }

            maybeSelector = element.value.value;
            if (maybeSelector.type !== 'Selector') {
                return null;
            }

            return maybeSelector;
        }

        // the elements from the current selector so far
        currentElements = [];
        // the current list of new selectors to add to the path.
        // We will build it up. We initiate it with one empty selector as we "multiply" the new selectors
        // by the parents
        newSelectors = [
            []
        ];

        for (i = 0; i < inSelector.elements.length; i++) {
            el = inSelector.elements[i];
            // non parent reference elements just get added
            if (el.value !== "&") {
                var nestedSelector = findNestedSelector(el);
                if (nestedSelector != null) {
                    // merge the current list of non parent selector elements
                    // on to the current list of selectors to add
                    mergeElementsOnToSelectors(currentElements, newSelectors);

                    var nestedPaths = [], replaced, replacedNewSelectors = [];
                    replaced = replaceParentSelector(nestedPaths, context, nestedSelector);
                    hadParentSelector = hadParentSelector || replaced;
                    //the nestedPaths array should have only one member - replaceParentSelector does not multiply selectors
                    for (k = 0; k < nestedPaths.length; k++) {
                        var replacementSelector = createSelector(createParenthesis(nestedPaths[k], el), el);
                        addAllReplacementsIntoPath(newSelectors, [replacementSelector], el, inSelector, replacedNewSelectors);
                    }
                    newSelectors = replacedNewSelectors;
                    currentElements = [];

                } else {
                    currentElements.push(el);
                }

            } else {
                hadParentSelector = true;
                // the new list of selectors to add
                selectorsMultiplied = [];

                // merge the current list of non parent selector elements
                // on to the current list of selectors to add
                mergeElementsOnToSelectors(currentElements, newSelectors);

                // loop through our current selectors
                for (j = 0; j < newSelectors.length; j++) {
                    sel = newSelectors[j];
                    // if we don't have any parent paths, the & might be in a mixin so that it can be used
                    // whether there are parents or not
                    if (context.length === 0) {
                        // the combinator used on el should now be applied to the next element instead so that
                        // it is not lost
                        if (sel.length > 0) {
                            sel[0].elements.push(new Element(el.combinator, '', el.index, el.currentFileInfo));
                        }
                        selectorsMultiplied.push(sel);
                    }
                    else {
                        // and the parent selectors
                        for (k = 0; k < context.length; k++) {
                            // We need to put the current selectors
                            // then join the last selector's elements on to the parents selectors
                            var newSelectorPath = addReplacementIntoPath(sel, context[k], el, inSelector);
                            // add that to our new set of selectors
                            selectorsMultiplied.push(newSelectorPath);
                        }
                    }
                }

                // our new selectors has been multiplied, so reset the state
                newSelectors = selectorsMultiplied;
                currentElements = [];
            }
        }

        // if we have any elements left over (e.g. .a& .b == .b)
        // add them on to all the current selectors
        mergeElementsOnToSelectors(currentElements, newSelectors);

        for (i = 0; i < newSelectors.length; i++) {
            length = newSelectors[i].length;
            if (length > 0) {
                paths.push(newSelectors[i]);
                lastSelector = newSelectors[i][length - 1];
                newSelectors[i][length - 1] = lastSelector.createDerived(lastSelector.elements, inSelector.extendList);
                //newSelectors[i][length - 1].copyVisibilityInfo(inSelector.visibilityInfo());
            }
        }

        return hadParentSelector;
    }

    function deriveSelector(visibilityInfo, deriveFrom) {
        var newSelector = deriveFrom.createDerived(deriveFrom.elements, deriveFrom.extendList, deriveFrom.evaldCondition);
        newSelector.copyVisibilityInfo(visibilityInfo);
        return newSelector;
    }

    // joinSelector code follows
    var i, newPaths, hadParentSelector;

    newPaths = [];
    hadParentSelector = replaceParentSelector(newPaths, context, selector);

    if (!hadParentSelector) {
        if (context.length > 0) {
            newPaths = [];
            for (i = 0; i < context.length; i++) {
                //var concatenated = [];
                //context[i].forEach(function(entry) {
                //    var newEntry = entry.createDerived(entry.elements, entry.extendList, entry.evaldCondition);
                //    newEntry.copyVisibilityInfo(selector.visibilityInfo());
                //    concatenated.push(newEntry);
                //}, this);
                var concatenated = context[i].map(deriveSelector.bind(this, selector.visibilityInfo()));

                concatenated.push(selector);
                newPaths.push(concatenated);
            }
        }
        else {
            newPaths = [[selector]];
        }
    }

    for (i = 0; i < newPaths.length; i++) {
        paths.push(newPaths[i]);
    }

};
module.exports = Ruleset;

},{"../contexts":11,"../functions/default":20,"../functions/function-registry":22,"./debug-info":54,"./element":58,"./node":70,"./paren":72,"./rule":74,"./selector":77}],77:[function(require,module,exports){
var Node = require("./node"),
    Element = require("./element");

var Selector = function (elements, extendList, condition, index, currentFileInfo, visibilityInfo) {
    this.elements = elements;
    this.extendList = extendList;
    this.condition = condition;
    this.currentFileInfo = currentFileInfo || {};
    if (!condition) {
        this.evaldCondition = true;
    }
    this.copyVisibilityInfo(visibilityInfo);
};
Selector.prototype = new Node();
Selector.prototype.type = "Selector";
Selector.prototype.accept = function (visitor) {
    if (this.elements) {
        this.elements = visitor.visitArray(this.elements);
    }
    if (this.extendList) {
        this.extendList = visitor.visitArray(this.extendList);
    }
    if (this.condition) {
        this.condition = visitor.visit(this.condition);
    }
};
Selector.prototype.createDerived = function(elements, extendList, evaldCondition) {
    var info = this.visibilityInfo();
    evaldCondition = (evaldCondition != null) ? evaldCondition : this.evaldCondition;
    var newSelector = new Selector(elements, extendList || this.extendList, null, this.index, this.currentFileInfo, info);
    newSelector.evaldCondition = evaldCondition;
    newSelector.mediaEmpty = this.mediaEmpty;
    return newSelector;
};
Selector.prototype.createEmptySelectors = function() {
    var el = new Element('', '&', this.index, this.currentFileInfo),
        sels = [new Selector([el], null, null, this.index, this.currentFileInfo)];
    sels[0].mediaEmpty = true;
    return sels;
};
Selector.prototype.match = function (other) {
    var elements = this.elements,
        len = elements.length,
        olen, i;

    other.CacheElements();

    olen = other._elements.length;
    if (olen === 0 || len < olen) {
        return 0;
    } else {
        for (i = 0; i < olen; i++) {
            if (elements[i].value !== other._elements[i]) {
                return 0;
            }
        }
    }

    return olen; // return number of matched elements
};
Selector.prototype.CacheElements = function() {
    if (this._elements) {
        return;
    }

    var elements = this.elements.map( function(v) {
        return v.combinator.value + (v.value.value || v.value);
    }).join("").match(/[,&#\*\.\w-]([\w-]|(\\.))*/g);

    if (elements) {
        if (elements[0] === "&") {
            elements.shift();
        }
    } else {
        elements = [];
    }

    this._elements = elements;
};
Selector.prototype.isJustParentSelector = function() {
    return !this.mediaEmpty &&
        this.elements.length === 1 &&
        this.elements[0].value === '&' &&
        (this.elements[0].combinator.value === ' ' || this.elements[0].combinator.value === '');
};
Selector.prototype.eval = function (context) {
    var evaldCondition = this.condition && this.condition.eval(context),
        elements = this.elements, extendList = this.extendList;

    elements = elements && elements.map(function (e) { return e.eval(context); });
    extendList = extendList && extendList.map(function(extend) { return extend.eval(context); });

    return this.createDerived(elements, extendList, evaldCondition);
};
Selector.prototype.genCSS = function (context, output) {
    var i, element;
    if ((!context || !context.firstSelector) && this.elements[0].combinator.value === "") {
        output.add(' ', this.currentFileInfo, this.index);
    }
    if (!this._css) {
        //TODO caching? speed comparison?
        for (i = 0; i < this.elements.length; i++) {
            element = this.elements[i];
            element.genCSS(context, output);
        }
    }
};
Selector.prototype.getIsOutput = function() {
    return this.evaldCondition;
};
module.exports = Selector;

},{"./element":58,"./node":70}],78:[function(require,module,exports){
var Node = require("./node");

var UnicodeDescriptor = function (value) {
    this.value = value;
};
UnicodeDescriptor.prototype = new Node();
UnicodeDescriptor.prototype.type = "UnicodeDescriptor";

module.exports = UnicodeDescriptor;

},{"./node":70}],79:[function(require,module,exports){
var Node = require("./node"),
    unitConversions = require("../data/unit-conversions");

var Unit = function (numerator, denominator, backupUnit) {
    this.numerator = numerator ? numerator.slice(0).sort() : [];
    this.denominator = denominator ? denominator.slice(0).sort() : [];
    if (backupUnit) {
        this.backupUnit = backupUnit;
    } else if (numerator && numerator.length) {
        this.backupUnit = numerator[0];
    }
};

Unit.prototype = new Node();
Unit.prototype.type = "Unit";
Unit.prototype.clone = function () {
    return new Unit(this.numerator.slice(0), this.denominator.slice(0), this.backupUnit);
};
Unit.prototype.genCSS = function (context, output) {
    // Dimension checks the unit is singular and throws an error if in strict math mode.
    var strictUnits = context && context.strictUnits;
    if (this.numerator.length === 1) {
        output.add(this.numerator[0]); // the ideal situation
    } else if (!strictUnits && this.backupUnit) {
        output.add(this.backupUnit);
    } else if (!strictUnits && this.denominator.length) {
        output.add(this.denominator[0]);
    }
};
Unit.prototype.toString = function () {
    var i, returnStr = this.numerator.join("*");
    for (i = 0; i < this.denominator.length; i++) {
        returnStr += "/" + this.denominator[i];
    }
    return returnStr;
};
Unit.prototype.compare = function (other) {
    return this.is(other.toString()) ? 0 : undefined;
};
Unit.prototype.is = function (unitString) {
    return this.toString().toUpperCase() === unitString.toUpperCase();
};
Unit.prototype.isLength = function () {
    return Boolean(this.toCSS().match(/px|em|%|in|cm|mm|pc|pt|ex/));
};
Unit.prototype.isEmpty = function () {
    return this.numerator.length === 0 && this.denominator.length === 0;
};
Unit.prototype.isSingular = function() {
    return this.numerator.length <= 1 && this.denominator.length === 0;
};
Unit.prototype.map = function(callback) {
    var i;

    for (i = 0; i < this.numerator.length; i++) {
        this.numerator[i] = callback(this.numerator[i], false);
    }

    for (i = 0; i < this.denominator.length; i++) {
        this.denominator[i] = callback(this.denominator[i], true);
    }
};
Unit.prototype.usedUnits = function() {
    var group, result = {}, mapUnit, groupName;

    mapUnit = function (atomicUnit) {
        /*jshint loopfunc:true */
        if (group.hasOwnProperty(atomicUnit) && !result[groupName]) {
            result[groupName] = atomicUnit;
        }

        return atomicUnit;
    };

    for (groupName in unitConversions) {
        if (unitConversions.hasOwnProperty(groupName)) {
            group = unitConversions[groupName];

            this.map(mapUnit);
        }
    }

    return result;
};
Unit.prototype.cancel = function () {
    var counter = {}, atomicUnit, i;

    for (i = 0; i < this.numerator.length; i++) {
        atomicUnit = this.numerator[i];
        counter[atomicUnit] = (counter[atomicUnit] || 0) + 1;
    }

    for (i = 0; i < this.denominator.length; i++) {
        atomicUnit = this.denominator[i];
        counter[atomicUnit] = (counter[atomicUnit] || 0) - 1;
    }

    this.numerator = [];
    this.denominator = [];

    for (atomicUnit in counter) {
        if (counter.hasOwnProperty(atomicUnit)) {
            var count = counter[atomicUnit];

            if (count > 0) {
                for (i = 0; i < count; i++) {
                    this.numerator.push(atomicUnit);
                }
            } else if (count < 0) {
                for (i = 0; i < -count; i++) {
                    this.denominator.push(atomicUnit);
                }
            }
        }
    }

    this.numerator.sort();
    this.denominator.sort();
};
module.exports = Unit;

},{"../data/unit-conversions":14,"./node":70}],80:[function(require,module,exports){
var Node = require("./node");

var URL = function (val, index, currentFileInfo, isEvald) {
    this.value = val;
    this.currentFileInfo = currentFileInfo;
    this.index = index;
    this.isEvald = isEvald;
};
URL.prototype = new Node();
URL.prototype.type = "Url";
URL.prototype.accept = function (visitor) {
    this.value = visitor.visit(this.value);
};
URL.prototype.genCSS = function (context, output) {
    output.add("url(");
    this.value.genCSS(context, output);
    output.add(")");
};
URL.prototype.eval = function (context) {
    var val = this.value.eval(context),
        rootpath;

    if (!this.isEvald) {
        // Add the base path if the URL is relative
        rootpath = this.currentFileInfo && this.currentFileInfo.rootpath;
        if (rootpath &&
            typeof val.value === "string" &&
            context.isPathRelative(val.value)) {

            if (!val.quote) {
                rootpath = rootpath.replace(/[\(\)'"\s]/g, function(match) { return "\\" + match; });
            }
            val.value = rootpath + val.value;
        }

        val.value = context.normalizePath(val.value);

        // Add url args if enabled
        if (context.urlArgs) {
            if (!val.value.match(/^\s*data:/)) {
                var delimiter = val.value.indexOf('?') === -1 ? '?' : '&';
                var urlArgs = delimiter + context.urlArgs;
                if (val.value.indexOf('#') !== -1) {
                    val.value = val.value.replace('#', urlArgs + '#');
                } else {
                    val.value += urlArgs;
                }
            }
        }
    }

    return new URL(val, this.index, this.currentFileInfo, true);
};
module.exports = URL;

},{"./node":70}],81:[function(require,module,exports){
var Node = require("./node");

var Value = function (value) {
    this.value = value;
    if (!value) {
        throw new Error("Value requires an array argument");
    }
};
Value.prototype = new Node();
Value.prototype.type = "Value";
Value.prototype.accept = function (visitor) {
    if (this.value) {
        this.value = visitor.visitArray(this.value);
    }
};
Value.prototype.eval = function (context) {
    if (this.value.length === 1) {
        return this.value[0].eval(context);
    } else {
        return new Value(this.value.map(function (v) {
            return v.eval(context);
        }));
    }
};
Value.prototype.genCSS = function (context, output) {
    var i;
    for (i = 0; i < this.value.length; i++) {
        this.value[i].genCSS(context, output);
        if (i + 1 < this.value.length) {
            output.add((context && context.compress) ? ',' : ', ');
        }
    }
};
module.exports = Value;

},{"./node":70}],82:[function(require,module,exports){
var Node = require("./node");

var Variable = function (name, index, currentFileInfo) {
    this.name = name;
    this.index = index;
    this.currentFileInfo = currentFileInfo || {};
};
Variable.prototype = new Node();
Variable.prototype.type = "Variable";
Variable.prototype.eval = function (context) {
    var variable, name = this.name;

    if (name.indexOf('@@') === 0) {
        name = '@' + new Variable(name.slice(1), this.index, this.currentFileInfo).eval(context).value;
    }

    if (this.evaluating) {
        throw { type: 'Name',
                message: "Recursive variable definition for " + name,
                filename: this.currentFileInfo.filename,
                index: this.index };
    }

    this.evaluating = true;

    variable = this.find(context.frames, function (frame) {
        var v = frame.variable(name);
        if (v) {
            if (v.important) {
                var importantScope = context.importantScope[context.importantScope.length - 1];
                importantScope.important = v.important;
            }
            return v.value.eval(context);
        }
    });
    if (variable) {
        this.evaluating = false;
        return variable;
    } else {
        throw { type: 'Name',
                message: "variable " + name + " is undefined",
                filename: this.currentFileInfo.filename,
                index: this.index };
    }
};
Variable.prototype.find = function (obj, fun) {
    for (var i = 0, r; i < obj.length; i++) {
        r = fun.call(obj, obj[i]);
        if (r) { return r; }
    }
    return null;
};
module.exports = Variable;

},{"./node":70}],83:[function(require,module,exports){
module.exports = {
    getLocation: function(index, inputStream) {
        var n = index + 1,
            line = null,
            column = -1;

        while (--n >= 0 && inputStream.charAt(n) !== '\n') {
            column++;
        }

        if (typeof index === 'number') {
            line = (inputStream.slice(0, index).match(/\n/g) || "").length;
        }

        return {
            line: line,
            column: column
        };
    }
};

},{}],84:[function(require,module,exports){
var tree = require("../tree"),
    Visitor = require("./visitor"),
    logger = require("../logger");

/*jshint loopfunc:true */

var ExtendFinderVisitor = function() {
    this._visitor = new Visitor(this);
    this.contexts = [];
    this.allExtendsStack = [[]];
};

ExtendFinderVisitor.prototype = {
    run: function (root) {
        root = this._visitor.visit(root);
        root.allExtends = this.allExtendsStack[0];
        return root;
    },
    visitRule: function (ruleNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitRuleset: function (rulesetNode, visitArgs) {
        if (rulesetNode.root) {
            return;
        }

        var i, j, extend, allSelectorsExtendList = [], extendList;

        // get &:extend(.a); rules which apply to all selectors in this ruleset
        var rules = rulesetNode.rules, ruleCnt = rules ? rules.length : 0;
        for (i = 0; i < ruleCnt; i++) {
            if (rulesetNode.rules[i] instanceof tree.Extend) {
                allSelectorsExtendList.push(rules[i]);
                rulesetNode.extendOnEveryPath = true;
            }
        }

        // now find every selector and apply the extends that apply to all extends
        // and the ones which apply to an individual extend
        var paths = rulesetNode.paths;
        for (i = 0; i < paths.length; i++) {
            var selectorPath = paths[i],
                selector = selectorPath[selectorPath.length - 1],
                selExtendList = selector.extendList;

            extendList = selExtendList ? selExtendList.slice(0).concat(allSelectorsExtendList)
                                       : allSelectorsExtendList;

            if (extendList) {
                extendList = extendList.map(function(allSelectorsExtend) {
                    return allSelectorsExtend.clone();
                });
            }

            for (j = 0; j < extendList.length; j++) {
                this.foundExtends = true;
                extend = extendList[j];
                extend.findSelfSelectors(selectorPath);
                extend.ruleset = rulesetNode;
                if (j === 0) { extend.firstExtendOnThisSelectorPath = true; }
                this.allExtendsStack[this.allExtendsStack.length - 1].push(extend);
            }
        }

        this.contexts.push(rulesetNode.selectors);
    },
    visitRulesetOut: function (rulesetNode) {
        if (!rulesetNode.root) {
            this.contexts.length = this.contexts.length - 1;
        }
    },
    visitMedia: function (mediaNode, visitArgs) {
        mediaNode.allExtends = [];
        this.allExtendsStack.push(mediaNode.allExtends);
    },
    visitMediaOut: function (mediaNode) {
        this.allExtendsStack.length = this.allExtendsStack.length - 1;
    },
    visitDirective: function (directiveNode, visitArgs) {
        directiveNode.allExtends = [];
        this.allExtendsStack.push(directiveNode.allExtends);
    },
    visitDirectiveOut: function (directiveNode) {
        this.allExtendsStack.length = this.allExtendsStack.length - 1;
    }
};

var ProcessExtendsVisitor = function() {
    this._visitor = new Visitor(this);
};

ProcessExtendsVisitor.prototype = {
    run: function(root) {
        var extendFinder = new ExtendFinderVisitor();
        this.extendIndicies = {};
        extendFinder.run(root);
        if (!extendFinder.foundExtends) { return root; }
        root.allExtends = root.allExtends.concat(this.doExtendChaining(root.allExtends, root.allExtends));
        this.allExtendsStack = [root.allExtends];
        var newRoot = this._visitor.visit(root);
        this.checkExtendsForNonMatched(root.allExtends);
        return newRoot;
    },
    checkExtendsForNonMatched: function(extendList) {
        var indicies = this.extendIndicies;
        extendList.filter(function(extend) {
            return !extend.hasFoundMatches && extend.parent_ids.length == 1;
        }).forEach(function(extend) {
                var selector = "_unknown_";
                try {
                    selector = extend.selector.toCSS({});
                }
                catch(_) {}

                if (!indicies[extend.index + ' ' + selector]) {
                    indicies[extend.index + ' ' + selector] = true;
                    logger.warn("extend '" + selector + "' has no matches");
                }
            });
    },
    doExtendChaining: function (extendsList, extendsListTarget, iterationCount) {
        //
        // chaining is different from normal extension.. if we extend an extend then we are not just copying, altering
        // and pasting the selector we would do normally, but we are also adding an extend with the same target selector
        // this means this new extend can then go and alter other extends
        //
        // this method deals with all the chaining work - without it, extend is flat and doesn't work on other extend selectors
        // this is also the most expensive.. and a match on one selector can cause an extension of a selector we had already
        // processed if we look at each selector at a time, as is done in visitRuleset

        var extendIndex, targetExtendIndex, matches, extendsToAdd = [], newSelector, extendVisitor = this, selectorPath,
            extend, targetExtend, newExtend;

        iterationCount = iterationCount || 0;

        //loop through comparing every extend with every target extend.
        // a target extend is the one on the ruleset we are looking at copy/edit/pasting in place
        // e.g.  .a:extend(.b) {}  and .b:extend(.c) {} then the first extend extends the second one
        // and the second is the target.
        // the seperation into two lists allows us to process a subset of chains with a bigger set, as is the
        // case when processing media queries
        for (extendIndex = 0; extendIndex < extendsList.length; extendIndex++) {
            for (targetExtendIndex = 0; targetExtendIndex < extendsListTarget.length; targetExtendIndex++) {

                extend = extendsList[extendIndex];
                targetExtend = extendsListTarget[targetExtendIndex];

                // look for circular references
                if ( extend.parent_ids.indexOf( targetExtend.object_id ) >= 0 ) { continue; }

                // find a match in the target extends self selector (the bit before :extend)
                selectorPath = [targetExtend.selfSelectors[0]];
                matches = extendVisitor.findMatch(extend, selectorPath);

                if (matches.length) {
                    extend.hasFoundMatches = true;

                    // we found a match, so for each self selector..
                    extend.selfSelectors.forEach(function(selfSelector) {
                        var info = targetExtend.visibilityInfo();

                        // process the extend as usual
                        newSelector = extendVisitor.extendSelector(matches, selectorPath, selfSelector, extend.isVisible());

                        // but now we create a new extend from it
                        newExtend = new(tree.Extend)(targetExtend.selector, targetExtend.option, 0, targetExtend.currentFileInfo, info);
                        newExtend.selfSelectors = newSelector;

                        // add the extend onto the list of extends for that selector
                        newSelector[newSelector.length - 1].extendList = [newExtend];

                        // record that we need to add it.
                        extendsToAdd.push(newExtend);
                        newExtend.ruleset = targetExtend.ruleset;

                        //remember its parents for circular references
                        newExtend.parent_ids = newExtend.parent_ids.concat(targetExtend.parent_ids, extend.parent_ids);

                        // only process the selector once.. if we have :extend(.a,.b) then multiple
                        // extends will look at the same selector path, so when extending
                        // we know that any others will be duplicates in terms of what is added to the css
                        if (targetExtend.firstExtendOnThisSelectorPath) {
                            newExtend.firstExtendOnThisSelectorPath = true;
                            targetExtend.ruleset.paths.push(newSelector);
                        }
                    });
                }
            }
        }

        if (extendsToAdd.length) {
            // try to detect circular references to stop a stack overflow.
            // may no longer be needed.
            this.extendChainCount++;
            if (iterationCount > 100) {
                var selectorOne = "{unable to calculate}";
                var selectorTwo = "{unable to calculate}";
                try {
                    selectorOne = extendsToAdd[0].selfSelectors[0].toCSS();
                    selectorTwo = extendsToAdd[0].selector.toCSS();
                }
                catch(e) {}
                throw { message: "extend circular reference detected. One of the circular extends is currently:" +
                    selectorOne + ":extend(" + selectorTwo + ")"};
            }

            // now process the new extends on the existing rules so that we can handle a extending b extending c extending
            // d extending e...
            return extendsToAdd.concat(extendVisitor.doExtendChaining(extendsToAdd, extendsListTarget, iterationCount + 1));
        } else {
            return extendsToAdd;
        }
    },
    visitRule: function (ruleNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitSelector: function (selectorNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitRuleset: function (rulesetNode, visitArgs) {
        if (rulesetNode.root) {
            return;
        }
        var matches, pathIndex, extendIndex, allExtends = this.allExtendsStack[this.allExtendsStack.length - 1],
            selectorsToAdd = [], extendVisitor = this, selectorPath;

        // look at each selector path in the ruleset, find any extend matches and then copy, find and replace

        for (extendIndex = 0; extendIndex < allExtends.length; extendIndex++) {
            for (pathIndex = 0; pathIndex < rulesetNode.paths.length; pathIndex++) {
                selectorPath = rulesetNode.paths[pathIndex];

                // extending extends happens initially, before the main pass
                if (rulesetNode.extendOnEveryPath) { continue; }
                var extendList = selectorPath[selectorPath.length - 1].extendList;
                if (extendList && extendList.length) { continue; }

                matches = this.findMatch(allExtends[extendIndex], selectorPath);

                if (matches.length) {
                    allExtends[extendIndex].hasFoundMatches = true;

                    allExtends[extendIndex].selfSelectors.forEach(function(selfSelector) {
                        var extendedSelectors;
                        extendedSelectors = extendVisitor.extendSelector(matches, selectorPath, selfSelector, allExtends[extendIndex].isVisible());
                        selectorsToAdd.push(extendedSelectors);
                    });
                }
            }
        }
        rulesetNode.paths = rulesetNode.paths.concat(selectorsToAdd);
    },
    findMatch: function (extend, haystackSelectorPath) {
        //
        // look through the haystack selector path to try and find the needle - extend.selector
        // returns an array of selector matches that can then be replaced
        //
        var haystackSelectorIndex, hackstackSelector, hackstackElementIndex, haystackElement,
            targetCombinator, i,
            extendVisitor = this,
            needleElements = extend.selector.elements,
            potentialMatches = [], potentialMatch, matches = [];

        // loop through the haystack elements
        for (haystackSelectorIndex = 0; haystackSelectorIndex < haystackSelectorPath.length; haystackSelectorIndex++) {
            hackstackSelector = haystackSelectorPath[haystackSelectorIndex];

            for (hackstackElementIndex = 0; hackstackElementIndex < hackstackSelector.elements.length; hackstackElementIndex++) {

                haystackElement = hackstackSelector.elements[hackstackElementIndex];

                // if we allow elements before our match we can add a potential match every time. otherwise only at the first element.
                if (extend.allowBefore || (haystackSelectorIndex === 0 && hackstackElementIndex === 0)) {
                    potentialMatches.push({pathIndex: haystackSelectorIndex, index: hackstackElementIndex, matched: 0,
                        initialCombinator: haystackElement.combinator});
                }

                for (i = 0; i < potentialMatches.length; i++) {
                    potentialMatch = potentialMatches[i];

                    // selectors add " " onto the first element. When we use & it joins the selectors together, but if we don't
                    // then each selector in haystackSelectorPath has a space before it added in the toCSS phase. so we need to
                    // work out what the resulting combinator will be
                    targetCombinator = haystackElement.combinator.value;
                    if (targetCombinator === '' && hackstackElementIndex === 0) {
                        targetCombinator = ' ';
                    }

                    // if we don't match, null our match to indicate failure
                    if (!extendVisitor.isElementValuesEqual(needleElements[potentialMatch.matched].value, haystackElement.value) ||
                        (potentialMatch.matched > 0 && needleElements[potentialMatch.matched].combinator.value !== targetCombinator)) {
                        potentialMatch = null;
                    } else {
                        potentialMatch.matched++;
                    }

                    // if we are still valid and have finished, test whether we have elements after and whether these are allowed
                    if (potentialMatch) {
                        potentialMatch.finished = potentialMatch.matched === needleElements.length;
                        if (potentialMatch.finished &&
                            (!extend.allowAfter &&
                                (hackstackElementIndex + 1 < hackstackSelector.elements.length || haystackSelectorIndex + 1 < haystackSelectorPath.length))) {
                            potentialMatch = null;
                        }
                    }
                    // if null we remove, if not, we are still valid, so either push as a valid match or continue
                    if (potentialMatch) {
                        if (potentialMatch.finished) {
                            potentialMatch.length = needleElements.length;
                            potentialMatch.endPathIndex = haystackSelectorIndex;
                            potentialMatch.endPathElementIndex = hackstackElementIndex + 1; // index after end of match
                            potentialMatches.length = 0; // we don't allow matches to overlap, so start matching again
                            matches.push(potentialMatch);
                        }
                    } else {
                        potentialMatches.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        return matches;
    },
    isElementValuesEqual: function(elementValue1, elementValue2) {
        if (typeof elementValue1 === "string" || typeof elementValue2 === "string") {
            return elementValue1 === elementValue2;
        }
        if (elementValue1 instanceof tree.Attribute) {
            if (elementValue1.op !== elementValue2.op || elementValue1.key !== elementValue2.key) {
                return false;
            }
            if (!elementValue1.value || !elementValue2.value) {
                if (elementValue1.value || elementValue2.value) {
                    return false;
                }
                return true;
            }
            elementValue1 = elementValue1.value.value || elementValue1.value;
            elementValue2 = elementValue2.value.value || elementValue2.value;
            return elementValue1 === elementValue2;
        }
        elementValue1 = elementValue1.value;
        elementValue2 = elementValue2.value;
        if (elementValue1 instanceof tree.Selector) {
            if (!(elementValue2 instanceof tree.Selector) || elementValue1.elements.length !== elementValue2.elements.length) {
                return false;
            }
            for (var i = 0; i  < elementValue1.elements.length; i++) {
                if (elementValue1.elements[i].combinator.value !== elementValue2.elements[i].combinator.value) {
                    if (i !== 0 || (elementValue1.elements[i].combinator.value || ' ') !== (elementValue2.elements[i].combinator.value || ' ')) {
                        return false;
                    }
                }
                if (!this.isElementValuesEqual(elementValue1.elements[i].value, elementValue2.elements[i].value)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },
    extendSelector:function (matches, selectorPath, replacementSelector, isVisible) {

        //for a set of matches, replace each match with the replacement selector

        var currentSelectorPathIndex = 0,
            currentSelectorPathElementIndex = 0,
            path = [],
            matchIndex,
            selector,
            firstElement,
            match,
            newElements;

        for (matchIndex = 0; matchIndex < matches.length; matchIndex++) {
            match = matches[matchIndex];
            selector = selectorPath[match.pathIndex];
            firstElement = new tree.Element(
                match.initialCombinator,
                replacementSelector.elements[0].value,
                replacementSelector.elements[0].index,
                replacementSelector.elements[0].currentFileInfo
            );

            if (match.pathIndex > currentSelectorPathIndex && currentSelectorPathElementIndex > 0) {
                path[path.length - 1].elements = path[path.length - 1]
                    .elements.concat(selectorPath[currentSelectorPathIndex].elements.slice(currentSelectorPathElementIndex));
                currentSelectorPathElementIndex = 0;
                currentSelectorPathIndex++;
            }

            newElements = selector.elements
                .slice(currentSelectorPathElementIndex, match.index)
                .concat([firstElement])
                .concat(replacementSelector.elements.slice(1));

            if (currentSelectorPathIndex === match.pathIndex && matchIndex > 0) {
                path[path.length - 1].elements =
                    path[path.length - 1].elements.concat(newElements);
            } else {
                path = path.concat(selectorPath.slice(currentSelectorPathIndex, match.pathIndex));

                path.push(new tree.Selector(
                    newElements
                ));
            }
            currentSelectorPathIndex = match.endPathIndex;
            currentSelectorPathElementIndex = match.endPathElementIndex;
            if (currentSelectorPathElementIndex >= selectorPath[currentSelectorPathIndex].elements.length) {
                currentSelectorPathElementIndex = 0;
                currentSelectorPathIndex++;
            }
        }

        if (currentSelectorPathIndex < selectorPath.length && currentSelectorPathElementIndex > 0) {
            path[path.length - 1].elements = path[path.length - 1]
                .elements.concat(selectorPath[currentSelectorPathIndex].elements.slice(currentSelectorPathElementIndex));
            currentSelectorPathIndex++;
        }

        path = path.concat(selectorPath.slice(currentSelectorPathIndex, selectorPath.length));
        path = path.map(function (currentValue) {
            // we can re-use elements here, because the visibility property matters only for selectors
            var derived = currentValue.createDerived(currentValue.elements);
            if (isVisible) {
                derived.ensureVisibility();
            } else {
                derived.ensureInvisibility();
            }
            return derived;
        });
        return path;
    },
    visitMedia: function (mediaNode, visitArgs) {
        var newAllExtends = mediaNode.allExtends.concat(this.allExtendsStack[this.allExtendsStack.length - 1]);
        newAllExtends = newAllExtends.concat(this.doExtendChaining(newAllExtends, mediaNode.allExtends));
        this.allExtendsStack.push(newAllExtends);
    },
    visitMediaOut: function (mediaNode) {
        var lastIndex = this.allExtendsStack.length - 1;
        this.allExtendsStack.length = lastIndex;
    },
    visitDirective: function (directiveNode, visitArgs) {
        var newAllExtends = directiveNode.allExtends.concat(this.allExtendsStack[this.allExtendsStack.length - 1]);
        newAllExtends = newAllExtends.concat(this.doExtendChaining(newAllExtends, directiveNode.allExtends));
        this.allExtendsStack.push(newAllExtends);
    },
    visitDirectiveOut: function (directiveNode) {
        var lastIndex = this.allExtendsStack.length - 1;
        this.allExtendsStack.length = lastIndex;
    }
};

module.exports = ProcessExtendsVisitor;

},{"../logger":33,"../tree":62,"./visitor":91}],85:[function(require,module,exports){
function ImportSequencer(onSequencerEmpty) {
    this.imports = [];
    this.variableImports = [];
    this._onSequencerEmpty = onSequencerEmpty;
    this._currentDepth = 0;
}

ImportSequencer.prototype.addImport = function(callback) {
    var importSequencer = this,
        importItem = {
            callback: callback,
            args: null,
            isReady: false
        };
    this.imports.push(importItem);
    return function() {
        importItem.args = Array.prototype.slice.call(arguments, 0);
        importItem.isReady = true;
        importSequencer.tryRun();
    };
};

ImportSequencer.prototype.addVariableImport = function(callback) {
    this.variableImports.push(callback);
};

ImportSequencer.prototype.tryRun = function() {
    this._currentDepth++;
    try {
        while (true) {
            while (this.imports.length > 0) {
                var importItem = this.imports[0];
                if (!importItem.isReady) {
                    return;
                }
                this.imports = this.imports.slice(1);
                importItem.callback.apply(null, importItem.args);
            }
            if (this.variableImports.length === 0) {
                break;
            }
            var variableImport = this.variableImports[0];
            this.variableImports = this.variableImports.slice(1);
            variableImport();
        }
    } finally {
        this._currentDepth--;
    }
    if (this._currentDepth === 0 && this._onSequencerEmpty) {
        this._onSequencerEmpty();
    }
};

module.exports = ImportSequencer;

},{}],86:[function(require,module,exports){
var contexts = require("../contexts"),
    Visitor = require("./visitor"),
    ImportSequencer = require("./import-sequencer");

var ImportVisitor = function(importer, finish) {

    this._visitor = new Visitor(this);
    this._importer = importer;
    this._finish = finish;
    this.context = new contexts.Eval();
    this.importCount = 0;
    this.onceFileDetectionMap = {};
    this.recursionDetector = {};
    this._sequencer = new ImportSequencer(this._onSequencerEmpty.bind(this));
};

ImportVisitor.prototype = {
    isReplacing: false,
    run: function (root) {
        try {
            // process the contents
            this._visitor.visit(root);
        }
        catch(e) {
            this.error = e;
        }

        this.isFinished = true;
        this._sequencer.tryRun();
    },
    _onSequencerEmpty: function() {
        if (!this.isFinished) {
            return;
        }
        this._finish(this.error);
    },
    visitImport: function (importNode, visitArgs) {
        var inlineCSS = importNode.options.inline;

        if (!importNode.css || inlineCSS) {

            var context = new contexts.Eval(this.context, this.context.frames.slice(0));
            var importParent = context.frames[0];

            this.importCount++;
            if (importNode.isVariableImport()) {
                this._sequencer.addVariableImport(this.processImportNode.bind(this, importNode, context, importParent));
            } else {
                this.processImportNode(importNode, context, importParent);
            }
        }
        visitArgs.visitDeeper = false;
    },
    processImportNode: function(importNode, context, importParent) {
        var evaldImportNode,
            inlineCSS = importNode.options.inline;

        try {
            evaldImportNode = importNode.evalForImport(context);
        } catch(e) {
            if (!e.filename) { e.index = importNode.index; e.filename = importNode.currentFileInfo.filename; }
            // attempt to eval properly and treat as css
            importNode.css = true;
            // if that fails, this error will be thrown
            importNode.error = e;
        }

        if (evaldImportNode && (!evaldImportNode.css || inlineCSS)) {

            if (evaldImportNode.options.multiple) {
                context.importMultiple = true;
            }

            // try appending if we haven't determined if it is css or not
            var tryAppendLessExtension = evaldImportNode.css === undefined;

            for (var i = 0; i < importParent.rules.length; i++) {
                if (importParent.rules[i] === importNode) {
                    importParent.rules[i] = evaldImportNode;
                    break;
                }
            }

            var onImported = this.onImported.bind(this, evaldImportNode, context),
                sequencedOnImported = this._sequencer.addImport(onImported);

            this._importer.push(evaldImportNode.getPath(), tryAppendLessExtension, evaldImportNode.currentFileInfo,
                evaldImportNode.options, sequencedOnImported);
        } else {
            this.importCount--;
            if (this.isFinished) {
                this._sequencer.tryRun();
            }
        }
    },
    onImported: function (importNode, context, e, root, importedAtRoot, fullPath) {
        if (e) {
            if (!e.filename) {
                e.index = importNode.index; e.filename = importNode.currentFileInfo.filename;
            }
            this.error = e;
        }

        var importVisitor = this,
            inlineCSS = importNode.options.inline,
            isPlugin = importNode.options.plugin,
            isOptional = importNode.options.optional,
            duplicateImport = importedAtRoot || fullPath in importVisitor.recursionDetector;

        if (!context.importMultiple) {
            if (duplicateImport) {
                importNode.skip = true;
            } else {
                importNode.skip = function() {
                    if (fullPath in importVisitor.onceFileDetectionMap) {
                        return true;
                    }
                    importVisitor.onceFileDetectionMap[fullPath] = true;
                    return false;
                };
            }
        }

        if (!fullPath && isOptional) {
            importNode.skip = true;
        }

        if (root) {
            importNode.root = root;
            importNode.importedFilename = fullPath;

            if (!inlineCSS && !isPlugin && (context.importMultiple || !duplicateImport)) {
                importVisitor.recursionDetector[fullPath] = true;

                var oldContext = this.context;
                this.context = context;
                try {
                    this._visitor.visit(root);
                } catch (e) {
                    this.error = e;
                }
                this.context = oldContext;
            }
        }

        importVisitor.importCount--;

        if (importVisitor.isFinished) {
            importVisitor._sequencer.tryRun();
        }
    },
    visitRule: function (ruleNode, visitArgs) {
        if (ruleNode.value.type === "DetachedRuleset") {
            this.context.frames.unshift(ruleNode);
        } else {
            visitArgs.visitDeeper = false;
        }
    },
    visitRuleOut : function(ruleNode) {
        if (ruleNode.value.type === "DetachedRuleset") {
            this.context.frames.shift();
        }
    },
    visitDirective: function (directiveNode, visitArgs) {
        this.context.frames.unshift(directiveNode);
    },
    visitDirectiveOut: function (directiveNode) {
        this.context.frames.shift();
    },
    visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
        this.context.frames.unshift(mixinDefinitionNode);
    },
    visitMixinDefinitionOut: function (mixinDefinitionNode) {
        this.context.frames.shift();
    },
    visitRuleset: function (rulesetNode, visitArgs) {
        this.context.frames.unshift(rulesetNode);
    },
    visitRulesetOut: function (rulesetNode) {
        this.context.frames.shift();
    },
    visitMedia: function (mediaNode, visitArgs) {
        this.context.frames.unshift(mediaNode.rules[0]);
    },
    visitMediaOut: function (mediaNode) {
        this.context.frames.shift();
    }
};
module.exports = ImportVisitor;

},{"../contexts":11,"./import-sequencer":85,"./visitor":91}],87:[function(require,module,exports){
var visitors = {
    Visitor: require("./visitor"),
    ImportVisitor: require('./import-visitor'),
    MarkVisibleSelectorsVisitor: require("./set-tree-visibility-visitor"),
    ExtendVisitor: require('./extend-visitor'),
    JoinSelectorVisitor: require('./join-selector-visitor'),
    ToCSSVisitor: require('./to-css-visitor')
};

module.exports = visitors;

},{"./extend-visitor":84,"./import-visitor":86,"./join-selector-visitor":88,"./set-tree-visibility-visitor":89,"./to-css-visitor":90,"./visitor":91}],88:[function(require,module,exports){
var Visitor = require("./visitor");

var JoinSelectorVisitor = function() {
    this.contexts = [[]];
    this._visitor = new Visitor(this);
};

JoinSelectorVisitor.prototype = {
    run: function (root) {
        return this._visitor.visit(root);
    },
    visitRule: function (ruleNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },
    visitMixinDefinition: function (mixinDefinitionNode, visitArgs) {
        visitArgs.visitDeeper = false;
    },

    visitRuleset: function (rulesetNode, visitArgs) {
        var context = this.contexts[this.contexts.length - 1],
            paths = [], selectors;

        this.contexts.push(paths);

        if (! rulesetNode.root) {
            selectors = rulesetNode.selectors;
            if (selectors) {
                selectors = selectors.filter(function(selector) { return selector.getIsOutput(); });
                rulesetNode.selectors = selectors.length ? selectors : (selectors = null);
                if (selectors) { rulesetNode.joinSelectors(paths, context, selectors); }
            }
            if (!selectors) { rulesetNode.rules = null; }
            rulesetNode.paths = paths;
        }
    },
    visitRulesetOut: function (rulesetNode) {
        this.contexts.length = this.contexts.length - 1;
    },
    visitMedia: function (mediaNode, visitArgs) {
        var context = this.contexts[this.contexts.length - 1];
        mediaNode.rules[0].root = (context.length === 0 || context[0].multiMedia);
    },
    visitDirective: function (directiveNode, visitArgs) {
        var context = this.contexts[this.contexts.length - 1];
        if (directiveNode.rules && directiveNode.rules.length) {
            directiveNode.rules[0].root = (directiveNode.isRooted || context.length === 0 || null);
        }
    }
};

module.exports = JoinSelectorVisitor;

},{"./visitor":91}],89:[function(require,module,exports){
var SetTreeVisibilityVisitor = function(visible) {
    this.visible = visible;
};
SetTreeVisibilityVisitor.prototype.run = function(root) {
    this.visit(root);
};
SetTreeVisibilityVisitor.prototype.visitArray = function(nodes) {
    if (!nodes) {
        return nodes;
    }

    var cnt = nodes.length, i;
    for (i = 0; i < cnt; i++) {
        this.visit(nodes[i]);
    }
    return nodes;
};
SetTreeVisibilityVisitor.prototype.visit = function(node) {
    if (!node) {
        return node;
    }
    if (node.constructor === Array) {
        return this.visitArray(node);
    }

    if (!node.blocksVisibility || node.blocksVisibility()) {
        return node;
    }
    if (this.visible) {
        node.ensureVisibility();
    } else {
        node.ensureInvisibility();
    }

    node.accept(this);
    return node;
};
module.exports = SetTreeVisibilityVisitor;
},{}],90:[function(require,module,exports){
var tree = require("../tree"),
    Visitor = require("./visitor");

var CSSVisitorUtils = function(context) {
    this._visitor = new Visitor(this);
    this._context = context;
};

CSSVisitorUtils.prototype = {
    containsSilentNonBlockedChild: function(bodyRules) {
        var rule;
        if (bodyRules == null) {
            return false;
        }
        for (var r = 0; r < bodyRules.length; r++) {
            rule = bodyRules[r];
            if (rule.isSilent && rule.isSilent(this._context) && !rule.blocksVisibility()) {
                //the directive contains something that was referenced (likely by extend)
                //therefore it needs to be shown in output too
                return true;
            }
        }
        return false;
    },

    keepOnlyVisibleChilds: function(owner) {
        if (owner == null || owner.rules == null) {
            return ;
        }

        owner.rules = owner.rules.filter(function(thing) {
                return thing.isVisible();
            }
        );
    },

    isEmpty: function(owner) {
        if (owner == null || owner.rules == null) {
            return true;
        }
        return owner.rules.length === 0;
    },

    hasVisibleSelector: function(rulesetNode) {
        if (rulesetNode == null || rulesetNode.paths == null) {
            return false;
        }
        return rulesetNode.paths.length > 0;
    },

    resolveVisibility: function (node, originalRules) {
        if (!node.blocksVisibility()) {
            if (this.isEmpty(node) && !this.containsSilentNonBlockedChild(originalRules)) {
                return ;
            }

            return node;
        }

        var compiledRulesBody = node.rules[0];
        this.keepOnlyVisibleChilds(compiledRulesBody);

        if (this.isEmpty(compiledRulesBody)) {
            return ;
        }

        node.ensureVisibility();
        node.removeVisibilityBlock();

        return node;
    },

    isVisibleRuleset: function(rulesetNode) {
        if (rulesetNode.firstRoot) {
            return true;
        }

        if (this.isEmpty(rulesetNode)) {
            return false;
        }

        if (!rulesetNode.root && !this.hasVisibleSelector(rulesetNode)) {
            return false;
        }

        return true;
    }

};

var ToCSSVisitor = function(context) {
    this._visitor = new Visitor(this);
    this._context = context;
    this.utils = new CSSVisitorUtils(context);
};

ToCSSVisitor.prototype = {
    isReplacing: true,
    run: function (root) {
        return this._visitor.visit(root);
    },

    visitRule: function (ruleNode, visitArgs) {
        if (ruleNode.blocksVisibility() || ruleNode.variable) {
            return;
        }
        return ruleNode;
    },

    visitMixinDefinition: function (mixinNode, visitArgs) {
        // mixin definitions do not get eval'd - this means they keep state
        // so we have to clear that state here so it isn't used if toCSS is called twice
        mixinNode.frames = [];
    },

    visitExtend: function (extendNode, visitArgs) {
    },

    visitComment: function (commentNode, visitArgs) {
        if (commentNode.blocksVisibility() || commentNode.isSilent(this._context)) {
            return;
        }
        return commentNode;
    },

    visitMedia: function(mediaNode, visitArgs) {
        var originalRules = mediaNode.rules[0].rules;
        mediaNode.accept(this._visitor);
        visitArgs.visitDeeper = false;

        return this.utils.resolveVisibility(mediaNode, originalRules);
    },

    visitImport: function (importNode, visitArgs) {
        if (importNode.blocksVisibility()) {
            return ;
        }
        return importNode;
    },

    visitDirective: function(directiveNode, visitArgs) {
        if (directiveNode.rules && directiveNode.rules.length) {
            return this.visitDirectiveWithBody(directiveNode, visitArgs);
        } else {
            return this.visitDirectiveWithoutBody(directiveNode, visitArgs);
        }
        return directiveNode;
    },

    visitDirectiveWithBody: function(directiveNode, visitArgs) {
        //if there is only one nested ruleset and that one has no path, then it is
        //just fake ruleset
        function hasFakeRuleset(directiveNode) {
            var bodyRules = directiveNode.rules;
            return bodyRules.length === 1 && (!bodyRules[0].paths || bodyRules[0].paths.length === 0);
        }
        function getBodyRules(directiveNode) {
            var nodeRules = directiveNode.rules;
            if (hasFakeRuleset(directiveNode)) {
                return nodeRules[0].rules;
            }

            return nodeRules;
        }
        //it is still true that it is only one ruleset in array
        //this is last such moment
        //process childs
        var originalRules = getBodyRules(directiveNode);
        directiveNode.accept(this._visitor);
        visitArgs.visitDeeper = false;

        if (!this.utils.isEmpty(directiveNode)) {
            this._mergeRules(directiveNode.rules[0].rules);
        }

        return this.utils.resolveVisibility(directiveNode, originalRules);
    },

    visitDirectiveWithoutBody: function(directiveNode, visitArgs) {
        if (directiveNode.blocksVisibility()) {
            return;
        }

        if (directiveNode.name === "@charset") {
            // Only output the debug info together with subsequent @charset definitions
            // a comment (or @media statement) before the actual @charset directive would
            // be considered illegal css as it has to be on the first line
            if (this.charset) {
                if (directiveNode.debugInfo) {
                    var comment = new tree.Comment("/* " + directiveNode.toCSS(this._context).replace(/\n/g, "") + " */\n");
                    comment.debugInfo = directiveNode.debugInfo;
                    return this._visitor.visit(comment);
                }
                return;
            }
            this.charset = true;
        }

        return directiveNode;
    },

    checkPropertiesInRoot: function(rules) {
        var ruleNode;
        for (var i = 0; i < rules.length; i++) {
            ruleNode = rules[i];
            if (ruleNode instanceof tree.Rule && !ruleNode.variable) {
                throw { message: "properties must be inside selector blocks, they cannot be in the root.",
                    index: ruleNode.index, filename: ruleNode.currentFileInfo ? ruleNode.currentFileInfo.filename : null};
            }
        }
    },

    visitRuleset: function (rulesetNode, visitArgs) {
        //at this point rulesets are nested into each other
        var rule, rulesets = [];
        if (rulesetNode.firstRoot) {
            this.checkPropertiesInRoot(rulesetNode.rules);
        }
        if (! rulesetNode.root) {
            //remove invisible paths
            this._compileRulesetPaths(rulesetNode);

            // remove rulesets from this ruleset body and compile them separately
            var nodeRules = rulesetNode.rules, nodeRuleCnt = nodeRules ? nodeRules.length : 0;
            for (var i = 0; i < nodeRuleCnt; ) {
                rule = nodeRules[i];
                if (rule && rule.rules) {
                    // visit because we are moving them out from being a child
                    rulesets.push(this._visitor.visit(rule));
                    nodeRules.splice(i, 1);
                    nodeRuleCnt--;
                    continue;
                }
                i++;
            }
            // accept the visitor to remove rules and refactor itself
            // then we can decide nogw whether we want it or not
            // compile body
            if (nodeRuleCnt > 0) {
                rulesetNode.accept(this._visitor);
            } else {
                rulesetNode.rules = null;
            }
            visitArgs.visitDeeper = false;

        } else { //if (! rulesetNode.root) {
            rulesetNode.accept(this._visitor);
            visitArgs.visitDeeper = false;
        }

        if (rulesetNode.rules) {
            this._mergeRules(rulesetNode.rules);
            this._removeDuplicateRules(rulesetNode.rules);
        }

        //now decide whether we keep the ruleset
        if (this.utils.isVisibleRuleset(rulesetNode)) {
            rulesetNode.ensureVisibility();
            rulesets.splice(0, 0, rulesetNode);
        }

        if (rulesets.length === 1) {
            return rulesets[0];
        }
        return rulesets;
    },

    _compileRulesetPaths: function(rulesetNode) {
        if (rulesetNode.paths) {
            rulesetNode.paths = rulesetNode.paths
                .filter(function(p) {
                    var i;
                    if (p[0].elements[0].combinator.value === ' ') {
                        p[0].elements[0].combinator = new(tree.Combinator)('');
                    }
                    for (i = 0; i < p.length; i++) {
                        if (p[i].isVisible() && p[i].getIsOutput()) {
                            return true;
                        }
                    }
                    return false;
                });
        }
    },

    _removeDuplicateRules: function(rules) {
        if (!rules) { return; }

        // remove duplicates
        var ruleCache = {},
            ruleList, rule, i;

        for (i = rules.length - 1; i >= 0 ; i--) {
            rule = rules[i];
            if (rule instanceof tree.Rule) {
                if (!ruleCache[rule.name]) {
                    ruleCache[rule.name] = rule;
                } else {
                    ruleList = ruleCache[rule.name];
                    if (ruleList instanceof tree.Rule) {
                        ruleList = ruleCache[rule.name] = [ruleCache[rule.name].toCSS(this._context)];
                    }
                    var ruleCSS = rule.toCSS(this._context);
                    if (ruleList.indexOf(ruleCSS) !== -1) {
                        rules.splice(i, 1);
                    } else {
                        ruleList.push(ruleCSS);
                    }
                }
            }
        }
    },

    _mergeRules: function (rules) {
        if (!rules) { return; }

        var groups = {},
            parts,
            rule,
            key;

        for (var i = 0; i < rules.length; i++) {
            rule = rules[i];

            if ((rule instanceof tree.Rule) && rule.merge) {
                key = [rule.name,
                    rule.important ? "!" : ""].join(",");

                if (!groups[key]) {
                    groups[key] = [];
                } else {
                    rules.splice(i--, 1);
                }

                groups[key].push(rule);
            }
        }

        Object.keys(groups).map(function (k) {

            function toExpression(values) {
                return new (tree.Expression)(values.map(function (p) {
                    return p.value;
                }));
            }

            function toValue(values) {
                return new (tree.Value)(values.map(function (p) {
                    return p;
                }));
            }

            parts = groups[k];

            if (parts.length > 1) {
                rule = parts[0];
                var spacedGroups = [];
                var lastSpacedGroup = [];
                parts.map(function (p) {
                    if (p.merge === "+") {
                        if (lastSpacedGroup.length > 0) {
                            spacedGroups.push(toExpression(lastSpacedGroup));
                        }
                        lastSpacedGroup = [];
                    }
                    lastSpacedGroup.push(p);
                });
                spacedGroups.push(toExpression(lastSpacedGroup));
                rule.value = toValue(spacedGroups);
            }
        });
    },

    visitAnonymous: function(anonymousNode, visitArgs) {
        if (anonymousNode.blocksVisibility()) {
            return ;
        }
        anonymousNode.accept(this._visitor);
        return anonymousNode;
    }
};

module.exports = ToCSSVisitor;

},{"../tree":62,"./visitor":91}],91:[function(require,module,exports){
var tree = require("../tree");

var _visitArgs = { visitDeeper: true },
    _hasIndexed = false;

function _noop(node) {
    return node;
}

function indexNodeTypes(parent, ticker) {
    // add .typeIndex to tree node types for lookup table
    var key, child;
    for (key in parent) {
        if (parent.hasOwnProperty(key)) {
            child = parent[key];
            switch (typeof child) {
                case "function":
                    // ignore bound functions directly on tree which do not have a prototype
                    // or aren't nodes
                    if (child.prototype && child.prototype.type) {
                        child.prototype.typeIndex = ticker++;
                    }
                    break;
                case "object":
                    ticker = indexNodeTypes(child, ticker);
                    break;
            }
        }
    }
    return ticker;
}

var Visitor = function(implementation) {
    this._implementation = implementation;
    this._visitFnCache = [];

    if (!_hasIndexed) {
        indexNodeTypes(tree, 1);
        _hasIndexed = true;
    }
};

Visitor.prototype = {
    visit: function(node) {
        if (!node) {
            return node;
        }

        var nodeTypeIndex = node.typeIndex;
        if (!nodeTypeIndex) {
            return node;
        }

        var visitFnCache = this._visitFnCache,
            impl = this._implementation,
            aryIndx = nodeTypeIndex << 1,
            outAryIndex = aryIndx | 1,
            func = visitFnCache[aryIndx],
            funcOut = visitFnCache[outAryIndex],
            visitArgs = _visitArgs,
            fnName;

        visitArgs.visitDeeper = true;

        if (!func) {
            fnName = "visit" + node.type;
            func = impl[fnName] || _noop;
            funcOut = impl[fnName + "Out"] || _noop;
            visitFnCache[aryIndx] = func;
            visitFnCache[outAryIndex] = funcOut;
        }

        if (func !== _noop) {
            var newNode = func.call(impl, node, visitArgs);
            if (impl.isReplacing) {
                node = newNode;
            }
        }

        if (visitArgs.visitDeeper && node && node.accept) {
            node.accept(this);
        }

        if (funcOut != _noop) {
            funcOut.call(impl, node);
        }

        return node;
    },
    visitArray: function(nodes, nonReplacing) {
        if (!nodes) {
            return nodes;
        }

        var cnt = nodes.length, i;

        // Non-replacing
        if (nonReplacing || !this._implementation.isReplacing) {
            for (i = 0; i < cnt; i++) {
                this.visit(nodes[i]);
            }
            return nodes;
        }

        // Replacing
        var out = [];
        for (i = 0; i < cnt; i++) {
            var evald = this.visit(nodes[i]);
            if (evald === undefined) { continue; }
            if (!evald.splice) {
                out.push(evald);
            } else if (evald.length) {
                this.flatten(evald, out);
            }
        }
        return out;
    },
    flatten: function(arr, out) {
        if (!out) {
            out = [];
        }

        var cnt, i, item,
            nestedCnt, j, nestedItem;

        for (i = 0, cnt = arr.length; i < cnt; i++) {
            item = arr[i];
            if (item === undefined) {
                continue;
            }
            if (!item.splice) {
                out.push(item);
                continue;
            }

            for (j = 0, nestedCnt = item.length; j < nestedCnt; j++) {
                nestedItem = item[j];
                if (nestedItem === undefined) {
                    continue;
                }
                if (!nestedItem.splice) {
                    out.push(nestedItem);
                } else if (nestedItem.length) {
                    this.flatten(nestedItem, out);
                }
            }
        }

        return out;
    }
};
module.exports = Visitor;

},{"../tree":62}],92:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],93:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise;
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new self.constructor(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":95}],94:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Promise.prototype

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    })
  });
}

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
}

},{"./core.js":93,"asap":95}],95:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require('_process'))
},{"_process":92}],96:[function(require,module,exports){
// should work in any browser without browserify

if (typeof Promise.prototype.done !== 'function') {
  Promise.prototype.done = function (onFulfilled, onRejected) {
    var self = arguments.length ? this.then.apply(this, arguments) : this
    self.then(null, function (err) {
      setTimeout(function () {
        throw err
      }, 0)
    })
  }
}
},{}],97:[function(require,module,exports){
// not "use strict" so we can declare global "Promise"

var asap = require('asap');

if (typeof Promise === 'undefined') {
  Promise = require('./lib/core.js')
  require('./lib/es6-extensions.js')
}

require('./polyfill-done.js');

},{"./lib/core.js":93,"./lib/es6-extensions.js":94,"./polyfill-done.js":96,"asap":95}]},{},[2])(2)
});;/*! CSS-REGIONS-POLYFILL - v3.0.0 - 2015-12-13 - https://github.com/FremyCompany/css-regions-polyfill - Copyright (c) 2015 François REMY; MIT-Licensed !*/

!(function() { 'use strict';
    var module = { exports:{} };
    var require = (function() { var modules = {}; var require = function(m) { return modules[m]; }; require.define = function(m) { modules[m]=module.exports; module.exports={}; }; return require; })();

////////////////////////////////////////

!(function(window, document) { "use strict";

	//
	// some code for console polyfilling
	//
	if(!window.console) {
			
		window.console = {
			backlog: '',
			
			log: function(x) { this.backlog+=x+'\n'; if(window.debug) alert(x); },
			
			dir: function(x) { try { 
				
				var elm = function(e) {
					if(e.innerHTML) {
						return {
							tagName: e.tagName,
							className: e.className,
							id: e.id,
							innerHTML: e.innerHTML.substr(0,100)
						}
					} else {
						return {
							nodeName: e.nodeName,
							nodeValue: e.nodeValue
						}
					}
				};
				
				var jsonify = function(o) {
					var seen=[];
					var jso=JSON.stringify(o, function(k,v){
						if (typeof v =='object') {
							if ( !seen.indexOf(v) ) { return '__cycle__'; }
							if ( v instanceof window.Node) { return elm(v); }
							seen.push(v);
						} return v;
					});
					return jso;
				};
				
				this.log(jsonify(x)); 
				
			} catch(ex) { this.log(x) } },
			
			warn: function(x) { this.log(x) },
			
			error: function(x) { this.log("ERROR:"); this.log(x); }
			
		};
		
		if(!window.onerror) {
			window.onerror = function() {
				console.log([].slice.call(arguments,0).join("\n"))
			};
		}
		
	}

	//
	// this special console is used as a proxy emulating the CSS console of browsers
	//
	window.cssConsole = {
		enabled: (!!window.debug), warnEnabled: (true),
		log: function(x) { if(this.enabled) console.log(x) },
		dir: function(x) { if(this.enabled) console.dir(x) },
		warn: function(x) { if(this.warnEnabled) console.warn(x) },
		error: function(x) { console.error(x); }
	}

})(window, document);
require.define('src/core/polyfill-dom-console.js');

////////////////////////////////////////

module.exports = (function(window, document) { "use strict";

	require('src/core/polyfill-dom-console.js');

	//
	// some other basic om code
	//
	var domEvents = {
		
		//
		// the following functions are about event cloning
		//
		cloneMouseEvent: function cloneMouseEvent(e) {
			var evt = document.createEvent("MouseEvent");
			evt.initMouseEvent( 
				e.type, 
				e.canBubble||e.bubbles, 
				e.cancelable, 
				e.view, 
				e.detail, 
				e.screenX, 
				e.screenY, 
				e.clientX, 
				e.clientY, 
				e.ctrlKey, 
				e.altKey, 
				e.shiftKey, 
				e.metaKey, 
				e.button, 
				e.relatedTarget
			);
			return evt;
		},
		
		cloneKeyboardEvent: function cloneKeyboardEvent(e) {
			// TODO: this doesn't work cross-browser...
			// see https://gist.github.com/termi/4654819/ for the huge code
			return domEvents.cloneCustomEvent(e);
		},
		
		cloneCustomEvent: function cloneCustomEvent(e) {
			var ne = document.createEvent("CustomEvent");
			ne.initCustomEvent(e.type, e.canBubble||e.bubbles, e.cancelable, "detail" in e ? e.detail : e);
			for(var prop in e) {
				try {
					if(e[prop] != ne[prop] && e[prop] != e.target) {
						try { ne[prop] = e[prop]; }
						catch (ex) { Object.defineProperty(ne,prop,{get:function() { return e[prop]} }) }
					}
				} catch(ex) {}
			}
			return ne;
		},
		
		cloneEvent: function cloneEvent(e) {
			
			if(e instanceof MouseEvent) {
				return domEvents.cloneMouseEvent(e);
			} else if(e instanceof KeyboardEvent) {
				return domEvents.cloneKeyboardEvent(e);
			} else {
				return domEvents.cloneCustomEvent(e);
			}
			
		},
		
		//
		// allows you to drop event support to any class easily
		//
		EventTarget: {
			implementsIn: function(eventClass, static_class) {
				
				if(!static_class && typeof(eventClass)=="function") eventClass=eventClass.prototype;
				
				eventClass.dispatchEvent = domEvents.EventTarget.prototype.dispatchEvent;
				eventClass.addEventListener = domEvents.EventTarget.prototype.addEventListener;
				eventClass.removeEventListener = domEvents.EventTarget.prototype.removeEventListener;
				
			},
			prototype: {}
		}
		
	};

	domEvents.EventTarget.prototype.addEventListener = function(eventType,f) {
		if(!this.eventListeners) this.eventListeners=[];
		
		var ls = (this.eventListeners[eventType] || (this.eventListeners[eventType]=[]));
		if(ls.indexOf(f)==-1) {
			ls.push(f);
		}
		
	}

	domEvents.EventTarget.prototype.removeEventListener = function(eventType,f) {
		if(!this.eventListeners) this.eventListeners=[];

		var ls = (this.eventListeners[eventType] || (this.eventListeners[eventType]=[])), i;
		if((i=ls.indexOf(f))!==-1) {
			ls.splice(i,1);
		}
		
	}

	domEvents.EventTarget.prototype.dispatchEvent = function(event_or_type) {
		if(!this.eventListeners) this.eventListeners=[];
		
		// abort quickly when no listener has been set up
		if(typeof(event_or_type) == "string") {
			if(!this.eventListeners[event_or_type] || this.eventListeners[event_or_type].length==0) {
				return;
			}
		} else {
			if(!this.eventListeners[event_or_type.type] || this.eventListeners[event_or_type.type].length==0) {
				return;
			}
		}
		
		// convert the event
		var event = event_or_type;
		function setUpPropertyForwarding(e,ee,key) {
			Object.defineProperty(ee,key,{
				get:function() {
					var v = e[key]; 
					if(typeof(v)=="function") {
						return v.bind(e);
					} else {
						return v;
					}
				},
				set:function(v) {
					e[key] = v;
				}
			});
		}
		function setUpTarget(e,v) {
			try { Object.defineProperty(e,"target",{get:function() {return v}}); }
			catch(ex) {}
			finally {
				
				if(e.target !== v) {
					
					var ee = Object.create(Object.getPrototypeOf(e));
					ee = setUpTarget(ee,v);
					for(key in e) {
						if(key != "target") setUpPropertyForwarding(e,ee,key);
					}
					return ee;
					
				} else {
					
					return e;
					
				}
				
			}
		}
		
		// try to set the target
		if(typeof(event)=="object") {
			try { event=setUpTarget(event,this); } catch(ex) {}
			
		} else if(typeof(event)=="string") {
			event = document.createEvent("CustomEvent");
			event.initCustomEvent(event_or_type, /*canBubble:*/ true, /*cancelable:*/ false, /*detail:*/this);
			try { event=setUpTarget(event,this); } catch(ex) {}
			
		} else {
			throw new Error("dispatchEvent expect an Event object or a string containing the event type");
		}
		
		// call all listeners
		var ls = (this.eventListeners[event.type] || (this.eventListeners[event.type]=[]));
		for(var i=ls.length; i--;) {
			try { 
				ls[i](event);
			} catch(ex) {
				setImmediate(function() { throw ex; });
			}
		}
		
		return event.isDefaultPrevented;
	}
	
	return domEvents;
	
})(window, document);
require.define('src/core/dom-events.js');

////////////////////////////////////////

//
// note: this file is based on Tab Atkins's CSS Parser
// please include him (@tabatkins) if you open any issue for this file
// 
module.exports = (function(window, document) { "use strict";

// 
// exports
//
var cssSyntax = { 
	tokenize: function(string) {/*filled later*/}, 
	parse: function(tokens) {/*filled later*/}
};

//
// css tokenizer
//

// Add support for token lists (superclass of array)
function TokenList() {
	var array = []; 
	array.toCSSString=TokenListToCSSString;
	return array;
}
function TokenListToCSSString(sep) {
	if(sep) {
		return this.map(function(o) { return o.toCSSString(); }).join(sep);
	} else {
		return this.asCSSString || (this.asCSSString = (
			this.map(function(o) { return o.toCSSString(); }).join("/**/")
				.replace(/( +\/\*\*\/ *| * | *\/\*\*\/ +)/g," ")
				.replace(/( +\/\*\*\/ *| * | *\/\*\*\/ +)/g," ")
				.replace(/(\!|\:|\;|\@|\.|\,|\*|\=|\&|\\|\/|\<|\>|\[|\{|\(|\]|\}|\)|\|)\/\*\*\//g,"$1")
				.replace(/\/\*\*\/(\!|\:|\;|\@|\.|\,|\*|\=|\&|\\|\/|\<|\>|\[|\{|\(|\]|\}|\)|\|)/g,"$1")
		));
	}
}
cssSyntax.TokenList = TokenList;
cssSyntax.TokenListToCSSString = TokenListToCSSString;

function between(num, first, last) { return num >= first && num <= last; }
function digit(code) { return between(code, 0x30,0x39); }
function hexdigit(code) { return digit(code) || between(code, 0x41,0x46) || between(code, 0x61,0x66); }
function uppercaseletter(code) { return between(code, 0x41,0x5a); }
function lowercaseletter(code) { return between(code, 0x61,0x7a); }
function letter(code) { return uppercaseletter(code) || lowercaseletter(code); }
function nonascii(code) { return code >= 0x80; }
function namestartchar(code) { return letter(code) || nonascii(code) || code == 0x5f; }
function namechar(code) { return namestartchar(code) || digit(code) || code == 0x2d; }
function nonprintable(code) { return between(code, 0,8) || code == 0xb || between(code, 0xe,0x1f) || code == 0x7f; }
function newline(code) { return code == 0xa; }
function whitespace(code) { return newline(code) || code == 9 || code == 0x20; }
function badescape(code) { return newline(code) || isNaN(code); }

var maximumallowedcodepoint = 0x10ffff;

function InvalidCharacterError(message) {
	this.message = message;
};
InvalidCharacterError.prototype = new Error;
InvalidCharacterError.prototype.name = 'InvalidCharacterError';

function preprocess(str) {
	// Turn a string into an array of code points,
	// following the preprocessing cleanup rules.
	var codepoints = [];
	for(var i = 0; i < str.length; i++) {
		var code = str.charCodeAt(i);
		if(code == 0xd && str.charCodeAt(i+1) == 0xa) {
			code = 0xa; i++;
		}
		if(code == 0xd || code == 0xc) code = 0xa;
		if(code == 0x0) code = 0xfffd;
		if(between(code, 0xd800, 0xdbff) && between(str.charCodeAt(i+1), 0xdc00, 0xdfff)) {
			// Decode a surrogate pair into an astral codepoint.
			var lead = code - 0xd800;
			var trail = str.charCodeAt(i+1) - 0xdc00;
			code = Math.pow(2, 21) + lead * Math.pow(2, 10) + trail;
		}
		codepoints.push(code);
	}
	return codepoints;
}

function stringFromCode(code) {
	if(code <= 0xffff) return String.fromCharCode(code);
	// Otherwise, encode astral char as surrogate pair.
	code -= Math.pow(2, 21);
	var lead = Math.floor(code/Math.pow(2, 10)) + 0xd800;
	var trail = code % Math.pow(2, 10); + 0xdc00;
	return String.fromCharCode(lead) + String.fromCharCode(trail);
}

function tokenize(str) {
	str = preprocess(str);
	var i = -1;
	var tokens = new TokenList();
	var code;

	// Line number information.
	var line = 0;
	var column = 0;
	// The only use of lastLineLength is in reconsume().
	var lastLineLength = 0;
	var incrLineno = function() {
		line += 1;
		lastLineLength = column;
		column = 0;
	};
	var locStart = {line:line, column:column};

	var codepoint = function(i) {
		if(i >= str.length) {
			return -1;
		}
		return str[i];
	}
	var next = function(num) {
		if(num === undefined) { num = 1; }
		if(num > 3) { throw "Spec Error: no more than three codepoints of lookahead."; }
		return codepoint(i+num);
	};
	var consume = function(num) {
		if(num === undefined)
			num = 1;
		i += num;
		code = codepoint(i);
		if(newline(code)) incrLineno();
		else column += num;
		//console.log('Consume '+i+' '+String.fromCharCode(code) + ' 0x' + code.toString(16));
		return true;
	};
	var reconsume = function() {
		i -= 1;
		if (newline(code)) {
			line -= 1;
			column = lastLineLength;
		} else {
			column -= 1;
		}
		locStart.line = line;
		locStart.column = column;
		return true;
	};
	var eof = function(codepoint) {
		if(codepoint === undefined) codepoint = code;
		return codepoint == -1;
	};
	var donothing = function() {};
	var tokenizeerror = function() { console.log("Parse error at index " + i + ", processing codepoint 0x" + code.toString(16) + ".");return true; };

	var consumeAToken = function() {
		consumeComments();
		consume();
		if(whitespace(code)) {
			while(whitespace(next())) consume();
			return new WhitespaceToken;
		}
		else if(code == 0x22) return consumeAStringToken();
		else if(code == 0x23) {
			if(namechar(next()) || areAValidEscape(next(1), next(2))) {
				var token = new HashToken();
				if(wouldStartAnIdentifier(next(1), next(2), next(3))) token.type = "id";
				token.value = consumeAName();
				return token;
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x24) {
			if(next() == 0x3d) {
				consume();
				return new SuffixMatchToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x27) return consumeAStringToken();
		else if(code == 0x28) return new OpenParenToken();
		else if(code == 0x29) return new CloseParenToken();
		else if(code == 0x2a) {
			if(next() == 0x3d) {
				consume();
				return new SubstringMatchToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x2b) {
			if(startsWithANumber()) {
				reconsume();
				return consumeANumericToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x2c) return new CommaToken();
		else if(code == 0x2d) {
			if(startsWithANumber()) {
				reconsume();
				return consumeANumericToken();
			} else if(next(1) == 0x2d && next(2) == 0x3e) {
				consume(2);
				return new CDCToken();
			} else if(startsWithAnIdentifier()) {
				reconsume();
				return consumeAnIdentlikeToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x2e) {
			if(startsWithANumber()) {
				reconsume();
				return consumeANumericToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x3a) return new ColonToken;
		else if(code == 0x3b) return new SemicolonToken;
		else if(code == 0x3c) {
			if(next(1) == 0x21 && next(2) == 0x2d && next(3) == 0x2d) {
				consume(3);
				return new CDOToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x40) {
			if(wouldStartAnIdentifier(next(1), next(2), next(3))) {
				return new AtKeywordToken(consumeAName());
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x5b) return new OpenSquareToken();
		else if(code == 0x5c) {
			if(startsWithAValidEscape()) {
				reconsume();
				return consumeAnIdentlikeToken();
			} else {
				tokenizeerror();
				return new DelimToken(code);
			}
		}
		else if(code == 0x5d) return new CloseSquareToken();
		else if(code == 0x5e) {
			if(next() == 0x3d) {
				consume();
				return new PrefixMatchToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x7b) return new OpenCurlyToken();
		else if(code == 0x7c) {
			if(next() == 0x3d) {
				consume();
				return new DashMatchToken();
			} else if(next() == 0x7c) {
				consume();
				return new ColumnToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(code == 0x7d) return new CloseCurlyToken();
		else if(code == 0x7e) {
			if(next() == 0x3d) {
				consume();
				return new IncludeMatchToken();
			} else {
				return new DelimToken(code);
			}
		}
		else if(digit(code)) {
			reconsume();
			return consumeANumericToken();
		}
		else if(namestartchar(code)) {
			reconsume();
			return consumeAnIdentlikeToken();
		}
		else if(eof()) return new EOFToken();
		else return new DelimToken(code);
	};

	var consumeComments = function() {
		while(next(1) == 0x2f && next(2) == 0x2a) {
			consume(2);
			while(true) {
				consume();
				if(code == 0x2a && next() == 0x2f) {
					consume();
					break;
				} else if(eof()) {
					tokenizeerror();
					return;
				}
			}
		}
	};

	var consumeANumericToken = function() {
		var num = consumeANumber();
		if(wouldStartAnIdentifier(next(1), next(2), next(3))) {
			var token = new DimensionToken();
			token.value = num.value;
			token.repr = num.repr;
			token.type = num.type;
			token.unit = consumeAName();
			return token;
		} else if(next() == 0x25) {
			consume();
			var token = new PercentageToken();
			token.value = num.value;
			token.repr = num.repr;
			return token;
		} else {
			var token = new NumberToken();
			token.value = num.value;
			token.repr = num.repr;
			token.type = num.type;
			return token;
		}
	};

	var consumeAnIdentlikeToken = function() {
		var str = consumeAName();
		if(str.toLowerCase() == "url" && next() == 0x28) {
			consume();
			while(whitespace(next(1)) && whitespace(next(2))) consume();
			if(next() == 0x22 || next() == 0x27) {
				return new FunctionToken(str);
			} else if(whitespace(next()) && (next(2) == 0x22 || next(2) == 0x27)) {
				return new FunctionToken(str);
			} else {
				return consumeAURLToken();
			}
		} else if(next() == 0x28) {
			consume();
			return new FunctionToken(str);
		} else {
			return new IdentifierToken(str);
		}
	};

	var consumeAStringToken = function(endingCodePoint) {
		if(endingCodePoint === undefined) endingCodePoint = code;
		var string = "";
		while(consume()) {
			if(code == endingCodePoint || eof()) {
				return new StringToken(string);
			} else if(newline(code)) {
				tokenizeerror();
				reconsume();
				return new BadStringToken();
			} else if(code == 0x5c) {
				if(eof(next())) {
					donothing();
				} else if(newline(next())) {
					consume();
				} else {
					string += stringFromCode(consumeEscape())
				}
			} else {
				string += stringFromCode(code);
			}
		}
	};

	var consumeAURLToken = function() {
		var token = new URLToken("");
		while(whitespace(next())) consume();
		if(eof(next())) return token;
		while(consume()) {
			if(code == 0x29 || eof()) {
				return token;
			} else if(whitespace(code)) {
				while(whitespace(next())) consume();
				if(next() == 0x29 || eof(next())) {
					consume();
					return token;
				} else {
					consumeTheRemnantsOfABadURL();
					return new BadURLToken();
				}
			} else if(code == 0x22 || code == 0x27 || code == 0x28 || nonprintable(code)) {
				tokenizeerror();
				consumeTheRemnantsOfABadURL();
				return new BadURLToken();
			} else if(code == 0x5c) {
				if(startsWithAValidEscape()) {
					token.value += stringFromCode(consumeEscape());
				} else {
					tokenizeerror();
					consumeTheRemnantsOfABadURL();
					return new BadURLToken();
				}
			} else {
				token.value += stringFromCode(code);
			}
		}
	};

	var consumeEscape = function() {
		// Assume the the current character is the \
		// and the next code point is not a newline.
		consume();
		if(hexdigit(code)) {
			// Consume 1-6 hex digits
			var digits = [code];
			for(var total = 0; total < 5; total++) {
				if(hexdigit(next())) {
					consume();
					digits.push(code);
				} else {
					break;
				}
			}
			if(whitespace(next())) consume();
			var value = parseInt(digits.map(function(x){return String.fromCharCode(x);}).join(''), 16);
			if( value > maximumallowedcodepoint ) value = 0xfffd;
			return value;
		} else if(eof()) {
			return 0xfffd;
		} else {
			return code;
		}
	};

	var areAValidEscape = function(c1, c2) {
		if(c1 != 0x5c) return false;
		if(newline(c2)) return false;
		return true;
	};
	var startsWithAValidEscape = function() {
		return areAValidEscape(code, next());
	};

	var wouldStartAnIdentifier = function(c1, c2, c3) {
		if(c1 == 0x2d) {
			return namestartchar(c2) || c2 == 0x2d || areAValidEscape(c2, c3);
		} else if(namestartchar(c1)) {
			return true;
		} else if(c1 == 0x5c) {
			return areAValidEscape(c1, c2);
		} else {
			return false;
		}
	};
	var startsWithAnIdentifier = function() {
		return wouldStartAnIdentifier(code, next(1), next(2));
	};

	var wouldStartANumber = function(c1, c2, c3) {
		if(c1 == 0x2b || c1 == 0x2d) {
			if(digit(c2)) return true;
			if(c2 == 0x2e && digit(c3)) return true;
			return false;
		} else if(c1 == 0x2e) {
			if(digit(c2)) return true;
			return false;
		} else if(digit(c1)) {
			return true;
		} else {
			return false;
		}
	};
	var startsWithANumber = function() {
		return wouldStartANumber(code, next(1), next(2));
	};

	var consumeAName = function() {
		var result = "";
		while(consume()) {
			if(namechar(code)) {
				result += stringFromCode(code);
			} else if(startsWithAValidEscape()) {
				result += stringFromCode(consumeEscape());
			} else {
				reconsume();
				return result;
			}
		}
	};

	var consumeANumber = function() {
		var repr = '';
		var type = "integer";
		if(next() == 0x2b || next() == 0x2d) {
			consume();
			repr += stringFromCode(code);
		}
		while(digit(next())) {
			consume();
			repr += stringFromCode(code);
		}
		if(next(1) == 0x2e && digit(next(2))) {
			consume();
			repr += stringFromCode(code);
			consume();
			repr += stringFromCode(code);
			type = "number";
			while(digit(next())) {
				consume();
				repr += stringFromCode(code);
			}
		}
		var c1 = next(1), c2 = next(2), c3 = next(3);
		if((c1 == 0x45 || c1 == 0x65) && digit(c2)) {
			consume();
			repr += stringFromCode(code);
			consume();
			repr += stringFromCode(code);
			type = "number";
			while(digit(next())) {
				consume();
				repr += stringFromCode(code);
			}
		} else if((c1 == 0x45 || c1 == 0x65) && (c2 == 0x2b || c2 == 0x2d) && digit(c3)) {
			consume();
			repr += stringFromCode(code);
			consume();
			repr += stringFromCode(code);
			consume();
			repr += stringFromCode(code);
			type = "number";
			while(digit(next())) {
				consume();
				repr += stringFromCode(code);
			}
		}
		var value = convertAStringToANumber(repr);
		return {type:type, value:value, repr:repr};
	};

	var convertAStringToANumber = function(string) {
		// CSS's number rules are identical to JS, afaik.
		return +string;
	};

	var consumeTheRemnantsOfABadURL = function() {
		while(consume()) {
			if(code == 0x2d || eof()) {
				return;
			} else if(startsWithAValidEscape()) {
				consumeEscape();
				donothing();
			} else {
				donothing();
			}
		}
	};



	var iterationCount = 0;
	while(!eof(next())) {
		tokens.push(consumeAToken());
		if(iterationCount++ > str.length*2) throw new Error("The CSS Tokenizer is infinite-looping");
	}
	return tokens;
}

function CSSParserToken() { return this; }
CSSParserToken.prototype.toJSON = function() {
	return {token: this.tokenType};
}
CSSParserToken.prototype.toString = function() { return this.tokenType; }
CSSParserToken.prototype.toCSSString = function() { return ''+this; }

function BadStringToken() { return this; }
BadStringToken.prototype = new CSSParserToken;
BadStringToken.prototype.tokenType = "BADSTRING";
BadStringToken.prototype.toCSSString = function() { return "'"; }

function BadURLToken() { return this; }
BadURLToken.prototype = new CSSParserToken;
BadURLToken.prototype.tokenType = "BADURL";
BadURLToken.prototype.toCSSString = function() { return "url("; }

function WhitespaceToken() { return this; }
WhitespaceToken.prototype = new CSSParserToken;
WhitespaceToken.prototype.tokenType = "WHITESPACE";
WhitespaceToken.prototype.toString = function() { return "WS"; }
WhitespaceToken.prototype.toCSSString = function() { return " "; }

function CDOToken() { return this; }
CDOToken.prototype = new CSSParserToken;
CDOToken.prototype.tokenType = "CDO";
CDOToken.prototype.toCSSString = function() { return "<!--"; }

function CDCToken() { return this; }
CDCToken.prototype = new CSSParserToken;
CDCToken.prototype.tokenType = "CDC";
CDCToken.prototype.toCSSString = function() { return "-->"; }

function ColonToken() { return this; }
ColonToken.prototype = new CSSParserToken;
ColonToken.prototype.tokenType = ":";

function SemicolonToken() { return this; }
SemicolonToken.prototype = new CSSParserToken;
SemicolonToken.prototype.tokenType = ";";

function CommaToken() { return this; }
CommaToken.prototype = new CSSParserToken;
CommaToken.prototype.tokenType = ",";
CommaToken.prototype.value = ";"; // backwards-compat with DELIM token

function GroupingToken() { return this; }
GroupingToken.prototype = new CSSParserToken;

function OpenCurlyToken() { this.value = "{"; this.mirror = "}"; return this; }
OpenCurlyToken.prototype = new GroupingToken;
OpenCurlyToken.prototype.tokenType = "{";

function CloseCurlyToken() { this.value = "}"; this.mirror = "{"; return this; }
CloseCurlyToken.prototype = new GroupingToken;
CloseCurlyToken.prototype.tokenType = "}";

function OpenSquareToken() { this.value = "["; this.mirror = "]"; return this; }
OpenSquareToken.prototype = new GroupingToken;
OpenSquareToken.prototype.tokenType = "[";

function CloseSquareToken() { this.value = "]"; this.mirror = "["; return this; }
CloseSquareToken.prototype = new GroupingToken;
CloseSquareToken.prototype.tokenType = "]";

function OpenParenToken() { this.value = "("; this.mirror = ")"; return this; }
OpenParenToken.prototype = new GroupingToken;
OpenParenToken.prototype.tokenType = "(";

function CloseParenToken() { this.value = ")"; this.mirror = "("; return this; }
CloseParenToken.prototype = new GroupingToken;
CloseParenToken.prototype.tokenType = ")";

function IncludeMatchToken() { return this; }
IncludeMatchToken.prototype = new CSSParserToken;
IncludeMatchToken.prototype.tokenType = "~=";

function DashMatchToken() { return this; }
DashMatchToken.prototype = new CSSParserToken;
DashMatchToken.prototype.tokenType = "|=";

function PrefixMatchToken() { return this; }
PrefixMatchToken.prototype = new CSSParserToken;
PrefixMatchToken.prototype.tokenType = "^=";

function SuffixMatchToken() { return this; }
SuffixMatchToken.prototype = new CSSParserToken;
SuffixMatchToken.prototype.tokenType = "$=";

function SubstringMatchToken() { return this; }
SubstringMatchToken.prototype = new CSSParserToken;
SubstringMatchToken.prototype.tokenType = "*=";

function ColumnToken() { return this; }
ColumnToken.prototype = new CSSParserToken;
ColumnToken.prototype.tokenType = "||";

function EOFToken() { return this; }
EOFToken.prototype = new CSSParserToken;
EOFToken.prototype.tokenType = "EOF";
EOFToken.prototype.toCSSString = function() { return ""; }

function DelimToken(code) {
	this.value = stringFromCode(code);
	return this;
}
DelimToken.prototype = new CSSParserToken;
DelimToken.prototype.tokenType = "DELIM";
DelimToken.prototype.toString = function() { return "DELIM("+this.value+")"; }
DelimToken.prototype.toCSSString = function() {
	return (this.value == "\\") ? "\\\n" : this.value;
}

function StringValuedToken() { return this; }
StringValuedToken.prototype = new CSSParserToken;
StringValuedToken.prototype.ASCIIMatch = function(str) {
	return this.value.toLowerCase() == str.toLowerCase();
}

function IdentifierToken(val) {
	this.value = val;
}
IdentifierToken.prototype = new StringValuedToken;
IdentifierToken.prototype.tokenType = "IDENT";
IdentifierToken.prototype.toString = function() { return "IDENT("+this.value+")"; }
IdentifierToken.prototype.toCSSString = function() {
	return escapeIdent(this.value);
}

function FunctionToken(val) {
	this.value = val;
	this.mirror = ")";
}
FunctionToken.prototype = new StringValuedToken;
FunctionToken.prototype.tokenType = "FUNCTION";
FunctionToken.prototype.toString = function() { return "FUNCTION("+this.value+")"; }
FunctionToken.prototype.toCSSString = function() {
	return escapeIdent(this.value) + "(";
}
	
function AtKeywordToken(val) {
	this.value = val;
}
AtKeywordToken.prototype = new StringValuedToken;
AtKeywordToken.prototype.tokenType = "AT-KEYWORD";
AtKeywordToken.prototype.toString = function() { return "AT("+this.value+")"; }
AtKeywordToken.prototype.toCSSString = function() {
	return "@" + escapeIdent(this.value);
}

function HashToken(val) {
	this.value = val;
	this.type = "unrestricted";
}
HashToken.prototype = new StringValuedToken;
HashToken.prototype.tokenType = "HASH";
HashToken.prototype.toString = function() { return "HASH("+this.value+")"; }
HashToken.prototype.toCSSString = function() {
	var escapeValue = (this.type == "id") ? escapeIdent : escapeHash;
	return "#" + escapeValue(this.value);
}

function StringToken(val) {
this.value = val;
}
StringToken.prototype = new StringValuedToken;
StringToken.prototype.tokenType = "STRING";
StringToken.prototype.toString = function() {
	return '"' + escapeString(this.value) + '"';
}

function URLToken(val) {
	this.value = val;
}
URLToken.prototype = new StringValuedToken;
URLToken.prototype.tokenType = "URL";
URLToken.prototype.toString = function() { return "URL("+this.value+")"; }
URLToken.prototype.toCSSString = function() {
	return 'url("' + escapeString(this.value) + '")';
}

function NumberToken() {
	this.value = null;
	this.type = "integer";
	this.repr = "";
}
NumberToken.prototype = new CSSParserToken;
NumberToken.prototype.tokenType = "NUMBER";
NumberToken.prototype.toString = function() {
	if(this.type == "integer")
		return "INT("+this.value+")";
	return "NUMBER("+this.value+")";
}
NumberToken.prototype.toJSON = function() {
	var json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
	json.value = this.value;
	json.type = this.type;
	json.repr = this.repr;
	return json;
}
NumberToken.prototype.toCSSString = function() { return this.repr; };

function PercentageToken() {
	this.value = null;
	this.repr = "";
}
PercentageToken.prototype = new CSSParserToken;
PercentageToken.prototype.tokenType = "PERCENTAGE";
PercentageToken.prototype.toString = function() { return "PERCENTAGE("+this.value+")"; }
PercentageToken.prototype.toCSSString = function() { return this.repr + "%"; }

function DimensionToken() {
	this.value = null;
	this.type = "integer";
	this.repr = "";
	this.unit = "";
}
DimensionToken.prototype = new CSSParserToken;
DimensionToken.prototype.tokenType = "DIMENSION";
DimensionToken.prototype.toString = function() { return "DIM("+this.value+","+this.unit+")"; }
DimensionToken.prototype.toCSSString = function() {
	var source = this.repr;
	var unit = escapeIdent(this.unit);
	if(unit[0].toLowerCase() == "e" && (unit[1] == "-" || between(unit.charCodeAt(1), 0x30, 0x39))) {
		// Unit is ambiguous with scinot
		// Remove the leading "e", replace with escape.
		unit = "\\65 " + unit.slice(1, unit.length);
	}
	return source+unit;
}

function escapeIdent(string) {
	string = ''+string;
	var result = '';
	var firstcode = string.charCodeAt(0);
	for(var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		if(code == 0x0) {
			throw new InvalidCharacterError('Invalid character: the input contains U+0000.');
		}

		if(
			between(code, 0x1, 0x1f) || code == 0x7f ||
			(i == 0 && between(code, 0x30, 0x39)) ||
			(i == 1 && between(code, 0x30, 0x39) && firstcode == 0x2d)
		) {
			result += '\\' + code.toString(16) + ' ';
		} else if(
			code >= 0x80 ||
			code == 0x2d ||
			code == 0x5f ||
			between(code, 0x30, 0x39) ||
			between(code, 0x41, 0x5a) ||
			between(code, 0x61, 0x7a)
		) {
			result += string[i];
		} else {
			result += '\\' + string[i];
		}
	}
	return result;
}

function escapeHash(string) {
	// Escapes the contents of "unrestricted"-type hash tokens.
	// Won't preserve the ID-ness of "id"-type hash tokens;
	// use escapeIdent() for that.
	string = ''+string;
	var result = '';
	var firstcode = string.charCodeAt(0);
	for(var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);
		if(code == 0x0) {
			throw new InvalidCharacterError('Invalid character: the input contains U+0000.');
		}

		if(
			code >= 0x80 ||
			code == 0x2d ||
			code == 0x5f ||
			between(code, 0x30, 0x39) ||
			between(code, 0x41, 0x5a) ||
			between(code, 0x61, 0x7a)
		) {
			result += string[i];
		} else {
			result += '\\' + code.toString(16) + ' ';
		}
	}
	return result;
}

function escapeString(string) {
	string = ''+string;
	var result = '';
	for(var i = 0; i < string.length; i++) {
		var code = string.charCodeAt(i);

		if(code == 0x0) {
			throw new InvalidCharacterError('Invalid character: the input contains U+0000.');
		}

		if(between(code, 0x1, 0x1f) || code == 0x7f) {
			result += '\\' + code.toString(16) + ' ';
		} else if(code == 0x22 || code == 0x5c) {
			result += '\\' + string[i];
		} else {
			result += string[i];
		}
	}
	return result;
}

// Exportation.
cssSyntax.tokenize = tokenize;
cssSyntax.IdentToken = IdentifierToken;
cssSyntax.IdentifierToken = IdentifierToken;
cssSyntax.FunctionToken = FunctionToken;
cssSyntax.AtKeywordToken = AtKeywordToken;
cssSyntax.HashToken = HashToken;
cssSyntax.StringToken = StringToken;
cssSyntax.BadStringToken = BadStringToken;
cssSyntax.URLToken = URLToken;
cssSyntax.BadURLToken = BadURLToken;
cssSyntax.DelimToken = DelimToken;
cssSyntax.NumberToken = NumberToken;
cssSyntax.PercentageToken = PercentageToken;
cssSyntax.DimensionToken = DimensionToken;
cssSyntax.IncludeMatchToken = IncludeMatchToken;
cssSyntax.DashMatchToken = DashMatchToken;
cssSyntax.PrefixMatchToken = PrefixMatchToken;
cssSyntax.SuffixMatchToken = SuffixMatchToken;
cssSyntax.SubstringMatchToken = SubstringMatchToken;
cssSyntax.ColumnToken = ColumnToken;
cssSyntax.WhitespaceToken = WhitespaceToken;
cssSyntax.CDOToken = CDOToken;
cssSyntax.CDCToken = CDCToken;
cssSyntax.ColonToken = ColonToken;
cssSyntax.SemicolonToken = SemicolonToken;
cssSyntax.CommaToken = CommaToken;
cssSyntax.OpenParenToken = OpenParenToken;
cssSyntax.CloseParenToken = CloseParenToken;
cssSyntax.OpenSquareToken = OpenSquareToken;
cssSyntax.CloseSquareToken = CloseSquareToken;
cssSyntax.OpenCurlyToken = OpenCurlyToken;
cssSyntax.CloseCurlyToken = CloseCurlyToken;
cssSyntax.EOFToken = EOFToken;
cssSyntax.CSSParserToken = CSSParserToken;
cssSyntax.GroupingToken = GroupingToken;

//
// css parser
//

function TokenStream(tokens) {
	// Assume that tokens is an array.
	this.tokens = tokens;
	this.i = -1;
}
TokenStream.prototype.tokenAt = function(i) {
	if(i < this.tokens.length)
		return this.tokens[i];
	return new EOFToken();
}
TokenStream.prototype.consume = function(num) {
	if(num === undefined) num = 1;
	this.i += num;
	this.token = this.tokenAt(this.i);
	//console.log(this.i, this.token);
	return true;
}
TokenStream.prototype.next = function() {
	return this.tokenAt(this.i+1);
}
TokenStream.prototype.reconsume = function() {
	this.i--;
}

function parseerror(s, msg) {
	console.log("Parse error at token " + s.i + ": " + s.token + ".\n" + msg);
	return true;
}
function donothing(){ return true; };

function consumeAListOfRules(s, topLevel) {
	var rules = new TokenList();
	var rule;
	while(s.consume()) {
		if(s.token instanceof WhitespaceToken) {
			continue;
		} else if(s.token instanceof EOFToken) {
			return rules;
		} else if(s.token instanceof CDOToken || s.token instanceof CDCToken) {
			if(topLevel == "top-level") continue;
			s.reconsume();
			if(rule = consumeAStyleRule(s)) rules.push(rule);
		} else if(s.token instanceof AtKeywordToken) {
			s.reconsume();
			if(rule = consumeAnAtRule(s)) rules.push(rule);
		} else {
			s.reconsume();
			if(rule = consumeAStyleRule(s)) rules.push(rule);
		}
	}
}

function consumeAnAtRule(s) {
	s.consume();
	var rule = new AtRule(s.token.value);
	while(s.consume()) {
		if(s.token instanceof SemicolonToken || s.token instanceof EOFToken) {
			return rule;
		} else if(s.token instanceof OpenCurlyToken) {
			rule.value = consumeASimpleBlock(s);
			return rule;
		} else if(s.token instanceof SimpleBlock && s.token.name == "{") {
			rule.value = s.token;
			return rule;
		} else {
			s.reconsume();
			rule.prelude.push(consumeAComponentValue(s));
		}
	}
}

function consumeAStyleRule(s) {
	var rule = new StyleRule();
	while(s.consume()) {
		if(s.token instanceof EOFToken) {
			parseerror(s, "Hit EOF when trying to parse the prelude of a qualified rule.");
			return;
		} else if(s.token instanceof OpenCurlyToken) {
			rule.value = consumeASimpleBlock(s);
			return rule;
		} else if(s.token instanceof SimpleBlock && s.token.name == "{") {
			rule.value = s.token;
			return rule;
		} else {
			s.reconsume();
			rule.prelude.push(consumeAComponentValue(s));
		}
	}
}

function consumeAListOfDeclarations(s) {
	var decls = new TokenList();
	while(s.consume()) {
		if(s.token instanceof WhitespaceToken || s.token instanceof SemicolonToken) {
			donothing();
		} else if(s.token instanceof EOFToken) {
			return decls;
		} else if(s.token instanceof AtKeywordToken) {
			s.reconsume();
			decls.push(consumeAnAtRule(s));
		} else if(s.token instanceof IdentifierToken) {
			var temp = [s.token];
			while(!(s.next() instanceof SemicolonToken || s.next() instanceof EOFToken))
				temp.push(consumeAComponentValue(s));
			var decl;
			if(decl = consumeADeclaration(new TokenStream(temp))) decls.push(decl);
		} else {
			parseerror(s);
			s.reconsume();
			while(!(s.next() instanceof SemicolonToken || s.next() instanceof EOFToken))
				consumeAComponentValue(s);
		}
	}
}

function consumeADeclaration(s) {
	// Assumes that the next input token will be an ident token.
	s.consume();
	var decl = new Declaration(s.token.value);
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(!(s.next() instanceof ColonToken)) {
		parseerror(s);
		return;
	} else {
		s.consume();
	}
	while(!(s.next() instanceof EOFToken)) {
		decl.value.push(consumeAComponentValue(s));
	}
	var foundImportant = false;
	for(var i = decl.value.length - 1; i >= 0; i--) {
		if(decl.value[i] instanceof WhitespaceToken) {
			continue;
		} else if(decl.value[i] instanceof IdentifierToken && decl.value[i].ASCIIMatch("important")) {
			foundImportant = true;
		} else if(foundImportant && decl.value[i] instanceof DelimToken && decl.value[i].value == "!") {
			decl.value.splice(i, decl.value.length);
			decl.important = true;
			break;
		} else {
			break;
		}
	}
	return decl;
}

function consumeAComponentValue(s) {
	s.consume();
	if(s.token instanceof OpenCurlyToken || s.token instanceof OpenSquareToken || s.token instanceof OpenParenToken)
		return consumeASimpleBlock(s);
	if(s.token instanceof FunctionToken)
		return consumeAFunction(s);
	return s.token;
}

function consumeASimpleBlock(s) {
	var mirror = s.token.mirror;
	var block = new SimpleBlock(s.token.value);
	while(s.consume()) {
		if(s.token instanceof EOFToken || (s.token instanceof GroupingToken && s.token.value == mirror))
			return block;
		else {
			s.reconsume();
			block.value.push(consumeAComponentValue(s));
		}
	}
}

function consumeAFunction(s) {
	var func = new Func(s.token.value);
	while(s.consume()) {
		if(s.token instanceof EOFToken || s.token instanceof CloseParenToken)
			return func;
		else {
			s.reconsume();
			func.value.push(consumeAComponentValue(s));
		}
	}
}

function normalizeInput(input) {
	if(typeof input == "string")
		return new TokenStream(tokenize(input));
	if(input instanceof TokenStream)
		return input;
	if(input.length !== undefined)
		return new TokenStream(input);
	else throw SyntaxError(input);
}

function parseAStylesheet(s) {
	s = normalizeInput(s);
	var sheet = new Stylesheet();
	sheet.value = consumeAListOfRules(s, "top-level");
	return sheet;
}

function parseAListOfRules(s) {
	s = normalizeInput(s);
	return consumeAListOfRules(s);
}

function parseARule(s) {
	s = normalizeInput(s);
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(s.next() instanceof EOFToken) throw SyntaxError();
	if(s.next() instanceof AtKeywordToken) {
		var rule = consumeAnAtRule(s);
	} else {
		var rule = consumeAStyleRule(s);
		if(!rule) throw SyntaxError();
	}
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(s.next() instanceof EOFToken)
		return rule;
	throw SyntaxError();
}

function parseADeclaration(s) {
	s = normalizeInput(s);
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(!(s.next() instanceof IdentifierToken)) throw SyntaxError();
	var decl = consumeADeclaration(s);
	if(!decl) { throw new SyntaxError() }
	return decl;
}

function parseAListOfDeclarations(s) {
	s = normalizeInput(s);
	return consumeAListOfDeclarations(s);
}

function parseAComponentValue(s) {
	s = normalizeInput(s);
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(s.next() instanceof EOFToken) throw SyntaxError();
	var val = consumeAComponentValue(s);
	if(!val) throw SyntaxError();
	while(s.next() instanceof WhitespaceToken) s.consume();
	if(!(s.next() instanceof EOFToken)) throw new SyntaxError();
	return val;
}

function parseAListOfComponentValues(s) {
	s = normalizeInput(s);
	var vals = new TokenList();
	while(true) {
		var val = consumeAComponentValue(s);
		if(val instanceof EOFToken)
			return vals
		else
			vals.push(val);
	}
}

function parseACommaSeparatedListOfComponentValues(s) {
	s = normalizeInput(s);
	var listOfCVLs = new TokenList();
	while(true) {
		var vals = new TokenList();
		while(true) {
			var val = consumeAComponentValue(s);
			if(val instanceof EOFToken) {
				listOfCVLs.push(vals);
				return listOfCVLs;
			} else if(val instanceof CommaToken) {
				listOfCVLs.push(vals);
				break;
			} else {
				vals.push(val);
			}
		}
	}
}

function CSSParserRule() { return this; }
CSSParserRule.prototype.toString = function(indent) {
	return JSON.stringify(this,null,indent);
}

function Stylesheet() {
	this.value = new TokenList();
	return this;
}
Stylesheet.prototype = new CSSParserRule;
Stylesheet.prototype.type = "STYLESHEET";
Stylesheet.prototype.toCSSString = function() { return this.value.toCSSString("\n"); }

function AtRule(name) {
	this.name = name;
	this.prelude = new TokenList();
	this.value = null;
	return this;
}
AtRule.prototype = new CSSParserRule;
AtRule.prototype.toCSSString = function() { 
	if(this.value) {
		return "@" + escapeIdent(this.name) + " " + this.prelude.toCSSString() + this.value.toCSSString(); 
	} else {
		return "@" + escapeIdent(this.name) + " " + this.prelude.toCSSString() + '; '; 
	}
}
AtRule.prototype.toStylesheet = function() {
	return this.asStylesheet || (this.asStylesheet = this.value ? parseAStylesheet(this.value.value) : new Stylesheet());
}

function StyleRule() {
	this.prelude = new TokenList(); this.selector = this.prelude;
	this.value = null;
	return this;
}
StyleRule.prototype = new CSSParserRule;
StyleRule.prototype.type = "STYLE-RULE";
StyleRule.prototype.toCSSString = function() {
	return this.prelude.toCSSString() + this.value.toCSSString();
}
StyleRule.prototype.getSelector = function() {
	return this.prelude;
}
StyleRule.prototype.getDeclarations = function() {
	if(!(this.value instanceof SimpleBlock)) { return new TokenList(); }
	var value = this.value.value; return parseAListOfDeclarations(value);
}


function Declaration(name) {
	this.name = name;
	this.value = new TokenList();
	this.important = false;
	return this;
}
Declaration.prototype = new CSSParserRule;
Declaration.prototype.type = "DECLARATION";
Declaration.prototype.toCSSString = function() {
	return this.name + ':' + this.value.toCSSString() + '; ';
}

function SimpleBlock(type) {
	this.name = type;
	this.value = new TokenList();
	return this;
}
SimpleBlock.prototype = new CSSParserRule;
SimpleBlock.prototype.type = "BLOCK";
SimpleBlock.prototype.toCSSString = function() {
	switch(this.name) {
		case "(":
			return "(" + this.value.toCSSString() + ")";
			
		case "[":
			return "[" + this.value.toCSSString() + "]";
			
		case "{":
			return "{" + this.value.toCSSString() + "}";
		
		default: //best guess
			return this.name + this.value.toCSSString() + this.name;
	}
}

function Func(name) {
	this.name = name;
	this.value = new TokenList();
	return this;
}
Func.prototype = new CSSParserRule;
Func.prototype.type = "FUNCTION";
Func.prototype.toCSSString = function() {
	return this.name+'('+this.value.toCSSString()+')';
}
Func.prototype.getArguments = function() {
	var args = new TokenList(); var arg = new TokenList(); var value = this.value;
	for(var i = 0; i<value.length; i++) {
		if(value[i].tokenType == ',') {
			args.push(arg); arg = new TokenList();
		} else {
			arg.push(value[i])
		}
	}
	if(args.length > 0 || arg.length > 0) { args.push(arg); }
	return args;
}

function FuncArg() {
	this.value = new TokenList();
	return this;
}
FuncArg.prototype = new CSSParserRule;
FuncArg.prototype.type = "FUNCTION-ARG";
FuncArg.prototype.toCSSString = function() {
	return this.value.toCSSString()+', ';
}

// Exportation.
cssSyntax.CSSParserRule = CSSParserRule;
cssSyntax.Stylesheet = Stylesheet;
cssSyntax.AtRule = AtRule;
cssSyntax.StyleRule = StyleRule;
cssSyntax.Declaration = Declaration;
cssSyntax.SimpleBlock = SimpleBlock;
cssSyntax.Func = Func;
cssSyntax.parseAStylesheet = parseAStylesheet;
cssSyntax.parseAListOfRules = parseAListOfRules;
cssSyntax.parseARule = parseARule;
cssSyntax.parseADeclaration = parseADeclaration;
cssSyntax.parseAListOfDeclarations = parseAListOfDeclarations;
cssSyntax.parseAComponentValue = parseAComponentValue;
cssSyntax.parseAListOfComponentValues = parseAListOfComponentValues;
cssSyntax.parseACommaSeparatedListOfComponentValues = parseACommaSeparatedListOfComponentValues;
cssSyntax.parse = parseAStylesheet;
cssSyntax.parseCSSValue = parseAListOfComponentValues;

return cssSyntax;

}());

require.define('src/core/css-syntax.js');

////////////////////////////////////////

void function() {
	
	// request animation frame
    var vendors = ['webkit', 'moz', 'ms', 'o'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
        var vp = vendors[i];
        window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
        window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame'] || window[vp+'CancelRequestAnimationFrame']);
    }
    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
		
		// tick every 16ms
        var listener_index = 0; var listeners = []; var tmp = []; var tick = function() {
			var now = +(new Date()); var callbacks = listeners; listeners = tmp;
			for(var i = 0; i<callbacks.length; i++) { callbacks[i](now); }
			listener_index += callbacks.length; callbacks.length = 0; tmp = callbacks;
			setTimeout(tick, 16);
		}; tick();
		
		// add a listener
        window.requestAnimationFrame = function(callback) {
            return listener_index + listeners.push(callback);
        };
		
		// remove a listener
        window.cancelAnimationFrame = function(index) {
			index -= listener_index; if(index >= 0 && index < listeners.length) {
				listeners[index] = function() {};
			}
		};
		
    }
	
	// setImmediate
	if(!window.setImmediate) {
		window.setImmediate = function(f) { return setTimeout(f, 0) };
		window.cancelImmediate = clearTimeout;
	}
	
}();

require.define('src/core/polyfill-dom-requestAnimationFrame.js');

////////////////////////////////////////

/////////////////////////////////////////////////////////////////
////                                                         ////
////                 prerequirements of qSL                  ////
////                                                         ////
/////////////////////////////////////////////////////////////////
////                                                         ////
////   Please note that I require querySelectorAll to work   ////
////                                                         ////
////   See http://github.com/termi/CSS_selector_engine/      ////
////   for a polyfill for older browsers                     ////
////                                                         ////
/////////////////////////////////////////////////////////////////

// TODO: improve event streams
// - look for a few optimizations ideas in gecko/webkit
// - use arrays in CompositeEventStream to avoid nested debouncings
module.exports = (function(window, document) { "use strict";

	///
	/// event stream implementation
	/// please note this is required to 'live update' the qSA requests
	///
	function EventStream(connect, disconnect, reconnect) {
		var self=this;
		
		// validate arguments
		if(!disconnect) disconnect=function(){};
		if(!reconnect) reconnect=connect;
		
		// high-level states
		var isConnected=false;
		var isDisconnected=false;
		var shouldDisconnect=false;
		
		// global variables
		var callback=null;
		var yieldEvent = function() {
			
			// call the callback function, and pend disposal
			shouldDisconnect=true;
			try { callback && callback(self); } catch(ex) { setImmediate(function() { throw ex; }); }
			
			// if no action was taken, dispose
			if(shouldDisconnect) { dispose(); }
			
		}
		
		// export the interface
		var schedule = this.schedule = function(newCallback) {
		
			// do not allow to schedule on disconnected event streams
			if(isDisconnected) { throw new Error("Cannot schedule on a disconnected event stream"); }
			
			// do not allow to schedule on already scheduled event streams
			if(isConnected && !shouldDisconnect) { throw new Error("Cannot schedule on an already-scheduled event stream"); }
			
			// schedule the new callback
			callback=newCallback; shouldDisconnect=false;
			
			// reconnect to the stream
			if(isConnected) {
				reconnect(yieldEvent);
			} else {
				connect(yieldEvent);
				isConnected=true;
			}
		}
		
		var dispose = this.dispose = function() {
		
			// do not allow to dispose non-connected streams
			if(isConnected) {
			
				// disconnect & save resources
				disconnect(); 
				self=null; yieldEvent=null; callback=null; 
				isConnected=false; isDisconnected=true; shouldDisconnect=false;
				
			}
		}
	}

	///
	/// call a function every frame
	///
	function AnimationFrameEventStream(options) {
		
		// flag that says whether the observer is still needed or not
		var rid = 0;
			
		// start the event stream
		EventStream.call(
			this, 
			function connect(yieldEvent) { rid = requestAnimationFrame(yieldEvent); },
			function disconnect() { cancelAnimationFrame(rid); }
		);
		
	}

	///
	/// call a function every timeout
	///
	function TimeoutEventStream(options) {
		
		// flag that says whether the observer is still needed or not
		var rid = 0; var timeout=(typeof(options)=="number") ? (+options) : ("timeout" in options ? +options.timeout : 333);
			
		// start the event stream
		EventStream.call(
			this, 
			function connect(yieldEvent) { rid = setTimeout(yieldEvent, timeout); },
			function disconnect() { clearTimeout(rid); }
		);
		
	}

	///
	/// call a function every time the mouse moves
	///
	function MouseEventStream() {
		var self=this; var pointermove = (("PointerEvent" in window) ? "pointermove" : (("MSPointerEvent" in window) ? "MSPointerMove" : "mousemove"));

		// flag that says whether the event is still observed or not
		var scheduled = false; var interval=0;
		
		// handle the synchronous nature of mutation events
		var yieldEvent=null;
		var yieldEventDelayed = function() {
			if(scheduled) return;
			window.removeEventListener(pointermove, yieldEventDelayed, true);
			scheduled = requestAnimationFrame(yieldEvent);
		}
		
		// start the event stream
		EventStream.call(
			this, 
			function connect(newYieldEvent) {
				yieldEvent=newYieldEvent;
				window.addEventListener(pointermove, yieldEventDelayed, true);
			},
			function disconnect() { 
				window.removeEventListener(pointermove, yieldEventDelayed, true);
				cancelAnimationFrame(scheduled); yieldEventDelayed=null; yieldEvent=null; scheduled=false;
			},
			function reconnect(newYieldEvent) { 
				yieldEvent=newYieldEvent; scheduled=false;
				window.addEventListener(pointermove, yieldEventDelayed, true);
			}
		);
		
	}

	///
	/// call a function every time the mouse is clicked/unclicked
	///
	function MouseButtonEventStream() {
		var self=this; 
		var pointerup = (("PointerEvent" in window) ? "pointerup" : (("MSPointerEvent" in window) ? "MSPointerUp" : "mouseup"));
		var pointerdown = (("PointerEvent" in window) ? "pointerdown" : (("MSPointerEvent" in window) ? "MSPointerDown" : "mousedown"));

		// flag that says whether the event is still observed or not
		var scheduled = false; var interval=0;
		
		// handle the synchronous nature of mutation events
		var yieldEvent=null;
		var yieldEventDelayed = function() {
			if(scheduled) return;
			window.removeEventListener(pointerup, yieldEventDelayed, true);
			window.removeEventListener(pointerdown, yieldEventDelayed, true);
			scheduled = requestAnimationFrame(yieldEvent);
		}
		
		// start the event stream
		EventStream.call(
			this, 
			function connect(newYieldEvent) {
				yieldEvent=newYieldEvent;
				window.addEventListener(pointerup, yieldEventDelayed, true);
				window.addEventListener(pointerdown, yieldEventDelayed, true);
			},
			function disconnect() { 
				window.removeEventListener(pointerup, yieldEventDelayed, true);
				window.removeEventListener(pointerdown, yieldEventDelayed, true);
				cancelAnimationFrame(scheduled); yieldEventDelayed=null; yieldEvent=null; scheduled=false;
			},
			function reconnect(newYieldEvent) { 
				yieldEvent=newYieldEvent; scheduled=false;
				window.addEventListener(pointerup, yieldEventDelayed, true);
				window.addEventListener(pointerdown, yieldEventDelayed, true);
			}
		);
		
	}

	///
	/// call a function whenever the DOM is modified
	///
	var DOMUpdateEventStream;
	if("MutationObserver" in window) {
		DOMUpdateEventStream = function DOMUpdateEventStream(options) {
			 
			// configuration of the observer
			if(options) {
				var target = "target" in options ? options.target : document.documentElement;
				var config = { 
					subtree: "subtree" in options ? !!options.subtree : true, 
					attributes: "attributes" in options ? !!options.attributes : true, 
					childList: "childList" in options ? !!options.childList : true, 
					characterData: "characterData" in options ? !!options.characterData : false
				};
			} else {
				var target = document.documentElement;
				var config = { 
					subtree: true, 
					attributes: true, 
					childList: true, 
					characterData: false
				};
			}
								
			// start the event stream
			var observer = null;
			EventStream.call(
				this, 
				function connect(yieldEvent) { if(config) { observer=new MutationObserver(yieldEvent); observer.observe(target,config); target=null; config=null; } },
				function disconnect() { observer && observer.disconnect(); observer=null; },
				function reconnect() { observer.takeRecords(); }
			);

		}
	} else if("MutationEvent" in window) {
		DOMUpdateEventStream = function DOMUpdateEventStream(options) {
			var self=this;

			// flag that says whether the event is still observed or not
			var scheduled = false;
			
			// configuration of the observer
			if(options) {
				var target = "target" in options ? options.target : document.documentElement;
			} else {
				var target = document.documentElement;
			}
			
			// handle the synchronous nature of mutation events
			var yieldEvent=null;
			var yieldEventDelayed = function() {
				if(scheduled || !yieldEventDelayed) return;
				document.removeEventListener("DOMContentLoaded", yieldEventDelayed, false);
				document.removeEventListener("DOMContentLoaded", yieldEventDelayed, false);
				target.removeEventListener("DOMSubtreeModified", yieldEventDelayed, false);
				scheduled = requestAnimationFrame(yieldEvent);
			}
			
			// start the event stream
			EventStream.call(
				this, 
				function connect(newYieldEvent) {
					yieldEvent=newYieldEvent;
					document.addEventListener("DOMContentLoaded", yieldEventDelayed, false);
					target.addEventListener("DOMSubtreeModified", yieldEventDelayed, false);
				},
				function disconnect() { 
					document.removeEventListener("DOMContentLoaded", yieldEventDelayed, false);
					target.removeEventListener("DOMSubtreeModified", yieldEventDelayed, false);
					cancelAnimationFrame(scheduled); yieldEventDelayed=null; yieldEvent=null; scheduled=false;
				},
				function reconnect(newYieldEvent) { 
					yieldEvent=newYieldEvent; scheduled=false;
					target.addEventListener("DOMSubtreeModified", yieldEventDelayed, false);
				}
			);
			
		}
	} else {
		DOMUpdateEventStream = AnimationFrameEventStream;
	}

	///
	/// call a function every time the focus shifts
	///
	function FocusEventStream() {
		var self=this;
		
		// handle the filtering nature of focus events
		var yieldEvent=null; var previousActiveElement=null; var previousHasFocus=false; var rid=0;
		var yieldEventDelayed = function() {
			
			// if the focus didn't change
			if(previousActiveElement==document.activeElement && previousHasFocus==document.hasFocus()) {
				
				// then do not generate an event
				setTimeout(yieldEventDelayed, 333); // focus that didn't move is expected to stay
				
			} else {
				
				// else, generate one & save config
				previousActiveElement=document.activeElement;
				previousHasFocus=document.hasFocus();
				yieldEvent();
				
			}
		}
		
		// start the event stream
		EventStream.call(
			this, 
			function connect(newYieldEvent) {
				yieldEvent=newYieldEvent;
				rid=setTimeout(yieldEventDelayed, 500); // let the document load
			},
			function disconnect() { 
				clearTimeout(rid); yieldEventDelayed=null; yieldEvent=null; rid=0;
			},
			function reconnect(newYieldEvent) { 
				yieldEvent=newYieldEvent;
				rid=setTimeout(yieldEventDelayed, 100); // focus by tab navigation moves fast
			}
		);
		
	}

	///
	/// composite event stream
	/// because sometimes you need more than one event source
	///
	function CompositeEventStream(stream1, stream2) {
		var self=this;
		
		// fields
		var yieldEvent=null; var s1=false, s2=false;
		var yieldEventWrapper=function(s) { 
			if(s==stream1) s1=true;
			if(s==stream2) s2=true;
			if(s1&&s2) return;
			yieldEvent(self);
		}
		
		// start the event stream
		EventStream.call(
			this, 
			function connect(newYieldEvent) {
				yieldEvent=newYieldEvent;
				stream1.schedule(yieldEventWrapper);
				stream2.schedule(yieldEventWrapper);
			},
			function disconnect() { 
				stream1.dispose();
				stream2.dispose();
			},
			function reconnect(newYieldEvent) { 
				yieldEvent=newYieldEvent;
				s1 && stream1.schedule(yieldEventWrapper);
				s2 && stream2.schedule(yieldEventWrapper);
				s1 = s2 = false;
			}
		);
	}
	
	return {
		EventStream:                EventStream,
		AnimationFrameEventStream:  AnimationFrameEventStream,
		TimeoutEventStream:         TimeoutEventStream,
		MouseEventStream:           MouseEventStream,
		MouseButtonEventStream:     MouseButtonEventStream,
		DOMUpdateEventStream:       DOMUpdateEventStream,
		FocusEventStream:           FocusEventStream,
		CompositeEventStream:       CompositeEventStream
	};

})(window, document);
require.define('src/core/dom-experimental-event-streams.js');

////////////////////////////////////////

/////////////////////////////////////////////////////////////////
////                                                         ////
////                  Implementation of qSL                  ////
////                                                         ////
/////////////////////////////////////////////////////////////////
////                                                         ////
////   Please note that I require querySelectorAll to work   ////
////                                                         ////
////   See http://github.com/termi/CSS_selector_engine/      ////
////   for a polyfill for older browsers                     ////
////                                                         ////
/////////////////////////////////////////////////////////////////

module.exports = (function(window, document) { "use strict";

	// import dependencies
	var eventStreams = require('src/core/dom-experimental-event-streams.js'),
	    DOMUpdateEventStream = eventStreams.DOMUpdateEventStream,
		AnimationFrameEventStream = eventStreams.AnimationFrameEventStream,
		CompositeEventStream = eventStreams.CompositeEventStream,
		FocusEventStream = eventStreams.FocusEventStream,
		MouseButtonEventStream = eventStreams.MouseButtonEventStream,
		TimeoutEventStream = eventStreams.TimeoutEventStream,
		MouseEventStream = eventStreams.MouseEventStream;

	///
	/// the live querySelectorAll implementation
	///
	function querySelectorLive(selector, handler, root) {
		
		// restrict the selector coverage to some part of the DOM only
		var root = root || document;
		
		// TODO: make use of "mutatedAncestorElement" to update only elements inside the mutated zone
		
		var currentElms = [];
		var loop = function loop(eventStream) {
			
			// schedule next run
			eventStream.schedule(loop);
			
			// update elements matching the selector
			var newElms = [];
			var oldElms = currentElms.slice(0);
			var temps = root.querySelectorAll(selector);
			for(var i=newElms.length=temps.length; i;) { newElms.push(temps[--i]); }
			currentElms = newElms.slice(0); temps=null;
			
			// first let's clear all elements that have been removed from the document
			oldElms = oldElms.filter(function(e) {
				
				// check whether the current element is still there
				var isStillInDocument = (
					e===document.documentElement 
					|| document.documentElement.contains(e)
				);
				
				if(isStillInDocument) {
					
					// NEED_COMPARE: we will compare this element to the new list
					return true;
					
				} else {
					
					// DELETE: raise onremoved, pop old elements
					try { handler.onremoved && handler.onremoved(e); } catch(ex) { setImmediate(function() {throw ex})}
					return false;
					
				}
				
			});
			
			// now pop and match until both lists are exhausted
			// (we use the fact the returned elements are in document order)
			var el1 = oldElms.pop();
			var el2 = newElms.pop();
			while(el1 || el2) {
				if(el1===el2) {
				
					// MATCH: pop both elements
					el1 = oldElms.pop();
					el2 = newElms.pop();
					
				} else if (el2 && /*el1 is after el2*/(!el1||(el2.compareDocumentPosition(el1) & (1|2|8|32))===0)) {
					
					// INSERT: raise onadded, pop new elements
					try { handler.onadded && handler.onadded(el2); } catch(ex) { setImmediate(function() {throw ex})}
					el2 = newElms.pop();
					
				} else {
				
					// DELETE: raise onremoved, pop old elements
					try { handler.onremoved && handler.onremoved(el1); } catch(ex) { setImmediate(function() {throw ex})}
					el1 = oldElms.pop();
					
				}
			}
			
		};
		
		// use the event stream that best matches our needs
		var simpleSelector = selector.replace(/:(dir|lang|root|empty|blank|nth-child|nth-last-child|first-child|last-child|only-child|nth-of-type|nth-last-of-child|fist-of-type|last-of-type|only-of-type|not|matches|default)\b/gi,'')
		var eventStream; if(simpleSelector.indexOf(':') == -1) {
			
			// static stuff only
			eventStream = new DOMUpdateEventStream({target:root}); 
			
		} else {
			
			// dynamic stuff too
			eventStream = new DOMUpdateEventStream({target:root}); 
			if(DOMUpdateEventStream != AnimationFrameEventStream) {
			
				// detect the presence of focus-related pseudo-classes
				var reg = /:(focus|active)\b/gi;
				if(reg.test(simpleSelector)) {
					
					// mouse events should be listened
					eventStream = new CompositeEventStream(
						new FocusEventStream(),
						eventStream
					);
					
					// simplify simpleSelector
					var reg = /:(focus)\b/gi;
					simpleSelector = simpleSelector.replace(reg, ''); // :active has other hooks
					
				}
				
				// detect the presence of mouse-button-related pseudo-classes
				var reg = /:(active)\b/gi;
				if(reg.test(simpleSelector)) {
					
					// mouse events should be listened
					eventStream = new CompositeEventStream(
						new MouseButtonEventStream(),
						eventStream
					);
					
					// simplify simpleSelector
					simpleSelector = simpleSelector.replace(reg, '');
					
				}

				// detect the presence of user input pseudo-classes
				var reg = /:(target|checked|indeterminate|valid|invalid|in-range|out-of-range|user-error)\b/gi;
				if(reg.test(simpleSelector)) {
					
					// slowly dynamic stuff do happen
					eventStream = new CompositeEventStream(
						new TimeoutEventStream(250),
						eventStream
					);
					
					// simplify simpleSelector
					simpleSelector = simpleSelector.replace(reg, '');

					var reg = /:(any-link|link|visited|local-link|enabled|disabled|read-only|read-write|required|optional)\b/gi;
					// simplify simpleSelector
					simpleSelector = simpleSelector.replace(reg, '');
					
				}
				
				// detect the presence of nearly-static pseudo-classes
				var reg = /:(any-link|link|visited|local-link|enabled|disabled|read-only|read-write|required|optional)\b/gi;
				if(reg.test(simpleSelector)) {
					
					// nearly static stuff do happen
					eventStream = new CompositeEventStream(
						new TimeoutEventStream(333),
						eventStream
					);
					
					// simplify simpleSelector
					simpleSelector = simpleSelector.replace(reg, '');
					
				}
				
				// detect the presence of mouse-related pseudo-classes
				var reg = /:(hover)\b/gi;
				if(reg.test(simpleSelector)) {
					
					// mouse events should be listened
					eventStream = new CompositeEventStream(
						new MouseEventStream(),
						eventStream
					);
					
					// simplify simpleSelector
					simpleSelector = simpleSelector.replace(reg, '');
					
				}
				
				// detect the presence of unknown pseudo-classes
				if(simpleSelector.indexOf(':') !== -1) {
					
					// other stuff do happen, too (let's give up on events)
					eventStream = new AnimationFrameEventStream(); 
					
				}
				
			}
			
		}
		
		// start handling changes
		loop(eventStream);
		
	}
	
	return querySelectorLive;
	
})(window, document);
require.define('src/core/dom-query-selector-live.js');

////////////////////////////////////////

// TODO: comment about the 'no_auto_stylesheet_detection' flag?

module.exports = (function(window, document) { "use strict";
	
	// import dependencies
	require('src/core/polyfill-dom-console.js');
	require('src/core/polyfill-dom-requestAnimationFrame.js');
	var cssSyntax = require('src/core/css-syntax.js');
	var domEvents = require('src/core/dom-events.js');
	var querySelectorLive = require('src/core/dom-query-selector-live.js');
	
	// define the module
	var cssCascade = {
		
		//
		// returns the priority of a unique selector (NO COMMA!)
		// { the return value is an integer, with the same formula as webkit }
		//
		computeSelectorPriorityOf: function computeSelectorPriorityOf(selector) {
			if(typeof selector == "string") selector = cssSyntax.parse(selector.trim()+"{}").value[0].selector;
			
			var numberOfIDs = 0;
			var numberOfClasses = 0;
			var numberOfTags = 0;
			
			// TODO: improve this parser, or find one on the web
			for(var i = 0; i < selector.length; i++) {
				
				if(selector[i] instanceof cssSyntax.IdentifierToken) {
					numberOfTags++;
					
				} else if(selector[i] instanceof cssSyntax.DelimToken) {
					if(selector[i].value==".") {
						numberOfClasses++; i++;
					}
					
				} else if(selector[i] instanceof cssSyntax.ColonToken) {
					if(selector[++i] instanceof cssSyntax.ColonToken) {
						numberOfTags++; i++;
						
					} else if((selector[i] instanceof cssSyntax.Func) && (/^(not|matches)$/i).test(selector[i].name)) {
						var nestedPriority = this.computeSelectorPriorityOf(selector[i].value);
						numberOfTags += nestedPriority % 256; nestedPriority /= 256;
						numberOfClasses += nestedPriority % 256; nestedPriority /= 256;
						numberOfIDs += nestedPriority;
						
					} else {
						numberOfClasses++;
						
					}
					
				} else if(selector[i] instanceof cssSyntax.SimpleBlock) {
					if(selector[i].name=="[") {
						numberOfClasses++;
					}
					
				} else if(selector[i] instanceof cssSyntax.HashToken) {
					numberOfIDs++;
					
				} else {
					// TODO: stop ignoring unknown symbols?
					
				}
				
			}
			
			if(numberOfIDs>255) numberOfIDs=255;
			if(numberOfClasses>255) numberOfClasses=255;
			if(numberOfTags>255) numberOfTags=255;
			
			return ((numberOfIDs*256)+numberOfClasses)*256+numberOfTags;
			
		},
		
		//
		// returns an array of the css rules matching an element
		//
		findAllMatchingRules: function findAllMatchingRules(element) {
			return this.findAllMatchingRulesWithPseudo(element);
		},
		
		//
		// returns an array of the css rules matching a pseudo-element
		//
		findAllMatchingRulesWithPseudo: function findAllMatchingRules(element,pseudo) {
			pseudo = pseudo ? (''+pseudo).toLowerCase() : pseudo;
			
			// let's look for new results if needed...
			var results = [];
			
			// walk the whole stylesheet...
			var visit = function(rules) {
				try {
					for(var r = rules.length; r--; ) {
						var rule = rules[r]; 
						
						// media queries hook
						if(rule.disabled) continue;
						
						if(rule instanceof cssSyntax.StyleRule) {
							
							// consider each selector independently
							var subrules = rule.subRules || cssCascade.splitRule(rule);
							for(var sr = subrules.length; sr--; ) {
								
								var selector = subrules[sr].selector.toCSSString().replace(/ *(\/\*\*\/|  ) */g,' ').trim();
								if(pseudo) {
									// WE ONLY ACCEPT SELECTORS ENDING WITH THE PSEUDO
									var selectorLow = selector.toLowerCase();
									var newLength = selector.length-pseudo.length-1;
									if(newLength<=0) continue;
									
									if(selectorLow.lastIndexOf('::'+pseudo)==newLength-1) {
										selector = selector.substr(0,newLength-1);
									} else if(selectorLow.lastIndexOf(':'+pseudo)==newLength) {
										selector = selector.substr(0,newLength);
									} else {
										continue;
									}
									
									// fix selectors like "#element > :first-child ~ ::before"
									if(selector.trim().length == 0) { selector = '*' }
									else if(selector[selector.length-1] == ' ') { selector += '*' }
									else if(selector[selector.length-1] == '+') { selector += '*' }
									else if(selector[selector.length-1] == '>') { selector += '*' }
									else if(selector[selector.length-1] == '~') { selector += '*' }
									
								}
								
								// look if the selector matches
								var isMatching = false;
								try {
									if(element.matches) isMatching=element.matches(selector)
									else if(element.matchesSelector) isMatching=element.matchesSelector(selector)
									else if(element.oMatchesSelector) isMatching=element.oMatchesSelector(selector)
									else if(element.msMatchesSelector) isMatching=element.msMatchesSelector(selector)
									else if(element.mozMatchesSelector) isMatching=element.mozMatchesSelector(selector)
									else if(element.webkitMatchesSelector) isMatching=element.webkitMatchesSelector(selector)
									else { throw new Error("no element.matches?") }
								} catch(ex) { debugger; setImmediate(function() { throw ex; }) }
								
								// if yes, add it to the list of matched selectors
								if(isMatching) { results.push(subrules[sr]); }
								
							}
							
						} else if(rule instanceof cssSyntax.AtRule && rule.name=="media") {
							
							// visit them
							visit(rule.toStylesheet().value);
							
						}
						
					}
				} catch (ex) {
					setImmediate(function() { throw ex; });
				}
			}
			
			for(var s=cssCascade.stylesheets.length; s--; ) {
				var rules = cssCascade.stylesheets[s];
				visit(rules);
			}
			
			return results;
		},
		
		//
		// a list of all properties supported by the current browser
		//
		allCSSProperties: null,
		getAllCSSProperties: function getAllCSSProperties() {
			
			if(this.allCSSProperties) return this.allCSSProperties;
			
			// get all claimed properties
			var s = getComputedStyle(document.documentElement); var ps = new Array(s.length);
			for(var i=s.length; i--; ) {
				ps[i] = s[i];
			}
			
			// FIX A BUG WHERE WEBKIT DOESN'T REPORT ALL PROPERTIES
			if(ps.indexOf('content')==-1) {ps.push('content');}
			if(ps.indexOf('counter-reset')==-1) {
				
				ps.push('counter-reset');
				ps.push('counter-increment');
				
				// FIX A BUG WHERE WEBKIT RETURNS SHIT FOR THE COMPUTED VALUE OF COUNTER-RESET
				cssCascade.computationUnsafeProperties['counter-reset']=true;
				
			}
			
			// save in a cache for faster access the next times
			return this.allCSSProperties = ps;
			
		},
		
		// 
		// those properties are not safe for computation->specified round-tripping
		// 
		computationUnsafeProperties: {
			"bottom"          : true,
			"direction"       : true,
			"display"         : true,
			"font-size"       : true,
			"height"          : true,
			"left"            : true,
			"line-height"     : true,
			"margin-left"     : true,
			"margin-right"    : true,
			"margin-bottom"   : true,
			"margin-top"      : true,
			"max-height"      : true,
			"max-width"       : true,
			"min-height"      : true,
			"min-width"       : true,
			"padding-left"    : true,
			"padding-right"   : true,
			"padding-bottom"  : true,
			"padding-top"     : true,
			"right"           : true,
			"text-align"      : true,
			"text-align-last" : true,
			"top"             : true,
			"width"           : true,
			__proto__         : null,
		},
		
		//
		// a list of property we should inherit...
		//
		inheritingProperties: {
			"border-collapse"       : true,
			"border-spacing"        : true,
			"caption-side"          : true,
			"color"                 : true,
			"cursor"                : true,
			"direction"             : true,
			"empty-cells"           : true,
			"font-family"           : true,
			"font-size"             : true,
			"font-style"            : true,
			"font-variant"          : true,
			"font-weight"           : true,
			"font"                  : true,
			"letter-spacing"        : true,
			"line-height"           : true,
			"list-style-image"      : true,
			"list-style-position"   : true,
			"list-style-type"       : true,
			"list-style"            : true,
			"orphans"               : true,
			"quotes"                : true,
			"text-align"            : true,
			"text-indent"           : true,
			"text-transform"        : true,
			"visibility"            : true,
			"white-space"           : true,
			"widows"                : true,
			"word-break"            : true,
			"word-spacing"          : true,
			"word-wrap"             : true,
			__proto__               : null,
		},
		
		//
		// returns the default style for a tag
		//
		defaultStylesForTag: Object.create ? Object.create(null) : {},
		getDefaultStyleForTag: function getDefaultStyleForTag(tagName) {
			
			// get result from cache
			var result = this.defaultStylesForTag[tagName];
			if(result) return result;
			
			// create dummy virtual element
			var element = document.createElement(tagName);
			var style = this.defaultStylesForTag[tagName] = getComputedStyle(element);
			if(style.display) return style;
			
			// webkit fix: insert the dummy element anywhere (head -> display:none)
			document.head.insertBefore(element, document.head.firstChild);
			return style;
		},
		
		// 
		// returns the specified style of an element. 
		// REMARK: may or may not unwrap "inherit" and "initial" depending on implementation
		// REMARK: giving "matchedRules" as a parameter allow you to mutualize the "findAllMatching" rules calls
		// 
		getSpecifiedStyle: function getSpecifiedStyle(element, cssPropertyName, matchedRules) {
			
			// hook for css regions
			var fragmentSource;
			if(fragmentSource=element.getAttribute('data-css-regions-fragment-of')) {
				fragmentSource = document.querySelector('[data-css-regions-fragment-source="'+fragmentSource+'"]');
				if(fragmentSource) return cssCascade.getSpecifiedStyle(fragmentSource, cssPropertyName);
			}
			
			// give IE a thumbs up for this!
			if(element.currentStyle && !window.opera) {
				
				// ask IE to manage the style himself...
				var bestValue = element.myStyle[cssPropertyName] || element.currentStyle[cssPropertyName] || '';
				
				// return a parsed representation of the value
				return cssSyntax.parseAListOfComponentValues(bestValue);
				
			} else {
				
				// TODO: support the "initial" and "inherit" things?
				
				// first, let's try inline style as it's fast and generally accurate
				// TODO: what if important rules override that?
				try {
					if(bestValue = element.style.getPropertyValue(cssPropertyName) || element.myStyle[cssPropertyName]) {
						return cssSyntax.parseAListOfComponentValues(bestValue);
					}
				} catch(ex) {}
				
				// find all relevant style rules
				var isBestImportant=false; var bestPriority = 0; var bestValue = new cssSyntax.TokenList();
				var rules = matchedRules || (
					cssPropertyName in cssCascade.monitoredProperties
					? element.myMatchedRules || []
					: cssCascade.findAllMatchingRules(element)
				);
				
				var visit = function(rules) {
					
					for(var i=rules.length; i--; ) {
						
						// media queries hook
						if(rules[i].disabled) continue;
						
						// find a relevant declaration
						if(rules[i] instanceof cssSyntax.StyleRule) {
							var decls = rules[i].getDeclarations();
							for(var j=decls.length-1; j>=0; j--) {
								if(decls[j].type=="DECLARATION") {
									if(decls[j].name==cssPropertyName) {
										// only works if selectors containing a "," are deduplicated
										var currentPriority = cssCascade.computeSelectorPriorityOf(rules[i].selector);
										
										if(isBestImportant) {
											// only an important declaration can beat another important declaration
											if(decls[j].important) {
												if(currentPriority >= bestPriority) {
													bestPriority = currentPriority;
													bestValue = decls[j].value;
												}
											}
										} else {
											// an important declaration beats any non-important declaration
											if(decls[j].important) {
												isBestImportant = true;
												bestPriority = currentPriority;
												bestValue = decls[j].value;
											} else {
												// the selector priority has to be higher otherwise
												if(currentPriority >= bestPriority) {
													bestPriority = currentPriority;
													bestValue = decls[j].value;
												}
											}
										}
									}
								}
							}
						} else if((rules[i] instanceof cssSyntax.AtRule) && (rules[i].name=="media")) {
							
							// visit them
							visit(rules[i].toStylesheet())
							
						}
						
					}
					
				}
				visit(rules);
				
				// return our best guess...
				return bestValue||null;
				
			}
			
		},
		
		
		//
		// start monitoring a new stylesheet
		// (should usually not be used because stylesheets load automatically)
		//
		stylesheets: [],
		loadStyleSheet: function loadStyleSheet(cssText,i) {
			
			// load in order
			
			// parse the stylesheet content
			var rules = cssSyntax.parse(cssText).value;
			
			// add the stylesheet into the object model
			if(typeof(i)!=="undefined") { cssCascade.stylesheets[i]=rules; } 
			else { i=cssCascade.stylesheets.push(rules);}
			
			// make sure to monitor the required rules
			cssCascade.startMonitoringStylesheet(rules)
			
		},
		
		//
		// start monitoring a new stylesheet
		// (should usually not be used because stylesheets load automatically)
		//
		loadStyleSheetTag: function loadStyleSheetTag(stylesheet,i) {
			
			if(stylesheet.hasAttribute('data-css-polyfilled')) {
				return;
			}
			
			if(stylesheet.tagName=='LINK') {
				
				// oh, no, we have to download it...
				try {
					
					// dummy value in-between
					cssCascade.stylesheets[i] = new cssSyntax.TokenList();
					
					//
					var xhr = new XMLHttpRequest(); xhr.href = stylesheet.href;
					xhr.open('GET',stylesheet.href,true); xhr.ruleIndex = i; 
					xhr.onreadystatechange = function() {
						if(this.readyState==4) { 
							
							// status 0 is a webkit bug for local files
							if(this.status==200||this.status==0) {
								cssCascade.loadStyleSheet(this.responseText,this.ruleIndex)
							} else {
								cssConsole.log("css-cascade polyfill failled to load: " + this.href);
							}
						}
					};
					xhr.send();
					
				} catch(ex) {
					cssConsole.log("css-cascade polyfill failled to load: " + stylesheet.href);
				}
				
			} else {
				
				// oh, cool, we just have to parse the content!
				cssCascade.loadStyleSheet(stylesheet.textContent,i);
				
			}
			
			// mark the stylesheet as ok
			stylesheet.setAttribute('data-css-polyfilled',true);
			
		},
		
		//
		// calling this function will load all currently existing stylesheets in the document
		// (should usually not be used because stylesheets load automatically)
		//
		selectorForStylesheets: "style:not([data-no-css-polyfill]):not([data-css-polyfilled]), link[rel=stylesheet]:not([data-no-css-polyfill]):not([data-css-polyfilled])",
		loadAllStyleSheets: function loadAllStyleSheets() {
			
			// for all stylesheets in the <head> tag...
			var head = document.head || document.documentElement;
			var stylesheets = head.querySelectorAll(cssCascade.selectorForStylesheets);
			
			var intialLength = this.stylesheets.length;
			this.stylesheets.length += stylesheets.length
			
			// for all of them...
			for(var i = stylesheets.length; i--;) {
				
				// 
				// load the stylesheet
				// 
				var stylesheet = stylesheets[i]; 
				cssCascade.loadStyleSheetTag(stylesheet,intialLength+i)
				
			}
		},
		
		//
		// this is where we store event handlers for monitored properties
		//
		monitoredProperties: Object.create ? Object.create(null) : {},
		monitoredPropertiesHandler: {
			onupdate: function(element, rule) {
				
				// we need to find all regexps that matches
				var mps = cssCascade.monitoredProperties;
				var decls = rule.getDeclarations();
				for(var j=decls.length-1; j>=0; j--) {
					if(decls[j].type=="DECLARATION") {
						if(decls[j].name in mps) {
							
							// call all handlers waiting for this
							var hs = mps[decls[j].name];
							for(var hi=hs.length; hi--;) {
								hs[hi].onupdate(element,rule);
							};
							
							// don't call twice
							break;
							
						}
					}
				}
				
			}
		},
		
		//
		// add an handler to some properties (aka fire when their value *MAY* be affected)
		// REMARK: because this event does not promise the value changed, you may want to figure it out before relayouting
		//
		startMonitoringProperties: function startMonitoringProperties(properties, handler) {
			
			for(var i=properties.length; i--; ) {
				var property = properties[i];
				var handlers = (
					cssCascade.monitoredProperties[property]
					|| (cssCascade.monitoredProperties[property] = [])
				);
				handlers.push(handler)
			}
			
			for(var s=0; s<cssCascade.stylesheets.length; s++) {
				var currentStylesheet = cssCascade.stylesheets[s];
				cssCascade.startMonitoringStylesheet(currentStylesheet);
			}
			
		},
		
		//
		// calling this function will detect monitored rules in the stylesheet
		// (should usually not be used because stylesheets load automatically)
		//
		startMonitoringStylesheet: function startMonitoringStylesheet(rules) {
			for(var i=0; i<rules.length; i++) {
				
				// only consider style rules
				if(rules[i] instanceof cssSyntax.StyleRule) {
					
					// try to see if the current rule is worth monitoring
					if(rules[i].isMonitored) continue;
					
					// for that, let's see if we can find a declaration we should watch
					var decls = rules[i].getDeclarations();
					for(var j=decls.length-1; j>=0; j--) {
						if(decls[j].type=="DECLARATION") {
							if(decls[j].name in cssCascade.monitoredProperties) {
								
								// if we found some, start monitoring
								cssCascade.startMonitoringRule(rules[i]);
								break;
								
							}
						}
					}
					
				} else if(rules[i] instanceof cssSyntax.AtRule) {
					
					// handle @media
					if(rules[i].name == "media" && window.matchMedia) {
						
						cssCascade.startMonitoringMedia(rules[i]);
						
					}
					
				}
				
			}
		},
		
		//
		// calling this function will detect media query updates and fire events accordingly
		// (should usually not be used because stylesheets load automatically)
		//
		startMonitoringMedia: function startMonitoringMedia(atrule) {
			try {
				
				var media = window.matchMedia(atrule.prelude.toCSSString());
				
				// update all the rules when needed
				var rules = atrule.toStylesheet().value;
				cssCascade.updateMedia(rules, !media.matches, false);
				media.addListener(
					function(newMedia) { cssCascade.updateMedia(rules, !newMedia.matches, true); }
				);
				
				// it seems I like taking risks...
				cssCascade.startMonitoringStylesheet(rules);
				
			} catch(ex) {
				setImmediate(function() { throw ex; })
			}
		},
		
		//
		// define what happens when a media query status changes
		//
		updateMedia: function(rules,disabled,update) {
			for(var i=rules.length; i--; ) {
				rules[i].disabled = disabled;
				// TODO: should probably get handled by a setter on the rule...
				var sr = rules[i].subRules;
				if(sr) {
					for(var j=sr.length; j--; ) {
						sr[j].disabled = disabled;
					}
				}
			}
			
			// in case of update, all elements matching the selector went potentially updated...
			if(update) {
				for(var i=rules.length; i--; ) {
					var els = document.querySelectorAll(rules[i].selector.toCSSString());
					for(var j=els.length; j--; ) {
						cssCascade.monitoredPropertiesHandler.onupdate(els[j],rules[i]);
					}
				}
			}
		},
		
		// 
		// splits a rule if it has multiple selectors
		// 
		splitRule: function splitRule(rule) {
			
			// create an array for all the subrules
			var rules = [];
			
			// fill the array
			var currentRule = new cssSyntax.StyleRule(); currentRule.disabled=rule.disabled;
			for(var i=0; i<rule.selector.length; i++) {
				if(rule.selector[i] instanceof cssSyntax.DelimToken && rule.selector[i].value==",") {
					currentRule.value = rule.value; rules.push(currentRule);
					currentRule = new cssSyntax.StyleRule(); currentRule.disabled=rule.disabled;
				} else {
					currentRule.selector.push(rule.selector[i])
				}
			}
			currentRule.value = rule.value; rules.push(currentRule);
			
			// save the result of the split as subrules
			return rule.subRules = rules;
			
		},
		
		// 
		// ask the css-selector implementation to notify changes for the rules
		// 
		startMonitoringRule: function startMonitoringRule(rule) {
			
			// avoid monitoring rules twice
			if(!rule.isMonitored) { rule.isMonitored=true } else { return; }
			
			// split the rule if it has multiple selectors
			var rules = rule.subRules || cssCascade.splitRule(rule);
			
			// monitor the rules
			for(var i=0; i<rules.length; i++) {
				rule = rules[i];
				querySelectorLive(rule.selector.toCSSString(), {
					onadded: function(e) {
						
						// add the rule to the matching list of this element
						(e.myMatchedRules = e.myMatchedRules || []).unshift(rule); // TODO: does not respect priority order
						
						// generate an update event
						cssCascade.monitoredPropertiesHandler.onupdate(e, rule);
						
					},
					onremoved: function(e) {
						
						// remove the rule from the matching list of this element
						if(e.myMatchedRules) e.myMatchedRules.splice(e.myMatchedRules.indexOf(rule), 1);
						
						// generate an update event
						cssCascade.monitoredPropertiesHandler.onupdate(e, rule);
						
					}
				});
			}
			
		},
		
		//
		// converts a css property name to a javascript name
		//
		toCamelCase: function toCamelCase(variable) { 
			return variable.replace(
				/-([a-z])/g, 
				function(str,letter) { 
					return letter.toUpperCase();
				}
			);
		},
		
		//
		// add some magic code to support properties on the style interface
		//
		polyfillStyleInterface: function(cssPropertyName) {
			
			var prop = {
				
				get: function() {
					
					// check we know which element we work on
					try { if(!this.parentElement) throw new Error("Please use the anHTMLElement.myStyle property to get polyfilled properties") }
					catch(ex) { setImmediate(function() { throw ex; }); return ''; }
					
					try { 
						// non-computed style: return the local style of the element
						this.clip = (this.clip===undefined?'':this.clip);
						return this.parentElement.getAttribute('data-style-'+cssPropertyName);
					} catch (ex) {
						// computed style: return the specified style of the element
						var value = cssCascade.getSpecifiedStyle(this.parentElement, cssPropertyName, undefined, true);
						return value && value.length>0 ? value.toCSSString() : '';
					}
					
				},
				
				set: function(v) {
					
					// check that the style is writable
					this.clip = (this.clip===undefined?'':this.clip);

					// check we know which element we work on
					try { if(!this.parentElement) throw new Error("Please use the anHTMLElement.myStyle property to set polyfilled properties") }
					catch(ex) { setImmediate(function() { throw ex; }); return; }
					
					// modify the local style of the element
					if(this.parentElement.getAttribute('data-style-'+cssPropertyName) != v) {
						this.parentElement.setAttribute('data-style-'+cssPropertyName,v);
					}
					
				}
				
			};
			
			var styleProtos = [];
			try { styleProtos.push(Object.getPrototypeOf(document.documentElement.style) || CSSStyleDeclaration); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(getComputedStyle(document.documentElement))); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(document.documentElement.currentStyle)); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(document.documentElement.runtimeStyle)); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(document.documentElement.specifiedStyle)); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(document.documentElement.cascadedStyle)); } catch (ex) {}
			//try { styleProtos.push(Object.getPrototypeOf(document.documentElement.usedStyle)); } catch (ex) {}
			
			for(var i = styleProtos.length; i--;) {
				var styleProto = styleProtos[i];
				Object.defineProperty(styleProto,cssPropertyName,prop);
				Object.defineProperty(styleProto,cssCascade.toCamelCase(cssPropertyName),prop);
			}
			cssCascade.startMonitoringRule(cssSyntax.parse('[style*="'+cssPropertyName+'"]{'+cssPropertyName+':attr(style)}').value[0]);
			cssCascade.startMonitoringRule(cssSyntax.parse('[data-style-'+cssPropertyName+']{'+cssPropertyName+':attr(style)}').value[0]);
			
			// add to the list of polyfilled properties...
			cssCascade.getAllCSSProperties().push(cssPropertyName);
			cssCascade.computationUnsafeProperties[cssPropertyName] = true;
			
		}
		
	};

	//
	// polyfill for browsers not support CSSStyleDeclaration.parentElement (all of them right now)
	//
	domEvents.EventTarget.implementsIn(cssCascade);
	Object.defineProperty(Element.prototype,'myStyle',{
		get: function() {
			var style = this.style; 
			if(!style.parentElement) style.parentElement = this;
			return style;
		}
	});

	//
	// load all stylesheets at the time the script is loaded
	// then do it again when all stylesheets are downloaded
	// and again if some style tag is added to the DOM
	//
	if(!("no_auto_stylesheet_detection" in window)) {
		
		cssCascade.loadAllStyleSheets();
		document.addEventListener("DOMContentLoaded", function() {
			cssCascade.loadAllStyleSheets();
			querySelectorLive(
				cssCascade.selectorForStylesheets,
				{
					onadded: function(e) {
						// TODO: respect DOM order?
						cssCascade.loadStyleSheetTag(e);
						cssCascade.dispatchEvent('stylesheetadded');
					}
				}
			)
		})
	}
	
	return cssCascade;

})(window, document);
require.define('src/core/css-cascade.js');

////////////////////////////////////////

module.exports = (function(window, document) { "use strict"; 

	var cssSyntax = require('src/core/css-syntax.js');
	var cssCascade = require('src/core/css-cascade.js');
	
	var cssBreak = {

		//
		// returns true if an element is replaced 
		// (can't be broken because considered as an image in css layout)
		// 
		isReplacedElement: function isReplacedElement(element) {
			if(!(element instanceof Element)) return false;
			var replacedElementTags = /^(SVG|MATH|IMG|VIDEO|PICTURE|OBJECT|EMBED|IFRAME|TEXTAREA|BUTTON|INPUT)$/; // TODO: more
			return replacedElementTags.test(element.tagName);
		},
		
		// 
		// returns true if an element has a scrollbar or act on overflowing content
		// 
		isScrollable: function isScrollable(element, elementOverflow) {
			if(!(element instanceof Element)) return false;
			if(typeof(elementOverflow)=="undefined") elementOverflow = getComputedStyle(element).overflow;
			
			return (
				elementOverflow !== "visible"
				&& elementOverflow !== "hidden"
			);
			
		},
		
		// 
		// returns true if the element is part of an inline flow
		// TextNodes definitely qualify, but also inline-block elements
		// 
		isSingleLineOfTextComponent: function(element, elementStyle, elementDisplay, elementPosition, isReplaced) {
			if(!(element instanceof Element)) return true;
			if(typeof(elementStyle)=="undefined") elementStyle = getComputedStyle(element);
			if(typeof(elementDisplay)=="undefined") elementDisplay = elementStyle.display;
			if(typeof(elementPosition)=="undefined") elementPosition = elementStyle.position;
			if(typeof(isReplaced)=="undefined") isReplaced = this.isReplacedElement(element);
			
			return (
				elementDisplay === "inline-block"
				|| elementDisplay === "inline-table"
				|| elementDisplay === "inline-flex"
				|| elementDisplay === "inline-grid"
				// TODO: more
			) && (
				elementPosition === "static"
				|| elementPosition === "relative"
			);
			
		},
		
		// 
		// returns true if the element is part of an inline flow
		// TextNodes definitely qualify, but also inline-block elements
		// 
		hasAnyInlineFlow: function(element) {
			
			function countAsInline(element) {
				if(!(element instanceof Element)) return !(/^\s*$/.test(element.nodeValue));
				return !cssBreak.isOutOfFlowElement(element) && cssBreak.isSingleLineOfTextComponent(element);
			}
			
			// try to find any inline element
			var current = element.firstChild;
			while(current) {
				if(countAsInline(current)) return true;
				current = current.nextSibling;
			}
			
			// no inline element
			return false;
			
		},
		
		// 
		// returns true if the element breaks the inline flow
		// (the case of block elements, mostly)
		// 
		isLineBreakingElement: function(element, elementStyle, elementDisplay, elementPosition) {
			
			if(!(element instanceof Element)) return false;
			if(typeof(elementStyle)=="undefined") elementStyle = getComputedStyle(element);
			if(typeof(elementDisplay)=="undefined") elementDisplay = elementStyle.display;
			if(typeof(elementPosition)=="undefined") elementPosition = elementStyle.position;
			
			return (
				(
					// in-flow bock elements
					(elementDisplay === "block")
					&& !this.isOutOfFlowElement(element, elementStyle, elementDisplay, elementPosition)
					
				) || (
					
					// displayed <br> elements
					element.tagName==="BR" && elementDisplay!=="none"
					
				)
			);
		},
		
		// 
		// returns true if the element breaks the inline flow before him
		// (the case of block elements, mostly)
		// 
		isLinePreBreakingElement: function(element, elementStyle, elementDisplay, elementPosition) {
			if(!(element instanceof Element)) return false;

			var breakBefore = cssCascade.getSpecifiedStyle(element,'break-before').toCSSString();
			return (
				(breakBefore=="region"||breakBefore=="all") 
				|| cssBreak.isLineBreakingElement(element, elementStyle, elementDisplay, elementPosition)
			);
			
		},
		
		// 
		// returns true if the element breaks the inline flow after him
		// (the case of block elements, mostly)
		// 
		isLinePostBreakingElement: function(element, elementStyle, elementDisplay, elementPosition) {
			if(!(element instanceof Element)) return false;
			
			var breakAfter = cssCascade.getSpecifiedStyle(element,'break-after').toCSSString();
			return (
				(breakAfter=="region"||breakAfter=="all") 
				|| cssBreak.isLineBreakingElement(element, elementStyle, elementDisplay, elementPosition)
			);
			
		},
		
		// 
		// returns true if the element is outside any block/inline flow
		// (this the case of absolutely positioned elements, and floats)
		// 
		isOutOfFlowElement: function(element, elementStyle, elementDisplay, elementPosition, elementFloat) {
			if(!(element instanceof Element)) return false;
			if(typeof(elementStyle)=="undefined") elementStyle = getComputedStyle(element);
			if(typeof(elementDisplay)=="undefined") elementDisplay = elementStyle.display;
			if(typeof(elementPosition)=="undefined") elementPosition = elementStyle.position; 
			if(typeof(elementFloat)=="undefined") elementFloat = elementStyle.float || elementStyle.styleFloat || elementStyle.cssFloat;
			
			return (
				
				// positioned elements are out of the flow
				(elementPosition==="absolute"||elementPosition==="fixed")
				
				// floated elements as well
				|| (elementFloat!=="none") 
				
				// not sure but let's say hidden elements as well
				|| (elementDisplay==="none")
				
			);
			
		},
		
		// 
		// returns true if two sibling elements are in the same text line
		// (this function is not perfect, work with it with care)
		// 
		areInSameSingleLine: function areInSameSingleLine(element1, element2) {
			
			//
			// look for obvious reasons why it wouldn't be the case
			//
			
			// if the element are not direct sibling, we must use their inner siblings as well
			if(element1.nextSibling != element2) { 
				if(element2.nextSibling != element1) throw "I gave up!"; 
				var t = element1; element1=element2; element2=t;
			}
			 
			// a block element is never on the same line as another element
			if(this.isLinePostBreakingElement(element1)) return false;
			if(this.isLinePreBreakingElement(element2)) return false;
			
			// if the previous element is out of flow, we may consider it as being part of the current line
			if(this.isOutOfFlowElement(element1)) return true;
			
			// if the current object is not a single line component, return false
			if(!this.isSingleLineOfTextComponent(element1)) return false;
			
			// 
			// compute the in-flow bounding rect of the two elements
			// 
			var element1box = Node.getBoundingClientRect(element1);
			var element2box = Node.getBoundingClientRect(element2);
			function shift(box,shiftX,shiftY) {
				return {
					top: box.top+shiftY,
					bottom: box.bottom+shiftY,
					left: box.left+shiftX,
					right: box.right+shiftX
				}
			}
			
			// we only need to shift elements
			if(element1 instanceof Element) {
				var element1Style = getComputedStyle(element1);
				element1box = shift(element1box, parseFloat(element1Style.marginLeft), parseFloat(element1Style.marginTop))
				if(element1Style.position=="relative") {
					element1box = shift(element1box, parseFloat(element1Style.left), parseFloat(element1Style.top))
				}
			}
			
			// we only need to shift elements
			if(element2 instanceof Element) {
				var element2Style = getComputedStyle(element2);
				element2box = shift(element2box, parseFloat(element2Style.marginLeft), parseFloat(element2Style.marginTop))
				if(element2Style.position=="relative") {
					element2box = shift(element2box, parseFloat(element2Style.left), parseFloat(element2Style.top))
				}
			}
			
			// order the nodes so that they are in left-to-right order
			// (this means invert their order in the case of right-to-left flow)
			var firstElement = getComputedStyle(element1.parentNode).direction=="rtl" ? element2box : element1box;
			var secondElement = getComputedStyle(element1.parentNode).direction=="rtl" ? element1box : element2box;
			
			// return true if both elements are have non-overlapping
			// margin- and position-corrected in-flow bounding rect
			// and if their relative position is the one of the current
			// flow (either rtl or ltr)
			return firstElement.right <= secondElement.left;
			
			// TODO: what about left-to-right + right-aligned text?
			// I should probably takes care of vertical position in this case to solve ambiguities
			
		},
		
		//
		// returns true if the element has "overflow: hidden" set on it, and actually overflows
		//
		isHiddenOverflowing: function isHiddenOverflowing(element, elementOverflow) {
			if(!(element instanceof Element)) return false;
			if(typeof(elementOverflow)=="undefined") elementOverflow = getComputedStyle(element).display;
			
			return (
				elementOverflow == "hidden" 
				&& element.offsetHeight != element.scrollHeight // trust me that works
			);
			
		},
		
		//
		// returns true if the element has a border-radius that impacts his layout
		//
		hasBigRadius: function(element, elementStyle) {
			if(!(element instanceof Element)) return false;
			if(typeof(elementStyle)=="undefined") elementStyle = getComputedStyle(element);

			// if the browser supports radiuses {f### prefixes}
			if("borderTopLeftRadius" in elementStyle) {
				
				var tlRadius = parseFloat(elementStyle.borderTopLeftRadius);
				var trRadius = parseFloat(elementStyle.borderTopRightRadius);
				var blRadius = parseFloat(elementStyle.borderBottomLeftRadius);
				var brRadius = parseFloat(elementStyle.borderBottomRightRadius);
				
				// tiny radiuses (<15px) are tolerated anyway
				if(tlRadius < 15 && trRadius < 15 && blRadius < 15 && brRadius < 15) {
					return false;
				}
				
				var tWidth = parseFloat(elementStyle.borderTopWidth);
				var bWidth = parseFloat(elementStyle.borderBottomWidth);
				var lWidth = parseFloat(elementStyle.borderLeftWidth);
				var rWidth = parseFloat(elementStyle.borderRightWidth);
				
				// make sure the radius itself is contained into the border
				
				if(tlRadius > tWidth) return true;
				if(tlRadius > lWidth) return true;
				
				if(trRadius > tWidth) return true;
				if(trRadius > rWidth) return true;
				
				if(blRadius > bWidth) return true;
				if(blRadius > lWidth) return true;
				
				if(brRadius > bWidth) return true;
				if(brRadius > rWidth) return true;
				
			}
			
			// all conditions were met
			return false;
		},
		
		//
		// return trus if the break-inside property is 'avoid' or 'avoid-region'
		//
		isBreakInsideAvoid: function isBreakInsideAvoid(element, elementStyle) {
			var breakInside = cssCascade.getSpecifiedStyle(element, 'break-inside', undefined, true).toCSSString().trim().toLowerCase(); 
			return (breakInside == "avoid" || breakInside == "avoid-region");
		},
		
		//
		// returns true if the element is unbreakable according to the spec
		// (and some of the expected limitations of HTML/CSS)
		//
		isMonolithic: function isMonolithic(element) {
			if(!(element instanceof Element)) return false;
			
			var elementStyle = getComputedStyle(element);
			var elementOverflow = elementStyle.overflow;
			var elementDisplay = elementStyle.display;
			
			// Some content is not fragmentable, for example:
			// - many types of replaced elements (such as images or video)
			
			var isReplaced = this.isReplacedElement(element);
			
			// - scrollable elements
			
			var isScrollable = this.isScrollable(element, elementOverflow);
			
			// - a single line of text content. 
			
			var isSingleLineOfText = this.isSingleLineOfTextComponent(element, elementStyle, elementDisplay, undefined, isReplaced);
			
			// Such content is considered monolithic: it contains no
			// possible break points. 
			
			// In addition to any content which is not fragmentable, 
			// UAs may consider as monolithic:
			// - any elements with ‘overflow’ set to ‘auto’ or ‘scroll’ 
			// - any elements with ‘overflow: hidden’ and a non-‘auto’ logical height (and no specified maximum logical height).
			
			var isHiddenOverflowing = this.isHiddenOverflowing(element, elementOverflow);
			
			// ADDITION TO THE SPEC:
			// I don't want to handle the case where 
			// an element has a border-radius that is bigger
			// than the border-width to which it belongs
			var hasBigRadius = this.hasBigRadius(element, elementStyle);
			
			// ADDITION TO THE SPEC:
			// Someone proposed to support "break-inside: avoid" here
			var isBreakInsideAvoid = this.isBreakInsideAvoid(element, elementStyle);
			
			// all of them are monolithic
			return isReplaced || isScrollable || isSingleLineOfText || isHiddenOverflowing || hasBigRadius || isBreakInsideAvoid;
			
		},
		
		// 
		// returns true if "r" is a collapsed range located at a possible break point for "region"
		// (this function does all the magic for you, but you may want to avoid using it too much)
		// 
		isPossibleBreakPoint: function isPossibleBreakPoint(r, region) {
			
			// r has to be a range, and be collapsed
			if(!(r instanceof Range)) return false;
			if(!(r.collapsed)) return false;
			
			// no ancestor up to the region has to be monolithic
			var ancestor = r.startContainer;
			while(ancestor && ancestor !== region) {
				if(cssBreak.isMonolithic(ancestor)) {
					return false;
				}
				ancestor = ancestor.parentNode;
			}
			
			// we also have to check that we're not between two single-line-of-text elements
			// that are actually on the same line (in which case you can't break)
			var ancestor = r.startContainer; 
			var lastAncestor = r.startContainer.childNodes[r.startOffset];
			while(ancestor && lastAncestor !== region) {
				if(lastAncestor && lastAncestor.previousSibling) {
					
					if(this.areInSameSingleLine(lastAncestor, lastAncestor.previousSibling)) {
						return false;
					}
					
				}
				
				lastAncestor = ancestor;
				ancestor = ancestor.parentNode;
			}
			
			// there are some very specific conditions for breaking
			// at the edge of an element:
			
			if(r.startOffset==0) {
				
				// Class 3 breaking point:
				// ========================
				// Between the content edge of a block container box 
				// and the outer edges of its child content (margin 
				// edges of block-level children or line box edges 
				// for inline-level children) if there is a (non-zero)
				// gap between them.
				
				var firstChild = r.startContainer.childNodes[0];
				if(firstChild) {
					
					var firstChildBox = (
						Node.getBoundingClientRect(firstChild)
					);
					
					var parentBox = (
						r.startContainer.getBoundingClientRect()
					);
					
					if(firstChildBox.top == parentBox.top) {
						return false;
					}
					
				} else {
					return false;
				}
				
			}
			
			// all conditions are met!
			return true;
			
		}
		
	};
	
	return cssBreak;
	
})(window, document);
require.define('src/core/css-break.js');

////////////////////////////////////////

"use strict";

//
// start by polyfilling caretRangeFromPoint
//

if(!document.caretRangeFromPoint) {
    if (document.caretPositionFromPoint) {
        document.caretRangeFromPoint = function caretRangeFromPoint(x,y) {
            var r = document.createRange();
            var p = document.caretPositionFromPoint(x,y); 
            if(p.offsetNode) {
                r.setStart(p.offsetNode, p.offset);
                r.setEnd(p.offsetNode, p.offset);
            }
            return r;
        }
    } else if((document.body||document.createElement('body')).createTextRange) {
        
        //
        // we may want to convert TextRange to Range
        //
        
        var TextRangeUtils = {
            convertToDOMRange: function (textRange, document) {
                var adoptBoundary = function(domRange, textRangeInner, bStart) {
                    // iterate backwards through parent element to find anchor location
                    var cursorNode = document.createElement('a'), cursor = textRangeInner.duplicate();
                    cursor.collapse(bStart);
                    var parent = cursor.parentElement();
                    do {
                            parent.insertBefore(cursorNode, cursorNode.previousSibling);
                            cursor.moveToElementText(cursorNode);
                    } while (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) > 0 && cursorNode.previousSibling);
                    
                    // when we exceed or meet the cursor, we've found the node
                    if (cursor.compareEndPoints(bStart ? 'StartToStart' : 'StartToEnd', textRangeInner) == -1 && cursorNode.nextSibling) {
                            // data node
                            cursor.setEndPoint(bStart ? 'EndToStart' : 'EndToEnd', textRangeInner);
                            domRange[bStart ? 'setStart' : 'setEnd'](cursorNode.nextSibling, cursor.text.length);
                    } else {
                            // element
                            domRange[bStart ? 'setStartBefore' : 'setEndBefore'](cursorNode);
                    }
                    cursorNode.parentNode.removeChild(cursorNode);
                }
                
                // validate arguments
                if(!document) { document=window.document; }
                
                // return a DOM range
                var domRange = document.createRange();
                adoptBoundary(domRange, textRange, true);
                adoptBoundary(domRange, textRange, false);
                return domRange;
            },

            convertFromDOMRange: function (domRange) {
                var adoptEndPoint = function(textRange, domRangeInner, bStart) {
                    // find anchor node and offset
                    var container = domRangeInner[bStart ? 'startContainer' : 'endContainer'];
                    var offset = domRangeInner[bStart ? 'startOffset' : 'endOffset'], textOffset = 0;
                    var anchorNode = DOMUtils.isDataNode(container) ? container : container.childNodes[offset];
                    var anchorParent = DOMUtils.isDataNode(container) ? container.parentNode : container;
                    // visible data nodes need a text offset
                    if (container.nodeType == 3 || container.nodeType == 4)
                        textOffset = offset;
                    
                    // create a cursor element node to position range (since we can't select text nodes)
                    var cursorNode = domRangeInner._document.createElement('a');
                    anchorParent.insertBefore(cursorNode, anchorNode);
                    var cursor = domRangeInner._document.body.createTextRange();
                    cursor.moveToElementText(cursorNode);
                    cursorNode.parentNode.removeChild(cursorNode);
                    // move range
                    textRange.setEndPoint(bStart ? 'StartToStart' : 'EndToStart', cursor);
                    textRange[bStart ? 'moveStart' : 'moveEnd']('character', textOffset);
                }
               
                // return an IE text range
                var textRange = domRange._document.body.createTextRange();
                adoptEndPoint(textRange, domRange, true);
                adoptEndPoint(textRange, domRange, false);
                return textRange;
            }
        };

        
        document.caretRangeFromPoint = function caretRangeFromPoint(x,y) {
            
            // the accepted number of vertical backtracking, in CSS pixels
            var IYDepth = 40;
            
            // try to create a text range at the specified location
            var r = document.body.createTextRange();
            for(var iy=IYDepth; iy; iy=iy-4) {
                var ix = x; if(true) {
                    try {
                        r.moveToPoint(ix,iy+y-IYDepth); 
                        return TextRangeUtils.convertToDOMRange(r);
                    } catch(ex) {}
                }
            }
            
            // if that fails, return the location just after the element located there
            try {
                
                var elem = document.elementFromPoint(x-1,y-1);
                var r = document.createRange();
                r.setStartAfter(elem);
                return r;
                
            } catch(ex) {
                
                return null;
                
            }
        }
    }
}


///
/// helper function for moving ranges char by char
///

Range.prototype.myMoveOneCharLeft = function() {
    var r = this;
    
    // move to the previous cursor location
    if(r.endOffset > 0) {
        
        // if we can enter into the previous sibling
        var previousSibling = r.endContainer.childNodes[r.endOffset-1];
        if(previousSibling && previousSibling.lastChild) {
            
            // enter the previous sibling from its end
            r.setEndAfter(previousSibling.lastChild);
            
        } else if(previousSibling && previousSibling.nodeType==previousSibling.TEXT_NODE) { // todo: lookup value
            
            // enter the previous text node from its end
            r.setEnd(previousSibling, previousSibling.nodeValue.length);
            
        } else {
            
            // else move before that element
            r.setEnd(r.endContainer, r.endOffset-1);
            
        }
        
    } else {
        r.setEndBefore(r.endContainer);
    }
    
}

Range.prototype.myMoveOneCharRight = function() {
    var r = this;
    
    // move to the previous cursor location
    var max = (r.startContainer.nodeType==r.startContainer.TEXT_NODE ? r.startContainer.nodeValue.length : r.startContainer.childNodes.length)
    if(r.startOffset < max) {
        
        // if we can enter into the next sibling
        var nextSibling = r.endContainer.childNodes[r.endOffset];
        if(nextSibling && nextSibling.firstChild) {
            
            // enter the next sibling from its start
            r.setStartBefore(nextSibling.firstChild);
            
        } else if(nextSibling && nextSibling.nodeType==nextSibling.TEXT_NODE && nextSibling.nodeValue!='') { // todo: lookup value
            
            // enter the next text node from its start
            r.setStart(nextSibling, 0);
            
        } else {
            
            // else move before that element
            r.setStart(r.startContainer, r.startOffset+1);
            
        }
        
    } else {
        r.setStartAfter(r.endContainer);
    }
    
    // shouldn't be needed but who knows...
    r.setEnd(r.startContainer, r.startOffset);
    
}


///
/// This functions is optimized to not yield inside a word in a text node
///
Range.prototype.myMoveTowardRight = function() {
    var r = this;
    
    // move to the previous cursor location
    var isTextNode = r.startContainer.nodeType==r.startContainer.TEXT_NODE;
    var max = (isTextNode ? r.startContainer.nodeValue.length : r.startContainer.childNodes.length)
    if(r.startOffset < max) {
        
        // if we can enter into the next sibling
        var nextSibling = r.endContainer.childNodes[r.endOffset];
        if(nextSibling && nextSibling.firstChild) {
            
            // enter the next sibling from its start
            r.setStartBefore(nextSibling.firstChild);
            
        } else if(nextSibling && nextSibling.nodeType==nextSibling.TEXT_NODE && nextSibling.nodeValue!='') { // todo: lookup value
            
            // enter the next text node from its start
            r.setStart(nextSibling, 0);
            
        } else if(isTextNode) {
            
            // move to the next non a-zA-Z symbol
            var currentText = r.startContainer.nodeValue;
            var currentOffset = r.startOffset;
            var currentLetter = currentText[currentOffset++];
            while(currentOffset < max && /^\w$/.test(currentLetter)) {
                currentLetter = currentText[currentOffset++];
            }
            r.setStart(r.startContainer, currentOffset);
            
        } else {
            
            // else move after that element
            r.setStart(r.startContainer, r.startOffset+1);
            
        }
        
    } else {
        r.setStartAfter(r.endContainer);
    }
    
    // shouldn't be needed but who knows...
    r.setEnd(r.startContainer, r.startOffset);
    
}


Range.prototype.myMoveEndOneCharLeft = function() {
    var r = this;
    
    // move to the previous cursor location
    if(r.endOffset > 0) {
        
        // if we can enter into the previous sibling
        var previousSibling = r.endContainer.childNodes[r.endOffset-1];
        if(previousSibling && previousSibling.lastChild) {
            
            // enter the previous sibling from its end
            r.setEndAfter(previousSibling.lastChild);
            
        } else if(previousSibling && previousSibling.nodeType==previousSibling.TEXT_NODE) { // todo: lookup value
            
            // enter the previous text node from its end
            r.setEnd(previousSibling, previousSibling.nodeValue.length);
            
        } else {
            
            // else move before that element
            r.setEnd(r.endContainer, r.endOffset-1);
            
        }
        
    } else {
        r.setEndBefore(r.endContainer);
    }
    
}

Range.prototype.myMoveEndOneCharRight = function() {
    var r = this;
    
    // move to the previous cursor location
    var max = (r.endContainer.nodeType==r.endContainer.TEXT_NODE ? r.endContainer.nodeValue.length : r.endContainer.childNodes.length)
    if(r.endOffset < max) {
        
        // if we can enter into the next sibling
        var nextSibling = r.endContainer.childNodes[r.endOffset];
        if(nextSibling && nextSibling.firstChild) {
            
            // enter the next sibling from its start
            r.setEndBefore(nextSibling.firstChild);
            
        } else if(nextSibling && nextSibling.nodeType==nextSibling.TEXT_NODE) { // todo: lookup value
            
            // enter the next text node from its start
            r.setEnd(nextSibling, 0);
            
        } else {
            
            // else move before that element
            r.setEnd(r.endContainer, r.endOffset+1);
            
        }
        
    } else {
        r.setEndAfter(r.endContainer);
    }
    
}

//
// Get the *real* bounding client rect of the range
// { therefore we need to fix some browser bugs... }
//
Range.prototype.myGetSelectionRect = function() {
    
    // get the browser's claimed rect
    var rect = this.getBoundingClientRect();
	
	// HACK FOR ANDROID BROWSER AND OLD WEBKIT
	if(!rect) { 
		rect={top:0,right:0,bottom:0,left:0,width:0,height:0}; 
	}
    
    // if the value seems wrong... (some browsers don't like collapsed selections)
    if(this.collapsed && rect.top===0 && rect.bottom===0) {
        
        // select one char and infer location
        var clone = this.cloneRange(); var collapseToLeft=false; clone.collapse(false); 
        
        // the case where no char before is tricky...
        if(clone.startOffset==0) {
            
            // let's move on char to the right
            clone.myMoveTowardRight();
            collapseToLeft=true;

            // note: some browsers don't like selections
            // that spans multiple containers, so we will
            // iterate this process until we have one true
            // char selected
            clone.setStart(clone.endContainer, 0); 
            
        } else {
            
            // else, just select the char before
            clone.setStart(this.startContainer, this.startOffset-1);
            collapseToLeft=false;
            
        }
        
        // get some real rect
        var rect = clone.myGetSelectionRect();
        
        // compute final value
        if(collapseToLeft) {
            return {
                
                left: rect.left,
                right: rect.left,
                width: 0,
                
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height
                
            }
        } else {
            return {
                
                left: rect.right,
                right: rect.right,
                width: 0,
                
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height
                
            }
        }
        
    } else {
        return rect;
    }
    
}

// not sure it's needed but still
if(!window.Element) window.Element=window.HTMLElement;
if(!window.Node) window.Node = {};

// make getBCR working on text nodes & stuff
Node.getBoundingClientRect = function getBoundingClientRect(element) {
    if (element.getBoundingClientRect) {
        
        var rect = element.getBoundingClientRect();
        
    } else {
        
        var range = document.createRange();
        range.selectNode(element);
        
        var rect = range.getBoundingClientRect();
        
    }
	
	// HACK FOR ANDROID BROWSER AND OLD WEBKIT
	if(!rect) { 
		rect={top:0,right:0,bottom:0,left:0,width:0,height:0}; 
	}
	
	return rect;
};


// make getCR working on text nodes & stuff
Node.getClientRects = function getClientRects(firstChild) {
    if (firstChild.getBoundingClientRect) {
        
        return firstChild.getClientRects();
        
    } else {
        
        var range = document.createRange();
        range.selectNode(firstChild);
        
        return range.getClientRects();
        
    }
};

// fix for IE (contains fails for text nodes...)
Node.contains = function contains(parentNode,node) {
    if(node.nodeType != 1) {
        if(!node.parentNode) return false;
        return node.parentNode==parentNode || parentNode.contains(node.parentNode);
    } else {
        return parentNode.contains(node);
    }
}

//
// get the bounding rect of the selection, including the bottom padding/marging of the previous element if required
// { this is a special version for breaking algorithms that do not want to miss the previous element real size }
//
Range.prototype.myGetExtensionRect = function() {
    
    // this function returns the selection rect
    // but does take care of taking in account 
    // the bottom-{padding/border} of the previous
    // sibling element, to detect overflow points
    // more accurately
    
    var rect = this.myGetSelectionRect();
    var previousSibling = this.endContainer.childNodes[this.endOffset-1];
    if(previousSibling) {
        
        // correct with the new take
        var prevSibRect = Node.getBoundingClientRect(previousSibling);
        var adjustedBottom = Math.max(rect.bottom,prevSibRect.bottom);
        if(adjustedBottom == rect.bottom) return rect;
        return {
            
            left: rect.left,
            right: rect.right,
            width: rect.width,
            
            top: rect.top,
            bottom: adjustedBottom,
            height: adjustedBottom - rect.top
            
        };
        
    } else if(rect.bottom==0 && this.endContainer.nodeType === 3) {
        
        // note that if we are in a text node, 
        // we may want to cover all the previous
        // text in the node to avoid whitespace
        // related bugs
        
        var onlyWhiteSpaceBefore = /^(\s|\n)*$/.test(this.endContainer.nodeValue.substr(0,this.endOffset));
        if(onlyWhiteSpaceBefore) {
            
            // if we are in the fucking whitespace land, return first line
            var prevSibRect = Node.getClientRects(this.endContainer)[0];
            return prevSibRect;
            
        } else {
            
            // otherwhise, let's rely on previous chars
            var auxiliaryRange = this.cloneRange();
            auxiliaryRange.setStart(this.endContainer,0);
            
            // correct with the new take
            var prevSibRect = auxiliaryRange.getBoundingClientRect();
            var adjustedBottom = Math.max(rect.bottom,prevSibRect.bottom);
            return {
                
                left: rect.left,
                right: rect.right,
                width: rect.width,
                
                top: rect.top,
                bottom: adjustedBottom,
                height: adjustedBottom - rect.top
                
            };
            
        }
        
    } else {
        
        return rect;
        
    }
}
require.define('src/css-regions/lib/range-extensions.js');

////////////////////////////////////////

//
// this module holds the big-picture actions of the polyfill
//
module.exports = (function(window, document) { "use strict";
	
	var domEvents = require('src/core/dom-events.js');
	var cssSyntax = require('src/core/css-syntax.js');
	var cssCascade = require('src/core/css-cascade.js');
	var cssBreak = require('src/core/css-break.js');

	var cssRegionsHelpers = window.cssRegionsHelpers = {
		
		//
		// returns the previous sibling of the element
		// or the previous sibling of its nearest ancestor that has one
		//
		getAllLevelPreviousSibling: function(e, region) {
			if(!e || e==region) return null;
			
			// find the nearest ancestor that has a previous sibling
			while(!e.previousSibling) {
				
				// but bubble to the next avail ancestor
				e = e.parentNode;
				
				// dont get over the bar
				if(!e || e==region) return null;
				
			}
			
			// return that sibling
			return e.previousSibling;
		},
		
		//
		// prepares the element to become a css region
		//
		markNodesAsRegion: function(nodes,fast) {
			nodes.forEach(function(node) {
				node.regionOverset = 'empty';
				node.setAttribute('data-css-region',node.cssRegionsLastFlowFromName);
				cssRegionsHelpers.hideTextNodesFromFragmentSource([node]);
				node.cssRegionsWrapper = node.cssRegionsWrapper || node.appendChild(document.createElement("cssregion"));
			});
		},
		
		//
		// prepares the element to return to its normal css life
		//
		unmarkNodesAsRegion: function(nodes,fast) {
			nodes.forEach(function(node) {
				
				// restore regionOverset to its natural value
				node.regionOverset = 'fit';
				
				// remove the current <cssregion> tag
				try { node.cssRegionsWrapper && node.removeChild(node.cssRegionsWrapper); } 
				catch(ex) { setImmediate(function() { throw ex })}; 
				node.cssRegionsWrapper = undefined;
				delete node.cssRegionsWrapper;
				
				// restore top-level texts that may have been hidden
				cssRegionsHelpers.unhideTextNodesFromFragmentSource([node]);
				
				// unmark as a region
				node.removeAttribute('data-css-region');
			});
		},
		
		//
		// prepares the element for cloning (mainly give them an ID)
		//
		fragmentSourceIndex: 0,
		markNodesAsFragmentSource: function(nodes,ignoreRoot) {
			
			function visit(node,k) {
				var child, next;
				switch (node.nodeType) {
					case 1: // Element node
						
						if(typeof(k)=="undefined" || !ignoreRoot) {
							
							// mark as fragment source
							var id = node.getAttributeNode('data-css-regions-fragment-source');
							if(!id) { node.setAttribute('data-css-regions-fragment-source', cssRegionsHelpers.fragmentSourceIndex++); }
							
						}
						
						node.setAttribute('data-css-regions-cloning', true);
						
						// expand list values
						if(node.tagName=='OL') cssRegionsHelpers.expandListValues(node);
						if(typeof(k)!="undefined" && node.tagName=="LI") cssRegionsHelpers.expandListValues(node.parentNode);
						
					case 9: // Document node
					case 11: // Document fragment node
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			nodes.forEach(visit);
			
		},
		
		//
		// computes the "value" attribute of every LI element out there
		//
		expandListValues: function(OL) {
			if(OL.getAttribute("data-css-li-value-expanded")) return;
			OL.setAttribute('data-css-li-value-expanded', true);
			
			if(OL.hasAttribute("reversed")) {
				
				var currentValue = OL.getAttribute("start") ? parseInt(OL.getAttribute("start")) : OL.childElementCount;
				var increment = -1;
				
			} else {
				
				var currentValue = OL.getAttribute("start") ? parseInt(OL.getAttribute("start")) : 1;
				var increment = +1;
				
			}
			
			var LI = OL.firstElementChild; var LIV = null;
			while(LI) {
				if(LI.tagName==="LI") {
					if(LIV=LI.getAttributeNode("value")) {
						currentValue = parseInt(LIV.nodeValue);
						LI.setAttribute('data-css-old-value', currentValue)
					} else {
						LI.setAttribute("value", currentValue);
					}
					currentValue = currentValue + increment;
				}
				LI = LI.nextElementSibling;
			}
			
			
		},
		
		//
		// reverts to automatic computation of the value of LI elements
		//
		unexpandListValues: function(OL) {
			if(!OL.hasAttribute('data-css-li-value-expanded')) return;
			OL.removeAttribute('data-css-li-value-expanded')
			var LI = OL.firstElementChild; var LIV = null;
			while(LI) {
				if(LI.tagName==="LI") {
					if(LIV=LI.getAttributeNode("data-css-old-value")) {
						LI.removeAttributeNode(LIV);
					} else {
						LI.removeAttribute('value');
					}
				}
				LI = LI.nextElementSibling;
			}
		},
		
		//
		// makes empty text nodes which cannot get "display: none" applied to them
		//
		listOfTextNodesForIE: [],
		hideTextNodesFromFragmentSource: function(nodes) {
			
			function visit(node,k) {
				var child, next;
				switch (node.nodeType) {
					case 3: // Text node
						
						if(!node.parentNode.getAttribute('data-css-regions-fragment-source')) {
							// we have to remove their content the hard way...
							node.cssRegionsSavedNodeValue = node.nodeValue;
							node.nodeValue = "";
							
							// HACK: OTHERWISE IE WILL GC THE TEXTNODE AND RETURNS YOU
							// A FRESH TEXTNODE THE NEXT TIME WHERE YOUR EXPANDO
							// IS NOWHERE TO BE SEEN!
							if(navigator.userAgent.indexOf('MSIE')>0 || navigator.userAgent.indexOf("Trident")>0) {
								if(cssRegionsHelpers.listOfTextNodesForIE.indexOf(node)==-1) {
									cssRegionsHelpers.listOfTextNodesForIE.push(node);
								}
							}
						}
						
						break;
						
					case 1: // Element node
						if(node.hasAttribute('data-css-regions-cloning')) {
							node.removeAttribute('data-css-regions-cloning');
							node.setAttribute('data-css-regions-cloned', true);
							if(node.currentStyle) node.currentStyle.display.toString(); // IEFIX FOR BAD STYLE RECALC
						}
						if(typeof(k)=="undefined") return;
						
					case 9: // Document node
					case 11: // Document fragment node                    
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			nodes.forEach(visit);
			
		},
		
		//
		// makes emptied text nodes visible again
		//
		unhideTextNodesFromFragmentSource: function(nodes) {
			
			function visit(node) {
				var child, next;
				switch (node.nodeType) {
					case 3: // Text node
						
						// we have to remove their content the hard way...
						if("cssRegionsSavedNodeValue" in node) {
							node.nodeValue = node.cssRegionsSavedNodeValue;
							delete node.cssRegionsSavedNodeValue;
						}
						
						break;
						
					case 1: // Element node
						if(typeof(k)=="undefined") return;
						
					case 9: // Document node
					case 11: // Document fragment node                    
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			nodes.forEach(visit);
			
		},
		
		//
		// prepares the content elements to return to ther normal css life
		//
		unmarkNodesAsFragmentSource: function(nodes) {
			
			function visit(node,k) {
				var child, next;
				switch (node.nodeType) {
					case 3: // Text node
						
						// we have to reinstall their content the hard way...
						if("cssRegionsSavedNodeValue" in node) {
							node.nodeValue = node.cssRegionsSavedNodeValue;
							delete node.cssRegionsSavedNodeValue;
						}
						
						break;
					case 1: // Element node
						node.removeAttribute('data-css-regions-cloned');
						node.removeAttribute('data-css-regions-fragment-source');
						if(node.currentStyle) node.currentStyle.display.toString(); // IEFIX FOR BAD STYLE RECALC
						if(node.tagName=="OL") cssRegionsHelpers.unexpandListValues(node);
						if(typeof(k)!="undefined" && node.tagName=="LI") cssRegionsHelpers.unexpandListValues(node.parentNode);
						
					case 9: // Document node
					case 11: // Document fragment node
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			nodes.forEach(visit);
			
		},
		
		//
		// marks cloned content as fragment instead of as fragment source (basically)
		//
		transformFragmentSourceToFragments: function(nodes) {
			
			function visit(node) {
				var child, next;
				switch (node.nodeType) {
					case 1: // Element node
						var id = node.getAttribute('data-css-regions-fragment-source');
						node.removeAttribute('data-css-regions-fragment-source');
						node.removeAttribute('data-css-regions-cloning');
						node.removeAttribute('data-css-regions-cloned');
						node.setAttribute('data-css-regions-fragment-of', id);
						if(node.id) node.id += "--fragment";
						
					case 9: // Document node
					case 11: // Document fragment node
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			nodes.forEach(visit);
			
		},
		
		//
		// removes some invisible text nodes from the tree
		// (useful if you don't want to face browser bugs when dealing with them)
		//
		embedTrailingWhiteSpaceNodes: function(fragment) {
			
			var onlyWhiteSpace = /^\s*$/;
			function visit(node) {
				var child, next;
				switch (node.nodeType) {
					case 3: // Text node
						
						// we only remove nodes at the edges
						if (!node.previousSibling) {
							
							// we only remove nodes if their parent doesn't preserve whitespace
							if (getComputedStyle(node.parentNode).whiteSpace.substring(0,3)!=="pre") {
								
								// only remove pure whitespace nodes
								if (onlyWhiteSpace.test(node.nodeValue)) {
									node.parentNode.setAttribute('data-whitespace-before',node.nodeValue);
									node.parentNode.removeChild(node);
								}
								
							}
							
							break;
						}
						
						// we only remove nodes at the edges
						if (!node.nextSibling) {
							
							// we only remove nodes if their parent doesn't preserve whitespace
							if (getComputedStyle(node.parentNode).whiteSpace.substring(0,3)!=="pre") {
								
								// only remove pure whitespace nodes
								if (onlyWhiteSpace.test(node.nodeValue)) {
									node.parentNode.setAttribute('data-whitespace-after',node.nodeValue);
									node.parentNode.removeChild(node);
								}
								
							}
							
							break;
						}
						
						break;
					case 1: // Element node
					case 9: // Document node
					case 11: // Document fragment node
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			visit(fragment);
			
		},
		
		//
		// recover the previously removed invisible text nodes
		//
		unembedTrailingWhiteSpaceNodes: function(fragment) {
			
			var onlyWhiteSpace = /^\s*$/;
			function visit(node) {
				var child, next;
				switch (node.nodeType) {
					case 1: // Element node
						var txt = "";
						if(txt = node.getAttribute('data-whitespace-before')) {
							if(node.getAttribute('data-starting-fragment')=='' && node.getAttribute('data-special-starting-fragment','')) {
								node.insertBefore(document.createTextNode(txt),node.firstChild);
							}
						}
						node.removeAttribute('data-whitespace-before')
						if(txt = node.getAttribute('data-whitespace-after')) {
							if(node.getAttribute('data-continued-fragment')=='' && node.getAttribute('data-special-continued-fragment','')) {
								node.insertAfter(document.createTextNode(txt),node.lastChild);
							}
						}
						node.removeAttribute('data-whitespace-after')
						
					case 9: // Document node
					case 11: // Document fragment node
						child = node.firstChild;
						while (child) {
							next = child.nextSibling;
							visit(child);
							child = next;
						}
						break;
				}
			}
			
			visit(fragment);
			
		},
		
		///
		/// walk the two trees the same way, and copy all the styles
		/// BEWARE: if the DOMs are different, funny things will happen
		/// NOTE: this function will also remove elements put in another flow
		///
		copyStyle: function(root1, root2) {
			
			function visit(node1, node2, isRoot) {
				var child1, next1, child2, next2;
				switch (node1.nodeType) {
					case 1: // Element node
						
						// firstly, setup a cache of all css properties on the element
						var matchedRules = (node1.currentStyle && !window.opera) ? undefined : cssCascade.findAllMatchingRules(node1)
						
						// and compute the value of all css properties
						var properties = cssCascade.allCSSProperties || cssCascade.getAllCSSProperties();
						for(var p=properties.length; p--; ) {
							
							// if the property is computation-safe, use the computed value
							if(!(properties[p] in cssCascade.computationUnsafeProperties) && properties[p][0]!='-') {
								var style = getComputedStyle(node1).getPropertyValue(properties[p]);
								var defaultStyle = cssCascade.getDefaultStyleForTag(node1.tagName).getPropertyValue(properties[p]);
								if(style != defaultStyle) node2.style.setProperty(properties[p], style)
								continue;
							}
							
							// otherwise, get the element's specified value
							var cssValue = cssCascade.getSpecifiedStyle(node1, properties[p], matchedRules);
							if(cssValue && cssValue.length) {
								
								// if we have a specified value, let's use it
								node2.style.setProperty(properties[p], cssValue.toCSSString());
								
							} else if(isRoot && node1.parentNode && properties[p][0] != '-') {
								
								// NOTE: the root will be detached from its parent
								// Therefore, we have to inherit styles from it (oh no!)
								
								// TODO: create a list of inherited properties
								if(!(properties[p] in cssCascade.inheritingProperties)) continue;
								
								// if the property is computation-safe, use the computed value
								if((properties[p]=="font-size") || (!(properties[p] in cssCascade.computationUnsafeProperties) && properties[p][0]!='-')) {
									var style = getComputedStyle(node1).getPropertyValue(properties[p]);
									node2.style.setProperty(properties[p], style);
									//var parentStyle = style; try { parentStyle = getComputedStyle(node1.parentNode).getPropertyValue(properties[p]) } catch(ex){}
									//var defaultStyle = cssCascade.getDefaultStyleForTag(node1.tagName).getPropertyValue(properties[p]);
									
									//if(style === parentStyle) {
									//  node2.style.setProperty(properties[p], style)
									//}
									continue;
								}
								
								// otherwise, get the parent's specified value
								var cssValue = cssCascade.getSpecifiedStyle(node1, properties[p], matchedRules);
								if(cssValue && cssValue.length) {
									
									// if we have a specified value, let's use it
									node2.style.setProperty(properties[p], cssValue.toCSSString());
									
								}
								
							}
							
						}
						
						// now, let's work on ::after and ::before
						var importPseudo = function(node1,node2,pseudo) {
							
							//
							// we'll need to use getSpecifiedStyle here as the pseudo thing is slow
							//
							var mayExist = !!cssCascade.findAllMatchingRulesWithPseudo(node1,pseudo.substr(1)).length;
							if(!mayExist) return;
							
							var pseudoStyle = getComputedStyle(node1,pseudo);
							if(pseudoStyle.content!='none'){
								
								// let's create a stylesheet for the element
								var stylesheet = document.createElement('style');
								stylesheet.setAttribute('data-no-css-polyfill',true);
								
								// compute the value of all css properties
								var node2style = "";
								var properties = cssCascade.allCSSProperties || cssCascade.getAllCSSProperties();
								for(var p=properties.length; p--; ) {
									
									// we always use the computed value, because we don't have better
									var style = pseudoStyle.getPropertyValue(properties[p]);
									node2style += properties[p]+":"+style+";";
									
								}
								
								stylesheet.textContent = (
									'[data-css-regions-fragment-of="' + node1.getAttribute('data-css-regions-fragment-source') + '"]' 
									+':not([data-css-regions-starting-fragment]):not([data-css-regions-special-starting-fragment])'
									+':'+pseudo+'{'
									+node2style
									+"}"
								);
								
								node2.parentNode.insertBefore(stylesheet, node2);
								
							}
						}
						importPseudo(node1,node2,":before");
						importPseudo(node1,node2,":after");
						
						// retarget events
						cssRegionsHelpers.retargetEvents(node1,node2);
						
						
					case 9: // Document node
					case 11: // Document fragment node
						child1 = node1.firstChild;
						child2 = node2.firstChild;
						while (child1) {
							next1 = child1.nextSibling;
							next2 = child2.nextSibling;
							
							// decide between process style or hide
							if(child1.cssRegionsLastFlowIntoName && child1.cssRegionsLastFlowIntoType==="element") {
								node2.removeChild(child2);
							} else {
								visit(child1, child2);
							}
							
							child1 = next1;
							child2 = next2;
						}
						break;
				}
			}
			
			visit(root1, root2, true);
			
		},
		
		//
		// make sure the most critical events still fire in the fragment source
		// even if the browser initially fire them on the fragments
		//
		retargetEvents: function retargetEvents(node1,node2) {
			
			var retargetEvent = "cssRegionsHelpers.retargetEvent(this,event)";
			node2.setAttribute("onclick", retargetEvent);
			node2.setAttribute("ondblclick", retargetEvent);
			node2.setAttribute("onmousedown", retargetEvent);
			node2.setAttribute("onmouseup", retargetEvent);
			node2.setAttribute("onmousein", retargetEvent);
			node2.setAttribute("onmouseout", retargetEvent);
			node2.setAttribute("onmouseenter", retargetEvent);
			node2.setAttribute("onmouseleave", retargetEvent);
			
		},
		
		//
		// single hub for event retargeting operations.
		//
		retargetEvent: function retargeEvent(node2,e) {
			
			// get the node we should fire the event on
			var node1 = (
				(node2.cssRegionsFragmentSource) ||
				(node2.cssRegionsFragmentSource=document.querySelector('[data-css-regions-fragment-source="' + node2.getAttribute('data-css-regions-fragment-of') + '"]'))
			);
			
			if(node1) {
			
				// dispatch the event on the real node
				var ne = domEvents.cloneEvent(e);
				node1.dispatchEvent(ne);
				
				// prevent the event to fire on the region
				e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
				
				// make sure to cancel the event if required
				if(ne.isDefaultPrevented || ne.defaultPrevented) { e.preventDefault(); return false; }
			
			}
			
		}
	};
	
	return cssRegionsHelpers;
	
})(window, document);
require.define('src/css-regions/lib/helpers.js');

////////////////////////////////////////

//
// this module holds the front-facing features of the polyfill
//
module.exports = (function(window, document, cssRegions) { "use strict";

	var domEvents = require('src/core/dom-events.js');
	var cssSyntax = require('src/core/css-syntax.js');
	var cssCascade = require('src/core/css-cascade.js');
	var cssBreak = require('src/core/css-break.js');
	var cssRegionsHelpers = require('src/css-regions/lib/helpers.js');
	var ES = require('src/core/dom-experimental-event-streams.js');

	// 
	// this class contains flow-relative data field
	// 
	cssRegions.Flow = function NamedFlow(name) {
		
		// TODO: force immediate relayout if someone ask the overset properties
		// and the layout has been deemed wrong (still isn't a proof of correctness but okay)
		
		// define the flow name
		this.name = name; Object.defineProperty(this, "name", {get: function() { return name; }});
		
		// define the overset status
		this.overset = false;
		
		// define the first empty region
		this.firstEmptyRegionIndex = -1;
		
		// elements poured into the flow
		this.content = []; this.lastContent = [];
		
		// elements that consume this flow
		this.regions = []; this.lastRegions = [];
		
		// event handlers
		this.eventListeners = {
			"regionfragmentchange": [],
			"regionoversetchange": [],
		};
		
		// this function is used to work with dom event streams
		var This=this; This.update = function(stream) {
			stream.schedule(This.update); This.relayout();
		};
		
		// register to style changes already
		This.lastStylesheetAdded = 0;
		cssCascade.addEventListener('stylesheetadded', function() {
			if(This.lastStylesheetAdded - Date() > 100) {
				This.lastStylesheetAdded = +Date();
				This.relayout();
			} else {
				cssConsole.warn("Please don't add stylesheets as a response to region events. Operation cancelled.")
			}
		});
		
		// a small counter to avoid enter retry loops
		This.failedLayoutCount = 0;
		
		// some other fields
		This.lastEventRAF = 0;
		This.restartLayout = false;
	}
		
	cssRegions.Flow.prototype.removeFromContent = function(element) {
		
		// clean up stuff
		this.removeEventListenersOf(element);
		
		// remove reference
		var index = this.content.indexOf(element);
		if(index>=0) { this.content.splice(index,1); }
		
	};

	cssRegions.Flow.prototype.removeFromRegions = function(element) {
		
		// clean up stuff
		this.removeEventListenersOf(element);
		
		// remove reference
		var index = this.regions.indexOf(element);
		if(index>=0) { this.regions.splice(index,1); }
		
	};

	cssRegions.Flow.prototype.addToContent = function(element) {
		
		// walk the tree to find an element inside the content chain
		var content = this.content;
		var treeWalker = document.createTreeWalker(
			document.documentElement,
			NodeFilter.SHOW_ELEMENT,
			function(node) { 
				return content.indexOf(node) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; 
			},
			false
		); 
		
		// which by the way has to be after the considered element
		treeWalker.currentNode = element;
		
		// if we find such node
		if(treeWalker.nextNode()) {
			
			// insert the element at his current location
			content.splice(content.indexOf(treeWalker.currentNode),0,element);
			
		} else {
			
			// add the new element to the end of the array
			content.push(element);
			
		}

	};

	cssRegions.Flow.prototype.addToRegions = function(element) {
		
		// walk the tree to find an element inside the region chain
		var regions = this.regions;
		var treeWalker = document.createTreeWalker(
			document.documentElement,
			NodeFilter.SHOW_ELEMENT,
			function(node) { 
				return regions.indexOf(node) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; 
			},
			false
		);
		
		// which by the way has to be after the considered element
		treeWalker.currentNode = element;
		
		// if we find such node
		if(treeWalker.nextNode()) {
			
			// insert the element at his current location
			regions.splice(this.regions.indexOf(treeWalker.currentNode),0,element);
			
		} else {
			
			// add the new element to the end of the array
			regions.push(element);
		}
		
	};

	cssRegions.Flow.prototype.generateContentFragment = function() {
		var fragment = document.createDocumentFragment(); var This=this;

		// add copies of all due content
		for(var i=0; i<this.content.length; i++) {
			var element = this.content[i];
			
			// 
			// STEP 1: IDENTIFY FRAGMENT SOURCES AS SUCH
			//
			cssRegionsHelpers.markNodesAsFragmentSource([element], element.cssRegionsLastFlowIntoType=="content");
			
			
			//
			// STEP 2: CLONE THE FRAGMENT SOURCES
			// 
			
			// depending on the requested behavior
			if(element.cssRegionsLastFlowIntoType=="element") {
				
					// add the element
					var el = element;
					var elClone = el.cloneNode(true);
					var elToInsert = elClone; if(elToInsert.tagName=="LI") {
						elToInsert = document.createElement(el.parentNode.tagName);
						elToInsert.style.margin="0";
						elToInsert.style.padding="0";
						elToInsert.appendChild(elClone);
					}
					fragment.appendChild(elToInsert);
					
					// clone the style
					cssRegionsHelpers.copyStyle(el, elClone);
				
			} else {
				
				// add current children
				var el = element.firstChild; while(el) {
					
					// add the element
					var elClone = el.cloneNode(true);
					var elToInsert = elClone; if(elToInsert.tagName=="LI") {
						elToInsert = document.createElement(el.parentNode.tagName);
						elToInsert.style.margin="0";
						elToInsert.style.padding="0";
						elToInsert.appendChild(elClone);
					}
					fragment.appendChild(elToInsert);
					
					// clone the style
					cssRegionsHelpers.copyStyle(el, elClone);
					
					el = el.nextSibling;
				}
				
			}
			
		}
		
		//
		// STEP 3: HIDE TEXT NODES IN FRAGMENT SOURCES
		//
		cssRegionsHelpers.hideTextNodesFromFragmentSource(this.content);
		
		//
		// STEP 4: CONVERT CLONED FRAGMENT SOURCES INTO TRUE FRAGMENTS
		//
		cssRegionsHelpers.transformFragmentSourceToFragments(
			Array.prototype.slice.call(fragment.childNodes,0)
		)
		
		
		//
		// CLONED CONTENT IS READY!
		//
		return fragment;
	}

	cssRegions.Flow.prototype.relayout = function() {
		var This = this;
		
		// prevent previous relayouts from eventing
		cancelAnimationFrame(This.lastEventRAF);
		
		// batch relayout queries
		if(This.relayoutScheduled) { return; }
		if(This.relayoutInProgress) { This.restartLayout=true; return; }
		This.relayoutScheduled = true;
		requestAnimationFrame(function() { This._relayout() });
		
	}

	cssRegions.Flow.prototype._relayout = function(data){
		var This=this;
		
		try {
			
			//
			// note: it is recommended to look at the beautiful 
			// drawings I made before attempting to understand
			// this stuff. If you don't have them, ask me.
			//
			cssConsole.log("starting a new relayout for "+This.name);
			This.relayoutInProgress=true; This.relayoutScheduled=false;
			This.lastRelayout = +new Date();
			//debugger;
			
			// NOTE: we recover the scroll position in case the browser mess it up
			var docElmScrollTop = data && data.docElmScrollTop ? data.docElmScrollTop : document.documentElement.scrollTop;
			var docBdyScrollTop = data && data.docBdyScrollTop ? data.docBdyScrollTop : document.body.scrollTop;
			
			
			//
			// STEP 1: REMOVE PREVIOUS EVENT LISTENERS
			//
			
			// remove the listeners from everything
			This.removeEventListenersOf(This.lastRegions);
			This.removeEventListenersOf(This.lastContent);
			cancelAnimationFrame(This.lastEventRAF);
			
			
			//
			// STEP 2: RESTORE CONTENT/REGIONS TO A CLEAN STATE
			//
			
			// detect elements being removed of the document
			This.regions = This.regions.filter(function(e) { return document.documentElement.contains(e); })
			This.content = This.content.filter(function(e) { return document.documentElement.contains(e); })
			
			// cleanup previous layout
			cssRegionsHelpers.unmarkNodesAsRegion(This.lastRegions); This.lastRegions = This.regions.slice(0);
			cssRegionsHelpers.unmarkNodesAsFragmentSource(This.lastContent); This.lastContent = This.content.slice(0);
			
			
			
			//
			// STEP 3: EMPTY ALL REGIONS
			// ADD WRAPPER FOR FLOW CONTENT
			// PREPARE FOR CONTENT CLONING
			//
			
			// empty all the regions
			cssRegionsHelpers.markNodesAsRegion(This.regions);
			
			// create a fresh list of the regions
			var regionStack = This.regions.slice(0).reverse();
			
			
			
			//
			// STEP 4: CLONE THE CONTENT
			// ADD METADATA TO CLONED CONTENT
			// HIDE FLOW CONTENT AT INITIAL POSITION
			//
			
			// create a fresh list of the content
			// compute the style of all source elements
			// generate stylesheets for those rules
			var contentFragment = This.generateContentFragment();
			
			
			
			//
			// STEP 5: POUR CONTENT INTO THE REGIONS
			//
			
			// layout this stuff
			cssRegions.layoutContent(regionStack, contentFragment, {
				onprogress: function(continueLayout) {
					
					// NOTE: we recover the scroll position in case the browser mess it up
					document.documentElement.scrollTop = docElmScrollTop;
					document.body.scrollTop = docBdyScrollTop;
					
					// NOTE: if the current layout goes nowhere, start a new one already
					if(This.restartLayout) {
						
						This.relayoutInProgress = false;
						This.failedLayoutCount = 0;
						This.restartLayout = false;
						This._relayout({
							docElmScrollTop: docElmScrollTop,
							docBdyScrollTop: docBdyScrollTop
						});
						
					} else {
						
						setImmediate(continueLayout);
						
					}
					
				},
				ondone: function onLayoutDone(overset) {
				
					This.overset = overset;
					This.firstEmptyRegionIndex = This.regions.length-1; while(This.regions[This.firstEmptyRegionIndex]) {
					
						// tell whether the region is empty
						var isEmpty = false;
						isEmpty = isEmpty || !This.regions[This.firstEmptyRegionIndex].cssRegionsWrapper;
						isEmpty = isEmpty || !This.regions[This.firstEmptyRegionIndex].cssRegionsWrapper.firstChild;
						
						// if the region is not empty
						if(!isEmpty) {
							
							// the first empty region if the next one, if it exists
							if((++This.firstEmptyRegionIndex)==This.regions.length) {
								This.firstEmptyRegionIndex = -1;
							}
							break;
							
						} else {
							 
							// else, let's try the previous region
							This.firstEmptyRegionIndex--; 
							
						}
					}
					
					
					
					//
					// STEP 6: REGISTER TO UPDATE EVENTS
					//
					
					// make sure regions update are taken in consideration
					if(window.MutationObserver) {
						This.addEventListenersTo(This.content);
						This.addEventListenersTo(This.regions);
					} else {
						// the other browsers don't get this as acurately
						// but that shouldn't be that of an issue for 99% of the cases
						setImmediate(function() {
							This.addEventListenersTo(This.content);
						});
					}
					
					
					
					//
					// STEP 7: FIRE SOME EVENTS
					//
					if(This.regions.length > 0 && !This.restartLayout) {
						
						// before doing anything, let's check our stuff is consistent
						var isBuggy = false;
						isBuggy = isBuggy || This.regions.some(function(e) { return !document.documentElement.contains(e); })
						isBuggy = isBuggy || This.content.some(function(e) { return !document.documentElement.contains(e); })
						
						if(isBuggy) {
							
							// if we found any bug, we will need to restart a layout
							cssConsole.warn("Buggy css regions layout: the page changed; we need to restart.");
							This.restartLayout = true; 
							
						} else {
							
							// if it was okay, let's fire some event
							This.lastEventRAF = requestAnimationFrame(function() {
							
								// TODO: only fire when necessary but...
								This.dispatchEvent('regionfragmentchange');
								This.dispatchEvent('regionoversetchange');
								
							});
							
						}
					}
					
					
					// NOTE: we recover the scroll position in case the browser mess it up
					document.documentElement.scrollTop = docElmScrollTop;
					document.body.scrollTop = docBdyScrollTop;
					
					// mark layout has being done
					This.relayoutInProgress = false;
					This.failedLayoutCount = 0;
					
					// restart a layout if a request was queued during the current one
					if(This.restartLayout) {
						This.restartLayout = false;
						This.relayout();
					}
					
				}
			});
			
		} catch(ex) {
			
			// sometimes IE fails for no valid reason 
			// (other than the page is still loading)
			setImmediate(function() { throw ex; });
			
			// but we cannot accept to fail, so we need to try again
			// until we finish a complete layout pass...
			This.failedLayoutCount++;
			if(This.failedLayoutCount<7) {requestAnimationFrame(function() { This._relayout() });}
			else {This.failedLayoutCount=0; This.relayoutScheduled=false; This.relayoutInProgress=false; This.restartLayout=false; }
			
		}
	}

	cssRegions.Flow.prototype.relayoutIfSizeChanged = function() {
		
		// go through all regions
		// and see if any did change of size
		var rs = this.regions;     
		for(var i=rs.length; i--; ) {
			if(
				rs[i].offsetHeight !== rs[i].cssRegionsLastOffsetHeight
				|| rs[i].offsetWidth !== rs[i].cssRegionsLastOffsetWidth
			) {
				this.relayout(); return;
			}
		}
		
	}

	cssRegions.Flow.prototype.addEventListenersTo = function(nodes) {
		var This=this; if(nodes instanceof Element) { nodes=[nodes] }
		
		nodes.forEach(function(element) {
			if(!element.cssRegionsEventStream) {
				element.cssRegionsEventStream = new ES.DOMUpdateEventStream({target: element});
				element.cssRegionsEventStream.schedule(This.update);
			}
		});
		
	}

	cssRegions.Flow.prototype.removeEventListenersOf = function(nodes) {
		var This=this; if(nodes instanceof Element) { nodes=[nodes] }
		
		nodes.forEach(function(element) {
			if(element.cssRegionsEventStream) {
				element.cssRegionsEventStream.dispose();
				delete element.cssRegionsEventStream;
			}
		});
		
	}

	// alias
	cssRegions.NamedFlow = cssRegions.Flow;

	// return a disconnected array of the content of a NamedFlow
	cssRegions.NamedFlow.prototype.getContent = function getContent() {
		return this.content.slice(0)
	}

	// return a disconnected array of the regions of a NamedFlow
	cssRegions.NamedFlow.prototype.getRegions = function getRegions() {
		return this.regions.slice(0)
	}

	cssRegions.NamedFlow.prototype.getRegionsByContent = function getRegionsByContent(node) {
		var regions = [];
		var fragments = document.querySelectorAll('[data-css-regions-fragment-of="'+node.getAttribute('data-css-regions-fragment-source')+'"]');
		for (var i=0; i<fragments.length; i++) {
			
			var current=fragments[i]; do {
				
				if(current.getAttribute('data-css-region')) {
					regions.push(current); break;
				}
				
			} while(current=current.parentNode);
			
		}
		
		return regions;
	}

	domEvents.EventTarget.implementsIn(cssRegions.Flow);

	//
	// this class is a collection of named flows (not an array, sadly)
	//
	cssRegions.NamedFlowCollection = function NamedFlowCollection() {
		
		this.length = 0;
		
	}

	cssRegions.NamedFlowCollection.prototype.namedItem = function(k) {
		return cssRegions.flows[k] || (cssRegions.flows[k]=new cssRegions.Flow(k));
	}


	//
	// this helper creates the required methods on top of the DOM {ie: public exports}
	//
	cssRegions.enablePolyfillObjectModel = function() {
		
		//
		// DOCUMENT INTERFACE
		//
		
		//
		// returns a static list of active named flows
		//
		document.getNamedFlows = function() {
				
			var c = new cssRegions.NamedFlowCollection(); var flows = cssRegions.flows;
			for(var flowName in cssRegions.flows) {
				
				if(Object.prototype.hasOwnProperty.call(flows, flowName)) {
					
					// only active flows can be included
					if(flows[flowName].content.length!=0 || flows[flowName].regions.length!=0) {
						c[c.length++] = c[flowName] = flows[flowName];
					}
					
				}
				
			}
			return c;
			
		}
		
		//
		// returns a live object for any named flow
		//
		document.getNamedFlow = function(flowName) {
				
			var flows = cssRegions.flows;
			return (flows[flowName] || (flows[flowName]=new cssRegions.NamedFlow(flowName)));
			
		}
		
		//
		// ELEMENT INTERFACE
		//    
		Object.defineProperties(
			Element.prototype,
			{
				"regionOverset": {
					get: function() {
						return this._regionOverset || 'fit';
					},
					set: function(value) {
						this._regionOverset = value;
					}
				},
				"getRegionFlowRanges": {
					value: function getRegionFlowRanges() {
						return null; // TODO: can we implement that? I think we can't (properly).
					}
				},
				"getComputedRegionStyle": {
					value: function getComputedRegionStyle(element,pseudo) {
						// TODO: only works while we don't relayout
						// TODO: only works properly for elements actually in the region
						var fragment = document.querySelector('[data-css-regions-fragment-of="'+element.getAttribute('data-css-regions-fragment-source')+'"]');
						if(pseudo) {
							return getComputedStyle(fragment||element, pseudo);
						} else {
							return getComputedStyle(fragment||element);
						}
					}
				}
			}
		)
		
		
		//
		// CSSStyleDeclaration interface
		//
		cssCascade.polyfillStyleInterface('flow-into');
		cssCascade.polyfillStyleInterface('flow-from');
		cssCascade.polyfillStyleInterface('region-fragment');
		cssCascade.polyfillStyleInterface('break-before');
		cssCascade.polyfillStyleInterface('break-after');

	}

	// load the polyfill immediately if not especially told otherwise
	if(!("cssRegionsManualTrigger" in window)) { cssRegions.enablePolyfill(); }
	
});
require.define('src/css-regions/lib/objectmodel.js');

////////////////////////////////////////

//
// this module holds the big-picture actions of the polyfill
//
module.exports = (function(window, document) { "use strict";

	var domEvents = require('src/core/dom-events.js');
	var cssSyntax = require('src/core/css-syntax.js');
	var cssCascade = require('src/core/css-cascade.js');
	var cssBreak = require('src/core/css-break.js');
	
	require('src/css-regions/lib/range-extensions.js');
	var cssRegionsHelpers = require('src/css-regions/lib/helpers.js');
	var enableObjectModel = require('src/css-regions/lib/objectmodel.js');
	
	var CSS_STYLE = "cssregion,[data-css-region]>*,[data-css-regions-fragment-source]:not([data-css-regions-cloning]),[data-css-regions-fragment-source][data-css-regions-cloned]{display:none!important}[data-css-region]>cssregion:last-of-type{display:inline!important}[data-css-region]{content:normal!important}[data-css-special-continued-fragment]{counter-reset:none!important;counter-increment:none!important;margin-bottom:0!important;border-bottom-left-radius:0!important;border-bottom-right-radius:0!important}[data-css-continued-fragment]{counter-reset:none!important;counter-increment:none!important;margin-bottom:0!important;padding-bottom:0!important;border-bottom:none!important;border-bottom-left-radius:0!important;border-bottom-right-radius:0!important}[data-css-continued-fragment]::after{content:none!important;display:none!important}[data-css-special-starting-fragment]{text-indent:0!important;margin-top:0!important}[data-css-starting-fragment]{text-indent:0!important;margin-top:0!important;padding-top:0!important;border-top:none!important;border-top-left-radius:0!important;border-top-right-radius:0!important}[data-css-starting-fragment]::before{content:none!important;display:none!important}[data-css-continued-block-fragment][data-css-continued-fragment]:not(:empty)::after{content:''!important;display:inline-block!important;width:100%!important;height:0!important;font-size:0!important;line-height:0!important;margin:0!important;padding:0!important;border:0!important}";

	var cssRegions = {
		
		//
		// this function is at the heart of the region polyfill
		// it will iteratively fill a list of regions until no
		// content or no region is left
		//
		// the before-overflow size of a region is determined by
		// adding all content to it and comparing his offsetHeight
		// and his scrollHeight
		//
		// when this is done, we use dom ranges to detect the point
		// where the content exceed this box and we split the fragment
		// at that point.
		//
		// when splitting inside an element, the borders, paddings and
		// generated content must be tied to the right fragments which
		// require some code
		//
		// this functions returns whether some content was still remaining
		// when the flow when the last region was filled. please not this
		// can only happen if this last region has "region-fragment" set
		// to break, otherwhise all the content will automatically overflow
		// this last region.
		//
		layoutContent: function(regions, remainingContent, callback, startTime) {
			
			//
			// this function will iteratively fill all the regions
			// when we reach the last region, we return the overset status
			//
			
			// validate args
			if(!regions) return callback.ondone(!!remainingContent.hasChildNodes());
			if(!regions.length) return callback.ondone(!!remainingContent.hasChildNodes());
			if(!startTime) startTime = Date.now();
			
			// get the next region
			var region = regions.pop();
			  
			// NOTE: while we don't monitor that, and it can therefore become inaccurate
			// I'm going to follow the spec and refuse to mark as region inline/none elements]
			while(true) {
				var regionDisplay = getComputedStyle(region).display;
				if(regionDisplay == "none" || regionDisplay.indexOf("inline") !== -1) {
					if(region = regions.pop()) { continue } else { return callback.ondone(!!remainingContent.hasChildNodes()) };
				} else {
					break;
				}
			}
			
			// the polyfill actually use a <cssregion> wrapper
			// we need to link this wrapper and the actual region
			if(region.cssRegionsWrapper) {
				region.cssRegionsWrapper.cssRegionHost = region;
				region = region.cssRegionsWrapper;
			} else {
				region.cssRegionHost = region;
			}
			
			// empty the region
			region.innerHTML = '';
			
			// avoid doing the layout of empty regions
			if(!remainingContent.hasChildNodes()) {
				
				region.cssRegionHost.cssRegionsLastOffsetHeight = region.cssRegionHost.offsetHeight;
				region.cssRegionHost.cssRegionsLastOffsetWidth = region.cssRegionHost.offsetWidth;
				
				region.cssRegionHost.regionOverset = 'empty';
				
				var dummyCallback = { ondone:function(){}, onprogress:function(f){f()} };
				cssRegions.layoutContent(regions, remainingContent, dummyCallback, startTime);
				
				return callback.ondone(false);
				
			}
			
			// append the remaining content to the region
			region.appendChild(remainingContent);
			
			// check if we have more regions to process
			if(regions.length !== 0) {
				
				return this.layoutContentInNextRegionsWhenReady(region, regions, remainingContent, callback, startTime);
				
			} else {
				
				return this.layoutContentInLastRegionWhenReady(region, regions, remainingContent, callback, startTime);
				
			}
			
		},
		
		layoutContentInNextRegionsWhenReady: function(region, regions, remainingContent, callback, startTime) {
					
			// delays until all images are loaded
			var imgs = region.getElementsByTagName('img');
			for(var imgs_index=imgs.length; imgs_index--; ) {
				if(!imgs[imgs_index].complete && !imgs[imgs_index].hasAttribute('height')) {
					return setTimeout(
						function() {
							this.layoutContentInNextRegionsWhenReady(region, regions, remainingContent, callback, startTime+32);
						}.bind(this), 
						16
					);
				}
			}
			
			// check if there was an overflow or some break-before/after instruction
			var regionDidOverflow = region.cssRegionHost.scrollHeight != region.cssRegionHost.offsetHeight;
			var shouldSegmentContent = regionDidOverflow;
			if(!shouldSegmentContent) {
				var first = region.firstElementChild;
				var last = region.lastElementChild;
				var current = first;
				while(current) {
					
					if(current != first) {
						if(/(region|all|always)/i.test(cssCascade.getSpecifiedStyle(current,'break-before',undefined,true).toCSSString())) {
							shouldSegmentContent = true; break;
						}
					}
					
					if(current != last) {
						if(/(region|all|always)/i.test(cssCascade.getSpecifiedStyle(current,'break-after',undefined,true).toCSSString())) {
							current = current.nextElementSibling;
							shouldSegmentContent = true; break;
						}
					}

					current = current.nextElementSibling;
				}
			}
			
			
			if(shouldSegmentContent) {
				
				// the remaining content is what was overflowing
				remainingContent = this.extractOverflowingContent(region);
				
			} else {
				
				// there's nothing more to insert
				remainingContent = document.createDocumentFragment();
				
			}
			
			// if any content didn't fit
			if(remainingContent.hasChildNodes()) {
				region.cssRegionHost.regionOverset = 'overset';
			} else {
				region.cssRegionHost.regionOverset = 'fit';
			}
			
			// update flags
			region.cssRegionHost.cssRegionsLastOffsetHeight = region.cssRegionHost.offsetHeight;
			region.cssRegionHost.cssRegionsLastOffsetWidth = region.cssRegionHost.offsetWidth;
			
			// layout the next regions
			// WE LET THE NEXT REGION DECIDE WHAT TO RETURN
			if(startTime+200 > Date.now()) {
				
				return cssRegions.layoutContent(regions, remainingContent, callback, startTime);
				
			} else {
				
				return callback.onprogress(function() {
					cssRegions.layoutContent(regions, remainingContent, callback);
				});
				
			}
			
		},
		
		layoutContentInLastRegionWhenReady: function(region, regions, remainingContent, callback, startTime) {
			
			// delays until all images are loaded
			var imgs = region.getElementsByTagName('img');
			for(var imgs_index=imgs.length; imgs_index--; ) {
				if(!imgs[imgs_index].complete && !imgs[imgs_index].hasAttribute('height')) {
					return setTimeout(
						function() {
							this.layoutContentInLastRegionWhenReady(region, regions, remainingContent, callback, startTime+32);
						}.bind(this), 
						32
					);
				}
			}
			
			// support region-fragment: break
			if(cssCascade.getSpecifiedStyle(region.cssRegionHost,"region-fragment",undefined,true).toCSSString().trim().toLowerCase()=="break") {
				
				// WE RETURN TRUE IF WE DID OVERFLOW
				var didOverflow = (this.extractOverflowingContent(region).hasChildNodes());
				
				// update flags
				region.cssRegionHost.cssRegionsLastOffsetHeight = region.cssRegionHost.offsetHeight;
				region.cssRegionHost.cssRegionsLastOffsetWidth = region.cssRegionHost.offsetWidth;
				
				return callback.ondone(didOverflow);
				
			} else {
				
				// update flags
				region.cssRegionHost.cssRegionsLastOffsetHeight = region.cssRegionHost.offsetHeight;
				region.cssRegionHost.cssRegionsLastOffsetWidth = region.cssRegionHost.offsetWidth;
				
				// WE RETURN FALSE IF WE DIDN'T OVERFLOW
				return callback.ondone(region.cssRegionHost.offsetHeight != region.cssRegionHost.scrollHeight);
				
			}
		},

		
		//
		// this function returns a document fragment containing the content
		// that didn't fit in a particular <cssregion> element.
		//
		// in the simplest cases, we can just use hit-targeting to get very
		// close the the natural breaking point. for mostly textual flows,
		// this works perfectly, for the others, we may need some tweaks.
		//
		// there's a code detecting whether this hit-target optimization
		// did possibly fail, in which case we return to a setup where we
		// start from scratch.
		//
		extractOverflowingContent: function(region, dontOptimize) {
			
			// make sure empty nodes don't make our life more difficult
			cssRegionsHelpers.embedTrailingWhiteSpaceNodes(region);
			
			// get the region layout
			var sizingH = region.cssRegionHost.offsetHeight; // avail size (max-height)
			var sizingW = region.cssRegionHost.offsetWidth; // avail size (max-width)
			var pos = region.cssRegionHost.getBoundingClientRect(); // avail size?
			pos = {top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right};
			
			// substract from the bottom any border/padding of the region
			var lostHeight = parseInt(getComputedStyle(region.cssRegionHost).paddingBottom);
			lostHeight += parseInt(getComputedStyle(region.cssRegionHost).borderBottomWidth);
			pos.bottom -= lostHeight; sizingH -= lostHeight;
			
			//
			// note: let's use hit targeting to find a dom range
			// which is close to the location where we will need to
			// break the content into fragments
			// 
			
			// get the caret range for the bottom-right of that location
			try {
				var r = dontOptimize ? document.createRange() : document.caretRangeFromPoint(
					pos.left + sizingW - 1,
					pos.top + sizingH - 1
				);
			} catch (ex) {
				try {
					cssConsole.error(ex.message);
					cssConsole.dir(ex);
				} catch (ex) {}
			}
			
			// helper for logging info
			/*cssConsole.log("extracting overflow")
			cssConsole.log(pos.bottom)*/
			var debug = function() {
				/*cssConsole.dir({
					startContainer: r.startContainer,
					startOffset: r.startOffset,
					browserBCR: r.getBoundingClientRect(),
					computedBCR: rect
				});*/
			}
			
			var fixNullRect = function() {
				if(rect.bottom==0 && rect.top==0 && rect.left==0 && rect.right==0) {
					
					var scrollTop = -(document.documentElement.scrollTop || document.body.scrollTop);
					var scrollLeft = -(document.documentElement.scrollLeft || document.body.scrollLeft);
					
					rect = {
						width: 0,
						heigth: 0,
						top: scrollTop,
						bottom: scrollTop,
						left: scrollLeft,
						right: scrollLeft
					}
				}
			}
			
			// if the caret is outside the region
			if(!r || (region !== r.endContainer && !Node.contains(region,r.endContainer))) {
				
				// if the caret is after the region wrapper but inside the host...
				if(r && r.endContainer === region.cssRegionHost && r.endOffset==r.endContainer.childNodes.length) {
					
					// move back at the end of the region, actually
					r.setStart(region, region.childNodes.length);
					r.setEnd(region, region.childNodes.length);
					
				} else {
					
					// move back into the region
					r = r || document.createRange();
					r.setStart(region, 0);
					r.setEnd(region, 0);
					dontOptimize=true;
					
				}
			}
			
			// start finding the natural breaking point
			do {
				
				// store the current selection rect for fast access
				var rect = r.myGetExtensionRect(); fixNullRect();
				debug();
				
				//
				// note: maybe the text is right-to-left
				// in this case, we can go further than the caret
				//
				
				// move the end point char by char until it's completely in the region
				while(!(r.endContainer==region && r.endOffset==r.endContainer.childNodes.length) && rect.bottom<=pos.top+sizingH) {
					
					debug();
					
					// look if we can optimize by moving fast forward
					var nextSibling = r.endContainer.childNodes[r.endOffset];
					var nextSiblingRect = !nextSibling || Node.getBoundingClientRect(nextSibling);
					if(nextSibling && nextSiblingRect.bottom<=pos.top+sizingH) {
						
						// if yes, move element by element
						r.setStartAfter(nextSibling)
						r.setEndAfter(nextSibling)
						rect = nextSiblingRect
						fixNullRect()
						
					} else {
						
						// otherwise, go char-by-char
						r.myMoveTowardRight(); rect = r.myGetExtensionRect(); fixNullRect();
						
					}
				}
				
				//
				// note: maybe the text is one line too big
				// in this case, we have to backtrack a little
				//
				
				// move the end point char by char until it's completely in the region
				while(!(r.endContainer==region && r.endOffset==0) && rect.bottom>pos.top+sizingH) {
					debug(); r.myMoveOneCharLeft(); rect = r.myGetExtensionRect(); fixNullRect();
				}
				
				debug()
				
				//
				// note: if we optimized via hit-testing, this may be wrong
				// if next condition does not hold, we're fine. 
				// otherwhise we must restart without optimization...
				//
				
				// if the selected content is possibly off-target
				var optimizationFailled = false; if(!dontOptimize) {
					
					var current = r.endContainer;
					while(current = cssRegionsHelpers.getAllLevelPreviousSibling(current, region)) {
						if(Node.getBoundingClientRect(current).bottom > pos.top + sizingH) {
							r.setStart(region,0);
							r.setEnd(region,0);
							optimizationFailled=true;
							dontOptimize=true;
							break;
						}
					}
					
				}
				
			} while(optimizationFailled) 
			
			// 
			// note: we should not break the content inside monolithic content
			// if we do, we need to change the selection to avoid that
			// 
			
			// move the selection before the monolithic ancestors
			var current = r.endContainer;
			while(current !== region) {
				if(cssBreak.isMonolithic(current)) {
					r.setEndBefore(current);
				}
				current = current.parentNode;
			}
			
			// if the selection is not in the region anymore, add the whole region
			if(!r || (region !== r.endContainer && !Node.contains(region,r.endContainer))) {
				cssConsole.dir(r.cloneRange()); debugger;
				r.setStart(region,region.childNodes.length);
				r.setEnd(region,region.childNodes.length);
			}
			
			// 
			// note: we don't want to break inside a line.
			// backtrack to end of previous line...
			// 
			var first = r.startContainer.childNodes[r.startOffset], current = first; 
			if(cssBreak.hasAnyInlineFlow(r.startContainer)) {
				while((current) && (current = current.previousSibling)) {
					
					if(cssBreak.areInSameSingleLine(current,first)) {
						
						// optimization: first and current are on the same line
						// so if next and current are not the same line, it will still be
						// the same line the "first" element is in
						first = current;
						
						if(current instanceof Element) {
							
							// we don't want to break inside text lines
							r.setEndBefore(current);
							
						} else {
							
							// get last line via client rects
							var lines = Node.getClientRects(current);
							
							// if the text node did wrap into multiple lines
							if(lines.length>1) {
								
								// move back from the end until we get into previous line
								var previousLineBottom = lines[lines.length-2].bottom;
								r.setEnd(current, current.nodeValue.length);
								while(rect.bottom>previousLineBottom) {
									r.myMoveOneCharLeft(); rect = r.myGetExtensionRect(); fixNullRect();
								}
								
								// make sure we didn't exit the text node by mistake
								if(r.endContainer!==current) {
									// if we did, there's something wrong about the text node
									// but we can consider the text node as an element instead
									r.setEndBefore(current); // debugger; 
								}
								
							} else {
								
								// we can consider the text node as an element
								r.setEndBefore(current);
								
							}
							
						}
					} else {
						
						// if the two elements are not on the same line, 
						// then we just found a line break!
						break;
						
					}
					
				}
			}
			
			// if the selection is not in the region anymore, add the whole region
			if(!r || (region !== r.endContainer && !Node.contains(region,r.endContainer))) {
				cssConsole.dir(r.cloneRange()); debugger;
				r.setStart(region,region.childNodes.length);
				r.setEnd(region,region.childNodes.length);
			}
			
			
			// 
			// note: the css-break spec says that a region should not be emtpy
			// 
			
			// if we end up with nothing being selected, add the first block anyway
			if(r.endContainer===region && r.endOffset===0 && r.endOffset!==region.childNodes.length) {
				
				// find the first allowed break point
				do {
					
					//cssConsole.dir(r.cloneRange()); 
					
					// move the position char-by-char
					r.myMoveTowardRight(); 
					
					// but skip long islands of monolithic elements
					// since we know we cannot break inside them anyway
					var current = r.endContainer;
					while(current && current !== region) {
						if(cssBreak.isMonolithic(current)) {
							r.setStartAfter(current);
							r.setEndAfter(current);
						}
						current = current.parentNode;
					}
					
				}
				// do that until we reach a possible break point, or the end of the element
				while(!cssBreak.isPossibleBreakPoint(r,region) && !(r.endContainer===region && r.endOffset===region.childNodes.length))
				
			}
			
			// if the selection is not in the region anymore, add the whole region
			if(!r || region !== r.endContainer && !Node.contains(region,r.endContainer)) {
				cssConsole.dir(r.cloneRange()); debugger;
				r.setStart(region,region.childNodes.length);
				r.setEnd(region,region.childNodes.length);
			}
				
			// now, let's try to find a break-before/break-after element before the splitting point
			var current = r.endContainer; if(current.hasChildNodes()) { if(r.endOffset>0) { current=current.childNodes[r.endOffset-1] } };
			var first = r.endContainer.firstChild;
			do {
				if(current.style) {
					
					if(current != first) {
						if(/(region|all|always)/i.test(cssCascade.getSpecifiedStyle(current,'break-before',undefined,true).toCSSString())) {
							r.setStartBefore(current);
							r.setEndBefore(current);
							dontOptimize=true; // no algo involved in breaking, after all
						}
					}
					
					if(current !== region) {
						if(/(region|all|always)/i.test(cssCascade.getSpecifiedStyle(current,'break-after',undefined,true).toCSSString())) {
							r.setStartAfter(current);
							r.setEndAfter(current);
							dontOptimize=true; // no algo involved in breaking, after all
						}
					}
					
				}
			} while(current = cssRegionsHelpers.getAllLevelPreviousSibling(current, region));
			
			// we're almost done! now, let's collect the ancestors to make some splitting postprocessing
			var current = r.endContainer; var allAncestors=[];
			if(current.nodeType !== current.ELEMENT_NODE) current=current.parentNode;
			while(current !== region) {
				allAncestors.push(current);
				current = current.parentNode;
			}
			
			//
			// note: if we're about to split after the last child of
			// an element which has bottom-{padding/border/margin}, 
			// we need to figure how how much of that p/b/m we can
			// actually keep in the first fragment
			// 
			// TODO: avoid top & bottom p/b/m cuttings to use the 
			// same variables names, it's ugly
			//
			
			// split bottom-{margin/border/padding} correctly
			if(r.endOffset == r.endContainer.childNodes.length && r.endContainer !== region) {
				
				// compute how much of the bottom border can actually fit
				var box = r.endContainer.getBoundingClientRect();
				var excessHeight = box.bottom - (pos.top + sizingH);
				var endContainerStyle = getComputedStyle(r.endContainer);
				var availBorderHeight = parseFloat(endContainerStyle.borderBottomWidth);
				var availPaddingHeight = parseFloat(endContainerStyle.paddingBottom);
				
				// start by cutting into the border
				var borderCut = excessHeight;
				if(excessHeight > availBorderHeight) {
					borderCut = availBorderHeight;
					excessHeight -= borderCut;
					
					// continue by cutting into the padding
					var paddingCut = excessHeight;
					if(paddingCut > availPaddingHeight) {
						paddingCut = availPaddingHeight;
						excessHeight -= paddingCut;
					} else {
						excessHeight = 0;
					}
				} else {
					excessHeight = 0;
				}
				
				
				// we don't cut borders with radiuses
				// TODO: accept to cut the content not affected by the radius
				if(typeof(borderCut)==="number" && borderCut!==0) {
					
					// check the presence of a radius:
					var hasBottomRadius = (
						parseInt(endContainerStyle.borderBottomLeftRadius)>0
						|| parseInt(endContainerStyle.borderBottomRightRadius)>0
					);
					
					if(hasBottomRadius) {
						// break before the whole border:
						borderCut = availBorderHeight;
					}
					
				}
				
			}
			
			
			// split top-{margin/border/padding} correctly
			if(r.endOffset == 0 && r.endContainer !== region) {
				
				// note: the only possibility here is that we 
				// did split after a padding or a border.
				// 
				// it can only happen if the border/padding is 
				// too big to fit the region but is actually 
				// the first break we could find!
				
				// compute how much of the top border can actually fit
				var box = r.endContainer.getBoundingClientRect();
				var availHeight = (pos.top + sizingH) - pos.top;
				var endContainerStyle = getComputedStyle(r.endContainer);
				var availBorderHeight = parseFloat(endContainerStyle.borderTopWidth);
				var availPaddingHeight = parseFloat(endContainerStyle.paddingTop);
				var excessHeight = availBorderHeight + availPaddingHeight - availHeight;
				
				if(excessHeight > 0) {
				
					// start by cutting into the padding
					var topPaddingCut = excessHeight;
					if(excessHeight > availPaddingHeight) {
						topPaddingCut = availPaddingHeight;
						excessHeight -= topPaddingCut;
						
						// continue by cutting into the border
						var topBorderCut = excessHeight;
						if(topBorderCut > availBorderHeight) {
							topBorderCut = availBorderHeight;
							excessHeight -= topBorderCut;
						} else {
							excessHeight = 0;
						}
					} else {
						excessHeight = 0;
					}
					
				}
				
			}
			
			// remove bottom-{pbm} from all ancestors involved in the cut
			for(var i=allAncestors.length-1; i>=0; i--) {
				allAncestors[i].setAttribute('data-css-continued-fragment',true);
				if(getComputedStyle(allAncestors[i]).display.indexOf('block')>=0) {
					allAncestors[i].setAttribute('data-css-continued-block-fragment',true);
				}
			}
			if(typeof(borderCut)==="number") {
				allAncestors[0].removeAttribute('data-css-continued-fragment');
				allAncestors[0].setAttribute('data-css-special-continued-fragment',true);
				allAncestors[0].style.borderBottomWidth = (availBorderHeight-borderCut)+'px';
			}
			if(typeof(paddingCut)==="number") {
				allAncestors[0].removeAttribute('data-css-continued-fragment');
				allAncestors[0].setAttribute('data-css-special-continued-fragment',true);
				allAncestors[0].style.paddingBottom = (availPaddingHeight-paddingCut)+'px';
			}
			if(typeof(topBorderCut)==="number") {
				allAncestors[0].removeAttribute('data-css-continued-fragment');
				allAncestors[0].setAttribute('data-css-continued-fragment',true);
				allAncestors[0].style.borderTopWidth = (availBorderHeight-topBorderCut)+'px';
			}
			if(typeof(topPaddingCut)==="number") {
				allAncestors[0].removeAttribute('data-css-continued-fragment');
				allAncestors[0].setAttribute('data-css-special-continued-fragment',true);
				allAncestors[0].style.paddingTop = (availPaddingHeight-topPaddingCut)+'px';
			}
			
			
			//
			// note: at this point we have a collapsed range 
			// located at the split point
			//
			
			// select the overflowing content
			r.setEnd(region, region.childNodes.length);
			
			// extract it from the current region
			var overflowingContent = r.extractContents();
			
			// remove trailing whitespace from the cut element
			var tmp = allAncestors[0];
			if(tmp && (tmp=tmp.lastChild) && !tmp.tagName && tmp.nodeValue) {
				var nodeValue = tmp.nodeValue.replace(/(\s|\r|\n)*$/,'');
				if(nodeValue) {
					// if the last cut was just after a &shy; (soft hyphen), we need to append a dash
					if(/\u00AD$/.test(nodeValue)) {
						nodeValue = nodeValue.replace(/\u00AD$/, '-');
					}
					tmp.nodeValue = nodeValue;
				} else {
					tmp.parentNode.removeChild(tmp);
				}
			}
			
			// 
			// note: now we have to cancel out the artifacts of
			// the fragments cloning algorithm...
			//
			
			// do not forget to remove any top p/b/m on cut elements
			var newFragments = overflowingContent.querySelectorAll("[data-css-continued-fragment]");
			for(var i=newFragments.length; i--;) { // TODO: optimize by using while loop and a simple matchesSelector.
				newFragments[i].removeAttribute('data-css-continued-fragment')
				newFragments[i].setAttribute('data-css-starting-fragment',true);
			}
			
			// deduct any already-used bottom p/b/m
			var specialNewFragment = overflowingContent.querySelector('[data-css-special-continued-fragment]');
			if(specialNewFragment) {
				specialNewFragment.removeAttribute('data-css-special-continued-fragment')
				specialNewFragment.setAttribute('data-css-starting-fragment',true);
				
				if(typeof(borderCut)==="number") {
					specialNewFragment.style.borderBottomWidth = (borderCut)+'px';
				}
				if(typeof(paddingCut)==="number") {
					specialNewFragment.style.paddingBottom = (paddingCut);
				} else {
					specialNewFragment.style.paddingBottom = '0px';
				}
				
				if(typeof(topBorderCut)==="number") {
					specialNewFragment.removeAttribute('data-css-starting-fragment')
					specialNewFragment.setAttribute('data-css-special-starting-fragment',true);
					specialNewFragment.style.borderTopWidth = (topBorderCut)+'px';
				}
				if(typeof(topPaddingCut)==="number") {
					specialNewFragment.removeAttribute('data-css-starting-fragment')
					specialNewFragment.setAttribute('data-css-special-starting-fragment',true);
					specialNewFragment.style.paddingTop = (topPaddingCut)+'px';
					specialNewFragment.style.paddingBottom = '0px';
					specialNewFragment.style.borderBottomWidth = '0px';
				}
				
			} else if(typeof(borderCut)==="number") {
				
				// hum... there's an element missing here... {never happens anymore}
				try { throw new Error() }
				catch(ex) { setImmediate(function() { throw ex; }) }
				
			} else if(typeof(topPaddingCut)==="number") {
				
				// hum... there's an element missing here... {never happens anymore}
				try { throw new Error() }
				catch(ex) { setImmediate(function() { throw ex; }) }
				
			}
			
			
			// make sure empty nodes are reintroduced
			cssRegionsHelpers.unembedTrailingWhiteSpaceNodes(region);
			cssRegionsHelpers.unembedTrailingWhiteSpaceNodes(overflowingContent);
			
			// we're ready to return our result!
			return overflowingContent;
			
		},
			
		enablePolyfill: function enablePolyfill() {
			
			//
			// [0] insert necessary css
			//
			var s = document.createElement('style');
			s.setAttribute("data-css-no-polyfill", true);
			s.textContent = CSS_STYLE;
			var head = document.head || document.getElementsByTagName('head')[0];
			head.appendChild(s);
			
			// 
			// [1] when any update happens:
			// construct new content and region flow pairs
			// restart the region layout algorithm for the modified pairs
			// 
			cssCascade.startMonitoringProperties(
				["flow-into","flow-from","region-fragment"], 
				{
					onupdate: function onupdate(element, rule) {
						
						// let's just ignore fragments
						if(element.getAttributeNode('data-css-regions-fragment-of')) return;
						
						// log some message in the console for debug
						cssConsole.dir({message:"onupdate",element:element,selector:rule.selector.toCSSString(),rule:rule});
						var temp = null;
						
						//
						// compute the value of region properties
						//
						var flowInto = (
							cssCascade.getSpecifiedStyle(element, "flow-into")
							.filter(function(t) { return t instanceof cssSyntax.IdentifierToken })
						);
						
						var flowIntoName = flowInto[0] ? flowInto[0].toCSSString().toLowerCase() : "";
						if(flowIntoName=="none"||flowIntoName=="initial"||flowIntoName=="inherit"||flowIntoName=="default") {flowIntoName=""}
						var flowIntoType = flowInto[1] ? flowInto[1].toCSSString().toLowerCase() : ""; 
						if(flowIntoType!="content") {flowIntoType="element"}
						var flowInto = flowIntoName ? flowIntoName + " " + flowIntoType : "";
						
						var flowFrom = (
							cssCascade.getSpecifiedStyle(element, "flow-from")
							.filter(function(t) { return t instanceof cssSyntax.IdentifierToken })
						);
						
						var flowFromName = flowFrom[0] ? flowFrom[0].toCSSString().toLowerCase() : ""; 
						if(flowFromName=="none"||flowFromName=="initial"||flowFromName=="inherit"||flowFromName=="default") {flowFromName=""}
						var flowFrom = flowFromName;
						
						//
						// if the value of any property did change...
						//
						if(element.cssRegionsLastFlowInto != flowInto || element.cssRegionsLastFlowFrom != flowFrom) {
							
							// remove the element from previous regions
							var regionOverset = element.regionOverset;
							var lastFlowFrom = (cssRegions.flows[element.cssRegionsLastFlowFromName]);
							var lastFlowInto = (cssRegions.flows[element.cssRegionsLastFlowIntoName]);
							lastFlowFrom && lastFlowFrom.removeFromRegions(element);
							lastFlowInto && lastFlowInto.removeFromContent(element);
							
							// relayout those regions 
							// (it's async so it will wait for us
							// to add the element back if needed)
							lastFlowFrom && regionOverset!='empty' && lastFlowFrom.relayout();
							lastFlowInto && lastFlowInto.relayout();
							
							// save some property values for later
							element.cssRegionsLastFlowInto = flowInto;
							element.cssRegionsLastFlowFrom = flowFrom;
							element.cssRegionsLastFlowIntoName = flowIntoName;
							element.cssRegionsLastFlowFromName = flowFromName;
							element.cssRegionsLastFlowIntoType = flowIntoType;
							
							// add the element to new regions
							// and relayout those regions, if deemed necessary
							if(flowFromName) {
								var lastFlowFrom = (cssRegions.flows[flowFromName] = cssRegions.flows[flowFromName] || new cssRegions.Flow(flowFromName));
								lastFlowFrom && lastFlowFrom.addToRegions(element);
								lastFlowFrom && lastFlowFrom.relayout();
							}
							if(flowIntoName) {
								var lastFlowInto = (cssRegions.flows[flowIntoName] = cssRegions.flows[flowIntoName] || new cssRegions.Flow(flowIntoName));
								lastFlowInto && lastFlowInto.addToContent(element);
								lastFlowInto && lastFlowInto.relayout();
							}
							
						}
						
					}
				}
			);
			cssCascade.startMonitoringProperties(
				["break-before","break-after"], 
				{onupdate:function(element){
					
					// avoid fragments triggering update loops
					if(element.getAttribute('data-css-regions-fragment-of')){return;}
					
					// update parent regions
					while(element) {
						if(element.cssRegionsLastFlowIntoName) {
							cssRegions.flows[element.cssRegionsLastFlowIntoName].relayout();
							return;
						}
						element=element.parentNode;
					}
					
				}}
			);
			
			
			//
			// [2] perform the OM exports
			//
			cssRegions.enablePolyfillObjectModel();
			
			//
			// [3] make sure to update the region layout when all images loaded
			//
			window.addEventListener("load", 
				function() { 
					var flows = document.getNamedFlows();
					for(var i=0; i<flows.length; i++) {
						flows[i].relayout();
					}
				}
			);
			
			// 
			// [4] make sure we react to window resizes
			//
			//
			var lastWindowResize = 0;
			var relayoutModifiedFlows = function() {
				
				// specify the function did run
				relayoutModifiedFlows.timeout = 0;
				
				// rerun the layout
				var flows = document.getNamedFlows();
				for(var i=0; i<flows.length; i++) {
					if(flows[i].lastRelayout > lastWindowResize) continue;
					if(flows[i].relayoutInProgress) {
						flows[i].relayout();
					} else {
						flows[i].relayoutIfSizeChanged();
					}
				}
				
			}
			var hasOngoingLayouts = function() {
				
				var flows = document.getNamedFlows();
				for(var i=0; i<flows.length; i++) {
					if(flows[i].lastRelayout > lastWindowResize) continue;
					if(flows[i].relayoutInProgress) {
						return true;
					}
				}
				
				return false;
				
			}
			var restartOngoingLayouts = function() {
				
				var flows = document.getNamedFlows();
				for(var i=0; i<flows.length; i++) {
					if(flows[i].lastRelayout > lastWindowResize) continue;
					if(flows[i].relayoutInProgress) {
						flows[i].relayout();
					}
				}
				
			}
			window.addEventListener("resize",
				function() {
					
					// update the last layout flag
					lastWindowResize = +new Date();
					
					// if we aren't planning a resfresh already
					if(!relayoutModifiedFlows.timeout) { 
						
						// if we are already busy
						if(hasOngoingLayouts()) {
							
							// restart all layouts now
							setTimeout(restartOngoingLayouts, 16);
							
							// wait half a second before restarting them from now
							relayoutModifiedFlows.timeout = setTimeout(relayoutModifiedFlows, 500);
							
						} else {
							
							// debounce by running the resize code every 200ms
							relayoutModifiedFlows.timeout = setTimeout(relayoutModifiedFlows, 200);
							
						}
						
					}
					
				}
			);
			
		},
		
		// this dictionary is supposed to contains all the currently existing flows
		flows: Object.create ? Object.create(null) : {}
		
	};
	
	enableObjectModel(window, document, cssRegions);
	window.cssRegions = cssRegions;
	return cssRegions;
})(window, document);
require.define('src/css-regions/polyfill.js');

////////////////////////////////////////

//require('core:polyfill-dom-matchMedia');
//require('core:polyfill-dom-classList');
//require('css-grid:polyfill');
require('src/css-regions/polyfill.js');
require.define('src/requirements.js');

window.cssPolyfills = { require: require };

})();
//# sourceMappingURL=css-regions-polyfill.js.map;
;$(function() {
    $('iframe').load(function() {
        var doc = $("iframe").contents().find("html");

        $('[name="preview"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("preview");
                doc.removeClass("normal");
            } else {
                doc.removeClass("preview");
                doc.addClass("normal");
            }
        });

        $('[name="debug"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("debug");
            } else {
                doc.removeClass("debug");
            }
        });

        $('[name="spread"]').change(function() {
            if($(this).is(":checked")) {
                doc.addClass("spread");
            } else {
                doc.removeClass("spread");
            }
        });



        function applyZoom(level){
            doc.find("#pages").css({
                "-webkit-transform": "scale(" + level + ")",
                "-webkit-transform-origin": "0 0"
            });
        }

        var prevZoom = localStorage.getItem('H2PZoom');
        if(prevZoom){
            $('[name="zoom"]').val(prevZoom*100);
            applyZoom(prevZoom);
        }

        $('[name="zoom"]').change(function() {
            var zoomLevel = $(this).val() / 100;
            localStorage.setItem('H2PZoom', zoomLevel);
            applyZoom(zoomLevel);
        });


        $('[name="page"]').change(function() {
            var pageNumber = $(this).val() - 1;

            var target = doc.find('.paper:eq(' + pageNumber + ')');
            var offsetTop = target.offset().top;

            doc.find('body').scrollTop(offsetTop);
        });

        $("#print").on('click', function() {
            $("iframe").get(0).contentWindow.print();
        });
    });
});


var H2P = (function () {
    var masterID = '#master-page';
    var printConfigUrl = 'printConfig.json';
    var beforeLayoutTasks = [];
    var afterLayoutTasks = [];


    function beforeLayout(tasks){
        if(typeof tasks === 'function'){
            tasks = [tasks];
        }
        beforeLayoutTasks = beforeLayoutTasks.concat(tasks);
        return self;
    }

    function afterLayout(tasks){
        if(typeof tasks === 'function'){
            tasks = [tasks];
        }
        afterLayoutTasks = afterLayoutTasks.concat(tasks);
        return self;
    }


    var init = function (url) {

        function loadContent(){
            return new Promise(function(resolve, reject){
                var content = $('<div>');
                content.load(url, function (response, status, xhr) {
                    if ( status == "error" ) {
                        var msg = "Something went wrong with loading content from " + url;
                        var err = msg + " " + xhr.status + " " + xhr.statusText;
                        reject(err);
                    }
                    resolve(content);
                });
            });
        }


        function cleanContent(c) {
            var content = c.find('.h2p-content');
            content.find('.h2p-exclude').remove();
            return $('<div>').append(content);
        }

        function createPages(num){
            for (var i = 0; i < num; i++) {
                appendPage(masterID);
            }
        }

        function fetchPrintConfig(){
            return new Promise(function(resolve, reject){
                $.getJSON(printConfigUrl)
                    .done(function(printConfig){
                        resolve(printConfig);
                    })
                    .fail(function(xhr, status, err){
                        var msg = 'Cannot find config file at ' + printConfigUrl;
                        reject(msg + ", " + xhr + " " + status + " " + err);
                    })
            });
        }

        function registerAfterLayoutTasks(){
            var f = document.getNamedFlow('contentflow');
            f.addEventListener('regionfragmentchange', function (event) {
                // validate the target of the event
                if (event.target !== f) {
                    debugger;
                    return;
                }

                afterLayoutTasks.forEach(function (task) {
                    task.call();
                });
            })
        }



        // have to disable scroll, because scrolling can interfere with CSSRegions lib's work
        $('body').addClass('noScroll');


        // H2P's own tasks to be executed when layout is done
        var afterLayout = function(){
            removeEmptyPages();
            $('body').removeClass('noScroll');
            $('#loading-spinner').addClass('hidden');
            setTimeout(function(){
                $('#loading-spinner').remove();
            }, 2050);
        };

        // adding these to the top of the list
        beforeLayoutTasks.unshift(beforeLayout);
        afterLayoutTasks.unshift(afterLayout);

        // need to delay this otherwise the requests would delay the appearance of the loading indicator
        setTimeout(function(){

            // start
            loadContent()
                .then(function(cnt){

                    var content = cleanContent(cnt);
                    var contentWrapper = $('<div>').attr('id', 'content-source')
                        .append(content);

                    contentWrapper.appendTo('body');

                    fetchPrintConfig().then(function(config){

                        createPages(config['numPages']);

                        beforeLayoutTasks.forEach(function(task){
                            task.call();
                        });

                        // this will trigger less to recompile styles with the custom page config variables
                        less.modifyVars(config.style);
                        registerAfterLayoutTasks();

                    }).catch(function(err){
                        alert(err);
                    });

                }).catch(function(err){
                alert(err);
            });

        }, 1);

    };



    function updatePageIDs() {
        pages().each(function (i, page) {
            $(page).attr('id', "page-" + i);
        });
    }

    function page(pageNum) {
        return $("#page-" + pageNum);
    }

    function pages() {
        return $('#pages').children().not($(masterID));
    }

    function appendPage(masterID) {
        var masterClone = $(masterID).clone().attr("id", "page-" + pages().length);
        masterClone.find('.body').addClass('content-target');
        return masterClone.appendTo($('#pages'));
    }


    function removeEmptyPages() {
        var empty = $('.paper').filter(function () {
            return $(this).find('cssregion').children().length === 0;
        });

        empty.remove();
    }


    // interface to H2P
    var self = {

        init: init,
        pages: pages,
        page: page,
        appendPage: appendPage,
        beforeLayout: beforeLayout,
        afterLayout: afterLayout,

        insertPageAfter: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id", "page-" + pageIndex + 1).insertAfter(page(pageIndex));
            updatePageIDs();
            return $page;
        },

        insertPageBefore: function (masterID, pageIndex) {
            var $page = $(masterID).clone().attr("id", "page-" + pageIndex).insertBefore(page(pageIndex));
            updatePageIDs();
            return $page;
        }

    };

    return self;

})();


