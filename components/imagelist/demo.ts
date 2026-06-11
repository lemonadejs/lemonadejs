/**
 * Local playground for <ImageList /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import ImageList, { type ImageListItem } from '@lemonadejs/imagelist';

const pic = (seed: string, w = 400, h = 300) =>
    `https://picsum.photos/seed/${seed}/${w}/${h}`;

const standard: ImageListItem[] = [
    { src: pic('breakfast'), title: 'Breakfast', subtitle: '@bkristastucchio' },
    { src: pic('burger'), title: 'Burger', subtitle: '@rollelflex_graphy726' },
    { src: pic('camera'), title: 'Camera', subtitle: '@helloimnik' },
    { src: pic('coffee'), title: 'Coffee', subtitle: '@nolanissac' },
    { src: pic('hats'), title: 'Hats', subtitle: '@hjrc33' },
    { src: pic('honey'), title: 'Honey', subtitle: '@arwinneil' },
    { src: pic('basketball'), title: 'Basketball', subtitle: '@tjdragotta' },
    { src: pic('fern'), title: 'Fern', subtitle: '@katie_wasserman' },
    { src: pic('mushrooms'), title: 'Mushrooms', subtitle: '@silverdalex' },
];

const quilted: ImageListItem[] = [
    { src: pic('q-breakfast', 800, 600), title: 'Breakfast', cols: 2, rows: 2 },
    { src: pic('q-burger'), title: 'Burger' },
    { src: pic('q-camera'), title: 'Camera' },
    { src: pic('q-coffee', 800, 300), title: 'Coffee', cols: 2 },
    { src: pic('q-hats', 800, 300), title: 'Hats', cols: 2 },
    { src: pic('q-honey', 800, 600), title: 'Honey', cols: 2, rows: 2 },
    { src: pic('q-basketball'), title: 'Basketball' },
    { src: pic('q-fern'), title: 'Fern' },
];

const masonry: ImageListItem[] = [
    'bed', 'books', 'sink', 'kitchen', 'blinds', 'chairs',
    'laptop', 'doors', 'storage', 'candle', 'couch', 'shelves',
].map((seed, i) => ({
    src: pic('m-' + seed, 400, 240 + ((i * 97) % 320)),
    title: seed[0].toUpperCase() + seed.slice(1),
}));

const App: Component = (props, { state }) => {
    const data = state(standard.slice());
    const columns = state(3);
    const log = state<string[]>([]);

    const onitemclick = (item: ImageListItem, index: number) => {
        log.value = [...log.value, `onitemclick → #${index} ${item.title}`];
    };

    let extra = 0;

    return html`<div class="demo">
        <h1>&lt;ImageList /&gt;</h1>

        <h3>Standard grid + bars (live data, by reference)</h3>
        <${ImageList} data="${data}" columns="${columns}" bar onitemclick="${onitemclick}" />
        <button onclick="${() => (columns.value = columns.value === 3 ? 4 : 3)}">toggle columns (3/4)</button>
        <button onclick="${() => {
            extra++;
            data.value.push({ src: pic('extra-' + extra), title: 'Extra ' + extra });
            data.touch(); // mutate + touch: no copies
        }}">push image + touch()</button>
        <button onclick="${() => (data.value = standard.slice())}">reset (assignment)</button>

        <h3>Quilted — items span cells via cols/rows</h3>
        <${ImageList} data="${quilted}" variant="quilted" columns="4" rowheight="100" gap="4" bar />

        <h3>Masonry — CSS columns, natural heights</h3>
        <${ImageList} data="${masonry}" variant="masonry" columns="4" gap="10" rowheight="0" />

        <h3>onitemclick log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
