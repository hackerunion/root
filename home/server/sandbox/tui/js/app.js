$(function() {
  var scale = 20;
  var $voxels = {};
  var $layers = {};

  var $tool = {
    "layer": null,
    "pixels": null,
    "brush": null,
    "live": false
  };
  
  var setBrush = function($color) {
    $tool.live = !!$color;
    $tool.brush = $color;
    $tool.layer = layerForColor($color);
    $tool.pixels = pixelsForColor($color);
  };
  
  var addColor = function() {
    var $color = $("<div />")
      .addClass("color")
      .width(scale)
      .height(scale)
      .dblclick(function() { showChooser($color); })
      .click(function() {
        if (!$color.data("hex")) {
          return;
        }

        $(".color").removeClass("active");
        setBrush($color.addClass("active"));
      });

    var $root = $(".color.root").after($color);
    
    if (!$root.length) {
      return $("<div />").addClass("palette").appendTo("body").append($color.addClass("root"));
    }
  };
  
  var pixelsForColor = function($color) {
    var hex = $color.data("hex");
    return hex in $voxels ? $voxels[hex] : ($voxels[hex] = {});
  };

  var layerForColor = function($color) {
    var hex = $color.data("hex");
    var i = Object.keys($layers).length;

    if (hex in $layers) {
      return $layers[hex];
    }
    
    $layers[hex] = $("<div />")
      .addClass("layer")
      .appendTo($stack)
      .css({
        "transform": "translateZ(" + i + "em)",
        "z-index": i
      });

    return $layers[hex];
  };

  var showChooser = function($color) {
    var defaults = {
      'code': 'function($pixel, $pixels, action) { return $pixel; }',
      'hex': '#888'
    };

    $chooser.attr("contentEditable", true).show().keyup(function() {
      var match = $chooser.text().match(/^\s*(#[a-zA-Z0-9]{6}|#[a-zA-Z0-9]{3})\s*([\s\S]*)/);
      var hex = "#f55";
      var code = defaults.code;

      if (match) {
        hex = match[1];
        code = match[2];
      }

      $chooser.css("background-color", hex);

      if (!match) {
        return true;
      }

      try {
        eval("(" + code + ")");
        $chooser.css("color", "inherit");
      } catch(e) {
        $chooser.css("color", "#f55");
      }

      $color.css("background-color", hex);
      $color.data("hex", hex);
      $color.data("code", code);

    }).dblclick(function() {
      $chooser.attr("contentEditable", false).empty().hide();

    }).each(function() {
      $chooser.text(
        ($color.data("hex") || defaults.hex) + "\n\n" + 
        ($color.data("code") || defaults.code)
      );
    }).keyup();
  };

  var $stack = $("<div />").addClass("stack").width(scale).height(scale).appendTo("body");
  var $cursor = $("<div />").addClass("cursor").width(scale).height(scale).appendTo("body");
  var $chooser = $("<div />").addClass("chooser").appendTo("body");
  var $palette = addColor();
  
  var getCoords = function(x, y) {
    return [ Math.floor(x / scale) * scale, Math.floor(y / scale) * scale ];
  };
  
  $(document).on('mousemove', function(e) {
    if (!$tool.live) {
      return;
    }
    
    var coords = getCoords(e.clientX, e.clientY);
    var $pixel = $tool.pixels[coords];

    $cursor
      .appendTo($tool.layer)
      .offset({ 'left': coords[0], 'top': coords[1] })
      .css("background", $tool.brush.data("hex"));

    if (e.buttons) {
      if (e.shiftKey) {
        if ($pixel) {
          $pixel.remove();
          delete $tool.pixels[coords];
        }
      } else if (!$pixel) {
        $tool.pixels[coords] = $cursor
          .clone()
          .appendTo($tool.layer)
          .css("background", $tool.brush.data("hex"));
      }
    }
  });
});
