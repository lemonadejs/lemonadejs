Snake game
==========

The snake game is a classical game where the player controls a long, thin creature that crawls across the screen, collecting food (in this case a "limonade"), unable to collide with its own body. Each time the snake eats a piece of food, its tail grows, increasing the game's score. The user controls the direction of the snake's head (up, down, left and right) and its body follows. In this tutorial we will explan how to create a basic version of the game using LimonadeJS.  
  

A working example
-----------------

  

Source code
-----------

```javascript
var Snake = function() {
/** 
 * Math.floor(Math.random()*20) calculate some random number.
 * @param {number} Math.random()*20 - calculate some random number between 0 to 1 using Math.random() 
 *                                    and multiply by 20 to keep it in the stage limits. 
 */ 
var randomValue =  Math.floor(Math.random()*20);
// Initializing self.
var self = {
    // Properties to store the speed of the snake.
    speed: 1,
    speedx: 0,
    speedy: 0,
    // Properties to store the start point of the snake.
    pointx: 10,
    pointy: 10,
    // Properties to store the size of game's pieces and how many will be used.
    piecesSize: 20,
    pieces: 20,
    // Propertie to define the snake's tail size and store her trail.
    tail: 5,
    trail: [],
    // Propertie to define our context.
    context: null,
    // Properties to define a random place in our stage to spawn the lemonade (game objective).
    lemonadex: randomValue,
    lemonadey: randomValue,
}
/**
 * Represents the initializer of methods and functions.
 * @param {string} stage - identifier of canvas in html.
 */
self.init = function(stage) {
    // Propertie context recieves the stage context.
    context = stage.getContext("2d");
    // A event listener waitting for some directional key.
    document.addEventListener("keydown", function (o) {
        switch(o.keyCode) {
            case 37: // Left key
                self.speedx = -self.speed;
                self.speedy = 0;
                break;
            case 38: // Up key
                self.speedx = 0;
                self.speedy = -self.speed;
                break;
            case 39: // Right key
                self.speedx = self.speed;
                self.speedy = 0;
                break;
            case 40: // Down key
                self.speedx = 0;
                self.speedy = self.speed;
                break;
            default:
                break;
        }
    })
    /** 
     * Setting an interval to execute the self.game at every 60 milliseconds.
     * @param {string} self.game - calling of the function.
     * @param {number} 60 - the number of how many milliseconds the interval should wait.
     */
    setInterval(self.game, 60);
    }
    /**
     * Used to reset the game and spawn a new lemonade in the stage.
     */
    self.reset = function() {
        self.speedx = 0;
        self.speedy = 0;
        self.tail=5;
        self.lemonadex = Math.floor(Math.random()*self.pieces);
        self.lemonadey = lemonadex;
    }
    /**
     * Self.game keep running the mains rules of the game.
     */
    self.game = function() {
        // Properties pointx and pointy increases according the last key pressed.
        self.pointx += self.speedx;
        self.pointy += self.speedy;
        // Verifying the end of stage and returns the snake to the stage.
        if (self.pointx < 0) {
            self.pointx = self.pieces -1;
        }
        if (self.pointx > self.pieces-1) {
            self.pointx = 0;
        }
        if (self.pointy < 0) {
            self.pointy = self.pieces -1;
        }
        if (self.pointy > self.pieces-1) {
            self.pointy = 0;
        }
        // Here we setting the colors of our stage, snake and the objective.
        // context.fillRect() is used to locate were the fillStyle will be aplied.
        context.fillStyle = "#cecece";                
        context.fillRect(0,0, stage.width, stage.height);
        
        context.fillStyle = "green";
        context.fillRect(self.lemonadex*self.piecesSize, self.lemonadey*self.piecesSize, self.piecesSize, self.piecesSize);
        // Using a for loop to have controll of our snake size.
        context.fillStyle = "#6b6b6b";
        for (var i = 0; i < self.trail.length; i++) {
            context.fillRect(self.trail[i].x*self.piecesSize, self.trail[i].y*self.piecesSize, self.piecesSize-1, self.piecesSize-1);
            // Comparing positions of the head and the tail of the snake to detect collision.
            if (self.trail[i].x == self.pointx && self.trail[i].y == self.pointy) {
                self.speedx = 0;
                self.speedy = 0;
                self.tail = 5;
                self.score = 0;
            }
        }       
        // Creating the snake trail
        self.trail.push({x:self.pointx, y:self.pointy})
        while (self.trail.length > self.tail) {
            self.trail.shift();
        }
        // Collecting the objective increase size of the snake and set a new objective.
        if (self.lemonadex == self.pointx && self.lemonadey == self.pointy) {
            self.score ++;
            self.tail++;
            self.lemonadex = Math.floor(Math.random()*self.pieces);
            self.lemonadey = self.lemonadex;
        }
    }

// Game template
var template = `
    <div @ref="self.game(this)">
        <h1>Score:{{self.score}}</h1>
        <button onclick="self.reset()">Reset</button><br>
        <canvas id="stage" @ready="self.init(this)" width="400" height="400"></canvas>
    </div>`;
return lemonade.element(template, self);
}
```

[See this example on codesandbox](https://codesandbox.io/s/lemonadejs-tictactoe-myqbl)

[Acess snake game github here](https://github.com/lemonadejs/snake-game)
