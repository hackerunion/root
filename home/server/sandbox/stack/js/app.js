$(function() {
  var dump = function(v) {
    console.log(JSON.stringify(v, null, 4));
  };

  var intersectPoint = function(X, Y, x, y, w, h) {
    return X >= x && X <= (x + w) && Y >= y && Y <= (y + h);
  };
  
  var intersectMiddle = function(X, Y, W, H, x, y, w, h) {
    return X >= x && X <= (x + w) && ((Y >= y && Y <= (y + h)) || (y >= Y && y <= (Y + H)));
  };

  var intersectOne = function(X, Y, W, H, x, y, w, h) {
    return intersectPoint(X + 0, Y + 0, x, y, w, h) ||
           intersectPoint(X + W, Y + 0, x, y, w, h) ||
           intersectPoint(X + W, Y + H, x, y, w, h) ||
           intersectPoint(X + 0, Y + H, x, y, w, h) ||
           intersectMiddle(X, Y, W, H, x, y, w, h);
  };
  
  var intersect = function(X, Y, W, H, x, y, w, h) {
    return intersectOne(X, Y, W, H, x, y, w, h) ||
           intersectOne(x, y, w, h, X, Y, W, H);
  };
  
  var rectangleSelect = function(selector, sx, sy, ex, ey, strict) {
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
      var overlap = !strict && intersect(x1, y1, x2-x1, y2-y1, x, y, w, h);
  
      if (overlap || (
        x >= x1 &&
        y >= y1 && 
        x + w <= x2 &&
        y + h <= y2)) {
        elements.push($this.get(0));
        return true;
      }
    });

    return elements;
  }

  var navigate = function($s, $t, stack, go) {
    if (go in stack.cards) {
      return navigateCard($s, $t, stack, go);
    }

    // redirect to web url
    window.open(go, '_blank');
  };
  
  var is_color = function(s) {
    return /^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(s);
  };

  var renderCard = function($s, $t, stack, card){
    var $tr;
    var $card = $("<table />").addClass("card");
    var handler = function(r, c, cell) {
      return function() {
        if (!isEditMode($s) && cell.go) {
          navigate($s, $t, stack, cell.go);
        }
      }
    };

    for(var r=0; r < card.data.length; r++) {
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
          .data('cell-col', c)
          .data('cell-row', r)
          .click(handler(r, c, cell));

        if (cell.f) {
          cell.f($cell, cell, $card, card);
        }
      }
    }

    $s.empty().append($card);

    if (card.f) {
      card.f($card, card);
    }
  };

  var renderStack = function($s, $t, stack) {
    renderCard($s, $t, stack, stack.cards[stack.card]);

    if (stack.f) {
      stack.f($s, stack);
    }
  };

  var repaint = function($s, $t, stack) {
    toggleMode($s, $t, stack);
    renderCard($s, $t, stack, stack.cards[stack.card]);
    toggleMode($s, $t, stack);
  };

  var navigateCard = function($s, $t, stack, card) {
    stack.card = card;
    repaint($s, $t, stack);
    refreshTools($s, $t, stack);
  };

  var navigateStack = function($s, $t, stack) {
    stack.card = stack.home;
    repaint($s, $t, stack);
    refreshTools($s, $t, stack);
  };

  var toggleMode = function($s, $t, stack, allow) {
    if (allow === false) {
      return;
    }
    
    if (isEditMode($s)) {
      enableView($s, $t, stack);
    } else {
      enableEdit($s, $t, stack);
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
      'card': home,
      'cards': _.reduce(cards, function(r, c) { r[c.name] = c; return r; }, {}),
      'f': f || null
    };
  };

  var addCard = function(stack, card) {
    stack.cards[card.name] = card;
  };

  var removeCard = function(stack, name) {
    delete stack.cards[name];
    
    var next = _.first(_.values(stack.cards)).name;

    stack.card = stack.card == name ? next : stack.card;
    stack.home = stack.home == name ? next : stack.home;
  };

  var saveStack = function(stack) {
    return JSON.stringify(stack, null, 2);
  };

  var loadStack = function(s) {
    return JSON.parse(s);
  };

  var enableEdit = function($s, $t, stack) {
    var sx, sy, ex, ey, drag;
    var clear = function() { 
      $('.active, .selected, .cursor, .mark', $s).removeClass('active selected cursor mark');
      $s.removeClass('selected cursor');
    };
    
    // Avoid unsaved changes
    window.onbeforeunload = function(e) {
      e = e || window.event;
      e.preventDefault = true;
      e.cancelBubble = true;
      e.returnValue = 'You have unsaved changes!';
    };

    $s.add($t).addClass('edit');
    
    $('.cell', $s).on('click', function(e) {
      clear();
    });
    
    $('.cell', $s).on('dblclick', function(e) {
      clear();
      $(this).addClass('mark').add($s).addClass('cursor');
    });

    $s.on('mousedown', function(e) {
      sx = e.pageX;
      sy = e.pageY;
      drag = true;
      clear(); 
    });

    $s.on('mousemove', function(e) {
      if (!drag) {
        return;
      }

      ex = e.pageX;
      ey = e.pageY;
      
      $('.cell', $s).removeClass('active');

      rectangleSelect('.cell', sx, sy, ex, ey).forEach(function(e) {
        $(e).addClass('active');
      });
    });

    $s.on('mouseup', function(e) {
      ex = e.pageX;
      ey = e.pageY;
      drag = false;
      
      $('.cell', $s).removeClass('active');
      rectangleSelect('.cell', sx, sy, ex, ey).forEach(function(e) {
        $(e).add($s).addClass('selected');
      });
    });
    
    $s.on('keydown', function(e) {
      var $active = getActive($s);

      if ($active && $active.length == 1) {
        var loc = getLocation($active);
        switch(e.which) {
          case 8: // backspace
          case 37: // left
            getCell($s, loc, -1).dblclick();
            return false;
          case 38: // up
            getCell($s, loc, 0, -1).dblclick();
            return false;
          case 39: // right
            getCell($s, loc, 1).dblclick();
            return false;
          case 13: // enter
          case 40: // down
            getCell($s, loc, 0, 1).dblclick();
            return false;
        }
      }
    });

    $s.on('keypress', function(e) {
      var letter = String.fromCharCode(e.charCode);
      var $active = getActive($s);
      
      if ($active) {
        $active.text(letter);

        getActiveData($s, stack).forEach(function(data) {
          data.val = letter;
        });
        
        if ($active.length == 1) {
          $active.next().dblclick();
        }
      }

      // prevent scrolling via space
      if (letter == " ") {
        return false;
      }
    });
  };

  var countPrevious = function($e) {
    var i = 0;

    do {
      $e = $e.prev();
    } while($e.length && ++i);
    
    return i;
  }

  var getLocation = function($c) {
    var x = $c.data('cell-col') || countPrevious($c);
    var y = $c.data('cell-row') || countPrevious($c.parent());
    return [x, y];
  };
  
  var getCell = function($s, loc, x, y) {
    var $tr = $('tr:nth-child(' + (loc[1] + 1 + (y || 0)) + ')', $s);
    return $('.cell:nth-child(' + (loc[0] + 1 + (x || 0)) + ')', $tr);
  };
  
  var getDataAt = function(stack, loc) {
    return stack.cards[stack.card].data[loc[1]][loc[0]];
  };

  var getActiveData = function($s, stack) {
    var $active = getActive($s);
    var result = [];

    if (!$active.length) {
      return result;
    }

    $active.each(function() {
      result.push(getDataAt(stack, getLocation($(this))));
    })

    return result;
  };

  var getActive = function($s) {
      if ($s.hasClass('selected')) {
        return $s.find('.selected.cell');
      }
      
      if ($s.hasClass('cursor')) { 
        return $s.find('.cursor.cell');
      }

      return $();
  };

  var enableView = function($s, $t, stack) {
    $s.add($t).removeClass('edit');
    $s.off('mousedown mouseup mousemove click keydown keypress');
  };

  var isEditMode = function($s) {
    return $s.hasClass('edit');
  };

  var refreshTools = function($s, $t, stack) {
    var $cards = $('[name=card]', $t).empty();
    
    _.each(stack.cards, function(card, name) {
      var $o = $('<option />').attr('value', name).text(name);
      $cards.append(name == stack.card ? $o.attr('selected', 'selected') : $o);
    });
  };

  var enableTools = function($s, $t, stack) {
    $("[name=mode]", $t).change(function() {
      var edit = $(this).val() == "edit";
      refreshTools($s, $t, stack);

      if (edit) {
        enableEdit($s, $t, stack);
        return;
      }
      
      enableView($s, $t, stack);
    });
    
    $('[name=card]', $t).change(function() {
      navigateCard($s, $t, stack, $(this).val());
    });
    
    $('#savestack', $t).click(function() {
      var url = $("[name=card]", $t).val().trim();

      if (!confirm("Save your changes?")) {
        return false;
      }
    });

    $('#loadstack', $t).click(function() {
      var url = $("[name=card]", $t).val().trim();

      if (!confirm("Load a new stack?")) {
        return false;
      }

      $.getJSON(url, function(stack) {
        navigateStack($s, $t, stack);
      });
    });

    $('#newcard', $t).click(function() {
      var name;
      
      for(var i=0;; i++) {
        name = 'card' + i;

        if (!(name in stack.cards)) {
          break;
        }
      }

      addCard(stack, createBlankCard(name));
      navigateCard($s, $t, stack, name);
    });

    $('#deletecard', $t).click(function() {
      if (!confirm("Delete \"" + stack.card + "\"?")) {
        return false;
      }

      if (_.keys(stack.cards).length == 1) {
        alert("Cannot delete last card!");
        return false;
      }

      removeCard(stack, stack.card);
      navigateCard($s, $t, stack, stack.home);
    });

    $('#setname', $t).click(function() {
      var $active = getActive($s);
      var mode = $("[name=metadata]", $t).val().trim();
      var name = $("[name=name]", $t).val().trim();
      
      switch(mode) {
        case 'card':
          var card = stack.cards[stack.card];
          var old = card.name;

          if (name in stack.cards) {
            alert("A card with that name already exists.");
            break;
          }
          
          card.name = name;
          stack.card = name;
          stack.home = stack.home == old ? name : stack.home;
          stack.cards[name] = card

          delete stack.cards[old];

          refreshTools($s, $t, stack);
          break;
        
        case 'home':
          if (!(name in stack.cards)) {
            alert("A card with that name doesn't exists.");
            break;
          }

          stack.home = name;
          break;

        case 'stack':
          stack.name = name;
          break;
      }

      return false;
    });
    
    var getCodeObjs = function($s, $t, stack) {
      var $active = getActive($s);
      var mode = $("[name=code]", $t).val().trim();

      switch(mode) {
        case 'cell':
          return getActiveData($s, stack);

        case 'card':
          return [stack.cards[stack.card]];

        case 'stack':
          return [stack];
      }
    };

    $('#setcode', $t).click(function() {
      var source = $("[name=source]", $t).val().trim();
      var objs = getCodeObjs($s, $t, stack);
      
      try {
        objs.forEach(function(obj) {
          obj.f = eval("(" + source + ")");
        });
      } catch(e) {
        alert("Your code is broken: " + e.message);
      }

      return false;
    });

    $('#getcode', $t).click(function() {
      var source = $("[name=source]", $t);
      var objs = getCodeObjs($s, $t, stack);
       
      objs.forEach(function(obj) {
        source.val(obj.f ? obj.f.toString() : "");
        return false;
      });

      return false;
    });

    $('#setfg', $t).click(function() {
      var $active = getActive($s);
      var fg = $("[name=fg]", $t).val().trim();
      
      if (is_color(fg) && $active) {
        $active.css("color", fg);

        getActiveData($s, stack).forEach(function(data) {
          data.fg = fg;
        });
      }

      return false;
    });

    $('#setbg', $t).click(function() {
      var $active = getActive($s);
      var bg = $("[name=bg]", $t).val().trim();
      
      if (is_color(bg) && $active) {
        $active.css("background", bg);

        getActiveData($s, stack).forEach(function(data) {
          data.bg = bg;
        });
      }

      return false;
    });

    $('#setgo', $t).click(function() {
      var $active = getActive($s);
      var go = $("[name=go]", $t).val().trim();
      
      if ($active.length) {
        if (go) {
          $active.addClass("go");
        } else {
          $active.removeClass("go");
        }

        getActiveData($s, stack).forEach(function(data) {
          data.go = go;
        });
      }

      return false;
    });

    $('#clipboard', $t).click(function() {
      var $io = $('[name=io]', $t);

      if (!$io.val().trim()) {
        $io.val(getString($s, stack));
        return;
      }

      if (!$('.cell.cursor', $s).length) {
        $('.cell', $s).first().dblclick();
      }
      
      putString($s, $io.val());
    });
    
    $('#shift', $t).click(function() {
      var $active = getActive($s);

      var co = -parseInt($('[name=x]', $t).val());
      var ro = -parseInt($('[name=y]', $t).val());
  
      var data = stack.cards[stack.card].data;

      var loc1 = getLocation($active.first());
      var loc2 = getLocation($active.last());

      var c1 = loc1[0], r1 = loc1[1], c2 = loc2[0], r2 = loc2[1];

      var w = c2 - c1 + 1;
      var h = r2 - r1 + 1;

      var remap = function(c, r) {
        return [(w + (c % w)) % w, (h + (r % h)) % h];
      };

      var cache = function(tmp, loc, obj) {
        var r = loc[1], c = loc[0];

        if (!tmp[r]) {
          tmp[r] = [];
        }

        if (!tmp[r][c]) {
          tmp[r][c] = obj;
        }

        return tmp[r][c];
      };

      var getloc = function(data, loc) {
        return data[loc[1]][loc[0]];
      };

      var setloc = function(data, loc, val) {
        data[loc[1]][loc[0]] = val;
        return val;
      };
      
      tmp = [];

      for (var y=0; y<h; y++) {
        for (var x=0; x<w; x++) {
          var offset = remap(co + x, ro + y);
          var pre = [c1 + x, r1 + y];
          var post = [c1 + offset[0], r1 + offset[1]];

          var cur = cache(tmp, pre, getloc(data, pre));
          var nxt = cache(tmp, post, getloc(data, post));
          
          setloc(data, pre, nxt);
        }
      }
      
      repaint($s, $t, stack);
    });

    $("[name=mode]").change();
  };

  var getString = function($s, stack) {
    var s = "";
    var data = stack.cards[stack.card].data;

    for (var r=0; r<data.length; r++) {
      for (var c=0; c<data[r].length; c++) {
        s += data[r][c].val || ' ';
      }
      s += '\n';
    }

    return s.slice(0, -1);
  };

  var putString = function($s, data) {
    data = data || "";

    for(var m=0, i=0; i<data.length; m++, i++) {
      if (data[i] == '\n') {
        while(m--) {
          $s.trigger($.Event('keydown', { 'which': 8 })); // backspace
        }
        
        $s.trigger($.Event('keydown', { 'which': 13 })); // enter
        continue;
  
      } else if (/[\s\t]/.test(data[i])) {
        data[i] = ' ';
      }
  
      $s.trigger($.Event('keypress', { 'charCode': data.charCodeAt(i) }));
    }
  };
  
  var createRandomCard = function(name, rows, cols) {
    var hex = "0123456789ABCDEF";
    var data = [];
    var color = function() { return "#" + _.sample(hex) + _.sample(hex) + _.sample(hex); };
    
    for (var row=[], r=0; r<rows; row=[], r++) {
      for (var c=0; c<cols; c++) {
        row.push(createCell(color(), color(), "@", Math.random()));
      }

      data.push(row);
    }

    return createCard(name, data);
  };

  var createBlankCard = function(name, rows, cols, fg, bg) {
    var data = [];
    var fg = fg || "#000";
    var bg = bg || "#eee";
    var rows = rows || 24;
    var cols = cols || 80;

    for (var row=[], r=0; r<rows; row=[], r++) {
      for (var c=0; c<cols; c++) {
        row.push(createCell(fg, bg, " "));
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
    var blankCard = createBlankCard('card2', 24, 80);

    var testStack = createStack('stack', 'card2', [
      blankCard,
      testCard,
      randomCard
    ]);
    
    renderStack($stack, $tools, testStack);
    enableTools($stack, $tools, testStack);
  };
  
  main();
});
