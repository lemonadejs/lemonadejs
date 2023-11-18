Data Grid Sorting
====================

You can easily sort a Data Grid column by clicking on the column header. Multiple clicks on the same header will toggle between ascending (ASC) and descending (DESC) sorting.

For numerical data, ascending order means the smallest values appear first, while descending order displays the largest values first.

When dealing with strings, ascending order organizes them alphabetically from A to Z, and descending order reverses this, presenting them from Z to A. Sorting is enabled by default.

### Sorting Example

Give it a go! Click on the headers of some columns and see the sorting in action.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>

<script>
const data = [
    { bookId: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction' },
    { bookId: 2, title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance' },
    { bookId: 3, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classics' },
    { bookId: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Coming-of-age' },
]

const columns = [
    { name: 'bookId', title: 'Book ID', width: '50px', align: 'center' },
    { name: 'title', title: 'Title', width: '200px', align: 'left' },
    { name: 'author', title: 'Author', width: '120px', align: 'left' },
    { name: 'genre', title: 'Genre', width: '120px', align: 'left' },
]

const datagrid = Datagrid(document.getElementById('root'), {
    data: data,
    columns: columns,
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
        { bookId: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction' },
        { bookId: 2, title: '1984', author: 'George Orwell', genre: 'Dystopian' },
        { bookId: 3, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classics' },
        { bookId: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Coming-of-age' },
    ]

    self.columns = [
        { name: 'bookId', title: 'Book ID', width: '50px', align: 'center' },
        { name: 'title', title: 'Title', width: '80px', align: 'left' },
        { name: 'author', title: 'Author', width: '80px', align: 'left' },
        { name: 'genre', title: 'Genre', width: '80px', align: 'left' },
    ]

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect, useState } from "react";
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';


const columns = [
    { name: 'bookId', title: 'Book ID', width: '50px', align: 'center' },
    { name: 'title', title: 'Title', width: '80px', align: 'left' },
    { name: 'author', title: 'Author', width: '80px', align: 'left' },
    { name: 'genre', title: 'Genre', width: '80px', align: 'left' },
]

const data = [
    { bookId: 1, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction' },
    { bookId: 2, title: '1984', author: 'George Orwell', genre: 'Dystopian' },
    { bookId: 3, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classics' },
    { bookId: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger', genre: 'Coming-of-age' },
]

export default function App() {
    const domRef = useRef();

    useEffect(() => {
        if (! domRef.current.innerText) {
            Datagrid(domRef.current, {
                data: data,
                column: column,
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```