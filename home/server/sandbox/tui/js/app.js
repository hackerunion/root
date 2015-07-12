$(function() {
  var scale = 20;
  var $pixels = {};
  
  var addColor = function() {
    var $color = $("<div />").addClass("color").width(scale).height(scale);
    var $root = $(".color.root").after($color.dblclick(function() { showChooser($color); }));

    if (!$root.length) {
      return $("<div />").addClass("palette").appendTo("body").append($color.addClass("root"));
    }
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

  var $cursor = $("<div />").addClass("cursor").width(scale).height(scale).appendTo("body");
  var $chooser = $("<div />").addClass("chooser").appendTo("body");
  var $palette = addColor();
  
  var getCoords = function(x, y) {
    return [ Math.floor(x / scale) * scale, Math.floor(y / scale) * scale ];
  };
  
  $(document).on('mousemove', function(e) {
    var coords = getCoords(e.clientX, e.clientY);
    var $pixel = $pixels[coords];

    $cursor.offset({ 'left': coords[0], 'top': coords[1] });
    
    if (e.buttons) {
      if (e.shiftKey) {
        window.dribble = true;
        if ($pixel) {
          $cursor.click();
        }
      } else if (!$pixel) {
        $cursor.click();
      }
    }
  });

  $cursor.click(function(e) {
    var offset = $cursor.offset();
    var coords = getCoords(offset.left, offset.top);
    var $pixel = $pixels[coords];

    if ($pixel) {
      $pixel.remove();
      delete $pixels[coords];
      return;
    }

    if (window.dribble && e.clientX && e.clientY) {
      window.dribble = false;
      return;
    }

    $pixels[coords] = $cursor.clone().appendTo("body").addClass("active");
  });
});
