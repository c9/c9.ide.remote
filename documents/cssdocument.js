define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "remote", "watcher", "fs"
    ];
    main.provides = ["CSSDocument"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.Plugin;
        var remote   = imports.remote;
        var watcher  = imports.watcher;
        var fs       = imports.fs;
        
        var counter = 0;
        
        function CSSDocument(path){
            var exists = remote.findDocument(path);
            if (exists) return exists;
            
            /***** Initialization *****/
            
            var plugin = new Plugin("Ajax.org", main.consumes);
            // var emit   = plugin.getEmitter();
            
            var transports = [];
            var tab, doc;
            
            var loaded = false;
            function load() {
                if (loaded) return false;
                loaded = true;
                
                remote.register(plugin);
            }
            
            /***** Methods *****/
            
            function addTransport(transport){
                if (transports.indexOf(transport) == -1) {
                    transports.push(transport);
                    
                    transport.addOther(function(){
                        var idx = transports.indexOf(transport);
                        if (~idx) transports.splice(idx, 1);
                    });
                }
                
                return plugin;
            }
            
            function initTab(t){
                if (t && tab) 
                    throw new Error("Tab has already been defined");
                tab = t;
                
                if (!tab) {
                    doc = null;
                    fs.readFile(path, function(err, data){
                        update(null, data);
                    });
                    return;
                }
                
                doc = tab.document;
                var session = doc.getSession().session;
                
                // Listen for cursor position change
                session.selection.on("changeCursor", updateHighlight);
                
                // Listen for change in the document
                doc.undoManager.on("change", update, plugin);
                
                // Listen for a tab close event
                tab.on("close", function(){ watcher.watch(path); });
                
                if (doc.changed)
                    update();
            }
            
            var lastQuery;
            var reCssQuery = /(^|.*\})(.*)\{|\}/;
            function updateHighlight(e){
                if (!tab) return;
                
                var session = doc.getSession().session;
                var lines   = session.doc.getAllLines();
                var cursor  = session.selection.lead;
                
                var line = lines[cursor.row].substr(0, cursor.column);
                
                var query;
                if (line.match(reCssQuery))
                    query = RegExp.$2;
                else {
                    for (var i = cursor.row - 1; i >= 0; i--) {
                        if (lines[i].match(reCssQuery)) {
                            query = RegExp.$2;
                            break;
                        }
                    }
                }
                
                if (lastQuery == query) return;
                
                transports.forEach(function(transport){
                    transport.highlightCSSQuery(query);
                });
            }
            
            function remove(){
                transports.forEach(function(transport){
                    transport.deleteStyleSheet(path);
                });
            }
            
            function update(changes, value){
                transports.forEach(function(transport){
                    transport.updateStyleSheet(path, value || doc.value);
                });
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
                /**
                 * 
                 */
                get path(){ return path; },
                
                /**
                 * 
                 */
                get tab(){ return tab; },
                
                /**
                 * 
                 */
                set tab(tab){ initTab(tab); },
                
                _events : [
                    /**
                     * @event draw
                     */
                    "draw"
                ],
                
                /**
                 * 
                 */
                addTransport: addTransport,
                
                /**
                 * 
                 */
                remove: remove,
                
                /**
                 * 
                 */
                update: update
            });
            
            plugin.load("cssdocument" + counter++);
            
            return plugin;
        }
        
        register(null, {
            CSSDocument: CSSDocument
        });
    }
});