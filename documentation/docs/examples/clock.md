```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function Clock() {
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

    // Initial time
    updateClock();

    // Start counting
    setInterval(updateClock, 1000);


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
lemonade.render(Clock, document.getElementById('root'));
</script>
</html>
```


## CSS for this section

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