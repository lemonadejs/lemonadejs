Data Grid Cell Content Editing
====================

Empower your Data Grid with the ability to edit cell content seamlessly. To activate this feature, include ``editable: true`` in the configuration object. Once enabled, cells can enter an "editing mode" when selected and pressing enter. In this mode, users can effortlessly modify the cell's value and then press enter again to commit the change to the data array internal state.

### How to enable

In the configuration object, set ``editable: true.`` If you're working in a Lemonade component environment, you can alternatively send it as a prop by using ``:editable="true"``.

### Content Editing Example

Experience the convenience of on-the-fly cell content editing, enhancing the agility of your Data Grid.

This example also uses the `onupdate` event, which is called every time a cell value is edited, allowing us to dynamically calculate the total amount.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid@1.0.20/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />

<div id='root'></div>
<div>Total amount: $ <strong id='total-amount'>280</strong></div>

<script>
const data = [
    { category: "Electricity", amount: 150 },
    { category: "Water", amount: 50 },
    { category: "Internet", amount: 80 },
]

const columns = [
    { name: "category", title: "Category", width: '120px' },
    { name: "amount", title: "Amount $", width: '100px', align: 'center' },
]

const datagrid = Datagrid(document.getElementById('root'), {
    data: data,
    columns: columns,
    editable: true, // This line enables the cell editing feature
    onupdate: function(s) {
        document.getElementById('total-amount').innerText = s.data.reduce((acc, c) => acc + Number(c.amount), 0)
    }
});
</script>
</html>
```
```javascript
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

export default function App() {
    const self = this;

    self.data = [
        { category: "Electricity", amount: 150 },
        { category: "Water", amount: 50 },
        { category: "Internet", amount: 80 },
    ]

    self.columns = [
        { name: "category", title: "Category", width: '120px' },
        { name: "amount", title: "Amount $", width: '100px', align: 'center' },
    ]

    self.updateAmount = function(s) {
        self.totalAmountRef.innerText = s.data.reduce((acc, c) => acc + Number(c.amount), 0)
    }

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" :editable="true" :onupdate="self.updateAmount" />
        <div>Total amount: $ <strong :ref="self.totalAmountRef">280</strong></div>
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

const columns = [
    { name: "category", title: "Category", width: '120px' },
    { name: "amount", title: "Amount $", width: '100px', align: 'center' },
]

const data = [
    { category: "Electricity", amount: 150 },
    { category: "Water", amount: 50 },
    { category: "Internet", amount: 80 },
]

export default function App() {
    const domRef = useRef();
    const totalAmountRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Datagrid(domRef.current, {
                data: data,
                column: column,
                editable: true, // This line enables the cell editing feature
                onupdate: function(s) {
                    totalAmountRef.current.innerText = s.data.reduce((acc, c) => acc + Number(c.amount), 0)
                }
            });
        }
    }, []);

    return (<div>
        <div ref={domRef}></div>
        <div>Total amount: $ <strong ref={totalAmountRef}>280</strong></div>
    </div>);
}
```