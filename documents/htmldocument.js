define(function(require, exports, module) {
    main.consumes = [
        "Plugin", "remote", "watcher", "fs", "save"
    ];
    main.provides = ["HTMLDocument"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.Plugin;
        var remote   = imports.remote;
        var watcher  = imports.watcher;
        var save     = imports.save;
        var fs       = imports.fs;
        
        var Range    = require("ace/range").Range;
        var HTMLInstrumentation 
            = require("../../c9.ide.language.html.diff/HTMLInstrumentation");
        
        var counter = 0;
        
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
                        if (~idx) {
                            transports.splice(idx, 1);
                            
                            if (transports.length === 0)
                                plugin.unload();
                        }
                    });
                    
                }
                
                if (doc)
                    initDom(transport);
                
                if (tab && tab.isActive())
                    updateHighlight(true);
                
                // if (doc && doc.changed)
                //     update();
                
                return plugin;
            }
            
            function initTab(t){
                if (!t) {
                    doc = null;
                    if (tab) {
                        fs.readFile(path, function(err, data){
                            update(null, data);
                        });
                    }
                    tab = null;
                    return;
                }
                
                tab = t;
                doc = tab.document;
                
                // Listen for change in the document
                var c9session = doc.getSession();
                c9session.on("init", function(e){
                    e.session.on("change", update);
                    e.session.selection.on("changeCursor", updateHighlight);
                    e.session.savedDom = null;
                    e.session.dom = null;
                    plugin.addOther(function () {
                        e.session.off("change", update);
                        e.session.selection.off("changeCursor", updateHighlight);
                        e.session.savedDom = null;
                        e.session.dom = null;
                    });
                    transports.forEach(function(transport) {
                        initDom(transport, doc);
                    });
                });
                
                tab.on("activate", function(){ updateHighlight(); }, plugin);
                tab.on("deactivate", function(){ updateHighlight(false); }, plugin);
                
                // Listen for a tab close event
                tab.on("close", function(){ watcher.watch(path); });
                
                // @Ruben is there a better way to listen for save event?
                save.on("afterSave", function(e){
                    if (e.document == doc) {
                        var session = doc.getSession().session;
                        if (session)
                            session.savedDom = session.dom;
                    }
                });
            }
            
            function initDom(transport) {
                if (!doc) return;
                var session = doc.getSession().session;
                if (!session) return;
                var docState = HTMLInstrumentation.syncTagIds(session);
                if (docState.errors) {
                    session.dom = null;
                    this.errors = docState.errors;
                    console.log(this.errors);
                } else {
                    transport.initHTMLDocument(docState);
                }
            }
            
            function updateHighlight(e){
                var query, tagId;
                
                if (tab && e !== false) {
                    var session = doc.getSession().session;
                    if (!session || !session.dom) return;
                    
                    tagId = HTMLInstrumentation._getTagIDAtDocumentPos(session, session.selection.lead);
                }
                
                if (tagId) {
                    query = "[data-cloud9-id='" + tagId + "']";
                } else {
                    query = false;
                }
                
                // Send the highlight command
                transports.forEach(function(transport){
                    transport.highlightCSSQuery(query, e === true);
                });
            }
            
            function update(e, value){
                var changes = e && e.data;
                if (!changes) return; //@todo allow only value to be set
                
                // Calculate changes
                var session = doc.getSession().session;
                if (!session.dom) {
                    transports.forEach(function(transport) {
                        initDom(transport);
                    });
                    return;
                }
                
                var result = HTMLInstrumentation.getUnappliedEditList(session, changes);
                
                if (result.edits) {
                    transports.forEach(function(transport){
                        transport.processDOMChanges(result.edits, path);
                    });
                }
        
                this.errors = result.errors || [];
                
                if (session.domErrorMarker) {
                    session.removeMarker(session.domErrorMarker);
                    session.domErrorMarker = null;
                }
                if (this.errors.length) {
                    var error = this.errors[0];
                    var range = Range.fromPoints(error.startPos, error.endPos);
                    session.domErrorMarker = session.addMarker(range, "language_highlight_error", "text");
                }
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
                update: update
            });
            
            plugin.load("htmldocument" + counter++);
            
            return plugin;
        }
        
        register(null, {
            HTMLDocument: HTMLDocument
        });
    }
});