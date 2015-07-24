function boot(root, home, cache) {
  $(function() {
    var MSG_MAX = 25;
    var S_ISDIR = function(m) { return m & 0x4000 };
    var CPID = null;
    var AUTO = null;
    
    var autopilot = function(file) {
      if (file || file === null) {
        AUTO = file;
      }

      return AUTO;
    };

    var contentShow = function() {
      clearTimeout(CPID);
      CPID = setTimeout(function() { $("#content").show(); }, 1000);
    };

    var contentHide = function() {
      clearTimeout(CPID);
      CPID = setTimeout(function() { $("#content").hide(); }, 1000);
    };
    
    var msg = function(s, is_uri) {
      var $msg = $("#message");
      var cnt = '...';
      var root = '';
      var s = s || 'Unknown error';

      if (is_uri && s.length > MSG_MAX) {
        var path = s.split('/');
        var res = '';
        
        _.forEachRight(path, function(p, i) {
          res = (p ? '/' + p : p) + res;
          
          if (res.length + cnt.length > MSG_MAX) {
            root = path.slice(0, i+1).join("/");
            return false;
          }

          s = res;
        });

        if (res) {
          s = cnt + s;
        }
      }

      if (s.length > MSG_MAX) {
        s = cnt + s.slice(-MSG_MAX);
      }
      
      if (!is_uri) {
        return $msg.text(s);
      }

      var $nav = $("nav");
      var path = root;

      $msg.empty();

      if (!s.indexOf(cnt)) {
        $msg.append("<span>" + cnt + "</span>");
      }

      s.match(/\/[^\/]+/g).forEach(function(v) {
        var dir = path += v;

        $msg.append($("<a />").text(v).click(function() {
          $nav.addClass('loading');
          setTimeout(function() { $nav.removeClass('loading'); }, 5000);

          $kernel.cd(dir);
        }));
      });
    };
    
    var stat = function(uri, opts) {
    };

    var cd = function(uri, opts) {
      var $dir = $('#dir').empty();
      var $nav = $('nav');
      var $message = $("#message");
      var $index = null;
      var ap = autopilot();
      
      var dir = opts.dir || [];
      var index = opts.index || [];

      contentHide();
      msg(uri, true);
      
			_.sortByOrder(index, 'order', false).forEach(function(idx) {
        Array.prototype.unshift.apply(dir, _.remove(dir, 'path', idx.path));
      });
      
      dir.forEach(function(f) {
        var meta = _.findWhere(index, { 'path': f.path }) || {};

        if (f.path != '..' && meta.hide) {
          return true;
        }
        
        var $e = $('#templates ' + (f.type == '/' ? '.folder' : '.file')).clone().appendTo($dir);

        if (meta.special) {
          $e.addClass('special'); 
        }
  
        var $a = $e.find('a').text(f.path + f.type).click(function() {
          switch(f.type) {
            case '/':
              $nav.addClass('loading');
              setTimeout(function() { $nav.removeClass('loading'); }, 5000);

              $kernel.cd(f.path);
              break
          
            case '*':
              // if file is executable, load in frame
              exec(uri + '/' + f.path, { 'seamless': true, 'markup': '<iframe class="exec" src="' + $kernel.web(f.path) + '"></iframe>' }); 
              break;
           
            default:
              $kernel.exec(f.path);
          }

          return false;
        });

        if (ap == f.path) {
          autopilot(null);
          $index = $a;
        }
      });
      
      history.pushState(null, null, '#' + $kernel.noroot(uri));
  
      // automatically access index (or autopilot item), if found
      if ($index) {
        $index.click();
      }

      $nav.removeClass('loading');
      $dir.show();
      contentShow();
    };
  
    var exec = function(uri, opts) {
      var $content = $('#content');
      
      shell(true);

      if (opts.seamless) {
        $content.addClass('seamless');
      } else {
        $content.removeClass('seamless');
      }
    
      $content.html(opts['markup']);

      history.pushState(null, null, '#' + $kernel.noroot(uri));
    };
  
    var error = function(err, ctx) {
      msg("Error: " + err + (ctx ? (' (' + ctx + ')') : ''));
    };

    var $shell_btn = $("#shell-btn");
    var shell = function(hide) {
      var visible = $shell_btn.text()[0] == '-';
      var $shell = $("#shell");
      var $content = $("#content");

      if (hide) {
        if (visible) $shell_btn.click();
        return;
      }
      
      if (visible) {
        $shell.hide();
        $content.show();
      } else {
        $content.hide();
        $shell.show();

        // hackishly force reload (due to limitations of web shell)
        if (!$shell.hasClass("shell-iframe-hack")) {
          var f = $shell.addClass("shell-iframe-hack").find('iframe')[0];
	  f.src = f.src;
        }
      }
    };

    $shell_btn.click(function() {
      shell();

      if ($shell_btn.text()[0] == '+') {
        $shell_btn.text('-' + $shell_btn.text().slice(1))
      } else {
        $shell_btn.text('+' + $shell_btn.text().slice(1))
      }

      return false;
    });
    
    $kernel.bind_handlers({
      'md': '/srv/var/www/shell/js/handlers/markdown.js',
      'txt': '/srv/var/www/shell/js/handlers/text.js'
    });
  
    var ui = function(err, ctx, uri, opts) {
      if (err) {
        return error(err, ctx);
      }
  
      if (ctx == 'cd') {
        return cd(uri, opts);
      }
      
      if (ctx == 'stat') {
        return stat(uri, opts);
      }
      
      exec(uri, opts);
    };
    
    var navigate = function(dest) {
      autopilot($kernel.filename(root + dest).full);
      $kernel.cd($kernel.dirname(root + dest), null, true);
    };
    
    $kernel.use_cache(Kernel.LS_ENDPOINT, cache);
    $kernel.bind_listener(ui);
    $kernel.chroot(root);
    
    var cache_toggle = true;
    $("nav").on('dblclick', function() {
      if (cache_toggle) {
        msg("Cache disabled");
        $kernel.use_cache(Kernel.LS_ENDPOINT, {});
      } else {
        msg("Cache enabled");
        $kernel.use_cache(Kernel.LS_ENDPOINT, cache);
      }

      cache_toggle = !cache_toggle;
    });
    
    $(".container header a").on('click', function(e) {
      e.stopPropagation();
    });

    $(".container header").on('click', function() {
      var $content = $("body").toggleClass("maximize").parent();
    });
   
    $(window).on('hashchange', function(e) {
      navigate(e.newURL.split('#').slice(-1)[0]);
      return false;
    });

    if (window.location.hash) {
      navigate(window.location.hash.slice(1));
    } else {
      navigate(home);
    }
  });
}
