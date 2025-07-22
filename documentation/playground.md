title: LemonadeJS Playground
keywords: LemonadeJS, two-way data binding, frontend, javascript library, Reactive, React, Vue, Angular, micro library, examples
description: A small collection of working LemonadeJS examples.
canonical: https://lemonadejs.com/playground

<div class="center">


{data-text="Playground"}
# Play with some of the Features

</div>

<div class="space50"></div>

<div class="line" style="position: relative; margin-bottom: 1px;"></div>

<div style="display: none">


{title="Reactive statements" data-category="State" demo="https://stackblitz.com/edit/vitejs-vite-sf5jp3vt?file=src%2Fcounter.js"}
```playground
const { state } = lemonade;

export default function Counter() {
    let count = state(0);

    const update = () => {
        count.value++;
    };
    
    /**
    * Count is instance of state, so count == 1 or count.value === 1
    */
    return render => render`
        <div>
            <h1>Total ${count}</h1>
            <button onclick=${update} class="button">
                Clicked ${count} ${count == 1 ? 'time' : 'times'}
            </button>
        </div>
    `
}
```
```css
```

{title="Simple State Toggle" data-category="State" demo="https://stackblitz.com/edit/vitejs-vite-ksbkpkzg?file=src%2Flamp.js"}
```playground
const { state } = lemonade;

export default function Count() {
    let color = state('white');

    const update = () => {
        color.value = color.value === 'yellow' ? 'white' : 'yellow';
    };

    return render => render`
        <div>
            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                height="60px"
                width="60px"
                fill="#A7C4E5">
                <path d="M400-240q-33 0-56.5-23.5T320-320v-50q-57-39-88.5-100T200-600q0-117 81.5-198.5T480-880q117 0 198.5 81.5T760-600q0 69-31.5 129.5T640-370v50q0 33-23.5 56.5T560-240H400Zm0 160q-17 0-28.5-11.5T360-120q0-17 11.5-28.5T400-160h160q17 0 28.5 11.5T600-120q0 17-11.5 28.5T560-80H400Z"
                stroke="black" stroke-width="30" fill=${color} />
            </svg>
            <p><input type="button" value="Update" onClick=${update} /></p>
        </div>
    `
}
```
```css
```

{title="Property Value Toggle" data-category="Props" demo="https://stackblitz.com/edit/vitejs-vite-qgbygonu?file=src%2Ftoggle.js"}
```playground
export default function Welcome() {
    this.status = true;

    const toggle = () => {
        this.status = ! this.status;
    };
    
    return render => render `<div>
        <Switch value="${this.status}" />
        <p><input type="button" value="Toogle" onclick="${toggle}" /></p>
    </div>`
}
```
```css
```

{title="Loop with Tables" data-category="Loops" demo="https://stackblitz.com/edit/vitejs-vite-wsxavpnx?file=src%2Floop-table.js"}
```playground
export default function Tables() {

    this.rows = [
        { title:'Google', description: 'The google search engine...' },
        { title:'Bing', description: 'The microsoft search engine...' },
        { title:'Duckduckgo', description: 'Privacy in the first place...' },
    ];

    return render => render`
        <table>
            <thead>
               <tr>
                    <th>Title</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody :loop=${this.rows}>
                <tr>
                    <td>{{this.title}}</td>
                    <td>{{this.description}}</td>
                </tr>
            </tbody>
        </table>
    `
}
```
```css
```

{title="Persistence with binding" data-category="Loops" demo="https://stackblitz.com/edit/vitejs-vite-qhxausa8?file=src%2Fpersistence.js"}
```playground
let { onchange } = lemonade; 

export default function Persistence() {
    this.language = localStorage.getItem('language');

    onchange(() => {
        localStorage.setItem('language', this.language);
    });
    
    this.options = [
        { value: '', text: 'Choose one' },
        { value: 'en_GB', text: 'English' },
        { value: 'pt_BR', text: 'Portuguese' },
    ]

    // Loop will first load all options,
    // than binding the language to the select value 
    return render => render`
        <select :loop="this.options" :bind="this.language">
            <option value="{{this.value}}">{{this.text}}</option>
        </select>
    `
}
```
```css
```

{title="Todo list" data-category="Loops" demo="https://stackblitz.com/edit/lemonadejs-playground?file=src%2Ftodo.js"}
```playground
export default function Component() {
    const add = () => {
        this.data.push({ title: this.text });
        // Update the data property in the view
        this.refresh('data');
        // Reset label
        this.text = '';
    }

    const del = (e, itemOfTheArray) => {
        this.data.splice(this.data.indexOf(itemOfTheArray), 1);
        // Update the view
        this.refresh('data');
    }

    this.data = [
        { title: 'Create a presentation' },
        { title: 'Send the report' },
        { title: 'Return the call to Jorge' },
    ];

    return render => render`<div>
        <ul :loop="${this.data}">
            <li>
                <i>{{self.title}}</i>
                <span onclick="${del}"
                    style="cursor: pointer;"> (x)</span>
            </li>
        </ul>
        <input type="text" :bind="this.text" />
        <input type="button" value="Add" onclick="${add}" />
    </div>`;
}
```
```css
```










