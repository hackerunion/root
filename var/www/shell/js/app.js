function boot(root, home) {
  $(function() {
    var MSG_MAX = 25;
    
    var msg = function(s, is_uri) {
      var cnt = '...';

      if (is_uri && s.length > MSG_MAX) {
        var path = s.split('/');
        var res = '';
        
        _.forEachRight(path, function(p) {
          res = (p ? '/' + p : p) + res;

          if (res.length > MSG_MAX) {
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

    var cd = function(uri, opts) {
      var $dir = $('#dir').hide().empty();
      var $content = $('#content').hide();
      var $message = $("#message");
      var $index = null;
  
      msg(uri, true);
  
      (opts.dir || []).forEach(function(f) {
        var $e = $('#templates ' + (f.type == '/' ? '.folder' : '.file')).clone().appendTo($dir);
        
        if (f.type == '-' && /^index\..*/.test(f.path)) {
          $index = $e;
        }
  
        $e.find('a').text(f.path + f.type).click(function() {
          if (f.type == '/') {
            return $kernel.cd(f.path);
          }
  
          // if file is executable, load in frame
          if (f.type == '*') {
            return exec(null, {
              'markup': '<iframe class="exec" src="' + $kernel.web(f.path) + '"></iframe>'
            });
          }
  
          return $kernel.exec(f.path);
        });
      });
  
      $dir.show();
      $content.show();
  
      // automatically access index, if found
      if ($index) {
        $index.click();
      }
    };
  
    var exec = function(uri, opts) {
      var $content = $('#content');
      $content.html(opts['markup'] || '(no output)');
    };
  
    var error = function(err, ctx) {
      msg("Error: " + err + (ctx ? (' (' + ctx + ')') : ''));
    };

    var shell = function() {
      $("#content").toggle();
      $("#shell").toggle();
    };
    
    var $btn = $("#shell-btn");

    $btn.click(function() {
      shell();

      if ($btn.text()[0] == '+') {
        $btn.text('-' + $btn.text().slice(1))
      } else {
        $btn.text('+' + $btn.text().slice(1))
      }

      return false;
    });
    
    $kernel.bind_handlers({
      'md': '/srv/var/www/shell/js/handlers/markdown.js'
    });
  
    $kernel.bind_listener(function(err, ctx, uri, opts) {
      if (err) {
        return error(err, ctx);
      }
  
      if (ctx == 'cd') {
        return cd(uri, opts);
      }
  
      exec(uri, opts);
    });
    
    $kernel.chroot(root);
    $kernel.cd(root + home);
  });
}
