Dinossaur game
==============

The dinossaur game also known as the Chrome Dino is a built-in browser game in the Google Chrome web browser. The player guides a pixelated Tyrannosaurus rex across a side-scrolling landscape, avoiding obstacles. In this tutorial we will explan how to create a basic version of the game using LimonadeJS.  
  

A working example
-----------------

  

Source code
-----------

```javascript
var Dinosaur = function() {
// Initializing self.
var self = {
    // Propertie to store the dino element.
    dino: document.getElementById("dino"),
    // Propertie to store the cactus element.
    cactus: document.getElementById("cactus"),
}
/**
 * Self.init is used to initialize some methods and functions.
 */ 
self.init = function() {
  /*
   * Call the function self.Jump() when a key is pressed.
   */ 
  document.addEventListener("keydown", function () {
  self.jump();
  });
  /**
   * This interval will call self.isAlive() at every 10 miliseconds to check 
   * if the dinosaur is already alive.
   * @param {function} self.isAlive - The function that will be called.
   * @param {number} 10 - The number represents the milliseconds of the interval.
   */
  setInterval(self.isAlive, 10);
}
/**
 * Make the dinosaur recieve the class jump, and after the jump, remove it. 
 */ 
self.jump = function() {
    if (dino.classList != "jump") {
    dino.classList.add("jump");
    /**
     * Time out execute a function after 300 milliseconds.
     * @param {function} dino.classList.remove - The function to remove jump class from the dinossaur.
     * @param {number} 300 - The number represents the milliseconds of the timeout.
     */
    setTimeout(function () {
        dino.classList.remove("jump");
    }, 300);
    }
}
/**
 * Cactus recieve a class to make his animation;
 * @param {object} o - The cactus object.
 */
self.play = function (o) {
    o.setAttribute("class", "cactus");
    o.style.display = "";
}
/**
 * Self.isAlive uses an if condition to check the position of
 * the dinosaur and the cactus to detect collision.
 */
self.isAlive = function() {
    // Variable to store the position: of the top of the dino.
    var dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
    // Variable to store the position of the left of the cactus.
    var cactusLeft = parseInt(window.getComputedStyle(cactus).getPropertyValue("left"));
    if (cactusLeft < 50 && cactusLeft > 0 && dinoTop >= 140) {
        alert("Game Over!");
        cactus.classList.remove("cactus");
    }
}
// Game template.
let template = `
    <div class="game" @ready="self.init()">
        <div id="dino"><img src="data:image/png;base64,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"></div>
        <div id="cactus" style="display: none"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAABJCAIAAAAi6Oi8AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAASqSURBVGhD7drZUuNIEIXhfjQuCMy+7xgTwA1vz2p2hvnsY2scI7kbM5a6J8LnojprUdVPZlapRPPj80/SjGa8/oc0fw31/v7+9vbG0MhQfnx8jFZfX18zhs1QTqTJaFJ9eXmxKuP5+RlNjH7PP+p2uwNrEk1G44e+ublJ4+PjYwwq2hnI4KZ9Un3HN4zb29vYGxsb29vb7Xb75ORkbW1tc3Mz3hKm2iP18PBgjaRFgKCcnZ0tLy/v7e3t7u7C0miYshy+X2pi3yRpOGB/f//i4oI/1tfXDw8PlWiUW1tb+L4XrMloiuSVpAhWV1cPDg4YKysrnU6HnwBxkvA1kcXsZKt48Y0AgZArOzs7UEBwzNHRUavVMuYb7vkSTaEAJU8RcEP8wU5VqUoZY/zd3R0j5xDj6elJOU710lBSXhmaVMdpmjSMVCljsq0Et4Cjn0RwOjTKgiZGsXwipTo/P683M4xT7TSMREeC233yJqdRpaZGUxjaqTiIGTkF7EG9jmy96SprmjRaOKDHMqQxknIkZv9nTG+uKtVLkyw2gHuUxjucOEljpapprFp5TuAIkFQwac49y4SAUdCE2GBGBhRdmHSlt1Baxvqm8pz4PTTjzommaYq+ynOiOZpBc1+qZkl0zFKcE03TeDgTVZ4TuvJkvTRp6oGMqHxOaMyTzdHwyrhzQm+erD1S/5JZPDa6ABVdSlUD9H6bpqwZzYxmRjOjGWrQN3xveGNkJcdgbC+QnN3GBMgNyYewj1GzOTB9nvr8689RoenQENunZ1C8Uk5PT3X5Ste1tLSkV7sqFO2DWUqaDo0xluEYj9Dx8bF7CE+0221VBjgDFhYWzs/P5+bmRLBS06Exkj8YytiA9PKKYSCEcnFxkZ0b7WDxkuql0csrfMa+vLxk5GNqsHhJ9UZKu7RN6ak4xrODxUuqN4shSp3QeMSD+YWLySs1HZpxOzwfQPkdlEt+fONu1F+6Qj/4pzf9iLS4bemL883uJwtZJjLGAnqtKhywwjqKnmGTqppGaTpHFo4iG2yQ7Nj4IAlLyV+aAs3g36GgUG6iruhSQQZwgIMLgcVEBAFQZLH1hqAummScUmgEwoGBDAE7F2SGCMZmhKAWmkyUrzuyxtXVlWUkSiD4owmaoBBDNbvx/v5ezgqZHLK89ayqKnDZR3VFqqCxFcWo+AWdatyDwJIWc77JJDbl1Ujs6dMkaSJ2/nfj+vpayUkoGUCTQwhqzOKfK+dYyp5bhi+pEMRIe2j8eJXqzVWlHx4ra/BQSR4ofnfhmLEqDwWFyjT9ySo0mK6k7/gmytoSuU/SE4jkdUEzqSajKSR7Bgg7O9lcjNDEaJSGkrzS1s7/zTT2Wk4/7wfLg6CChkY35tf1n3wDyBujoGEUO7xRGoGQxQi4JyjUNI1NqExOWDJAAkSBCI1qE3kzoxmvGc14zWjG68+iIcvkTujq7gYYIHKHV82t2QHdxOlXXPy63a5Lu4VBQMHBJa6k7FarpWv072G+rol9EwHKHTmfoe5cSkC5LyubiJSf2IdfPqf5AEFQBAhEp9PBl7dpQ3lDwgRIciRRfBH7HuUYZAIHSPU7f2Py+fk3MkUn+Iu49v4AAAAASUVORK5CYII="></div>
    </div>
    <div class="btn"><button onclick="self.play(cactus)">Play</button></div>`;
    
return lemonade.element(template, self);
}
```

[Acess dinosaur game github here](https://github.com/lemonadejs/dinosaur-game)