{title="Color generator" data-category="Events" demo="https://stackblitz.com/edit/lemonadejs-playground-unynln3r?file=src%2Fcomponent.js"}
```playground
export default function ColorChanger() {
    const rand = function() {
        return parseInt(Math.random() * 255);
    };

    const applyColor = (e) => {
        let color = [ rand(), rand(), rand() ];
        e.target.style.backgroundColor = 'rgb(' + color + ')';
        e.target.innerText = color;
    };

    // Color changer template.
    return render => render`
        <div class="grid">
            <div onmousemove=${applyColor}></div>
            <div onmousemove=${applyColor}></div>
            <div onmousemove=${applyColor}></div>
        </div>
    `
}
```
```css
.grid {
    display: flex;
    flex-direction: row;
    width: 300px;
}

.grid > div {
    width: 100px;
    height: 100px;
    margin: 2px;
    color: #fff;
    text-align: center;
    transition: 0.5s;
    background-color: #cecece;
}
```

{title="Onchange hook" data-category="Events" demo="https://stackblitz.com/edit/lemonadejs-playground-9spdbk6z?file=src%2Fcomponent.js"}
```playground
let { onchange } = lemonade; 

export default function Data() {
    this.size = 100;

    onchange(() => {
        this.grid.style.width = this.size + 'px';
        this.grid.style.height = this.size + 'px';
    });

    return render => render`
        <div>
            <label>
                <input type="range" :bind="this.size" min="0" max="200" />
            </label>
            <br/>
            <div class="square" :ref=${this.grid}>${this.size}</div>
        </div>
    `
}
```
```css
.square {
    width: 100px;
    height: 100px;
    background-color: #cecece;
    display: block;
}
```

{title="Tic Tac Toe" data-category="Advanced" demo="https://stackblitz.com/edit/lemonadejs-playground-fh1ngh4b?file=src%2Fcomponent.js"}
```playground
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
        <div lm-loop="${this.board}" class="board" onclick=${click}>
            <span>{{this.player}}</span>
        </div><br/>
        <input type="button" onclick=${reset} value="Reset the game" />
    </div>`
}
```
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

{title="Analog Clock" data-category="Advanced" demo="https://stackblitz.com/edit/lemonadejs-playground-cipczj4a?file=src%2Fcomponent.js"}
```playground
export default function Clock() {
    // Update clock hands
    const updateClock = () => {
        // Current time
        const now = new Date();
        // 360° / 60 = 6° per second
        this.second = now.getSeconds() * 6;
        // 360° / 60 = 6° per minute + smooth movement
        this.minute = now.getMinutes() * 6 + now.getSeconds() * 0.1;
        // 360° / 12 = 30° per hour + smooth movement
        this.hour = now.getHours() * 30 + now.getMinutes() * 0.5;
    }

    // Create marks
    let marks = [];
    for (let i = 0; i < 12; i++) {
        marks.push({ index: i*30 });
    }
    this.marks = marks;

    // Start counting
    setInterval(updateClock, 1000);

    // Initial configuration
    updateClock();

    return render => render`<div class="clock">
        <div class="face">
            <div class="marks" :loop="${this.marks}">
                <div class="mark" style="transform: rotate({{this.index}}deg)"></div>
            </div>
            <div class="hand hour" style="transform: rotate({{this.hour}}deg)"></div>
            <div class="hand minute" style="transform: rotate({{this.minute}}deg)"></div>
            <div class="hand second" style="transform: rotate({{this.second}}deg)"></div>
        </div>
    </div>`;
}
```
```css
.clock {
    width: 200px;
    height: 200px;
    margin: 20px auto;
}
.face {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid #333;
    background: #fff;
}
.face::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: #333;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
.mark {
    position: absolute;
    width: 100%;
    height: 100%;
}
.mark::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 10px;
    background: #333;
    left: 50%;
    transform: translateX(-50%);
}
.hand {
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform-origin: bottom;
    background: #333;
}
.hour {
    width: 4px;
    height: 30%;
    background: #333;
}
.minute {
    width: 3px;
    height: 40%;
    background: #666;
}
.second {
    width: 1px;
    height: 45%;
    background: #f00;
}
```


</div>

{style="margin:0px"}
<lm-playground></lm-playground>

