/**
 * Local playground for <Toast /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Toast, { type ToastApi } from '@lemonadejs/toast';

const POSITIONS = ['', 'bottom-right', 'top-left', 'top-right'];

const App: Component = (props, { state }) => {
    let toast!: ToastApi;
    const position = state('');
    const log = state<string[]>([]);

    const onclose = (message: string) => {
        log.value = [...log.value, 'onclose → ' + message];
    };

    let n = 0;

    return html`<div class="demo">
        <h1>&lt;Toast /&gt;</h1>

        <${Toast} ref="${(a: ToastApi) => (toast = a)}" position="${position}" onclose="${onclose}" />

        <h3>Severity helpers</h3>
        <button onclick="${() => toast.show('Plain snackbar message')}">show</button>
        <button onclick="${() => toast.success('Profile saved')}">success</button>
        <button onclick="${() => toast.error('Could not reach the server')}">error</button>
        <button onclick="${() => toast.warning('Storage almost full')}">warning</button>
        <button onclick="${() => toast.info('A new version is available')}">info</button>

        <h3>Durations</h3>
        <button onclick="${() => toast.show('Gone in one second', { duration: 1000 })}">1s toast</button>
        <button onclick="${() => toast.warning('Sticky until you close me', { duration: 0 })}">sticky</button>

        <h3>Action toast</h3>
        <button onclick="${() =>
            toast.show('Message deleted', {
                severity: 'info',
                action: { label: 'Undo', onclick: () => toast.success('Restored!') },
            })}">delete something</button>

        <h3>Queue (max 5 visible)</h3>
        <button onclick="${() => {
            for (let i = 0; i < 8; i++) {
                toast.show('Burst toast #' + ++n);
            }
        }}">fire 8 at once — 3 wait their turn</button>
        <button onclick="${() => toast.clear()}">clear()</button>

        <h3>Corner</h3>
        ${POSITIONS.map(
            (p) => html`<label style="margin-right:12px">
                <input type="radio" name="position"
                    checked="${() => position.value === p}"
                    onchange="${() => (position.value = p)}" />
                ${p || 'bottom-left (default)'}
            </label>`
        )}

        <h3>onclose log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
