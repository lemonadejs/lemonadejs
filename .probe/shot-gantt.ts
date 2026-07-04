/**
 * Visual snapshot page for <Gantt /> — default look (colors, typography,
 * bar/milestone/link styling) for a headless-Chrome screenshot. Not a
 * probe: no PASS/FAIL, just pixels for eyeballing default styling changes.
 */
import { html, mount, type Component } from 'lemonadejs';
import Gantt from '@lemonadejs/gantt';

const tasks = [
    { id: 'discovery', label: 'Discovery', start: '2026-06-22', end: '2026-06-26', progress: 100 },
    { id: 'design', label: 'Design', start: '2026-06-25', end: '2026-07-02', progress: 80, dependencies: ['discovery'] },
    { id: 'build', label: 'Build', start: '2026-07-01', end: '2026-07-14', progress: 35, dependencies: ['design'] },
    { id: 'qa', label: 'QA', start: '2026-07-10', end: '2026-07-17', progress: 0, dependencies: ['build'] },
    { id: 'launch', label: 'Launch', start: '2026-07-20', end: '2026-07-20', type: 'milestone', dependencies: ['qa'] },
];

const colored = [
    { label: 'Backend', start: '2026-06-24', end: '2026-07-04', progress: 60 },
    { label: 'Frontend', start: '2026-06-29', end: '2026-07-09', progress: 40, color: '#c0554a' },
    { label: 'Docs', start: '2026-07-07', end: '2026-07-12', progress: 0, color: '#578163' },
];

const App: Component = () => html`<div style="padding:24px;display:flex;flex-direction:column;gap:48px;max-width:860px;background:#fff">
    <div id="g-default"><${Gantt} data="${tasks}" editable="${true}" /></div>
    <div id="g-colored"><${Gantt} data="${colored}" /></div>
</div>`;

mount(App, document.getElementById('app') as Element);
