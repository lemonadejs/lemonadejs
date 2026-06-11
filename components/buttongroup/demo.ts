/**
 * Local playground for <ButtonGroup /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import ButtonGroup from '@lemonadejs/buttongroup';

const App: Component = (props, { state }) => {
    const align = state<string | null>('left');
    const format = state<string[]>(['bold']);
    const log = state<string[]>([]);

    const note = (line: string) => {
        log.value = [...log.value, line];
    };

    return html`<div class="demo">
        <h1>&lt;ButtonGroup /&gt;</h1>

        <h3>Plain action buttons (onclick mode)</h3>
        <${ButtonGroup}
            options="${['One', 'Two', 'Three']}"
            onclick="${(v: unknown) => note('onclick → ' + v)}" />
        <br /><br />
        <${ButtonGroup} variant="outlined" options="${['Save', 'Discard']}"
            onclick="${(v: unknown) => note('onclick → ' + v)}" />
        <${ButtonGroup} variant="text" options="${['Cut', 'Copy', 'Paste']}"
            onclick="${(v: unknown) => note('onclick → ' + v)}" />

        <h3>Single select — alignment picker</h3>
        <${ButtonGroup} selectable="single" variant="outlined" bind="${align}"
            options="${[
                { value: 'left', icon: 'format_align_left' },
                { value: 'center', icon: 'format_align_center' },
                { value: 'right', icon: 'format_align_right' },
                { value: 'justify', icon: 'format_align_justify', disabled: true },
            ]}"
            onchange="${(v: unknown) => note('align onchange → ' + JSON.stringify(v))}" />
        <p>Alignment: <b>${() => String(align.value)}</b></p>
        <button onclick="${() => (align.value = 'center')}">write 'center' from outside (no onchange echo)</button>

        <h3>Multiple select — formatting bar</h3>
        <${ButtonGroup} selectable="multiple" bind="${format}"
            options="${[
                { value: 'bold', label: 'Bold', icon: 'format_bold' },
                { value: 'italic', label: 'Italic', icon: 'format_italic' },
                { value: 'underline', label: 'Underline', icon: 'format_underlined' },
            ]}"
            onchange="${(v: unknown) => note('format onchange → ' + JSON.stringify(v))}" />
        <p>Formatting: <b>${() => JSON.stringify(format.value)}</b></p>

        <h3>Variants, colors, sizes, orientation</h3>
        <${ButtonGroup} color="green" size="small" options="${['Small', 'Green']}" />
        <${ButtonGroup} color="purple" size="large" options="${['Large', 'Purple']}" />
        <br /><br />
        <${ButtonGroup} orientation="vertical" variant="outlined" selectable="single"
            options="${['Top', 'Middle', 'Bottom']}" />
        <${ButtonGroup} orientation="vertical" options="${['Up', 'Down']}" />

        <h3>Disabled group</h3>
        <${ButtonGroup} disabled options="${['Cannot', 'Touch', 'This']}" />

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
