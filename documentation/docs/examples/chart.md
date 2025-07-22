```html
<script src="https://lemonadejs.com/v5/lemonade.js"></script>
<div id='root'></div>
<script>
function BarChart() {
    // Sample data
    this.data = [
        { label: 'A', value: 45 },
        { label: 'B', value: 70 },
        { label: 'C', value: 30 },
        { label: 'D', value: 85 },
        { label: 'E', value: 55 }
    ];

    // Get the maximum value for scaling
    const maxValue = Math.max(...this.data.map(item => item.value));
    
    // SVG dimensions and settings
    const width = 400;
    const height = 200;
    const padding = 40;
    const barWidth = (width - padding * 2) / this.data.length;

    // Calculate bar height based on value
    const getHeight = (value) => {
        return (value / maxValue) * (height - padding * 2);
    }

    // Calculate bar position
    const getX = (index) => {
        return padding + (index * barWidth);
    }

    return render => render`<svg width="${width}" height="${height}">
        <g :loop="${this.data}">
            <rect x="{{getX(self.index)}}" y="{{height - padding - getHeight(self.value)}}" width="50" height="{{getHeight(self.value)}}" fill="#3498db">
            </rect>
            <text x="{{getX(self.index) + barWidth/2 - 5}}" y="200" fill="black">{{self.label}}</text>
            <text x="{{getX(self.index) + barWidth/2 - 10}}" y="{{height - padding - getHeight(self.value) - 5}}" fill="black">{{self.value}}</text>
        </g>
    </svg>`;
}
lemonade.render(BarChart, document.getElementById('root'));
</script>
</html>
```