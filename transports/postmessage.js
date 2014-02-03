define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "commands", "c9"
    ];
    main.provides = ["remote.PostMessage"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.Plugin;
        var commands = imports.commands;
        var c9       = imports.c9;
        
        var HTMLURL = options.htmlurl
        if (!HTMLURL || HTMLURL.charAt(0) == "/")
            HTMLURL = location.protocol + "//" + location.host + HTMLURL;
        var previewOrigin = HTMLURL.match(/^(?:[^\/]|\/\/)*/)[0];
        
        var counter = 0;
        
        function PostMessage(iframe, sessionId){
            /***** Initialization *****/
            
            var plugin = new Plugin("Ajax.org", main.consumes);
            var emit   = plugin.getEmitter();
            
            var styleSheets, scripts, html, source;
            
            var loaded = false;
            function load() {
                if (loaded) return false;
                loaded = true;
                
                var onMessage = function(e) {
                    if (c9.hosted && event.origin !== previewOrigin)
                        return;
                    
                    if (sessionId != e.data.id)
                        return;
                    
                    if (e.data.message == "exec") {
                        commands.exec(e.data.command);
                    }
                    else if (e.data.message == "callback") {
                        callbacks[e.data.cb](e.data.data);
                        delete callbacks[e.data.cb];
                    }
                    else if (e.data.message == "focus") {
                        emit("focus");
                    }
                    else if (e.data.message == "html.ready") {
                        var data = e.data.data;
                        styleSheets = data.styles;
                        scripts     = data.scripts;
                        html        = data.href;
                        source      = e.source;
                        
                        // Send available keys
                        source.postMessage({
                            id   : sessionId,
                            type : "keys",
                            keys : commands.getExceptionBindings()
                        }, "*");
                        
                        emit("ready");
                    }
                };
                
                window.addEventListener("message", onMessage, false);
                plugin.addOther(function(){
                    window.removeEventListener("message", onMessage, false);
                });
            }
            
            /***** Methods *****/
            
            var callbacks = [];
            function wrapCallback(callback){
                return callbacks.push(callback) - 1;
            }
            
            function getSources(callback){
                return callback(null, {
                    styleSheets : styleSheets,
                    scripts     : scripts,
                    html        : html
                });
            }
            
            function getStyleSheet(){
                
            }
            
            function getHTMLDocument(callback){
                var message = {
                    id      : sessionId,
                    type    : "simpledom",
                    cb      : wrapCallback(callback)
                };
                source.postMessage(message, "*");
            }
            
            function getScript(){
                
            }
            
            function updateStyleSheet(path, value){
                var message = {
                    id      : sessionId,
                    type    : "updatecss",
                    path    : path,
                    data    : value
                };
                source.postMessage(message, "*");
            }
            
            function updateStyleRule(url, rule){
                var message = {
                    id      : sessionId,
                    type    : "stylerule",
                    url     : url,
                    rule    : rule
                };
                source.postMessage(message, "*");
            }
            
            function processDOMChanges(edits){
                var message = {
                    id      : sessionId,
                    type    : "domedits",
                    edits   : edits
                };
                source.postMessage(message, "*");
            }
            
            function updateScript(){
                
            }
            
            function deleteStyleSheet(url){
                var message = {
                    id      : sessionId,
                    type    : "update",
                    url     : url,
                    del     : true
                };
                source.postMessage(message, "*");
            }
            
            function deleteScript(){
                
            }
            
            var lastQuery;
            function highlightCSSQuery(query, force){
                if (!force && lastQuery == query) return;
                lastQuery = query;
                
                var message = {
                    id      : sessionId,
                    type    : "highlight",
                    query   : query
                };
                source.postMessage(message, "*");
            }
            
            /***** Lifecycle *****/
            
            plugin.on("load", function() {
                load();
            });
            plugin.on("enable", function() {
                
            });
            plugin.on("disable", function() {
                
            });
            plugin.on("unload", function() {
                loaded = false;
            });
            
            /***** Register and define API *****/
            
            /**
             * 
             **/
            plugin.freezePublicAPI({
                _events : [
                    /**
                     * @event draw
                     */
                    "draw"
                ],
                
                /**
                 * 
                 */
                getSources: getSources,
                
                /**
                 * 
                 */
                getStyleSheet: getStyleSheet,
                
                /**
                 * 
                 */
                getHTMLDocument: getHTMLDocument,
                
                /**
                 * 
                 */
                getScript: getScript,
                
                /**
                 * 
                 */
                updateStyleSheet: updateStyleSheet,
                
                /**
                 * 
                 */
                updateStyleRule: updateStyleRule,
                
                /**
                 * 
                 */
                processDOMChanges: processDOMChanges,
                
                /**
                 * 
                 */
                updateScript: updateScript,
                
                /**
                 * 
                 */
                deleteStyleSheet: deleteStyleSheet,
                
                /**
                 * 
                 */
                deleteScript: deleteScript,
                
                /**
                 * 
                 */
                highlightCSSQuery: highlightCSSQuery
            });
            
            plugin.load("postmessage" + counter++)
            
            return plugin;
        }
        
        register(null, {
            "remote.PostMessage": PostMessage
        });
    }
});