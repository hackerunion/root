(function(global) {
    var Kernel = klass(function(env, cb) {
        this.env = _.extend({
            cwd: [],
            handlers: {}
        }, env);

        this.cb = cb || function(err, ctx, uri, opts) { console.log(err ? "Fail: " + err : "[" + ctx + "] " + uri); next(err); };
    })
    .statics({
        DEFAULT_HANDLER: '?',
        CAT_ENDPOINT: ['bin', 'cat.cgi'],
        LS_ENDPOINT: ['bin', 'ls.cgi'],

        withScripts: function(srcList, callback) {
            var numScripts = srcList.length;
            var numLoaded = 0;
            var scriptLoaded = function() {
                numLoaded++;
                if (numLoaded === numScripts) {
                    callback();
                }
            };
    
            for (var i=0; i<numScripts; i++) {
                var script_tag = document.createElement('script');
    
                script_tag.setAttribute("type","text/javascript");
                script_tag.setAttribute("src", srcList[i]);
    
                if (script_tag.readyState) {
                    script_tag.onreadystatechange = function() { // For old versions of IE
                        if (this.readyState == 'complete' || this.readyState == 'loaded') {
                            scriptLoaded();
                        }
                    };
                } else {
                    script_tag.onload = scriptLoaded;
                }
    
                // Try to find the head, otherwise default to the documentElement
                (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
            }
    
            if (!numScripts) {
                callback();
            }
        },
    
        withStyleSheets: function(srcList, callback) {
            for (var i=0; i<srcList.length; i++) {
                if (document.createStyleSheet) {
                    document.createStyleSheet(srcList[i]);
                } else {
                    var ss = document.createElement("link");
                    ss.type = "text/css";
                    ss.rel = "stylesheet";
                    ss.href = srcList[i];
                    document.getElementsByTagName("head")[0].appendChild(ss);
                }
            }
            if (callback) { callback(); }
        },
    
        loadDependencies: function(scripts, styles, callback) {
            withStyleSheets(styles);
            withScripts(scripts, callback);
        }
    })
    .methods({
        path: function(uri) {
            // assume all arrays are paths
            if (Array.isArray(uri)) {
                return uri;
            }
            
            var dirs = (uri || '').split('/');
            var absolute = dirs[0] == '';
            
            if (absolute) {
                dirs.shift();
            } else {
                dirs = this.env.cwd.concat(dirs);
            } 

            return _.reduce(dirs, function(all, c) { if (c == '.') return all; if (c == '..') return all.slice(0, -1); return all.concat(c); }, []);
        },

        bind_listener: function(cb) {
            this.cb = cb 
        },

        bind_handlers: function(handlers) {
            this.env.handlers = _.extend(this.env.handlers, handlers);
        },

        dirname: function(uri) {
            return this.path(uri).slice(0, -1);
        },

        filename: function(uri) {
            var path = this.path(uri);
            var file = path[path.length - 1];
            
            if (file[0] == '.') {
                return { basename: file, suffix: '', special: true };
            }
            
            var parts = file.split('.');

            return { basename: parts[0], suffix: parts.length > 1 ? parts[1].toLowerCase() : "", special: false };
        },

        uri: function(path) {
            return '/' + this.path(path).join('/');
        },

        cd: function(uri, next) {
            var kernel = this;
            var path = kernel.path(uri);
            var next = next || kernel.cb;

            kernel._fetch(Kernel.LS_ENDPOINT, path, function(err, obj) {
                if (err || !obj) {
                    return next(err, 'cd');
                }

                var opts = { 'dir': obj.value };

                // find all index files in current directory and inject exec callback
                var index_funcs = _.map(_.filter(opts.dir, function(file) { return 0 == file.path.search(/index\.|README\./) && '-' == file.type; }), function(file) {
                    return function(cnt) {
                        kernel.exec(kernel.uri(path.concat(file.path)), null, function(err) { next.apply(this, arguments); cnt(err); });
                    };
                });
                
                // evaluate all index funcs (from above) in parallel (if no index functions, the callback is always invoked)
                return async.parallel(index_funcs, function(err, data) {
                  // update current working directory
                  if (!err) {
                    kernel.env.cwd = path;
                  }
                  
                  return next(err, 'cd', kernel.uri(kernel.env.cwd), opts); });
            });
        },
        
        exec: function(uri, opts, next) {
            var kernel = this;
            var path = kernel.path(uri);
            var file = kernel.filename(uri);
            var next = next || kernel.cb;
            var opts = opts || {};
            var handler;

            // can't execute special files like "." and ".."
            if (file.special) {
                return next("Not executable", "exec"); 
            }

            kernel._fetch(Kernel.CAT_ENDPOINT, path, function(err, obj) {
                if (err || !obj) {
                    return next(err);
                }

                // check for an explicit handler
                var data = obj.value;
                var shebang = data.match(/#!\s*([^\n\r]*)([\s\S]*)/);
                var meta = {};

                if (shebang) {
                    try { 
                        meta = JSON.parse(shebang[1]);
                    } catch (e) {
                        /* nop */
                    }
          
                    data = shebang[2];
                }

                // attempt to lookup handler by extension, or default handler
                if (meta.handler) {
                    handler = meta.handler;
                } else if (file.suffix in kernel.env.handlers) {
                    handler = kernel.env.handlers[file.suffix];
                } else if (Kernel.DEFAULT_HANDLER in kernel.env.handlers)  {
                    handler = kernel.env.handlers[Kernel.DEFAULT_HANDLER];
                } else {
                    return next("No handler", null);
                }

                opts['data'] = data;
                opts['meta'] = meta;

                // fetch handler via api
                var cb = function(err, src) {
                    if (err) {
                        return next(err);
                    }
                    
                    if (src) {
                      // source must be enclosed in parenthesis
                      if (src.value[0] != '(' || src.value[src.value.length-1] != ')') {
                        src.value = '(' + src.value + ')';
                      }

                      handler = window.eval.call(window, src.value);
                    }

                    handler(null, 'eval', kernel.uri(path), opts, next);
                };
                
                if (_.isFunction(handler)) {
                  return cb();
                }

                kernel._fetch(Kernel.CAT_ENDPOINT,  kernel.path(handler), cb);
            });
        },

        _fetch: function(endpoint, path, cb) {
            $.ajax({
                'type': 'GET',
                'url': this.uri(endpoint),
                'data': { 'path': this.uri(path) },
                'success': function(data) { cb(null, data); },
                'error': function(x, e, msg) { cb(msg); }
            });
        }
    });

    global.Kernel = Kernel;
    global.$kernel = new Kernel({
      'handlers': {
        '?': function(err, ctx, uri, opts, cb) {
            opts['markup'] = '<pre>' + opts.data + '</pre>';
            return cb.apply(this, arguments);
        }
      }
    });
})(window);