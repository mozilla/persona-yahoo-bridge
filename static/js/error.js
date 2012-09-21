    // From mozilla/browserid resources/static/pages/page_helpers.js
    window.resizeTo(700, 375);
    $('button').click(function () {
        navigator.id.raiseAuthenticationFailure('user authenticated as wrong user.');
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