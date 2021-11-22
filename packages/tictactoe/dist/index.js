// Load lemonadejs
if (typeof(lemonade) == 'undefined') {
    if (typeof(require) === 'function') {
        var lemonade = require('lemonadejs');
    } else if (window.lemonade) {
        var lemonade = window.lemonade;
    }
}

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.tictactoe = factory();
}(this, (function () {

    'use strict';

    // Grid container
    var grid = null;

    // Game texts
    var text = [
        'Click play to start',
        'Turn to play',
        'Won the game',
        'Draw detected',
    ]

    // Initializing self.
    var self = {
        // Property to set the turn.
        turn: '',
        // Property to define if bot will play.
        bot: true,
        // Property to store boxes marked and the player who's marked it..
        game: [],
        // Property to set what text will appear in the template.
        text: text[0],
        // Property to define if already reached a winner.
        winner: true,
        // Button play
        buttonLabel: 'Play',
    }

    /**
     * Checking if the span's id are the same as the playerSign.
     * @param {number} val1 - Id of the span selected.
     * @param {number} val2 - Id of the span selected.
     * @param {number} val3 - Id of the span selected.
     * @returns Returns the id in win case.
     */
    var checkMatching = function(val1, val2, val3) {
        // Verify if all the spans was marked by the same player.
        if (self.game[val1] == self.game[val2] && self.game[val2] == self.game[val3]) {
            return self.game[val1];
        }
    }

    /**
     * self.clickedBox recieve the element clicked by the user and marks it with X or O depending the turn.
     * @param {element} element - used to determine what span will be marked.
     **/
    var clickedBox = function(element) {
        // Start the game if that is the first click
        if (self.buttonLabel === 'Play') {
            self.play();
        }
        // Verify if a winner is defined to stop the game.
        if (self.winner) {
            return false;
        }
        // Span has already been clicked
        if (element) {
            // If the clicked SPAN is already clicked
            if (self.game[element.id]) {
                return false;
            } else {
                // Marks the box clicked according the player's turn.
                element.innerHTML = self.turn;
                // Increase the self.game array with the boxes already clicked.
                self.game[element.id] = self.turn;
                // Switch the text element to refers the player's turn.
                self.text = text[1];
                // Switch player's turn.
                if (self.turn == 'x') {
                    self.turn = 'o';
                } else {
                    self.turn = 'x';
                }
            }
        }

        // Variable to check if some player won the game.
        var winner = checkMatching(1, 2, 3) || checkMatching(4, 5, 6) ||
            checkMatching(7, 8, 9) || checkMatching(1, 4, 7) ||
            checkMatching(2, 5, 8) || checkMatching(3, 6, 9) ||
            checkMatching(1, 5, 9) || checkMatching(3, 5, 7);

        if (winner) {
            // Who is the winner
            self.turn = winner;
            // Switch the text element to refers the winner.
            self.text = text[2];
            // A new winner
            self.winner = true;
        } else {
            // No winner, so check for draw which means no empty blanks left
            var result = grid.querySelectorAll('span:empty');
            if (! result.length) {
                // No ones-turn
                self.turn = '';
                // Draw detected
                self.text = text[3];
                return false;
            }
        }

        return true;
    }

    /**
     * Boot should play now
     */
    var bot = function() {
        // Define the pointerEvents to none, so the user cannot click while bot's turn.
        grid.style.pointerEvents = 'none';
        // Set a timeout to the bot's turn.
        setTimeout(() => {
            // Variable to store the spans not yet marked.
            var result = grid.querySelectorAll('span:empty');
            // Variable to select one of the not marked spans.
            var randomBox = result[Math.floor(Math.random() * result.length)];
            // Play in the random position
            clickedBox(randomBox);
            // Make the pointerEvents clickable again.
            grid.style.pointerEvents = '';
        }, 800);
    }

    /**
     * This will identifier the element clicked in the div if its a span, mark a boxes,
     * and if its a button, execute self.play.
     * @param {element} o - Div element.
     */
    self.grid = function(o) {
        // Keep the grid container accessible
        grid = o;
        // Add an eventListener to wait for a click in the element.
        o.addEventListener('click', function(e) {
            // Create a var called element to store the target of the event e.
            var element = e.target;
            // Verify the tagName of the element.
            if (element.tagName == 'SPAN') {
                // Call the clickedBox function.
                if (clickedBox(element)) {
                    // If self.bot == true, this will do the bot move.
                    if (self.bot) {
                        // Play will bot with a little delay
                        bot();
                    }
                }
            } else if (element.tagName == 'BUTTON') {
                // The user click in the play or restart button
                self.play();
            }
        });
    }

    /**
     * Set all the game elements to the initial state.
     * @param {element} o - Div where is the game elements.
     */
    self.play = function() {
        // Start the game
        self.winner = false;
        // Start with player x
        self.turn = 'x';
        // Remove the elements from the game array.
        self.game = [];
        // Switch the text element to refers the player's turn.
        self.text = text[1];
        // Get all the spans elements to remove the marks.
        var result = grid.querySelectorAll('span');
        // Reset the all SPAN in the grid
        for (var i = 0; i < result.length; i++) {
            result[i].innerHTML = '';
        }
        // Set the button label
        self.buttonLabel = 'Restart';

    }

    // Game template
    var template = `
        <div>
            <h1>Tic tac toe</h1>
            <label class="jswitch">
                Bot is the second player <input type="checkbox" value='1' checked="checked" @bind='self.bot'> <i></i>
            </label>
            <div class="play-board">
                <div style="margin-top: 10px; margin-left: 70px; font-size: 20px">
                    <span style="text-transform: uppercase">{{self.turn}} </span> 
                    <span>{{self.text}}</span>
                </div>
                <div @ready="self.grid(this)" class="play-area">
                    <section>
                        <span id="1"></span>
                        <span id="2"></span>
                        <span id="3"></span>
                    </section>
                    <section>
                        <span id="4"></span>
                        <span id="5"></span>
                        <span id="6"></span>
                    </section>
                    <section>
                        <span id="7"></span>
                        <span id="8"></span>
                        <span id="9"></span>
                    </section>
                    <div class="btn"><button>{{self.buttonLabel}}</button></div>
                </div>
            </div>
        </div>`;

    return lemonade.element(template, self);
})));