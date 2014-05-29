/**
 * Factory
 */
;(function(factory) {
  // AMD
  if (typeof define === 'function' && define.amd) {      
    define(['underscore', 'backbone'], factory);
  }

  //CommonJS
  else if (typeof exports !== 'undefined') {
    factory(require('underscore'), require('backbone'));
  }

  //Globals
  else {
    factory(_, Backbone);
  }
}(function(_, Backbone) {


  //Get the correct transitionend event for the browser
  var transitionEndEvent = (function whichTransitionEvent() {
    var t;
    var el = document.createElement('fakeelement');
    var transitions = {
      'transition':'transitionend',
      'OTransition':'oTransitionEnd',
      'MozTransition':'transitionend',
      'WebkitTransition':'webkitTransitionEnd'
    }

    for(t in transitions){
      if( el.style[t] !== undefined ){
        return transitions[t];
      }
    }
  })();


  /**
   * Source
   */
  var ScreenManager = Backbone.View.extend({

    initialize: function() {
      //Modal manager
      this.modals = [];

      this.$el.addClass('screen-manager');
    },

    /**
     * Remove the current view
     */
    clear: function() {
      this.closeMenu();

      if (this.screen) {
        this.screen.remove();
      }
    },

    /**
     * Show a screen without animation
     *
     * @param {View} screen
     */
    show: function(screen) {
      this.closeMenu();

      this.$el.append(screen.el);

      this.clear();

      this.screen = screen;
    },

    /**
     * Show a screen with animation sliding in from the right
     *
     * @param {View} screen
     */
    next: function(screen) {
      this.closeMenu();

      var self = this,
          $manager = this.$el,
          $newScreen = screen.$el;

      $newScreen.addClass('right');

      $manager.append($newScreen);

      //Animate after delay which avoids skipping the animation in iOS
      setTimeout(function() {
        $newScreen.removeClass('right');
        $newScreen.addClass('slide');

        //Remove the old screen on animation end
        $newScreen.one(transitionEndEvent, function() {
          self.clear();

          self.screen = screen;
        });
      }, 50);
    },

    /**
     * Slide the current screen out, revealing the given screen underneath
     *
     * @param {View} screen
     */
    prev: function(screen) {
      this.closeMenu();

      var self = this,
          $manager = this.$el,
          $oldScreen = this.screen.$el,
          $newScreen = screen.$el;

      $newScreen.addClass('under');

      $manager.prepend($newScreen);

      //Animate after delay which avoids skipping the animation in iOS
      setTimeout(function() {
        $oldScreen.addClass('slide right');

        //Remove the old screen on animation end
        $oldScreen.one(transitionEndEvent, function() {
          self.clear();

          self.screen = screen;
        });
      }, 50);
    },

    /**
     * Slide the given screen up as a modal
     *
     * @param {View} screen
     */
    openModal: function(screen) {
      var self = this,
          $manager = this.$el,
          $modal = screen.$el;

      $modal.addClass('down');

      $manager.append($modal);

      //Animate after delay which avoids skipping the animation in iOS
      setTimeout(function() {
        $modal.removeClass('down');
        $modal.addClass('slide');

        self.modals.push(screen);
      }, 50);
    },

    /**
     * Closes the topmost modal
     */
    closeModal: function() {
      if (!this.modals.length) return;

      var self = this,
          modal = this.modals.pop(),
          $modal = modal.$el;

      //Animate
      $modal.addClass('slide down');

      //Remove modal on animation end
      $modal.one(transitionEndEvent, function() {
        modal.remove();
      });
    },

    /**
     * Returns if the status bar is on display
     *
     * @return {Boolean}
     */
    hasStatusBar: function() {
      return !!this.statusbar;
    },

    /**
     * Slides in a status bar at the top or bottom
     *
     * @param {View} statusbar 
     * @param {String} side     Default: 'top'
     */
    openStatusbar: function(statusbar, side) {
      var self = this,
          side = side || 'top',
          $manager = this.$el,
          $screen = this.screen.$el,
          $statusbar = statusbar.$el;

      //Add the statusbar
      $manager.append($statusbar);

      //Animate after delay which avoids skipping the animation in iOS
      setTimeout(function() {
        //Move the manager to show the statusbar
        $screen.addClass('slide');
        $manager.addClass('statusbar-slide has-'+side+'-statusbar');

        self.statusbar = statusbar;
        self.statusbarSide = side;
      }, 50);
    },

    /**
     * Closes the current statusbar
     */
    closeStatusbar: function() {
      if (!this.statusbar) return;

      var self = this,
          $manager = this.$el,
          $screen = this.screen.$el,
          $statusbar = this.statusbar.$el,
          side = this.statusbarSide;

      //Move the screen
      $manager.removeClass('has-'+side+'-statusbar');

      //Animate
      $manager.addClass('slide-top');

      //Remove statusbar on animation end
      $statusbar.one(transitionEndEvent, function() {
        if (!self.statusbar) return;
        
        self.statusbar.remove();
        self.statusbar = null;
        self.statusbarSide = null;
      });
    },

    /**
     * Returns if the side menu is on display
     */
    hasMenu: function() {
      return !!this.menu;
    },

    /**
     * Slides in a side menu
     *
     * @param {View} menu
     * @param {String} side     Default: 'left'
     */
    openMenu: function(menu, side) {
      var self = this,
          side = side || 'left',
          $manager = this.$el,
          $screen = this.screen.$el,
          $menu = menu.$el;

      //Add the menu
      $menu.addClass(side);
      $manager.append($menu);

      //Close the menu when the main screen is clicked
      $screen.on('click.screenManager.offMenu', function(event) {
        self.closeMenu();

        event.preventDefault();
        event.stopPropagation();
      });

      //Animate after delay which avoids skipping the animation in iOS
      setTimeout(function() {
        //Move the menu
        $menu.removeClass(side);
        $menu.addClass('slide');

        //Move the main screen
        $screen.addClass('slide '+side+'-menu-offset');

        self.menu = menu;
        self.menuSide = side;
      }, 50);
    },

    /**
     * Closes the current side menu
     */
    closeMenu: function() {
      if (!this.menu) return;

      var self = this,
          $manager = this.$el,
          $screen = this.screen.$el,
          $menu = this.menu.$el,
          side = this.menuSide;

      //Clean up event handler added in openMenu()
      $screen.off('click.screenManager.offMenu');

      //Move the screen
      $screen.removeClass(side+'-menu-offset');

      //Animate
      $menu.addClass('slide '+side);

      //Remove menu on animation end
      $menu.one(transitionEndEvent, function() {
        if (!self.menu) return;
        
        self.menu.remove();
        self.menu = null;
        self.menuSide = null;
      });
    }

  });


  /**
   * Exports
   */
  Backbone.ScreenManager = ScreenManager;

  //CommonJS
  if (typeof module != 'undefined') module.exports = ScreenManager;
  
  return ScreenManager;

}));
