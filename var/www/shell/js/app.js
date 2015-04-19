function boot(root, home) {
  $(function() {
    var MSG_MAX = 25;
    var S_ISDIR = function(m) { return m & 0x4000 };
    var AUTO = null;

    var autopilot = function(file) {
      if (file || file === null) {
        AUTO = file;
      }

      return AUTO;
    };
    
    var msg = function(s, is_uri) {
      var cnt = '...';
      var s = s || 'Unknown error';

      if (is_uri && s.length > MSG_MAX) {
        var path = s.split('/');
        var res = '';
        
        _.forEachRight(path, function(p) {
          res = (p ? '/' + p : p) + res;
          
          if (res.length + cnt.length > MSG_MAX) {
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

      $("#message").text(s);
    };
    
    var stat = function(uri, opts) {
    };

    var cd = function(uri, opts) {
      var $dir = $('#dir').hide().empty();
      var $nav = $('nav');
      var $content = $('#content').hide();
      var $message = $("#message");
      var $index = null;
      var wander = true;
      var ap = autopilot();
  
      msg(uri, true);
  
      (opts.dir || []).forEach(function(f) {
        var $e = $('#templates ' + (f.type == '/' ? '.folder' : '.file')).clone().appendTo($dir);

        if (wander && f.type == '-' && /^index\..*/.test(f.path)) {
          $index = $e;
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
          wander = false;
        }
      });
      
      history.pushState(null, null, '#' + $kernel.noroot(uri));
      
      $nav.removeClass('loading');
      $dir.show();
      $content.show();
  
      // automatically access index (or autopilot item), if found
      if ($index) {
        $index.click();
      }
    };
  
    var exec = function(uri, opts) {
      var $content = $('#content');
      
      shell(true);

      if (opts.seamless) {
        $content.addClass('seamless');
      } else {
        $content.removeClass('seamless');
      }
    
      $content.html(opts['markup'] || '(no output)');
      history.pushState(null, null, '#' + $kernel.noroot(uri));
    };
  
    var error = function(err, ctx) {
      msg("Error: " + err + (ctx ? (' (' + ctx + ')') : ''));
    };

    var $shell_btn = $("#shell-btn");
    var shell = function(hide) {
      var visible = $shell_btn.text()[0] == '-';

      if (hide) {
        if (visible) $shell_btn.click();
        return;
      }
      
      if (visible) {
        $("#shell").hide();
        $("#content").show();
      } else {
        $("#content").hide();
        $("#shell").show();
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
      'md': '/srv/var/www/shell/js/handlers/markdown.js'
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

    $kernel.bind_listener(ui);
    $kernel.chroot(root);
    
    var dest = root + home;

    if (window.location.hash) {
      dest = root + window.location.hash.slice(1);
      
      autopilot($kernel.filename(dest).full);
      dest = $kernel.dirname(dest);
    }
    
    $kernel.cd(dest);
  });
}
