title: JavaScript Hangman Game | LemonadeJS v1
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: Understand all concepts of LemonadeJS in this hangman game implementation.

Hangman game
============

The hangman game is a classical paper and pencil guessing game for two or more players. One player thinks of a word, phrase or sentence and the other(s) tries to guess it by suggesting letters within a certain number of guesses. In this tutorial we will explan how to create a basic JavaScript version of the game using about 130 lines of code.  
  

A working example
-----------------

  

Source code
-----------

```javascript
var Hangman = function() {
    // Initializing self.
    var self = {
        // Propertie to store the number of user fails.
        fails: 0,
        // Propertie to store the last user input.
        userInput: '',
        // Propertie to be the a clue of the word.
        clue: 'FRUITS',
        // Propertie to store a random word from values.
        currentWord: '',
        // Propertie to be used to apply some changes in the selected current word.
        auxWord: '',
        // Propertie to store all the possibilities of words.
        values: ['apple', 'banana', 'orange', 'pear', 'papaya', 'kiwi', 'lemon', 'mandarine', 'peach', 'raspberry', 'mango', 'fig', 'plum'],
        // Propertie to store the element where the letters in.
        lettersElement: null,
    }
    /** 
     * Generate a random word from self.values. 
     * Using Math.floor(Math.random()*self.values.length) calculate some random number.
     * @param {number} Math.random()*self.values.length - calculate some random number between 0 to 1 using Math.random() 
     *                                                    and multiply by the length of self.values to what word will be chosen. 
     * */ 
    self.setWord = function() {
        self.currentWord = self.auxWord = self.values[Math.floor(Math.random() * self.values.length)];
    }
    /** 
     * Renders the elements that will be the slots for each letter.
     * @param {event} o - used to manipulate the element dom.
     * */ 
    self.renderLetters = function(o) {
        // Clear up the element
        o.innerHTML = '';
        // Setting a random word in the array of fruits. 
        self.setWord();
        // Using a for loop to create each letter in the element.
        for (var i = 0; i < self.currentWord.length; i++) {
            var letterElement = document.createElement('span');
            o.appendChild(letterElement);
        }
    }
    /** 
     * Used to display a letter when the user hits the right word.
     * @param {string} letter - Pass the letter typed by the user.
     * */
    self.showLetter = function(letter) {
        for (var i = 0; i < self.currentWord.length; i++) {
            if (self.currentWord[i] == letter) {
                self.lettersElement.children[i].textContent = letter;
            }
        }
    }
    /**
     * Shows a body part of the stickman on the gallows based on its body part id.
     * @param {string} body_id - Id from the body part to show.
     * */ 
    self.showStickman = function(body_id) {
        document.getElementById('stickman-' + body_id).style.visibility = 'visible';
    }
    /**
     * Checks if the user input is a valid input.
     * @param {element} o - The input that will be checked.
     * */
    self.check = function(o) {
        self.userInput = o.value;
        // Checking if the user input is in the current word.
        var findedLetterIndex = self.auxWord.indexOf(self.userInput);
        // Check if the user input exists in the current game word.
        if (findedLetterIndex >= 0) {
            self.auxWord = self.auxWord.replaceAll(self.userInput, "");
            self.showLetter(self.userInput);
            // When the auxWord no longer has letters, it means that the user has finished the game.
            if (! self.auxWord.length) {
                self.endGame(o, 0);
            }
        }
        else {
            // Handles user fails 
            self.fails++;
            self.showStickman(self.fails)
            if (self.fails > 5) {
                self.endGame(o, 1);
            }
        }
        // Reset the input value
        o.value = "";
    }
    /** 
     * Specifies the endgame type and displays a message to the user.
     * @param {Object} o - The input object that will be disabled.
     * @param {Object} m - The message object to display.
     * */ 
    self.endGame = function(o, m) {
        o.setAttribute('disabled', '');
        var message = !m ? "You finished the game successfully, congratulations" : "You failed! Try again?"
        alert(message);
    }
    /**
     * Function responsable to restart the game.
     * */
    self.resetGame = function() {
        // Restarting the main properties.
        self.fails = 0;
        self.userInput = '';
        self.currentWord = '';
        self.auxWord = '';
        self.lettersElement = null;
        // Cleans the entire container.
        document.getElementById('root').innerHTML = '';
        // Call lemonade.blender again to assign the self to the template again and re-render the result in the container.
        lemonade.blender(template, self, document.getElementById('root'));
    }
    // Game template
    var template = `
        <div class='p20' style='width: 460px;'>
            <div style='border-left:2px solid black; border-top:2px solid black; height: 160px;width:100px;padding-top:20px;'>
                <div style='position: absolute; margin-left:40px;'>
                    <svg class="stickman" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns:ns1="http://sozi.baierouge.fr" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 168.38 357.72" width='60'>
                        <g transform="translate(-165.46 -71.804)">
                            <g  transform="translate(15.143 -322.57)">
                                <path id="stickman-1" d="m275 450.36c0 22.644-18.356 41-41 41s-41-18.356-41-41 18.356-41 41-41 41 18.356 41 41z" style=" visibility: hidden; stroke:#000000;stroke-width:10;fill:none" />
                                <path id="stickman-2" d="m234 511.91v138.91z" style=" visibility: hidden; stroke:#000000;stroke-width:8.4187;" />
                                <path id="stickman-5" d="m244 667.36 47 72z" style=" visibility: hidden; stroke:#000000;stroke-width:10;" />
                                <path id="stickman-6" d="m222.5 666.36-47 72z" style=" visibility: hidden; stroke:#000000;stroke-linecap:round;stroke-width:10;" />
                                <path id="stickman-3" d="m211.5 520.36-47 72z" style=" visibility: hidden; stroke:#000000;stroke-width:10;" />
                                <path id="stickman-4" d="m257.5 514.36 47 72z" style=" visibility: hidden; stroke:#000000;stroke-width:10;" />
                            </g>
                        </g>
                    </svg>
                </div>
            </div>
            <div @ready="self.renderLetters(this)" @ref="self.lettersElement" class="word" style='text-align: center'></div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px;">
                <div>
                    <label for="user-input">Input:</label>
                    <input type="text" name="user-input" placeholder="Enter a letter" onkeyup="self.check(this)"/> 
                </div>
                <input type="button" onclick="self.resetGame(this)" value="Restart Game" class="jbutton dark" /> <span class="clue">Clue: {{self.clue}}</span>
            </div>
    </div>`;
    return lemonade.element(template, self);
}
```