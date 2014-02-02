define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "remote", "watcher"
    ];
    main.provides = ["CSSDocument"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.Plugin;
        var remote   = imports.remote;
        var watcher  = imports.watcher;
        
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
                if (tab) throw new Error("Tab has already been defined");
                tab = t;
                doc = tab.document;
                
                // Listen for change in the document
                doc.undoManager.on("change", update, plugin);
                
                // Listen for a tab close event
                tab.on("close", function(){ watcher.watch(path); });
                
                if (doc.changed)
                    update();
            }
            
            function remove(){
                transports.forEach(function(transport){
                    transport.deleteStyleSheet(path);
                });
            }
            
            function update(){
                transports.forEach(function(transport){
                    transport.updateStyleSheet(path, doc.value);
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
                remove: remove,
                
                /**
                 * 
                 */
                update: update
            });
            
            return plugin;
        }
        
        register(null, {
            CSSDocument: CSSDocument
        });
    }
});