/*
  Name:              David Bui
  Email address:     David_Bui@student.uml.edu
  Affiliation:       Student at UMass Lowell in course COMP 4610 GUI Programming I
  Date file created: November 30, 2016
  Short Description: This file handles the hand panel aspect of the game.
*/

window.Hand = function($html, board) {
  var that = this;

  this.$html = $html;
  this.hand = [null, null, null, null, null, null, null];
  this.board = board;

  // Places where we can currently drop scrabble pieces into the tile rack
  this.dropTargets = {};

  // Run this when we stop dragging a tile taken from the tile rack
  this.dragStop = function(event, ui) {
    var $tile = $(event.target);
    var x = $tile.offset().left + ($tile.outerWidth() / 2);
    var $board = $('#board');
    var boardRightEdge = Math.abs($board.offset().left + $board.outerWidth() - x);
    var paneRLeftEdge = Math.abs(that.$html.offset().left - x);

    if (boardRightEdge < paneRLeftEdge) {
      // Dropped closer to the board
      // Shift the coordinates to the frame of reference of the board
      var $paneR = $('#side-left');
      var boardOff = $board.offset();
      var paneROff = $paneR.offset();
      ui.boardPosition = {
        left: ui.position.left + paneROff.left - boardOff.left,
        top: ui.position.top + paneROff.top - boardOff.top
      };
      that.dragStopBoard(event, ui);
    } else {
      // Dropped closer to the thing that holds all the tiles
      that.dragStopTileRack(event, ui);
    }
  };

  // Called by dragStop when the tile is dropped closer to the board
  this.dragStopBoard = function(event, ui) {
    var locations = Object.keys(that.board.dropTargets).map(function(x) {
      // Add a bit of info to each drop target containing the euclidean distance
      // to the target
      var $drop = $('#' + x);
      var x = $drop.position().left;
      var y = $drop.position().top;
      var dx = ui.boardPosition.left - x;
      var dy = ui.boardPosition.top  - y;
      var ox = ui.offset.left - $drop.offset().left;
      var oy = ui.offset.top - $drop.offset().top;
      var distance = Math.sqrt(ox * ox + oy * oy);
      return [$drop, distance, x, y];
    }).sort(function(l, r) {
      // Find the droppable location that is the closest to the tile
      return l[1] - r[1];
    });

    if (locations.length > 0) {
      // Translate the piece to the closest location if there is one
      var place = locations[0];
      var hx = ui.helper.parent().index();
      var tx = Math.floor(place[2] / 47);
      var ty = Math.floor(place[3] / 47);

      // Unstage the current piece
      // Needs to be done or else tile staging won't allow you to change axis w/ 2 pieces
      var letter = that.removeByIndex(hx);
      // try to stage the tile to it's new location
      var stageRes = that.board.stageTile(tx, ty, letter);

      if (stageRes !== null) {
        // This is the case where we try to stage a tile over an existing tile
        // This not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;

        // Add the current piece to the hand again
        that.addByIndex(hx, letter);
        slideHandToBoard(ui.helper, that.board, that, x, y);
      } else {
        var offBoard = $('#board').offset();
        var offPaneR = ui.helper.parent().offset();
        var a = (place[2] + 2) + offBoard.left - offPaneR.left;
        var b = (place[3] + 2) + offBoard.top - offPaneR.top;
        slideHandToBoard(ui.helper, that.board, that, a, b);
      }
    } else {
      // There are no active regions, move the tile back to it's home
      var x = ui.originalPosition.left;
      var y = ui.originalPosition.top;
      slideHandToBoard(ui.helper, that.board, that, x, y);
    }

    // Clear the current drop targets
    that.board.dropTargets = {};
  };

  // Called by dragStop when the tile is dropped closer to the tile rack
  this.dragStopTileRack = function(event, ui) {
    var locations = Object.keys(that.dropTargets).map(function(x) {
      // Add a bit of info to each drop target containing the euclidean distance
      // to the target
      var $drop = $('#' + x);
      var x = $drop.offset().left;
      var y = $drop.offset().top;
      var dx = ui.offset.left - x;
      var dy = ui.offset.top  - y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      return [$drop, distance, x, y];
    }).sort(function(l, r) {
      // Find the droppable location that is the closest to the tile
      return l[1] - r[1];
    });

    if (locations.length > 0) {
      // Translate the piece to the closest location if there is one
      var place = locations[0];
      var hx = ui.helper.parent().index();
      var tx = place[0].index();

      // Unstage the current piece
      // Needs to be done or else tile staging won't allow you to change axis w/ 2 pieces
      // Then try to stage the tile to it's new location
      var letter = that.removeByIndex(hx);
      var stageRes = that.addByIndex(tx, letter);

      if (stageRes) {
        var dx = ui.originalPosition.left - ui.helper.parent().offset().left + place[0].offset().left;
        var dy = ui.originalPosition.top  - ui.helper.parent().offset().top  + place[0].offset().top;
        slideHandToHand(ui.helper, that, dx, dy);
      } else {
        // This is the case where we try to stage a tile over an existing tile
        // This not a valid spot, move the tile back to it's home
        var dx = ui.originalPosition.left;
        var dy = ui.originalPosition.top;
        slideHandToHand(ui.helper, that, dx, dy);

        // Add the current piece to the hand again
        that.addByIndex(hx, letter);
      }
    } else {
      // There are no active regions, move the tile back to it's home
      var dx = ui.originalPosition.left;
      var dy = ui.originalPosition.top;
      slideHandToHand(ui.helper, that, dx, dy);
    }

    // Clear the current drop targets
    that.board.dropTargets = {};
  };

  // jQuery UI event handler for when a tile rack square has a tile moved into it
  this.dropActivate = function(event, ui) {
    // figure out if we're currently in an occupied tile
    var $drop = $(this);
    var idx = $drop.index();

    if (that.hand[idx] === null) {
      // Store the id of the droppable as a key in the dropTargets object
      // The value is a function to call when the tile is released
      var dropName = this.id;
      that.dropTargets[dropName] = 1;
    }
  };
  
  // jQuery UI event handler for when a tile rack square has a tile moved out of it
  this.dropOut = function(event, ui) {
    var dropName = this.id;
    delete that.dropTargets[dropName];
  };
};

