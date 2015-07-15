$(function() {
////////////////////
////////////////////
////////////////////

// x1, y1 would be mouse coordinates onmousedown
// x2, y2 would be mouse coordinates onmouseup
// all coordinates are considered relative to the document
function rectangleSelect(selector, sx, sy, ex, ey) {
  var elements = [];
    
  x1 = Math.min(sx, ex);
  y1 = Math.min(sy, ey);
  x2 = Math.max(sx, ex);
  y2 = Math.max(sy, ey);

  $(selector).each(function() {
    var $this = $(this);
    var offset = $this.offset();
    var x = offset.left;
    var y = offset.top;
    var w = $this.width();
    var h = $this.height();

    if (x >= x1 
      && y >= y1 
      && x + w <= x2 
      && y + h <= y2) {
      // this element fits inside the selection rectangle
      elements.push($this.get(0));
    }
  });
  return elements;
}

////////////////////
////////////////////
////////////////////

  var navigate = function(stack, go) {
    if (go in stack.cards) {
      // render card + push history
    }

    // redirect to web url
  };

  var renderCard = function($p, stack, card){
    var $card = $("<table />").addClass("card");
    var $tr;

    for(var r=0; r<card.data.length; r++) {
      $tr = $("<tr />").appendTo($card);

      for(var c=0; c<card.data[r].length; c++) {
        var cell = card.data[r][c];
        var $cell = $("<td />")
          .addClass('cell')
          .appendTo($tr)
          .html(cell.val || '')
          .css({
            'background': cell.bg || 'transparent',
            'color': cell.fg || '#000'
          })
          .addClass(cell.go ? 'go' : '')
          .click(function() {
            if (cell.go) {
              navigate(stack, cell.go);
            }

            return false;
          });

        if (cell.f) {
          cell.f($cell, cell, $card, card);
        }
      }
    }

    $p.empty().append($card);

    if (card.f) {
      card.f($card, card);
    }
  };

  var renderStack = function($p, stack) {
    renderCard($p, stack, stack.cards[stack.home]);

    if (stack.f) {
      stack.f($p, stack);
    }
  };
  
  var createCell = function(fg, bg, val, go, f) {
    return { 
      'fg': fg || '#000',
      'bg': bg || '#fff',
      'val': val || '',
      'go': go || null,
      'f': f || null
    };
  };

  var createCard = function(name, data, f) {
    return {
      'name': name,
      'data': data || [],
      'f': f || null
    };
  };

  var createStack = function(name, home, cards, f) {
    return {
      'name': name,
      'home': home,
      'cards': _.reduce(cards, function(r, c) { r[c.name] = c; return r; }, {}),
      'f': f || null
    };
  };

  var saveStack = function(stack) {
    return JSON.stringify(stack, null, 2);
  };

  var loadStack = function(s) {
    return JSON.parse(s);
  };

  var enableEdit = function($s, $t) {
    var sx, sy, ex, ey, drag;
    var clear = function() { 
      $('.cell', $s).removeClass('active selected');
    };

    $s.addClass("edit");
    
    $('.cell', $s).on('click', function(e) {
      clear();
    });

    $s.on('mousedown', function(e) {
      sx = e.clientX;
      sy = e.clientY;
      drag = true;
      clear(); 
    });

    $s.on('mousemove', function(e) {
      if (!drag) {
        return;
      }

      ex = e.clientX;
      ey = e.clientY;
      
      $('.cell', $s).removeClass('active');

      rectangleSelect('.cell', sx, sy, ex, ey).forEach(function(e) {
        $(e).addClass('active');
      });
    });

    $s.on('mouseup', function(e) {
      ex = e.clientX;
      ey = e.clientY;
      drag = false;
      
      $('.cell', $s).removeClass('active');

      rectangleSelect('.cell', sx, sy, ex, ey).forEach(function(e) {
        $(e).addClass('selected');
      });
    });
  };

  var enableView = function($s, $t) {
    $s.removeClass("edit");
    $s.off('mousedown mouseup mousemove click');
    $('.cell', $s).off('click');
  };

  var enableTools = function($s, $t) {
    $("[name=mode]", $t).change(function() {
      var edit = $(this).val() == "edit";
      
      if (edit) {
        enableEdit($s, $t);
        return;
      }
      
      enableView($s, $t);
    });
    
    $("[name=mode][value=view]").change();
  };
  
  var createRandomCard = function(name, rows, cols) {
    var hex = "0123456789ABCDEF";
    var data = [];
    var color = function() { return "#" + _.sample(hex) + _.sample(hex) + _.sample(hex); };
    
    for (var row=[], r=0; r<rows; row=[], r++) {
      for (var c=0; c<cols; c++) {
        row.push(createCell(color(), color(), Math.floor(Math.random() * 10), Math.random()));
      }

      data.push(row);
    }

    return createCard(name, data);
  };

  var main = function() {
    var $stack = $("#stack");
    var $tools = $("#tools");

    var testCard = createCard('card0', [
      [ createCell('#fff', '#f00', '1', 'card1'), createCell('#000', '#0f0', '2', 'card2') ],
      [ createCell('#000', '#ff0', '3', 'card3'), createCell('#fff', '#00f', '4', 'card4') ]
    ]);

    var randomCard = createRandomCard('card1', 24, 80);
  
    var testStack = createStack('stack', 'card1', [
      testCard,
      randomCard
    ]);

    renderStack($stack, testStack);
    enableTools($stack, $tools);
  };
  
  main();
});
