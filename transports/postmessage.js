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
            
            function getSources(callback){
                return callback(null, {
                    styleSheets : styleSheets,
                    scripts     : scripts,
                    html        : html
                });
            }
            
            function getStyleSheet(){
                
            }
            
            function getHTMLDocument(){
                
            }
            
            function getScript(){
                
            }
            
            function updateStyleSheet(url, value){
                var message = {
                    id      : sessionId,
                    type    : "update",
                    url     : url,
                    css     : value
                };
                source.postMessage(message, "*");
            }
            
            function processDOMChanges(){
                
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
                deleteScript: deleteScript
            });
            
            plugin.load("postmessage" + counter++)
            
            return plugin;
        }
        
        register(null, {
            "remote.PostMessage": PostMessage
        });
    }
});