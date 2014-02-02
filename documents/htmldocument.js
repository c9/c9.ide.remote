define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "remote", "watcher"
    ];
    main.provides = ["HTMLDocument"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.Plugin;
        var remote   = imports.remote;
        var watcher  = imports.watcher;
        
        var HTMLInstrumentation 
            = require("../c9.ide.language.html.diff/HTMLInstrumentation");
        
        function HTMLDocument(path){
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
            
             /** Triggered on change by the editor */
            function update(){
                // Calculate changes
                
                // Only handles attribute changes currently.
                // TODO: text changes should be easy to add
                // TODO: if new tags are added, need to instrument them
                var result = HTMLInstrumentation.getUnappliedEditList(editor, change);
                
                if (result.edits) {
                    transports.forEach(function(transport){
                        transport.processDOMChanges(path, result.edits);
                    });
                }
        
                this.errors = result.errors || [];
                if (this.errors.length) alert(this.errors); // @todo
                // $(this).triggerHandler("statusChanged", [this]);
                
                // Debug-only: compare in-memory vs. in-browser DOM
                // edit this file or set a conditional breakpoint at the top of this function:
                //     "this._debug = true, false"
                // if (this._debug) {
                //     console.log("Edits applied to browser were:");
                //     console.log(JSON.stringify(result.edits, null, 2));
                //     applyEditsPromise.done(function () {
                //         self._compareWithBrowser(change);
                //     });
                // }
                
        //        var marker = HTMLInstrumentation._getMarkerAtDocumentPos(
        //            this.editor,
        //            editor.getCursorPos()
        //        );
        //
        //        if (marker && marker.tagID) {
        //            var range   = marker.find(),
        //                text    = marker.doc.getRange(range.from, range.to);
        //
        //            // HACK maintain ID
        //            text = text.replace(">", " data-brackets-id='" + marker.tagID + "'>");
        //
        //            // FIXME incorrectly replaces body elements with content only, missing body element
        //            RemoteAgent.remoteElement(marker.tagID).replaceWith(text);
        //        }
        
                // if (!this.editor) {
                //     return;
                // }
                // var codeMirror = this.editor._codeMirror;
                // while (change) {
                //     var from = codeMirror.indexFromPos(change.from);
                //     var to = codeMirror.indexFromPos(change.to);
                //     var text = change.text.join("\n");
                //     DOMAgent.applyChange(from, to, text);
                //     change = change.next;
                // }
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
                update: update
            });
            
            return plugin;
        }
        
        register(null, {
            HTMLDocument: HTMLDocument
        });
    }
});