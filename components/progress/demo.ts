/**
 * Local playground for <Progress /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Progress from '@lemonadejs/progress';

const App: Component = (props, { state, onUnmount }) => {
    const percent = state(0);

    // Determinate animation: a plain interval driving the bound store
    const timer = setInterval(() => {
        percent.value = percent.value >= 100 ? 0 : percent.value + 1;
    }, 80);
    onUnmount(() => clearInterval(timer));

    return html`<div class="demo">
        <h1>&lt;Progress /&gt;</h1>

        <h3>Linear, determinate (driven by setInterval)</h3>
        <${Progress} bind="${percent}" />

        <h3>Linear, labeled + thickness + color</h3>
        <${Progress} bind="${percent}" label />
        <${Progress} bind="${percent}" label thickness="8" color="green" />

        <h3>Linear, indeterminate (unbound)</h3>
        <${Progress} />
        <${Progress} color="purple" />

        <h3>Circular, determinate</h3>
        <${Progress} type="circular" bind="${percent}" />
        <${Progress} type="circular" bind="${percent}" label size="64" thickness="5" color="orange" />

        <h3>Circular, indeterminate</h3>
        <${Progress} type="circular" />
        <${Progress} type="circular" indeterminate size="24" thickness="3" color="red" />

        <h3>Forced indeterminate (value present, animation anyway)</h3>
        <${Progress} bind="${percent}" indeterminate />
    </div>`;
};

mount(App, document.getElementById('app') as Element);
