$(function() {
  var cd = function(uri, opts) {
    var $dir = $('#dir').hide().empty();
    var $message = $("#message");

    $message.text(uri);

    (opts.dir || []).concat({ path: '..', type: '/' }).forEach(function(f) {
      $dir.append($("<li />").append($("<a>" + f.path + f.type + "</a>", { 'href': '#' }).click(function() {

        if (f.type == '/') {
          return $kernel.cd(f.path);
        }

        // if file is executable, prompt user to run
        if (f.type == '*') {
          if(confirm("Run the executable \"" + f.path + "\"?")) {
            exec(null, {
              'markup': '<iframe seamless class="exec" src="' + $kernel.web(f.path) + '"></iframe>'
            });

            return;
          }
        }

        return $kernel.exec(f.path);
      })));
    });

    $dir.show();
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

  $kernel.cd('/srv');
});
