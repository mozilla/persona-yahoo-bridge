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
      $('[name=pin]').focus();
    });

    $('#check-pin-error').hide();
    $('#check-pin').submit(function(e) {
      e.preventDefault();
      $('#check-pin-error').hide('fast');
      $('input, button').attr('disabled', true);
      $.post('/pin_code_check', {
        "_csrf": $('[name=csrf_token]').val(),
        "pin": $('[name=pin]').val()
      }, function(data) {
        $('input, button').removeAttr('disabled');
        if (data.error || data.pinMatched === false ||
            data.pinMatched === 'false') {
            showTooltip($('[name=pin]'));
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
    }

  function showTooltip(target) {
    var tooltip = $('.tooltip'),
        targetOffset = target.offset();

    targetOffset.top -= (tooltip.parent().outerHeight() + 5);
    targetOffset.left += 10;

    tooltip.css(targetOffset);
    tooltip.fadeIn(function() {
      setTimeout(function() {
        $('.tooltip').fadeOut();
      }, 2000);
    });
  }