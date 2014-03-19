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
            
            var sources = [];
            var styleSheets, scripts, html;
            
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
                        var cb = callbacks[e.data.cb];
                        if (cb) {
                            cb(e.data.data);
                            delete callbacks[e.data.cb];
                        }
                    }
                    else if (e.data.message == "focus") {
                        emit("focus");
                    }
                    else if (e.data.message == "html.ready") {
                        var data = e.data.data;
                        styleSheets = data.styles;
                        scripts     = data.scripts;
                        html        = data.href;
                        
                        if (sources.indexOf(e.source) == -1) {
                            sources.push(e.source);
                            e.source.addEventListener("unload", function(){
                                var idx = sources.indexOf(this);
                                if (idx > -1) sources.splice(idx, 1);
                                
                                if (!sources.length)
                                    emit("empty");
                            });
                        }
                        
                        // Send available keys
                        e.source.postMessage({
                            id   : sessionId,
                            type : "keys",
                            keys : commands.getExceptionBindings()
                        }, "*");
                        
                        // todo: should this emit e, so that init messages are 
                        // sent only to newly added page?
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
            
            function send(message){
                sources.forEach(function(source){
                    source.postMessage(message, "*");
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
                send(message);
            }
            
            function initHTMLDocument(dom){
                var message = {
                    id      : sessionId,
                    type    : "initdom",
                    dom     : dom
                };
                send(message);
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
                send(message);
            }
            
            function updateStyleRule(url, rule){
                var message = {
                    id      : sessionId,
                    type    : "stylerule",
                    url     : url,
                    rule    : rule
                };
                send(message);
            }
            
            function processDOMChanges(edits){
                var message = {
                    id      : sessionId,
                    type    : "domedits",
                    edits   : edits
                };
                send(message);
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
                send(message);
            }
            
            function deleteScript(){
                
            }
            
            function reload(){
                var message = {
                    id      : sessionId,
                    type    : "reload"
                };
                send(message);
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
                send(message);
            }
            
            function reveal(query) {
                var message = {
                    id      : sessionId,
                    type    : "reveal",
                    query   : query || lastQuery
                };
                send(message);
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
                get sources(){ return sources.slice(0); },
                
                _events : [
                    /**
                     * @event draw
                     */
                    "draw"
                ],
                
                /**
                 * 
                 */
                reload: reload,
                
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
                initHTMLDocument: initHTMLDocument,
                
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
                highlightCSSQuery: highlightCSSQuery,
                
                /**
                 * 
                 */
                reveal: reveal
            });
            
            plugin.load("postmessage" + counter++);
            
            return plugin;
        }
        
        register(null, {
            "remote.PostMessage": PostMessage
        });
    }
});