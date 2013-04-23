    // From mozilla/browserid resources/static/pages/page_helpers.js
    window.resizeTo(700, 375);
    $('button.cancel').click(function(e) {
      e.preventDefault();
        navigator.id.raiseAuthenticationFailure(
            'user authenticated as wrong user.');
    });

    $('button.continue').click(function(e) {
      e.preventDefault();
      $('#auth_error').hide();
      $.post('/link_accounts_request', {"_csrf": $('[name=csrf_token]').val()});
      $('#link_accounts_prompt').show();
    });

    $('button.close').click(function(e) {
      e.preventDefault();
      window.close();
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