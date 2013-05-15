    // From mozilla/browserid resources/static/pages/page_helpers.js
    window.resizeTo(700, 375);
    $('button.cancel').click(function(e) {
      e.preventDefault();
        navigator.id.raiseAuthenticationFailure(
            'user authenticated as wrong user.');
    });

    $('button.js-continue').click(function(e) {
      e.preventDefault();
      $('#auth_error').hide();
      $.post('/pin_code_request', {"_csrf": $('[name=csrf_token]').val()});
      $('#pin_code_prompt').show();
      $('[name=pin1]').focus();
    });

    $('.autofocus').bind('keyup', function(e) {
      window.a = $(this);
      var value = $(this).val();
      var size = parseInt($(this).attr('maxlength'), 10);
      var next = '[name=' + $(this).attr('data-next') + ']';
      if (value.length >= size) {
        $(next).focus();
      }
    });
    $('#check-pin-error').hide();
    $('#check-pin').submit(function(e) {
      e.preventDefault();
      $('#check-pin-error').hide('fast');
      $('input, button').attr('disabled', true);
      $.post('/pin_code_check', {
        "_csrf": $('[name=csrf_token]').val(),
        "pin": [$('[name=pin1]').val(),
                $('[name=pin2]').val(),
                $('[name=pin3]').val()].join('')
      }, function(data) {
        $('input, button').removeAttr('disabled');
        if (data.error || data.pinMatched === false ||
	    data.pinMatched === 'false') {

          $('#check-pin-error').show('slow');
        } else {
          window.location = data.redirectUrl;
        }
      });
    });

    $(window).load(function(){
      setMinHeight();
    }).resize(function(){
      setMinHeight();
    });

    function setMinHeight(){
      var windowHeight = $(window).height();
      var headerHeight = $('header').height();
      $('#content').css('minHeight', windowHeight - headerHeight);
    }