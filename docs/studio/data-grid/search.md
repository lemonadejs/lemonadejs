Data Grid Search
====================

Enhance your Data Grid with a powerful search feature. To activate it, simply modify the configuration object. Once enabled, a search input will materialize, allowing you to dynamically filter the table based on the content of all columns.

### How to enable

In the configuration object, set ``search: true``. If you're working in a Lemonade component environment, you can alternatively send it as a prop by using ``:search="true"``.

### Search Example

Give it a try by typing into the search input and witness the table seamlessly adapt to your search queries.

```html
<html>
<script src="https://cdn.jsdelivr.net/npm/lemonadejs/dist/lemonade.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/index.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@lemonadejs/data-grid/dist/style.min.css" />
<div id='root'></div>

<script>
const data = [
    { id: 1, title: "The Shawshank Redemption", director: "Frank Darabont", genre: "Drama", releaseDate: "1994-09-23", rating: 9.3 },
    { id: 2, title: "The Godfather", director: "Francis Ford Coppola", genre: "Crime", releaseDate: "1972-03-24", rating: 9.2 },
    { id: 3, title: "The Dark Knight", director: "Christopher Nolan", genre: "Action", releaseDate: "2008-07-18", rating: 9.0 },
    { id: 4, title: "Pulp Fiction", director: "Quentin Tarantino", genre: "Crime", releaseDate: "1994-10-14", rating: 8.9 },
    { id: 5, title: "The Lord of the Rings: The Return of the King", director: "Peter Jackson", genre: "Adventure", releaseDate: "2003-12-17", rating: 8.9 },
    { id: 6, title: "Forrest Gump", director: "Robert Zemeckis", genre: "Drama", releaseDate: "1994-07-06", rating: 8.8 },
    { id: 7, title: "Inception", director: "Christopher Nolan", genre: "Sci-Fi", releaseDate: "2010-07-16", rating: 8.7 },
    { id: 8, title: "The Matrix", director: "The Wachowskis", genre: "Sci-Fi", releaseDate: "1999-03-31", rating: 8.7 },
    { id: 9, title: "Schindler's List", director: "Steven Spielberg", genre: "Biography", releaseDate: "1993-12-15", rating: 8.9 },
    { id: 10, title: "Fight Club", director: "David Fincher", genre: "Drama", releaseDate: "1999-10-15", rating: 8.8 },
    { id: 11, title: "The Silence of the Lambs", director: "Jonathan Demme", genre: "Thriller", releaseDate: "1991-01-30", rating: 8.6 },
    { id: 12, title: "The Departed", director: "Martin Scorsese", genre: "Crime", releaseDate: "2006-10-06", rating: 8.5 },
]

const columns = [
    { name: "id", title: "Movie ID", width: '50px', align: 'center' },
    { name: "title", title: "Title", width: '200px' },
    { name: "director", title: "Director" },
    { name: "genre", title: "Genre", width: '50px' },
    { name: "releaseDate", title: "Release Date" },
    { name: "rating", title: "Rating", width: '50px' },
]

const datagrid = Datagrid(document.getElementById('root'), {
    data: data,
    columns: columns,
    search: true, // This line enables the search feature
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
        { id: 1, title: "The Shawshank Redemption", director: "Frank Darabont", genre: "Drama", releaseDate: "1994-09-23", rating: 9.3 },
        { id: 2, title: "The Godfather", director: "Francis Ford Coppola", genre: "Crime", releaseDate: "1972-03-24", rating: 9.2 },
        { id: 3, title: "The Dark Knight", director: "Christopher Nolan", genre: "Action", releaseDate: "2008-07-18", rating: 9.0 },
        { id: 4, title: "Pulp Fiction", director: "Quentin Tarantino", genre: "Crime", releaseDate: "1994-10-14", rating: 8.9 },
        { id: 5, title: "The Lord of the Rings: The Return of the King", director: "Peter Jackson", genre: "Adventure", releaseDate: "2003-12-17", rating: 8.9 },
        { id: 6, title: "Forrest Gump", director: "Robert Zemeckis", genre: "Drama", releaseDate: "1994-07-06", rating: 8.8 },
        { id: 7, title: "Inception", director: "Christopher Nolan", genre: "Sci-Fi", releaseDate: "2010-07-16", rating: 8.7 },
        { id: 8, title: "The Matrix", director: "The Wachowskis", genre: "Sci-Fi", releaseDate: "1999-03-31", rating: 8.7 },
        { id: 9, title: "Schindler's List", director: "Steven Spielberg", genre: "Biography", releaseDate: "1993-12-15", rating: 8.9 },
        { id: 10, title: "Fight Club", director: "David Fincher", genre: "Drama", releaseDate: "1999-10-15", rating: 8.8 },
        { id: 11, title: "The Silence of the Lambs", director: "Jonathan Demme", genre: "Thriller", releaseDate: "1991-01-30", rating: 8.6 },
        { id: 12, title: "The Departed", director: "Martin Scorsese", genre: "Crime", releaseDate: "2006-10-06", rating: 8.5 },
    ]

    self.columns = [
        { name: "id", title: "Movie ID", width: '50px', align: 'center' },
        { name: "title", title: "Title", width: '200px' },
        { name: "director", title: "Director" },
        { name: "genre", title: "Genre", width: '50px' },
        { name: "releaseDate", title: "Release Date" },
        { name: "rating", title: "Rating", width: '50px' },
    ]

    return `<div>
        <Datagrid :data="self.data" :columns="self.columns" :search="true" />
    </div>`
}
```
```jsx
import React, { useRef, useEffect } from "react";
import Datagrid from '@lemonadejs/data-grid';
import '@lemonadejs/data-grid/dist/style.css';

const columns = [
    { name: "id", title: "Movie ID", width: '50px', align: 'center' },
    { name: "title", title: "Title", width: '200px' },
    { name: "director", title: "Director" },
    { name: "genre", title: "Genre", width: '50px' },
    { name: "releaseDate", title: "Release Date" },
    { name: "rating", title: "Rating", width: '50px' },
]

const data = [
    { id: 1, title: "The Shawshank Redemption", director: "Frank Darabont", genre: "Drama", releaseDate: "1994-09-23", rating: 9.3 },
    { id: 2, title: "The Godfather", director: "Francis Ford Coppola", genre: "Crime", releaseDate: "1972-03-24", rating: 9.2 },
    { id: 3, title: "The Dark Knight", director: "Christopher Nolan", genre: "Action", releaseDate: "2008-07-18", rating: 9.0 },
    { id: 4, title: "Pulp Fiction", director: "Quentin Tarantino", genre: "Crime", releaseDate: "1994-10-14", rating: 8.9 },
    { id: 5, title: "The Lord of the Rings: The Return of the King", director: "Peter Jackson", genre: "Adventure", releaseDate: "2003-12-17", rating: 8.9 },
    { id: 6, title: "Forrest Gump", director: "Robert Zemeckis", genre: "Drama", releaseDate: "1994-07-06", rating: 8.8 },
    { id: 7, title: "Inception", director: "Christopher Nolan", genre: "Sci-Fi", releaseDate: "2010-07-16", rating: 8.7 },
    { id: 8, title: "The Matrix", director: "The Wachowskis", genre: "Sci-Fi", releaseDate: "1999-03-31", rating: 8.7 },
    { id: 9, title: "Schindler's List", director: "Steven Spielberg", genre: "Biography", releaseDate: "1993-12-15", rating: 8.9 },
    { id: 10, title: "Fight Club", director: "David Fincher", genre: "Drama", releaseDate: "1999-10-15", rating: 8.8 },
    { id: 11, title: "The Silence of the Lambs", director: "Jonathan Demme", genre: "Thriller", releaseDate: "1991-01-30", rating: 8.6 },
    { id: 12, title: "The Departed", director: "Martin Scorsese", genre: "Crime", releaseDate: "2006-10-06", rating: 8.5 },
]

export default function App() {
    const domRef = useRef();


    useEffect(() => {
        if (! domRef.current.innerText) {
            Datagrid(domRef.current, {
                data: data,
                column: column,
                search: true, // This line enables the search feature
            });
        }
    }, []);

    return (<>
        <div ref={domRef}></div>
    </>);
}
```