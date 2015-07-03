$(function() {
  var scale = 20;
  
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

  $(document).mousemove(function(e) {
    var x = Math.floor(e.clientX / scale) * scale;
    var y = Math.floor(e.clientY / scale) * scale;
    
    $cursor.offset({ 'left': x, 'top': y });
  });

  $cursor.click(function() {
    $cursor.clone().appendTo("body").addClass("active").dblclick(function() { $(this).remove(); });
  });
});
