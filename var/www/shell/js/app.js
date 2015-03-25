$(function() {
  var cd = function(uri, opts) {
    var $dir = $('#dir').hide().empty();
    var $content = $('#content').hide();
    var $message = $("#message");
    var $index = null;

    $message.text(uri);

    (opts.dir || []).concat({ path: '..', type: '/' }).forEach(function(f) {
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
    $("#message").text("Error: " + err + (ctx ? (' (' + ctx + ')') : ''));
  };
  
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

  $kernel.chroot('/srv');
  $kernel.cd('/srv/var/www/public');
});
