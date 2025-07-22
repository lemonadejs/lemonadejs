title: JavaScript Hangman Game with LemonadeJS,
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, reactive, react, examples,
description: Experience the classic hangman game with a simple and modern JavaScript implementation using LemonadeJS.

Hangman game
============

The hangman game is a classical paper and pencil guessing game. Here is the minimal implementation of JavaScript using LemonadeJS.  
  
[See this example on codesandbox](https://codesandbox.io/s/javascript-hangman-game-implementation-with-lemonadejs-oh7fhn)  
  

A working example
-----------------

The game show name of fruits in english.


### Source code

  
```html
<html>
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
let { onload } = lemonade;

function Hangman() {

    onload(() => {
        // Reset game
        reset();
    })

    // Possible words
    const words = ['apple', 'banana', 'orange', 'pear', 'lemon' ];

    const reset = () => {
        // Make sure to restart the game
        this.gameOver = '';
        // Reset answers
        this.answer = [];
        // Random index
        let index = Math.floor(Math.random() * words.length);
        // Letters
        this.letters = words[index].split('').map((v, k) => {
            return { answer: v.toUpperCase(), disabled: !! k };
        });
        // Make all parts of the figure hidden
        this.figure.map((item) => {
            item.visible = false;
        })
        // Focus on the first element
        this.letters[0].el.focus();
    }

    const input = (e, s) => {
        // Input letter
        let letter = e.target.value.toUpperCase();
        // Check letter
        if (s.answer === letter) {
            // Make sure capital letter
            e.target.value = letter;
            // Focus on the next one
            s.disabled = true;
            // Current position
            let index = this.letters.indexOf(s);
            // Next
            index++;
            // Over?
            if (this.letters[index]) {
                // Disable
                this.letters[index].disabled = false;
                // Next
                e.target.nextElementSibling.focus();
            } else {
                this.status = 'You win!';
            }
        } else {
            // Show figure
            this.figure[this.answer.length].visible = true;
            // Wrong answers
            this.answer.push({letter});
            // Refresh template
            this.refresh('answer');
            // Reset input
            e.target.value = '';
            // Check end of the game
            if (this.answer.length > 5) {
                // Focus on the reset button
                s.disabled = true;
                // Game over
                this.status = 'Game Over';
            }
        }
    }

    // Figure representation
    this.figure = [
        { name: 'head' },
        { name: 'torso' },
        { name: 'arm left' },
        { name: 'arm right' },
        { name: 'leg left' },
        { name: 'leg right'  }
    ];
    
    return render => render`<div>
        <div class="hangman" data-status="${this.status}">
            <div class="figure" :loop="${this.figure}">
                <div class="{{this.name}}" data-visible="{{this.visible}}"></div>
            </div><div>
                <div :loop="${this.answer}" class="answers">
                    <div>{{self.letter}}</div>
                </div>
                <div :loop="${this.letters}" class="word">
                    <input type="text" maxlength="1" oninput="${input}" disabled="{{this.disabled}}" />
                </div>
            </div>
        </div>
        <input type="button" value="Reset game" onclick="${reset}" :ref="this.button" />
    </div>`;
}
lemonade.render(Hangman, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Hangman() {

    onload(() => {
        // Reset game
        reset();
    })

    // Possible words
    const words = ['apple', 'banana', 'orange', 'pear', 'lemon' ];

    const reset = () => {
        // Make sure to restart the game
        this.gameOver = '';
        // Reset answers
        this.answer = [];
        // Random index
        let index = Math.floor(Math.random() * words.length);
        // Letters
        this.letters = words[index].split('').map((v, k) => {
            return { answer: v.toUpperCase(), disabled: !! k };
        });
        // Make all parts of the figure hidden
        this.figure.map((item) => {
            item.visible = false;
        })
        // Focus on the first element
        this.letters[0].el.focus();
    }

    const input = (e, s) => {
        // Input letter
        let letter = e.target.value.toUpperCase();
        // Check letter
        if (s.answer === letter) {
            // Make sure capital letter
            e.target.value = letter;
            // Focus on the next one
            s.disabled = true;
            // Current position
            let index = this.letters.indexOf(s);
            // Next
            index++;
            // Over?
            if (this.letters[index]) {
                // Disable
                this.letters[index].disabled = false;
                // Next
                e.target.nextElementSibling.focus();
            } else {
                this.status = 'You win!';
            }
        } else {
            // Show figure
            this.figure[this.answer.length].visible = true;
            // Wrong answers
            this.answer.push({letter});
            // Refresh template
            this.refresh('answer');
            // Reset input
            e.target.value = '';
            // Check end of the game
            if (this.answer.length > 5) {
                // Focus on the reset button
                s.disabled = true;
                // Game over
                this.status = 'Game Over';
            }
        }
    }

    // Figure representation
    this.figure = [
        { name: 'head' },
        { name: 'torso' },
        { name: 'arm left' },
        { name: 'arm right' },
        { name: 'leg left' },
        { name: 'leg right'  }
    ];

    return render => render`<div>
        <div class="hangman" data-status="${this.status}">
            <div class="figure" :loop="${this.figure}">
                <div class="{{this.name}}" data-visible="{{this.visible}}"></div>
            </div><div>
                <div :loop="${this.answer}" class="answers">
                    <div>{{self.letter}}</div>
                </div>
                <div :loop="${this.letters}" class="word">
                    <input type="text" maxlength="1" oninput="${input}" disabled="{{this.disabled}}" />
                </div>
            </div>
        </div>
        <input type="button" value="Reset game" onclick="${reset}" :ref="this.button" />
    </div>`;
}
```

  

### CSS required for this example

  
```css

.hangman {
    display: flex;
    padding: 40px;
}

.hangman > div {
    padding: 20px;
}

.hangman .figure {
    width: 100px;
    height: 160px;
    border-top: 1px solid #000;
    border-left: 1px solid #000;
    position: relative;
    margin-right: 40px;
}

.hangman .figure > div {
    display: none;
}

.hangman input {
    border: 0px;
    border-bottom: 1px solid black;
    width: 30px;
    margin: 15px;
    outline: 0px;
    text-align: center;
}
.hangman input[disabled] {
    background-color: #eee;
}

.hangman .answers {
    display: flex;
    height: 80px;
    text-align: center;
    font-size: 20px;
    margin-bottom: 20px;
}

.hangman .answers > div {
    margin: 20px;
}

.hangman .word {
    height: 80px;
}

.hangman .figure > div {
    box-sizing: border-box;
}

.hangman .head {
    width: 30px;
    height: 40px;
    border: 1px solid black;
    border-radius: 50%;
    position: absolute;
    top: 20px;
    left: 60px;
}

.hangman .torso {
    width: 1px;
    height: 50px;
    border: 1px solid black;
    display: block;
    position: absolute;
    top: 60px;
    left: 75px;
    box-sizing: border-box;
}

.hangman .leg {
    width: 1px;
    height: 40px;
    border: 1px solid black;
    display: block;
    position: absolute;
    box-sizing: border-box;
    top: 110px;
    left: 75px;
}

.hangman .leg.left {
    transform: rotate(12deg);
    transform-origin: top;
}

.hangman .leg.right {
    transform: rotate(-12deg);
    transform-origin: top;
}

.hangman .arm {
    width: 30px;
    height: 1px;
    border: 1px solid black;
    position: absolute;

}

.hangman .arm.left {
    top: 70px;
    left: 45px;
}

.hangman .arm.right {
    top: 70px;
    left: 75px;
}

.hangman .over .word input {
    pointer-events: none;
}

.hangman div[data-visible=true] {
    display: block;
}

.hangman[data-status]::before {
    content: attr(data-status);
    position: absolute;
    margin: -40px 0 0 200px;
    font-weight: bold;
}
```