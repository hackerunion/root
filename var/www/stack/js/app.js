$(function() {
  var dump = function(v) {
    console.log(JSON.stringify(v, null, 4));
  };

  var js = function(s) {
    return eval('(' + s + ')');
  };

  var getModifiedTime = function() {
    return window.stackModifiedTime;
  };

  var bumpModifiedTime = function() {
    window.stackModifiedTime = (new Date()).getTime();
    return window.stackModifiedTime;
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
    var $card = $("<div />").addClass("card");
    var $markdown= $("<div />").addClass("markdown").appendTo($card);
    var $cells = $("<table />").addClass("cells").appendTo($card);

    var handler = function(r, c, cell) {
      return function() {
        if (!isEditMode($s) && cell.go) {
          navigate($s, $t, stack, cell.go);
        }
      }
    };
    
    if (card.markdown) {
      $markdown.html(marked(card.markdown));
    }

    for(var r=0; r < card.data.length; r++) {
      $tr = $("<tr />").appendTo($cells);

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

        if (getCallback(cell)) {
          getCallback(cell)($s, $card, $cell, stack, card, cell);
        }
      }
    }

    $s.empty().append($card);

    if (getCallback(card)) {
      getCallback(card)($s, $card, stack, card);
    }
  };

  var getCallback = function(obj) {
    return obj.f ? obj.f : (obj.source ? (obj.f = js(obj.source)) : undefined);
  };

  var renderStack = function($s, $t, stack) {
    renderCard($s, $t, stack, stack.cards[stack.card]);

    if (getCallback(stack)) {
      getCallback(stack)($s, stack);
    }
  };

  var repaint = function($s, $t, stack, init) {
    toggleMode($s, $t, stack);

    if (stack.style) {
      $('#style').html(stack.style);
    }

    if (init) {
      renderStack($s, $t, stack);
    } else {
      renderCard($s, $t, stack, stack.cards[stack.card]);
    }

    toggleMode($s, $t, stack);
  };

  var paint = function($s, $t, stack) {
    return repaint($s, $t, stack, true);
  }

  var navigateCard = function($s, $t, stack, card) {
    stack.card = card;
    repaint($s, $t, stack);
    refreshTools($s, $t, stack);
  };

  var navigateStack = function($s, $t, stack) {
    resetTools($s, $t, stack);
    stack.card = stack.home;
    paint($s, $t, stack);
    initTools($s, $t, stack);
    bumpModifiedTime();
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

  var saveStack = function(stack, pretty) {
    return JSON.stringify(stack, null, pretty ? 2 : 0);
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

  var getActiveString = function($s, stack) {
    var $active = getActive($s);
    var result = "";
    var last = null;
    var loc;

    if (!$active.length) {
      return "";
    }

    $active.each(function() {
      loc = getLocation($(this));

      if (last != null && loc[1] > last[1]) {
        result += "\n";
      }
      
      result += getDataAt(stack, loc).val || ' ';
      last = loc;
    });
    
    if (result && result[result.lengthx-1] == '\n') {
      result = result.slice(0, -1);
    }

    return result;
  };

  var getActiveData = function($s, stack) {
    var $active = getActive($s);
    var result = [];

    if (!$active.length) {
      return result;
    }

    $active.each(function() {
      result.push(getDataAt(stack, getLocation($(this))));
    });

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

  var resetTools = function($s, $t, stack) {
    $('#diffstack', $t).off('submit');
    $('[name=mode], [name=card]', $t).off('change');
    $('#hidetools, #showtools, #refresh, #shift, #setgo, #getmarkdown, #setmarkdown, #getstyle, #setstyle, #gettext, #settext, #savestack, #loadstack, #importstack, #exportstack, #newcard, #deletecard, #setname, #setcode, #getcode, #setfg, #setbg', $t).off('click');
  }

  var initTools = function($s, $t, stack) {
    $("[name=mode]", $t).change(function() {
      var edit = $(this).val() == "edit";
      refreshTools($s, $t, stack);

      if (edit) {
        enableEdit($s, $t, stack);
    
        // Avoid unsaved changes
        window.onbeforeunload = function(e) {
          e = e || window.event;
          e.preventDefault = true;
          e.cancelBubble = true;
          e.returnValue = 'You have unsaved changes!';
        };

        return;
      }
      
      enableView($s, $t, stack);
    });
    
    $('[name=card]', $t).change(function() {
      navigateCard($s, $t, stack, $(this).val());
    });
    
    $('#diffstack', $t).submit(function() {
      // post directly to diff endpoint
      var $f = $(this);
      var url = $("[name=stack]", $t).val().trim();

      $('[name=data]', $f).val(saveStack(stack));
      $('[name=timestamp]', $f).val(getModifiedTime());
      $('[name=url]', $f).val(url);

      return true;
    });

    $('#savestack', $t).click(function() {
      // deprecated: saves temporary file, then provides diff URL
      var url = $("[name=stack]", $t).val().trim();

      if (!confirm("Save your changes?")) {
        return false;
      }

      $.ajax({
        type: 'POST',
        data: { 'stack': saveStack(stack), 'url': url, 'timestamp': getModifiedTime() },
        success: function(result){
          if (result.error) {
            alert("Couldn't save stack: " + result.error);
            return;
          }
          
          var win = window.open(result.commit, '_blank');
          win.focus();
        },
        error: function(xhr, type){
          alert("Couldn't save stack!")
        }
      });
    });

    $('#loadstack', $t).click(function() {
      var url = $("[name=stack]", $t).val().trim();

      if (!confirm("Load a new stack?")) {
        return false;
      }

      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'json',
        success: function(stack){
          navigateStack($s, $t, stack);
          alert("Stack loaded!");
        },
        error: function(xhr, type){
          alert("Couldn't load stack!")
        }
      });
    });
    
    $('#refresh', $t).click(function() {
      navigateStack($s, $t, stack);
    });

    $('#importstack', $t).click(function() {
      var json = $("[name=json]").val();

      if (!confirm("Load a new stack?")) {
        return false;
      }

      try {
        navigateStack($s, $t, JSON.parse(json));
        alert("Stack imported!");
      } catch (e) {
        alert("Stack not imported: " + e.message);
      }
    });
    
    $('#exportstack', $t).click(function() {
      $("[name=json]").val(saveStack(stack));
    });

    $('#newcard', $t).click(function() {
      var name;
      var rows = parseInt($('[name=rows]', $t).val());
      var cols = parseInt($('[name=cols]', $t).val());

      for(var i=0;; i++) {
        name = 'card' + i;

        if (!(name in stack.cards)) {
          break;
        }
      }

      addCard(stack, createBlankCard(name, rows, cols));
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
    
    $('#getstyle', $t).click(function() {
      $("[name=style]", $t).val(stack.style || '');
      return false;
    });

    $('#setstyle', $t).click(function() {
      var style = $("[name=style]", $t).val().trim();
      stack.style = style;
      return repaint($s, $t, stack);
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
          obj.f = js(source); // this is mainly here to catch syntax errors
          obj.source = source;
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
        source.val(obj.source || "");
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

    $('#getmarkdown', $t).click(function() {
      var $markdown = $('[name=markdown]', $t);
      var card = stack.cards[stack.card];

      $markdown.val(card.markdown || '');

      return false;
    });

    $('#setmarkdown', $t).click(function() {
      var markdown = $("[name=markdown]", $t).val().trim();
      var card = stack.cards[stack.card];
      
      card.markdown = markdown;
      
      return repaint($s, $t, stack);
    });

    $('#gettext', $t).click(function() {
      var $io = $('[name=io]', $t);
      $io.val(getActiveString($s, stack) || getString($s, stack));
    });

    $('#settext', $t).click(function() {
      var $io = $('[name=io]', $t);
      var $active = getActive($s);

      if (!$active.length) {
        return;
      }
      
      $active.first().dblclick();

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

    $("#hidetools").click(function() {
      $t.hide();
      $("#showtools").show();
    });

    $("#showtools").click(function() {
      $t.show();
      $(this).hide();
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
    var rows = rows === undefined ? 24 : rows;
    var cols = cols === undefined ? 80 : cols;

    for (var row=[], r=0; r<rows; row=[], r++) {
      for (var c=0; c<cols; c++) {
        row.push(createCell(fg, bg, " "));
      }

      data.push(row);
    }

    return createCard(name, data);
  };

  var main = function(stack) {
    var $tools = $("#tools");
    var $stack = $("#stack").dblclick(function() {
      if(!isEditMode($stack)) {
        $stack.toggleClass("maximize");
      }

      return false;
    });
    
    var blankCard = createBlankCard('card0', 24, 80);
    var stack = stack || createStack('stack', 'card0', [ blankCard ]);
    
    navigateStack($stack, $tools, stack);
  };
  
  window._main = main;
});