window.Hand.prototype.draw = function(deck) {
  this.hand = this.hand.map(function(x, idx) {
    if (x === null) {
      return deck.draw();
    } else {
      return x;
    }
  });
};

window.Hand.prototype.remove = function(letter) {
  var idx = _.indexOf(this.hand, letter);
  if (idx === -1) {
    return false;
  } else {
    this.hand[idx] = null;
    return true;
  }
};

window.Hand.prototype.removeByIndex = function(idx) {
  var letter = this.hand[idx];
  this.hand[idx] = null;
  return letter;
}

window.Hand.prototype.addByIndex = function(idx, letter) {
  if (this.hand[idx] === null) {
    this.hand[idx] = letter;
    return true;
  } else {
    return false;
  }
}

window.Hand.prototype.render = function() {
  this.$html.empty();

  var handWidth = this.$html.outerWidth();
  var tileWidth = 43;
  var tileYOffset = 43;
  var tileYSpacing = 10;
  var left = (handWidth / 2) - (tileWidth / 2);

  this.hand.forEach(function(x, idx) {
    // Droppable region for tiles
    var $tileDrop = $('<div>', {
      'class': 'tile-drop',
      'id': 'deck-' + idx
    });

    $tileDrop.droppable({
      over: this.dropActivate,
      out: this.dropOut,
      tolerance: 'touch'
    });

    this.$html.append($tileDrop);

    // Tile itself
    if (x !== null) {
      var top = tileYOffset + tileYSpacing * idx + tileWidth * idx;
      var $tile = $('<div>', {
        'class': 'tile tile-' + x
      });

      $tile.draggable({
        containment: '#mat',
        stop: this.dragStop
      });

      $tileDrop.append($tile);
    }

  }, this);
};