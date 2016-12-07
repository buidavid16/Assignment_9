/*
  Name:              David Bui
  Email address:     David_Bui@student.uml.edu
  Affiliation:       Student at UMass Lowell in course COMP 4610 GUI Programming I
  Date file created: November 30, 2016
  Short Description: This file is supposed to calculate how many of each letter is 
                     available for the hand.
*/

/*
  Credit goes to Anthony Salani for the overall structure of this JavaScript file
  in terms of specific functions like the board design and score counter
*/
"use strict";

/*
  Makes the board when the document is loaded
*/

$(document).ready(function() {
  window.board = new Board($('#board'), null);
  window.deck = new Deck($('#tile-count'));
  window.hand = new Hand($('#side-left'), board);
  board.hand = hand;

  hand.draw(deck);
  hand.render();
  board.render();
  deck.render();

  initializeEvents();
});

/* 
  Distribution of letters in the game 
*/
window.Distribution = function() {
  this.dist = {
    'a': {count:  9, value:  1},
    'b': {count:  2, value:  3},
    'c': {count:  2, value:  3},
    'd': {count:  4, value:  2},
    'e': {count: 12, value:  1},
    'f': {count:  2, value:  4},
    'g': {count:  3, value:  2},
    'h': {count:  2, value:  4},
    'i': {count:  9, value:  1},
    'j': {count:  1, value:  8},
    'k': {count:  1, value:  5},
    'l': {count:  4, value:  1},
    'm': {count:  2, value:  3},
    'n': {count:  6, value:  1},
    'o': {count:  8, value:  1},
    'p': {count:  2, value:  3},
    'q': {count:  1, value: 10},
    'r': {count:  6, value:  1},
    's': {count:  4, value:  1},
    't': {count:  6, value:  1},
    'u': {count:  4, value:  1},
    'v': {count:  2, value:  4},
    'w': {count:  2, value:  4},
    'x': {count:  1, value:  8},
    'y': {count:  2, value:  4},
    'z': {count:  1, value: 10},
    '_': {count:  2, value:  0}
  };
}

/* 
  Returns a shuffled list of letters
*/
Distribution.prototype.shuffle = function() {
  var that = this;
  var unshuffled = _.keys(this.dist).reduce(function(prev, curr) {
    var items = _.range(that.dist[curr].count).map(function() { return curr; });
    return prev.concat(items);
  }, []);

  return _.shuffle(unshuffled);
};

/* 
  Object that holds all of the tiles 
*/
window.Deck = function($html) {
  this.$html = $html;
  this.reset();
};

/*
  Pulls a tile from the deck, return null if nothing is left
*/
Deck.prototype.draw = function() {
  if (this.deck.length > 0) {
    var draw = this.deck[0];
    this.deck = _.rest(this.deck);
    return draw;
  } else {
    return null;
  }
};

/* 
  Populates the deck with a valid distribution of letters
*/
Deck.prototype.reset = function() {
  this.deck = (function() {
    var dist = new Distribution();
    return dist.shuffle();
  })();
};

/* 
  Gets back number of tiles still in the deck
*/
Deck.prototype.size = function() {
  return this.deck.length;
};

/* 
  Redraws the box displaying the number of tiles remaining 
*/
Deck.prototype.render = function() {
  this.$html.empty();

  /* 
    Creates an object full of zeros for each letter
  */
  var bins = {
    a: 0, b: 0, c: 0, d: 0, e: 0, f: 0,
    g: 0, h: 0, i: 0, j: 0, k: 0, l: 0,
    m: 0, n: 0, o: 0, p: 0, q: 0, r: 0,
    s: 0, t: 0, u: 0, v: 0, w: 0, x: 0,
    y: 0, z: 0, _: 0
  };
  this.deck.forEach(function(x) {
    bins[x] += 1;
  }, this);

  var letters = Object.keys(bins).sort(function(l, r) {
    var lCode = l.charCodeAt(0);
    var rCode = r.charCodeAt(0);

    /* 
      Blank tiles should be last
    */
    if (l === '_') {
      lCode += 1000;
    }
    if (r === '_') {
      rCode += 1000;
    }

    return lCode - rCode;
  });

  this.$html.append($('<div class="head">Tiles Left:</div>'));
  letters.forEach(function(x) {
    var $div = $('<div class="count">' +
      '<div class="letter">' + x + ':&nbsp;</div>' +
      '<div class="letter-amt">' + bins[x] + '</div>' +
    '</div>');
    this.$html.append($div);
  }, this);
};

