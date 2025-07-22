title: Tic tac toe game with LemonadeJS,
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: Discover the reactive JavaScript implementation of the iconic Tic Tac Toe game using LemonadeJS.

Tic Tac Toe
===========

The Tic tac toe is a classical game where two players take turns marking the spaces in a three-by-three grid with X or O. The player who succeeds in placing three of their marks in a horizontal, vertical, or diagonal row is the winner.  
  
This tutorial will explain how to create a basic classical version of this game using LemonadeJS.  
  
[See this example on codesandbox](https://codesandbox.io/s/javascript-tic-tac-toe-nzf09r)  
  

Working example
---------------

```html
<html>
<script src="https://lemonadejs.com/v4/lemonade.js"></script>
<div id='root'></div>
<script>
function Tictactoe() {
    const self = this;

    let text = [
        'can start the game',
        'turn to play',
        'won the game',
    ]
    self.players = [ 'O','X' ];

    /**
     * Checking if the span's id are the same as the playerSign.
     * @param {number} a - Position of the item
     * @param {number} b - Position of the item
     * @param {number} c - Position of the item
     * @returns Returns the id in win case.
     */
    const checkMatching = function(a, b, c) {
        // If the three positions were picked by the same player
        if (self.board[a].player &&
            self.board[a].player === self.board[b].player &&
            self.board[b].player === self.board[c].player) {
            return true;
        }
        return false;
    }

    /**
     * Check the board to see if there is a winner
     */
    const isWinner = function() {
        return (checkMatching(0, 1, 2) || checkMatching(3, 4, 5) || checkMatching(6, 7, 8) ||
                checkMatching(0, 3, 6) || checkMatching(1, 4, 7) || checkMatching(2, 5, 8) ||
                checkMatching(0, 4, 8) || checkMatching(2, 4, 6));
    }

    /**
     * Click event handler
     * @param {MouseEvent} e
     */
    self.click = function(e) {
        // Valid item to be clicked - only SPAN
        if (e.target.tagName === 'SPAN') {
            if (self.winner) {
                alert(self.title.textContent);
            } else {
                // No one picked the position yet
                if (!e.target.textContent) {
                    // Get the position of the element clicked
                    let index = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
                    // Selected the board
                    self.board[index].player = self.player;
                    // Switch the text element to refers the player's turn.
                    self.text = text[1];
                    if (isWinner()) {
                        // Switch the text element to refers the winner.
                        self.text = text[2];
                        self.winner = true;
                        // We have a winner
                        alert(self.title.textContent);
                    } else {
                        // Switch player's turn.
                        self.player = self.player ? 0 : 1;
                    }
                }
            }
        }
    }

    /**
     * Reset the game variables
     */
    self.reset = function() {
        // Player 0 (o) and Player 1 (x)
        self.player = 0;
        // Update the instruction to the user
        self.text = text[0];
        // Property to define if already reached a winner.
        self.winner = false;
        // Reset the board with the 9 positions
        self.board = [{},{},{},{},{},{},{},{},{}];
    }

    /**
     * Create necessary variables
     */
    self.reset();

    // Game template
    return `<div class="tictactoe">
        <div class="title" :ref="self.title">{{self.players[self.player]}} {{self.text}}</div>
        <div :loop="self.board" class="board" onclick="self.click">
            <span>{{self.parent.players[self.player]}}</span>
        </div><br/>
        <input type="button" onclick="self.reset" value="Reset the game" />
    </div>`;
}

lemonade.render(Tictactoe, document.getElementById('root'));
</script>
```
```javascript
import lemonade from 'lemonadejs';

export default function Tictactoe() {
    const self = this;

    let text = [
        'can start the game',
        'turn to play',
        'won the game',
    ]
    self.players = [ 'O','X' ];

    /**
     * Checking if the span's id are the same as the playerSign.
     * @param {number} a - Position of the item
     * @param {number} b - Position of the item
     * @param {number} c - Position of the item
     * @returns Returns the id in win case.
     */
    const checkMatching = function(a, b, c) {
        // If the three positions were picked by the same player
        if (self.board[a].player &&
            self.board[a].player === self.board[b].player &&
            self.board[b].player === self.board[c].player) {
            return true;
        }
        return false;
    }

    /**
     * Check the board to see if there is a winner
     */
    const isWinner = function() {
        return (checkMatching(0, 1, 2) || checkMatching(3, 4, 5) || checkMatching(6, 7, 8) ||
            checkMatching(0, 3, 6) || checkMatching(1, 4, 7) || checkMatching(2, 5, 8) ||
            checkMatching(0, 4, 8) || checkMatching(2, 4, 6));
    }

    /**
     * Click event handler
     * @param {MouseEvent} e
     */
    self.click = function(e) {
        // Valid item to be clicked - only SPAN
        if (e.target.tagName === 'SPAN') {
            if (self.winner) {
                alert(self.title.textContent);
            } else {
                // No one picked the position yet
                if (!e.target.textContent) {
                    // Get the position of the element clicked
                    let index = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
                    // Selected the board
                    self.board[index].player = self.player;
                    // Switch the text element to refers the player's turn.
                    self.text = text[1];
                    if (isWinner()) {
                        // Switch the text element to refers the winner.
                        self.text = text[2];
                        self.winner = true;
                        // We have a winner
                        alert(self.title.textContent);
                    } else {
                        // Switch player's turn.
                        self.player = self.player ? 0 : 1;
                    }
                }
            }
        }
    }

    /**
     * Reset the game variables
     */
    self.reset = function() {
        // Player 0 (o) and Player 1 (x)
        self.player = 0;
        // Update the instruction to the user
        self.text = text[0];
        // Property to define if already reached a winner.
        self.winner = false;
        // Reset the board with the 9 positions
        self.board = [{},{},{},{},{},{},{},{},{}];
    }

    /**
     * Create necessary variables
     */
    self.reset();

    // Game template
    return `<div class="tictactoe">
        <div class="title" :ref="self.title">{{self.players[self.player]}} {{self.text}}</div>
        <div :loop="self.board" class="board" onclick="self.click">
            <span>{{self.parent.players[self.player]}}</span>
        </div><br/>
        <input type="button" onclick="self.reset" value="Reset the game" />
    </div>`;
}
```

### Style for this example

```css
.tictactoe {
    max-width: 244px;
}

.tictactoe .title {
    padding: 20px;
    text-align: center;
}

.tictactoe .board {
    display: grid;
    gap: 1px;
    grid-template-columns: repeat(3, 1fr);
}

.tictactoe .board > span {
    margin: 2px;
    width: 80px;
    height: 80px;
    background-color: #ddd;
    line-height: 80px;
    text-align: center;
    font-size: 22px;
}

.tictactoe button {
    width: 100%;
}
```