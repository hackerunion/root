function(err, ctx, uri, opts, cb) {
  Kernel.withScripts(['/usr/lib/js/marked/dev.js'], function() {
    opts['markup'] = marked(opts.data);
    return cb(err, ctx, uri, opts);
  });
}