var initializeEvents = function() {
  var turn = 0;
  var isValid = [false, ''];
  var score = 0;

  var $commitBtn = $('#commit-btn');
  var $restartBtn = $('#restart-btn');
  var $currentScore = $('#current-score');
  var $totalScore = $('#total-score');

  var checkIfValid = function() {
    isValid = board.validateStaging(turn);

    if (isValid[0]) {
      $commitBtn.removeClass('btn-disabled');
      $currentScore.removeClass('err');
      $currentScore.children('p').text('Current Score: ' + board.currentScore());
    } else {
      $commitBtn.addClass('btn-disabled');
      $currentScore.addClass('err');
      $currentScore.children('p').text(isValid[1]);
    }
  };

  /*
    Checks if the initial board state is valid (it isn't)
  */
  checkIfValid();

  /* 
    On a change in the board, check if its valid
  */
  board.onStage(checkIfValid);

  $commitBtn.click(function() {
    if (isValid[0]) {
      /*
        Commits the tiles to the board
      */
      var newScore = board.commitTiles();
      score += newScore;
      $totalScore.children('p').text('Total Score: ' + score);
      hand.draw(deck);

      /* 
        Increments turn
      */
      turn += 1;

      /*
        Redraws game
      */
      hand.render();
      board.render();
      deck.render();
    } else {      
      /*
        Flash the errors so people know something's wrong
      */
      $currentScore.css({backgroundColor: '#FF0000'});
      $currentScore.animate({
        backgroundColor: 'rgba(255, 0, 0, 0)'
      }, {
        duration: 1000,
        queue: false
      });
    }
  });

  $restartBtn.click(function() {
    turn = 0;
    score = 0;
    checkIfValid();
    $totalScore.children('p').text('Total Score: ' + score);

    window.board = new Board($('#board'), null);
    window.deck = new Deck($('#tile-count'));
    window.hand = new Hand($('#side-left'), board);
    board.hand = hand;
    board.onStage(checkIfValid);

    hand.draw(deck);
    hand.render();
    board.render();
    deck.render();
  });
}

var pos = function(x, y) {
  return y * 15 + x;
};

var posInv = function(idx) {
  return [idx % 15, Math.floor(idx / 15)];
};

// Returns newVal if oldVal is true, or newVal equals oldVal
// Returns false otherwise
// Very useful for determining which axis a piece lies along
var someFunc = function(oldVal, newVal) {
  if (oldVal === false) {
    return false;
  } else if (oldVal === true) {
    return newVal;
  } else if (oldVal !== newVal) {
    return false;
  } else {
    return newVal;
  }
}

/* 
  returns a list of all piece positions
*/
var getPositions = function(board) {
  return board.map(function(x, idx) {
    // Convert each cell to either null (if it's already null),
    // or an (x,y) pair
    if (x === null) {
      return null;
    } else {
      return posInv(idx);
    }
  }).filter(function(x) {
    // remove all of the nulls from the list so we can ignore them
    return x != null;
  });
}

/* 
  Determines which axis the tiles lie along
*/
var getAxis = function(positions) {
  return positions.reduce(function(prev, curr) {
    var x = someFunc(prev[0], curr[0]);
    var y = someFunc(prev[1], curr[1]);
    return [x, y];
  }, [true, true]);
}

