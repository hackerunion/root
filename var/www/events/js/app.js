  $(function() {
    $(".show-summary").click(function(e) {
      $("#details h3").text(e.target.getAttribute("data-name"));
      $("#details pre").html(e.target.getAttribute("data-details"));
      return false;
    });

    $("button.rsvp").click(function(e) {
      var $btn = $(e.target);
      var user = $btn.data('user');
      var eid = $btn.data('eid');
      var email = null;

      if (user == 'guest') {
        email = (prompt("You must provide your email address (you aren't logged in):", "Email address") || "").trim();
        
        if (email.indexOf("@") == -1 || !email.length) {
          alert("You must enter a valid email address.");
          return false;
        }
      }
      
      $btn.attr("disabled", true);

      $.ajax({
        url: '',
        type: 'POST',
        data: { 'id': eid, 'user': user, 'email': email },
        success: function () { window.location.href = window.location.href; },
        error: function() { alert("Your request could not be processed."); }
      });

      return false;
    });
  });
