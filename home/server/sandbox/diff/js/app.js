$(function() {
  var a = document.getElementById('a');
  var b = document.getElementById('b');
  var result = document.getElementById('result');
  
  $("[type=reset]").click(function() {
    window.location.href = $("[name=next]").val() || "/";
    return false;
  });

  function changed() {
    $('[name=modified]').val(b.textContent);
    if ((a.textContent + b.textContent).length > 1e4) {
      result.textContent = 'Too much data to compare.';
      return;
    }

    var diff = JsDiff[window.diffType](a.textContent, b.textContent);
    var fragment = document.createDocumentFragment();
    for (var i=0; i < diff.length; i++) {
  
      if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
        var swap = diff[i];
        diff[i] = diff[i + 1];
        diff[i + 1] = swap;
      }
  
      var node;
      if (diff[i].removed) {
        node = document.createElement('del');
        node.appendChild(document.createTextNode(diff[i].value));
      } else if (diff[i].added) {
        node = document.createElement('ins');
        node.appendChild(document.createTextNode(diff[i].value));
      } else {
        node = document.createTextNode(diff[i].value);
      }
      fragment.appendChild(node);
    }
  
    result.textContent = '';
    result.appendChild(fragment);
  }
  
  window.onload = function() {
    onDiffTypeChange(document.querySelector('#settings [name="diff_type"]:checked'));
    changed();
  };
  
  a.onpaste = a.onchange =
  b.onpaste = b.onchange = changed;
  
  if ('oninput' in a) {
    a.oninput = b.oninput = changed;
  } else {
    a.onkeyup = b.onkeyup = changed;
  }
  
  function onDiffTypeChange(radio) {
    window.diffType = radio.value;
    document.title = "Diff " + radio.value.slice(4);
  }
  
  var radio = document.getElementsByName('diff_type');
  for (var i = 0; i < radio.length; i++) {
    radio[i].onchange = function(e) {
      onDiffTypeChange(e.target);
      changed();
    }
  }
});
