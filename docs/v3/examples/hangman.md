title: Classic hangman game reimagined with LemonadeJS,
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
<script src="https://lemonadejs.net/v3/lemonade.js"></script>
<div id='root'></div>
<script>
function Hangman() {
    // Initializing self.
    const self = this;
    // Possible words
    self.words = ['apple', 'banana', 'orange', 'pear', 'lemon' ];

    self.onload = function() {
        // Reset game
        self.reset();
    }

    self.reset = function() {
        // Make sure to restart the game
        self.el.classList.remove('over');
        // Hide figure elements
        Array.from(self.figure.children).map(function(v) {
            v.style.display = '';
        });
        // Pick one word from the possible nes
        let index = Math.floor(Math.random()*self.words.length);
        // Reset answers given so far
        self.answer = [];
        // Secret word
        self.secret = self.words[index].split('').map(function(v, k) {
            return { letter: v.toUpperCase(), position: k };
        });
        // Focus on the first element
        self.secret[0].el.focus();
    }

    self.input = function(e, s) {
        // Input letter
        let letter = e.target.value.toUpperCase();
        // Check letter
        if (self.secret[s.position].letter == letter) {
            // Correct word disabled element
            e.target.setAttribute('disabled', true);
            // Make sure capital letter
            e.target.value = letter;
            // Focus on the next one
            if (e.target.nextElementSibling) {
                e.target.nextElementSibling.focus();
            }
        } else {
            // Show figure
            self.figure.children[self.answer.length].style.display = 'block';
            // Wrong answers
            self.answer.push({letter});
            // Refresh template
            self.refresh('answer');
            // Reset input
            e.target.value = '';
            // Check end of the game
            if (self.answer.length > 5) {
                // Focus on the reset button
                self.button.focus();
                // Game over
                self.el.classList.add('over');
                // Alert
                alert('Game over');
            }
        }
    }

    return `<div>
        <div class="hangman">
            <div class="figure" :ref="self.figure">
                <div class="head"></div>
                <div class="torso"></div>
                <div class="arm left"></div>
                <div class="arm right"></div>
                <div class="leg left"></div>
                <div class="leg right"></div>
            </div><div>
                <div :loop="self.answer" class="answers">
                    <div>{{self.letter}}</div>
                </div>
                <div :loop="self.secret" class="word">
                    <input type="text" value="" maxlength="1" oninput="self.parent.input(e, self)" />
                </div>
            </div>
        </div>
        <input type="button" value="Reset game" onclick="self.reset()" :ref="self.button" />
    </div>`;
}
lemonade.render(Hangman, document.getElementById('root'));
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Hangman() {
    // Initializing self.
    const self = this;
    // Possible words
    self.words = ['apple', 'banana', 'orange', 'pear', 'lemon' ];

    self.onload = function() {
        // Reset game
        self.reset();
    }

    self.reset = function() {
        // Make sure to restart the game
        self.el.classList.remove('over');
        // Hide figure elements
        Array.from(self.figure.children).map(function(v) {
            v.style.display = '';
        });
        // Pick one word from the possible nes
        let index = Math.floor(Math.random()*self.words.length);
        // Reset answers given so far
        self.answer = [];
        // Secret word
        self.secret = self.words[index].split('').map(function(v, k) {
            return { letter: v.toUpperCase(), position: k };
        });
        // Focus on the first element
        self.secret[0].el.focus();
    }

    self.input = function(e, s) {
        // Input letter
        let letter = e.target.value.toUpperCase();
        // Check letter
        if (self.secret[s.position].letter == letter) {
            // Correct word disabled element
            e.target.setAttribute('disabled', true);
            // Make sure capital letter
            e.target.value = letter;
            // Focus on the next one
            if (e.target.nextElementSibling) {
                e.target.nextElementSibling.focus();
            }
        } else {
            // Show figure
            self.figure.children[self.answer.length].style.display = 'block';
            // Wrong answers
            self.answer.push({letter});
            // Refresh template
            self.refresh('answer');
            // Reset input
            e.target.value = '';
            // Check end of the game
            if (self.answer.length > 5) {
                // Focus on the reset button
                self.button.focus();
                // Game over
                self.el.classList.add('over');
                // Alert
                alert('Game over');
            }
        }
    }

    return `<div>
        <div class="hangman">
            <div class="figure" :ref="self.figure">
                <div class="head"></div>
                <div class="torso"></div>
                <div class="arm left"></div>
                <div class="arm right"></div>
                <div class="leg left"></div>
                <div class="leg right"></div>
            </div><div>
                <div :loop="self.answer" class="answers">
                    <div>{{self.letter}}</div>
                </div>
                <div :loop="self.secret" class="word">
                    <input type="text" value="" maxlength="1" oninput="self.parent.input(e, self)" />
                </div>
            </div>
        </div>
        <input type="button" value="Reset game" onclick="self.reset()" :ref="self.button" />
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
```