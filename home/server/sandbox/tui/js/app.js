$(function() {
  var scale = 20;
  
  var addColor = function() {
    var $color = $("<div />").addClass("color").width(scale / 2.0).height(scale / 2.0);
    var $root = $(".color.root").after($color.dblclick(function() { showChooser($color); }));

    if (!$root.length) {
      return $("<div />").addClass("palette").appendTo("body").append($color.addClass("root"));
    }
  };

  var showChooser = function($color) {
    $chooser.attr("contentEditable", true).show().keydown(function() {
      var txt = $chooser.text();
      var clr = txt.match(/^\s*(#[a-zA-Z0-9]{6}|#[a-zA-Z0-9]{3})/);
      
      if (clr && clr.length >= 2) {
        clr = clr[1];
      } else {
        clr = "#f00";
      }

      $chooser.css("background-color", clr);

    }).dblclick(function() {
      $chooser.attr("contentEditable", false).empty().hide();
    });
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
