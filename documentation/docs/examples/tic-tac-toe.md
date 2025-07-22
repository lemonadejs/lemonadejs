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
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Tictactoe() {
    let text = [
        'can start the game',
        'turn to play',
        'won the game',
    ];

    // Check the board to see if there is a winner
    const isWinner = () => {
        return [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Columns
            [0,4,8], [2,4,6]           // Diagonals
        ].some(([a,b,c]) =>
            this.board[a].player &&
            this.board[a].player === this.board[b].player &&
            this.board[b].player === this.board[c].player
        );
    }

    /**
     * Click event handler
     * @param {MouseEvent} e
     */
    const click = (e) => {
        // Valid item to be clicked - only SPAN
        if (e.target.tagName === 'SPAN') {
            if (this.winner) {
                alert(this.title.textContent);
            } else {
                // No one picked the position yet
                if (! e.target.textContent) {
                    // Get the position of the element clicked
                    let index = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
                    // Selected the board
                    this.board[index].player = this.player;
                    // Switch the text element to refers the player's turn.
                    this.text = text[1];
                    if (isWinner()) {
                        // Switch the text element to refers the winner.
                        this.text = text[2];
                        this.winner = true;
                        // We have a winner
                        alert(this.title.textContent);
                    } else {
                        // Switch player's turn.
                        this.player = this.player === 'o' ? 'x' : 'o';
                    }
                }
            }
        }
    }

    /**
     * Reset the game variables
     */
    const reset = () => {
        // Player 0 (o) and Player 1 (x)
        this.player = 'o';
        // Update the instruction to the user
        this.text = text[0];
        // Property to define if already reached a winner.
        this.winner = false;
        // Reset the board with the 9 positions
        this.board = [{},{},{},{},{},{},{},{},{}];
    }

    // Start the game
    reset();

    // Game template
    return render => render`<div class="tictactoe">
        <h4 :ref="this.title">${this.player} ${this.text}</h4>
        <div :loop="${this.board}" class="board" onclick="${click}">
            <span>{{this.player}}</span>
        </div><br/>
        <input type="button" onclick=${reset} value="Reset the game" />
    </div>`
}

lemonade.render(Tictactoe, document.getElementById('root'));
</script>
```
```javascript
import lemonade from 'lemonadejs';

export default function Tictactoe() {
    let text = [
        'can start the game',
        'turn to play',
        'won the game',
    ];

    // Check the board to see if there is a winner
    const isWinner = () => {
        return [
            [0,1,2], [3,4,5], [6,7,8], // Rows
            [0,3,6], [1,4,7], [2,5,8], // Columns
            [0,4,8], [2,4,6]           // Diagonals
        ].some(([a,b,c]) =>
            this.board[a].player &&
            this.board[a].player === this.board[b].player &&
            this.board[b].player === this.board[c].player
        );
    }

    /**
     * Click event handler
     * @param {MouseEvent} e
     */
    const click = (e) => {
        // Valid item to be clicked - only SPAN
        if (e.target.tagName === 'SPAN') {
            if (this.winner) {
                alert(this.title.textContent);
            } else {
                // No one picked the position yet
                if (! e.target.textContent) {
                    // Get the position of the element clicked
                    let index = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
                    // Selected the board
                    this.board[index].player = this.player;
                    // Switch the text element to refers the player's turn.
                    this.text = text[1];
                    if (isWinner()) {
                        // Switch the text element to refers the winner.
                        this.text = text[2];
                        this.winner = true;
                        // We have a winner
                        alert(this.title.textContent);
                    } else {
                        // Switch player's turn.
                        this.player = this.player === 'o' ? 'x' : 'o';
                    }
                }
            }
        }
    }

    /**
     * Reset the game variables
     */
    const reset = () => {
        // Player 0 (o) and Player 1 (x)
        this.player = 'o';
        // Update the instruction to the user
        this.text = text[0];
        // Property to define if already reached a winner.
        this.winner = false;
        // Reset the board with the 9 positions
        this.board = [{},{},{},{},{},{},{},{},{}];
    }

    // Start the game
    reset();

    // Game template
    return render => render`<div class="tictactoe">
        <h4 :ref="this.title">${this.player} ${this.text}</h4>
        <div :loop="${this.board}" class="board" onclick="${click}">
            <span>{{this.player}}</span>
        </div><br/>
        <input type="button" onclick=${reset} value="Reset the game" />
    </div>`
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