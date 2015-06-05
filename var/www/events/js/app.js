  $(function() {
    $(".utc").each(function() {
      var $this = $(this);
      $this.text((new Date($this.text())).toLocaleString());
    });

    $(".show-summary").click(function() {
      $("#details h3").text(this.getAttribute("data-name"));
      $("#details pre").html(this.getAttribute("data-details"));
      $("#details address").text(this.getAttribute("data-address"));
      return false;
    });

    $("button.add").each(function() {
      var $btn = $(this);
      var ev = $btn.data('event');
    
      // need to add the duration field to the data file
      ev.duration |= 3600; 
      
      var cal = createCalendar({
        options: {
          'class': 'calendar-button'
        },
        data: {
          title: ev.name,
          start: new Date(ev.timestamp),
          duration: ev.duration / 60,
          address: ev.address || "See description",
          description: ev.details
        }
      });
      
      $btn.replaceWith(cal);
      $("label", cal).hide().click();
    });

    $("button.link").click(function() {
      prompt("Here is this event's link:", window.location.href.split('?')[0] + "?id=" + $(this).data('eid'));
      return;
    });

    $("button.rsvp").click(function() {
      var $btn = $(this);
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
