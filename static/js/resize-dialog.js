var BIGTENT = BIGTENT || {};

function resizeDialog() {
  // wrap in a try-catch in case localstorage barfs
  try { 
    if (!! localStorage.width && !! localStorage.height) {
      var w = parseInt(localStorage.getItem('width'), 10);
      var h = parseInt(localStorage.getItem('height'), 10);
      if (! isNaN(w) && w > 100 && ! isNaN(h) && h > 100) {
        window.resizeTo(w, h);
        if (localStorage.removeItem) {
          localStorage.removeItem('width');
          localStorage.removeItem('height');
        }
      }
    }
  } catch (e) {}
}

function recordDialogSize() {
  // IE8 never tells you the height of the window including browser chrome.
  // As a workaround, we know we open the dialog to 375x700 by default, so assume
  // that's the current height of the window.
  // The height of the chrome is then 375 minus window.outerHeight.
  // IE8 doesn't have outerHeight, it has document.documentElement.offsetHeight.
  // Regardless, once we know the size of the chrome, we can resize correctly
  // by adding chromeSize to 375 when we resize.
  // wrap in a try-catch because localstorage sometimes blows up.
  try {
    localStorage.height = window.outerHeight ||
      375 + (375 - document.documentElement.offsetHeight);
    localStorage.width = window.outerWidth || document.documentElement.offsetWidth;
  } catch (e) {}
}
BIGTENT.resizeDialog = resizeDialog;
BIGTENT.recordDialogSize = recordDialogSize;
