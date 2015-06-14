function(err, ctx, uri, opts, cb) {
    var pre = document.createElement('pre');
    var text = document.createTextNode(opts.data);

    pre.appendChild(text);
    opts['markup'] = pre.outerHTML;

    return cb(err, ctx, uri, opts);
}
