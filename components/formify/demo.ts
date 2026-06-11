/**
 * Local playground for <Formify /> — served by `npm run dev`
 */
import { html, mount, type Component } from 'lemonadejs';
import Formify, { type FormifyApi, type FormifyData } from '@lemonadejs/formify';

const SAMPLE: FormifyData = {
    first: 'Paul',
    last: 'Hodel',
    email: 'paul@example.com',
    newsletter: true,
    role: 'admin',
    gender: 'male',
    address: { city: 'London', country: 'UK' },
    bio: 'Building blocks for agents.',
};

// fetch() accepts data: URLs in the browser — a zero-server remote load
const REMOTE =
    'data:application/json,' +
    encodeURIComponent(JSON.stringify({ first: 'Remote', last: 'Load', email: 'remote@example.com', role: 'user' }));

const App: Component = (props, { state }) => {
    const profile = state<FormifyData>({});
    const log = state<string[]>([]);
    let api!: FormifyApi;

    const note = (m: string) => {
        log.value = [...log.value.slice(-8), m];
    };

    return html`<div class="demo">
        <h1>&lt;Formify /&gt;</h1>
        <p>The v5 model: YOUR markup, any child with a <code>name</code> participates.
            Nested names like <code>address[city]</code> become nested data.</p>

        <${Formify} bind="${profile}" ref="${(a: FormifyApi) => (api = a)}"
            onchange="${(d: FormifyData) => note('onchange → ' + JSON.stringify(d.first) + ' …')}"
            onsubmit="${(d: FormifyData) => note('onsubmit → ' + JSON.stringify(d))}"
            onload="${(d: FormifyData) => note('onload → ' + JSON.stringify(d))}">
            <div class="lm-formify-row">
                <div class="lm-formify-group">
                    <label>First name</label>
                    <input type="text" name="first" required />
                </div>
                <div class="lm-formify-group">
                    <label>Last name</label>
                    <input type="text" name="last" />
                </div>
            </div>
            <div class="lm-formify-group">
                <label>E-mail (required, native validation)</label>
                <input type="email" name="email" required />
            </div>
            <div class="lm-formify-row">
                <div class="lm-formify-group">
                    <label>City</label>
                    <input type="text" name="address[city]" />
                </div>
                <div class="lm-formify-group">
                    <label>Country</label>
                    <input type="text" name="address[country]" />
                </div>
            </div>
            <div class="lm-formify-group">
                <label>Role</label>
                <select name="role">
                    <option value="">Pick one…</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>
            <label class="lm-formify-choice"><input type="checkbox" name="newsletter" /> Newsletter</label>
            <label class="lm-formify-choice"><input type="radio" name="gender" value="male" /> Male</label>
            <label class="lm-formify-choice"><input type="radio" name="gender" value="female" /> Female</label>
            <div class="lm-formify-group">
                <label>Bio</label>
                <textarea name="bio" rows="3"></textarea>
            </div>
            <button type="submit">Submit (intercepted, validated natively)</button>
        </${Formify}>

        <h3>Imperative api (v5 surface)</h3>
        <button onclick="${() => api.set(SAMPLE)}">api.set(sample)</button>
        <button onclick="${() => api.set({})}">api.set({}) — clear</button>
        <button onclick="${() => note('api.get → ' + JSON.stringify(api.get()))}">api.get()</button>
        <button onclick="${() => api.load(REMOTE)}">api.load(url) — data: URL</button>

        <h3>Bound data (two-way, live)</h3>
        <pre>${() => JSON.stringify(profile.value, null, 2)}</pre>

        <h3>Event log</h3>
        <pre>${() => log.value.join('\n')}</pre>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
