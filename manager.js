define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "watcher", "tabManager", "fs"
    ];
    main.provides = ["remote"];
    return main;

    function main(options, imports, register) {
        var Plugin     = imports.Plugin;
        var watcher    = imports.watcher;
        var fs         = imports.fs;
        var tabManager = imports.tabManager;
        
        /***** Initialization *****/
        
        var plugin = new Plugin("Ajax.org", main.consumes);
        // var emit   = plugin.getEmitter();
        
        var documents = {};
        
        var loaded = false;
        function load() {
            if (loaded) return false;
            loaded = true;
            
            // watcher.on("delete", function(e){
            //     var info = isKnownFile(e.path);
            //     if (info) {
            //         info.del = true;
            //         update(null, info);
                    
            //         doc.remove();
            //         // doc.unload();
            //     }
            // }, plugin);
            
            // watcher.on("change", function(e){
            //     var info = isKnownFile(e.path);
            //     if (info) {
            //         var tab = tabManager.findTab(e.path);
            //         if (!tab) {
            //             fs.readFile(e.path, function(err, data){
            //                 update({ value: data }, info);
            //             });
            //         }
            //     }
            // }, plugin);
            
            // Listen for opening files
            tabManager.on("open", function(e){
                var tab = e.tab;
                var doc = tab.path && documents[tab.path];
                if (doc) doc.tab = tab;
            }, plugin);
            
            // Listen for closing tabs
            tabManager.on("tabDestroy", function(e){
                var tab = e.tab;
                var doc = tab.path && documents[tab.path];
                if (doc) doc.tab = null;
            }, plugin);
        }
        
        /***** Methods *****/
        
        function registerDocument(doc){
            documents[doc.path] = doc;
            watcher.watch(doc.path);
            
            doc.tab = tabManager.findTab(doc.path);
            
            doc.addOther(function(){
                delete documents[doc.path];
            });
        }
        
        function findDocument(path){
            return documents[path];
        }
        
        // function isKnownFile(path){
        //     var found;
            
        //     if (~session.href.indexOf(path))
        //         return { url: session.href, type: "html" }
            
        //     function search(arr, type) {
        //         if (arr.some(function(p){
        //             if (~p.indexOf(path)) {
        //                 found = p;
        //                 return true;
        //             }
        //         })) {
        //             return { url: found, type: type }
        //         }
        //     }
            
        //     return search(session.styles, "css")
        //         || search(session.scripts, "code");
        // }
        
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
            findDocument: findDocument,
            
            /**
             * 
             */
            register: registerDocument
        });
        
        register(null, {
            remote: plugin
        });
    }
});