/*
  Given a list of positions changed and the current state of the board, return
  a list of all "words" that should be scored. This is the word along the axis 
  that was changed, and every word perpendicular to the axis at each changed 
  position.
*/
var getWords = function(positions, board) {
  // Compute which axis the positions lie along (0 = x, 1 = y)
  var alignment = positions.reduce(function(prev, curr) {
    var x = someFunc(prev[0], curr[0]);
    var y = someFunc(prev[1], curr[1]);
    return [x, y];
  }, [true, true]);

  var idxSample = pos(positions[0][0], positions[0][1]);
  var words = [];

  if (alignment[0] === false) {
    // case for x-axis

    // determine each off-axis word, discard results of length 1
    var hasOffAxis = false;
    positions.forEach(function(x) {
      var idx = pos(x[0], x[1]);
      var word = spanToEdge(board, idx, 1); 
      if (word.length > 1) {
        hasOffAxis = true;
        words.push(word);
      }
    });

    // determine the on-axis word
    var onAxis = spanToEdge(board, idxSample, 0);
    if (onAxis.length > 1 || !hasOffAxis) {
      // only use a word of length 1 if we don't have off-axis words
      words.push(onAxis);
    }
  } else if (alignment[1] === false) {
    // case for the y-axis

    // determine each off-axis word, discard results of length 1
    var hasOffAxis = false;
    positions.forEach(function(x) {
      var idx = pos(x[0], x[1]);
      var word = spanToEdge(board, idx, 0);
      if (word.length > 1) {
        hasOffAxis = true;
        words.push(word);
      }
    });

    // determine the on-axis word
    var onAxis = spanToEdge(board, idxSample, 1);
    if (onAxis.length > 1 || !hasOffAxis) {
      // only use a word of length 1 if we don't have off-axis words
      words.push(onAxis);
    }
  } else {
    // handle the case where the user placed just one letter
    var xWord = spanToEdge(board, idxSample, 0);
    var yWord = spanToEdge(board, idxSample, 1);
    var minSize = Math.min(xWord.length, yWord.length);
    var maxSize = Math.max(xWord.length, yWord.length);
    if (maxSize === 1) {
      words.push(xWord);
    } else if (minSize === 1) {
      if (xWord.length === 1) {
        words.push(yWord);
      } else {
        words.push(xWord);
      }
    } else {
      words.push(xWord);
      words.push(yWord);
    }
  }

  return words;
};

/*
  Given a list of letter/index pairs, compute the score of the word note on scrabble 
  rules: each multiplier box can only be used once. It follows that the only time a 
  box can be used is when a tile is placed on it. However, if multiple words are formed 
  on a multplier, that multplier is used for each word.
*/
var scoreWord = function(word, board) {
  var wordMult = 1;
  var distribution = new Distribution();
  var baseScore = word.reduce(function(prev, curr) {
    var tileType = board[curr[1]];
    var tileScore = distribution.dist[curr[0]].value;
    if (tileType === 1) {
      // letter x 2 spot
      tileScore *= 2;
    } else if (tileType === 2) {
      // letter x 3 spot
      tileScore *= 3;
    } else if (tileType === 3 || tileType === 5) {
      // word x 2 spot
      wordMult *= 2;
    } else if (tileType === 4) {
      // word x 3 spot
      wordMult *= 3;
    }
    return prev + tileScore;
  }, 0);
  return baseScore * wordMult;
};

/*
  Given a position, board, and axis: return a list of letter/index pairs that
  extend from the first non-null value to the last non-null value along the
  specified axis.

  Note: 0 is the x axis, 1 is the y axis
*/
var spanToEdge = function(board, idx, axis) {
  var position = posInv(idx);

  // Handle cases where the provided index isn't on a letter
  if (board[idx] === null) {
    return [];
  }

  if (axis === 0) {
    // If we're along the x axis
    var minPos = position[0];
    var maxPos = position[0];
    var y = position[1];
    
    // Find the end point of the current word
    while (minPos > 0  && board[pos(minPos - 1, y)] !== null) {
      minPos -= 1;
    }

    // Find the start point of the current word
    while (maxPos < 14 && board[pos(maxPos + 1, y)] !== null) {
      maxPos += 1
    }

    // Convert the calculated range in an array of letters and indices
    return _.range(minPos, maxPos + 1).map(function(x) {
      var idx = pos(x, y);
      return [board[idx], idx];
    });
  } else {
    // if we're along the y axis
    var minPos = position[1];
    var maxPos = position[1];
    var x = position[0];

    // find the start point of the current word
    while (minPos > 0  && board[pos(x, minPos - 1)] != null) {
      minPos -= 1;
    }

    // find the end point of the current word
    while (maxPos < 14 && board[pos(x, maxPos + 1)] != null) {
      maxPos += 1;
    }

    // convert the calculated range in an array of letters and indices
    return _.range(minPos, maxPos + 1).map(function(y) {
      var idx = pos(x, y);
      return [board[idx], idx];
    });
  }
};

/*
  The following functions simplify sliding the tiles from point A to point B
  the last two are identical, but I made them seperate functions in case they
  needed to be different in the future
*/
var slideBoardToBoard = function($tile, board, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
    }
  });
};

var slideHandToBoard = function($tile, board, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
      hand.render();
    }
  });
};

var slideHandToHand = function($tile, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      hand.render();
    }
  });
};

var slideBoardToHand = function($tile, board, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
      hand.render();
    }
  });
};