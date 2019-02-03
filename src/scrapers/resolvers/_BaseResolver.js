const createEvent = require('../../utils/createEvent');
const rp = require('request-promise');

function _implementMe(functionName) {
    throw new Error(`Must implement ${functionName}()`);
}

/**
 * Representation of all the metadata the claws can pass through to the client.
 * @typedef {Object} ClawsMetadata
 * @property {String|null} quality The link quality
 * @property {String|null} provider The provider's name (human readable)
 * @property {String|null} source The source that uploaded the content to the provider (human readable)
 * @property {Boolean|null} isDownload Whether this source is download only.
 * @property {String|null} cookieRequired The name of the cookie required by the client.
 * @property {String|null} cookie The cookie to pass along to the client.
 */

/**
 * The base resolver class that every other resolver should extend from.
 * Functions to implement:
 * - supportsUri(uri)
 * - resolveHtml(meta, html, jar, headers)
 */
const BaseResolver = class BaseResolver {
    constructor() {
        if (new.target === BaseResolver) {
            throw new TypeError("Cannot construct BaseResolver instances directly");
        }
    }

    /**
     * Return the resolver id, this is usually the name of the class.
     * @return String
     */
    getResolverId() {
        return this.constructor.name;
    }

    /**
     * Whether this resolver supports the URI.
     * @param {String} uri
     * @return bool
     */
    supportsUri(uri) {
        _implementMe('supportsUri');
    }

    /**
     * Process the uri and convert it into a URL structure that can be requested and parsed.
     * @param {String} uri
     * @return String
     */
    normalizeUri(uri) {
        return uri;
    }

    /**
     * Whether the current resolver requires ip locking. Most resolvers don't need to override this.
     * @return {boolean}
     */
    hasIpLocking() {
        return false;
    }

    /**
     * Resolve a URI.
     * @param {Object} meta The meta data for resolving requests.
     * @param {Object} meta.sse server-side emitter/websocket agent.
     * @param {String} meta.source The source that initiated the request (Usually the provider ID).
     * @param {String} meta.quality The quality of the current request.
     * @param {String} uri
     * @param {Object} jar
     * @param {Object} headers
     *
     * @return {Object} The event object.
     */
    async resolveUri(meta, uri, jar, headers) {
        if (this.hasIpLocking() && this.scrapeFromClientResponse()) {
            return this.createScrapeEvent(uri, meta);
        }
        const responseHtml = await this.createRequest(this.normalizeUri(uri), jar, headers);
        return this.resolveHtml(meta, responseHtml, jar, headers);
    }

    /**
     * Resolve an html file.
     * @param {Object} meta The meta data for resolving requests.
     * @param {Object?} meta.sse server-side emitter/websocket agent. Only available when resolving on the server-side.
     * @param {String} meta.source The source that initiated the request.
     * @param {String} meta.quality The quality of the current request.
     * @param html
     * @param jar
     * @param headers
     *
     * @return {Array} Return a list of source events.
     */
    resolveHtml(meta, html, jar, headers) {
        _implementMe('resolveHtml');
    }

    /**
     * Function for creating a new request.
     * @param uri
     * @param jar
     * @param headers
     *
     * @return Promise
     */
    createRequest(uri, jar, headers) {
        return rp({
            uri,
            headers,
            jar,
            followAllRedirects: true,
            timeout: 5000
        });
    }

    /**
     * Process html resources. Usually called at the end of <code>resolveHtml</code>
     * @see resolveHtml
     *
     * @param {ClawsMetadata} metaData
     * @param {Array} links
     * @return {Array}
     */
    processHtmlResults(metaData, links) {
        if (metaData.sse) {
            if (metaData.sse.stopExecution) {
                console.log(`${this.getResolverId()}: Skip resolve due to disconnect. This should rarely ever happen!`);
                return links;
            }

            // Emitting resources directly from the server.
            links.forEach(link => {
                const event = this.createEvent(link, false, undefined, {
                    quality: metaData.quality,
                    source: metaData.source
                });
                metaData.sse.send(event, event.event);
            });
            return links;
        } else {
            // Returning links directly from HTMl.
            const dataList = [];
            links.forEach(dataObject => {
                dataList.push(this.createEvent(dataObject, false, {}, {quality: metaData.quality}));
            });
            return dataList;
        }
    }

    /**
     * Internal function to use for creating a scrape event.
     * @param data
     * @param ipLocked
     * @param pairing
     * @param {{quality: String, source: String}|ClawsMetadata} metaData
     * @param headers
     *
     * @return {Object} The event object.
     */
    createEvent(data, ipLocked, pairing, metaData, headers) {
        if (!metaData['provider']) {
            metaData['provider'] = this.getResolverId();
        }
        return createEvent(data, ipLocked, pairing, metaData, headers);
    }

    /**
     * Create a scrape event to send back to the client when ipLocking is enabled.
     * @see scrapeFromClientResponse
     *
     * @param {String} uri The uri for the current resolver.
     * @param {{quality: String, source: String}|ClawsMetadata} metaData The request metadata.
     *
     * @return {Object}
     */
    createScrapeEvent(uri, metaData) {
        return this.createEvent(undefined, true, {target: uri}, {quality: metaData.quality, source: metaData.source})
    }

    /**
     * Whether to scrape using the client's response object or not.
     * @return {boolean}
     */
    scrapeFromClientResponse() {
        return process.env.CLAWS_ENV === 'server';
    }

    /**
     *
     * @param {Object} $ Cheerio object.
     * @param {Function} processFn Optional callback for modifying the default jQuery object.
     * @return {Function}
     */
    _getJqueryShim($, processFn = null) {
        return function (selector, anotherArg) {

            let jQuery = function () {
                return jQuery;
            };

            jQuery.ready = jQuery.click = jQuery.hide = jQuery.show = jQuery.mouseup = jQuery.mousedown =
                jQuery.hasClass = jQuery.attr = jQuery.post = jQuery.get = jQuery.append = jQuery;

            jQuery.cookie = function () {
                return true;
            };

            if (processFn) {
                // Allow sub-classes to modify the returned jQuery object.
                processFn(jQuery, $, arguments);
            }

            return jQuery
        };
    }

    /**
     * Return a JWPlayer shim object.
     * @param {Function} setupCallback
     */
    _getJwPlayerShim(setupCallback) {
        let jwplayer = function () {
            return jwplayer;
        };
        jwplayer.on = jwplayer.addButton = jwplayer;

        jwplayer.setup = setupCallback;

        return jwplayer;
    }

    _getClapprShims(playerCallback) {
        let noop = function () {
            return noop;
        };
        let player = function (config) {
            playerCallback && playerCallback(config, 'constructor');
            return {
                options: config,
                attachTo: noop,
                listenTo: noop,
                configure: noop,
                play: noop,
                load: (options) => {
                    playerCallback && playerCallback(options, 'load');
                },
            }
        };
        let events = function () {
            return {
                PLAYER_FULLSCREEN: 'fullscreen',
                on: events,
                once: events,
                off: events,
                trigger: events,
                stopListening: events,
            }
        };
        let Clappr = {
            Player: player,
            Events: events,
        };
        Clappr.$ = function () {
            return {text: noop};
        };

        // List of properties which should be merged into the context object.
        return {
            Clappr: Clappr,
            LevelSelector: {},
            TheaterMode: {},
        };
    }

    _getDefaultSandbox(jQuery, jwPlayer, clapper, includeBrowserShims) {
        let sandbox = {
            $: jQuery,
            jQuery: jQuery,
            jwplayer: jwPlayer,
            sin: Math.sin,
            navigator: {
                userAgent: ''
            },
            ...clapper,
        };

        if (includeBrowserShims) {
            let Document = this._createNativeProxyShim('Document', false);

            sandbox['Document'] = Document;
            sandbox['document'] = Document;
        }

        sandbox['window'] = sandbox;
        return sandbox;
    }

    /**
     * Create a native shim object e.g. Document, which allows you call any functions/properties and allow them
     * to resolve without throwing a "Cannot read property of undefined" error.
     * Useful for bypassing tricky resolvers like Openload which check for browser objects.
     *
     * @param {String} propertyName
     * @param {Boolean} useProxy Set this if you need to shim complex objects with dynamic properties.
     * @return {Function|Proxy}
     */
    _createNativeProxyShim(propertyName, useProxy) {
        let that = this;

        let shim;
        if (useProxy) {
            shim = new Proxy(function () {
                return shim;
            }, {
                get: function (target, name, proxy) {
                    if (target.hasOwnProperty(name)) {
                        return target[name];
                    }

                    if ('hasOwnProperty' === name) {
                        return function () {
                            return true;
                        }
                    } else if ('toString' === name) {
                        return `toString: ${name}`;
                    } else if ('length' === name) {
                        return 0;
                    } else if (name === '__proto__') {
                        return proxy ? proxy : that;
                    }

                    return that._createNativeProxyShim(name, true);
                },
            });
        } else {
            shim = function () {
            };
        }

        let objectToString = "[object " + (propertyName.charAt(0).toUpperCase() + propertyName.slice(1)) + "]";

        shim.toString = function () {
            if (useProxy || /^[A-Z]/.test(propertyName)) {
                // Starts with a uppercase - it's a class.
                return "function " + propertyName + "() { [native code] }";
            }
            return objectToString;
        };
        shim.__proto__.toString = shim.toString;
        shim.prototype.toString = function () {
            return objectToString
        };

        return shim;
    }
};

// Done this way, because it's the only way to get IntelliJ type-hinting to work.
module.exports = BaseResolver;