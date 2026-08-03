/**
 * Theme showcase — one page with many components on screen and a theme
 * switcher (Modern / Minimal / Soft) + dark-mode toggle in the top bar.
 * Flip the theme/dark and watch every component re-theme live, since they
 * all read the same --lm-* tokens from the body class.
 *
 * It's a regular component folder (demo.ts + demo.html) so `npm run dev`
 * discovers it automatically at /components/showcase/demo.html.
 */
import { html, mount, type Component } from 'lemonadejs';
import Switch from '@lemonadejs/switch';
import Toggle from '@lemonadejs/toggle';
import Rating from '@lemonadejs/rating';
import Slider from '@lemonadejs/slider';
import Progress from '@lemonadejs/progress';
import Dropdown, { type DropdownItem } from '@lemonadejs/dropdown';
import Accordion, { type AccordionItem } from '@lemonadejs/accordion';
import Tabs, { type TabItem } from '@lemonadejs/tabs';
import Alert from '@lemonadejs/alert';
import Card from '@lemonadejs/card';
import Chart, { type ChartSeries } from '@lemonadejs/charts';

const countries: DropdownItem[] = [
    { value: 'br', text: 'Brazil', group: 'America' },
    { value: 'us', text: 'United States', group: 'America' },
    { value: 'pt', text: 'Portugal', group: 'Europe' },
    { value: 'de', text: 'Germany', group: 'Europe' },
    { value: 'jp', text: 'Japan', group: 'Asia' },
];
const accItems: AccordionItem[] = [
    { title: 'General', content: 'Plain text content — rendered as text.' },
    { title: 'Advanced', content: 'Exclusive mode: opening this closes the others.' },
];
const tabItems: TabItem[] = [
    { title: 'Overview', content: '<p style="padding:4px 2px">Overview panel.</p>' },
    { title: 'Settings', content: '<p style="padding:4px 2px">Settings panel.</p>' },
    { title: 'Activity', content: '<p style="padding:4px 2px">Activity panel.</p>' },
];
const series: ChartSeries[] = [
    { name: 'Product A', data: [12, 19, 8, 22] },
    { name: 'Product B', data: [7, 11, 14, 9] },
];

const App: Component = (_props, { state }) => {
    const theme = state('modern');
    const dark = state(false);
    const apply = () => {
        document.body.className = 'lm-theme-' + theme.value + (dark.value ? ' lm-dark-mode' : '');
    };

    // a few two-way binds so the controls are interactive
    const sw = state(true);
    const tg = state(false);
    const rating = state(3);
    const vol = state(60);
    const pct = state(45);
    const team = state('');
    const expanded = state(0);

    return html`<div>
        <div class="bar">
            <h1>LemonadeJS — Theme showcase</h1>
            <div class="switcher">
                <label>Theme
                    <select onchange="${(e: Event) => { theme.value = (e.target as HTMLSelectElement).value; apply(); }}">
                        <option value="modern">Modern</option>
                        <option value="minimal">Minimal</option>
                        <option value="soft">Soft</option>
                    </select>
                </label>
                <label><input type="checkbox"
                    onchange="${(e: Event) => { dark.value = (e.target as HTMLInputElement).checked; apply(); }}" /> Dark mode</label>
            </div>
        </div>

        <div class="gallery">
            <section class="cell">
                <h4>Buttons</h4>
                <div class="row">
                    <button class="lm-button">Default</button>
                    <button class="lm-button blue">Blue</button>
                    <button class="lm-button red">Red</button>
                </div>
            </section>

            <section class="cell">
                <h4>Switch &amp; Toggle</h4>
                <${Switch} bind="${sw}" label="Notifications" />
                <div style="height:10px"></div>
                <${Toggle} bind="${tg}" icon="mic" text="Microphone" />
            </section>

            <section class="cell">
                <h4>Rating</h4>
                <${Rating} bind="${rating}" number="${5}" />
            </section>

            <section class="cell">
                <h4>Slider</h4>
                <${Slider} bind="${vol}" label="Volume" showvalue />
            </section>

            <section class="cell">
                <h4>Progress</h4>
                <${Progress} bind="${pct}" />
            </section>

            <section class="cell">
                <h4>Dropdown</h4>
                <${Dropdown} data="${countries}" bind="${team}" placeholder="Pick a country" />
            </section>

            <section class="cell">
                <h4>Inputs</h4>
                <input class="lm-input" type="text" placeholder="Text input" style="width:100%;box-sizing:border-box" />
                <div style="height:10px"></div>
                <select class="lm-input" style="width:100%"><option>Native select</option></select>
            </section>

            <section class="cell">
                <h4>Accordion</h4>
                <${Accordion} options="${accItems}" bind="${expanded}" />
            </section>

            <section class="cell wide">
                <h4>Tabs</h4>
                <${Tabs} data="${tabItems}" />
            </section>

            <section class="cell">
                <h4>Alerts</h4>
                <${Alert} severity="success" title="Saved" message="Your changes were saved." />
                <div style="height:8px"></div>
                <${Alert} severity="warning" title="Heads up" message="Double-check your settings." />
            </section>

            <section class="cell">
                <h4>Card</h4>
                <${Card} variant="outlined" title="Plain card"
                    content="A bordered card — borders, radius and shadow all come from the theme tokens." />
            </section>

            <section class="cell wide">
                <h4>Chart (palette follows the theme defaults)</h4>
                <${Chart} type="bar" categories="${['Q1', 'Q2', 'Q3', 'Q4']}" series="${series}"
                    height="${190}" title="Quarterly revenue" />
            </section>
        </div>
    </div>`;
};

mount(App, document.getElementById('app') as Element);
