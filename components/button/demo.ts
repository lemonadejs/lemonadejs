/**
 * Local playground for <Button /> — served by `npm run dev`
 */
import { createWebComponent, html, mount, type Component } from 'lemonadejs';
import Button from '@lemonadejs/button';

// One call, zero options: the contract derives <lm-button> entirely
createWebComponent(Button);

const App: Component = (props, { state }) => {
    const busy = state(false);
    const log = state<string[]>([]);

    const onclick = (e: MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        log.value = [...log.value, 'onclick → ' + (el.textContent || '').trim()];
    };

    return html`<div class="demo">
        <h1>&lt;Button /&gt;</h1>

        <h3>Variants</h3>
        <div class="row">
            <${Button} label="Contained" onclick="${onclick}" />
            <${Button} variant="outlined" label="Outlined" onclick="${onclick}" />
            <${Button} variant="text" label="Text" onclick="${onclick}" />
        </div>

        <h3>Colors × variants</h3>
        <div class="row">
            <${Button} label="Primary" />
            <${Button} variant="outlined" label="Primary" />
            <${Button} variant="text" label="Primary" />
        </div>
        <div class="row">
            <${Button} color="secondary" label="Secondary" />
            <${Button} color="secondary" variant="outlined" label="Secondary" />
            <${Button} color="secondary" variant="text" label="Secondary" />
        </div>
        <div class="row">
            <${Button} color="success" label="Success" />
            <${Button} color="success" variant="outlined" label="Success" />
            <${Button} color="success" variant="text" label="Success" />
        </div>
        <div class="row">
            <${Button} color="error" label="Error" />
            <${Button} color="error" variant="outlined" label="Error" />
            <${Button} color="error" variant="text" label="Error" />
        </div>
        <div class="row">
            <${Button} color="warning" label="Warning" />
            <${Button} color="warning" variant="outlined" label="Warning" />
            <${Button} color="warning" variant="text" label="Warning" />
        </div>

        <h3>Sizes &amp; icons</h3>
        <div class="row">
            <${Button} size="small" icon="send" label="Small" />
            <${Button} icon="send" label="Medium" />
            <${Button} size="large" icon="send" label="Large" />
            <${Button} variant="outlined" icon="delete" color="error" label="Delete" />
        </div>

        <h3>Disabled</h3>
        <div class="row">
            <${Button} disabled label="Contained" />
            <${Button} disabled variant="outlined" label="Outlined" />
            <${Button} disabled variant="text" label="Text" />
        </div>

        <h3>Loading</h3>
        <div class="row">
            <${Button} loading label="Hidden while loading" />
            <${Button} loading variant="outlined" />
            <${Button} loading="${busy}" label="Toggle me below" onclick="${onclick}" />
            <${Button} variant="text" label="${() => (busy.value ? 'Stop loading' : 'Start loading')}"
                onclick="${() => (busy.value = !busy.value)}" />
        </div>

        <h3>Full width</h3>
        <${Button} fullwidth icon="save" label="Save everything" onclick="${onclick}" />

        <h3>Link buttons (href → real &lt;a&gt;)</h3>
        <div class="row">
            <${Button} href="https://lemonadejs.com" label="Visit site" />
            <${Button} href="https://lemonadejs.com" variant="outlined" label="Outlined link" />
            <${Button} href="https://lemonadejs.com" variant="text" disabled label="Disabled link" />
        </div>

        <h3>Children content</h3>
        <${Button} variant="outlined" onclick="${onclick}"><b>Bold</b>&nbsp;and plain</${Button}>

        <h3>Form participation</h3>
        <form onsubmit="${(e: Event) => {
            e.preventDefault();
            log.value = [...log.value, 'form submit'];
        }}">
            <div class="row">
                <${Button} type="submit" label="Submit" />
                <${Button} type="reset" variant="outlined" label="Reset" />
            </div>
        </form>

        <h3>Web component — the same block as &lt;lm-button&gt;</h3>
        <lm-button label="I am a real custom element" color="success" icon="bolt"
            onclick="${() => (log.value = [...log.value, 'lm-button click'])}"></lm-button>

        <h3>onclick log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
