/**
 * Visual snapshot page for <Chart /> — renders the default look (palette,
 * typography, plot geometry) for a headless-Chrome screenshot. Not a probe:
 * no PASS/FAIL, just pixels for eyeballing default styling changes.
 */
import { html, mount, type Component } from 'lemonadejs';
import Chart from '@lemonadejs/charts';

const App: Component = () => html`<div style="padding:24px;display:flex;flex-direction:column;gap:48px;max-width:760px;background:#fff">
    <div id="s-single" style="height:360px"><${Chart} type="bar" animate="${false}"
        title="You rate the WiFi quality at Starbucks as.."
        categories="${['3', '4', '2', '5', '1']}"
        series="${[{ name: 'Votes', data: [44, 32, 10, 8, 6] }]}"
        valuesuffix="%" /></div>
    <div id="s-multi" style="height:360px"><${Chart} type="bar" animate="${false}"
        title="Revenue by region" subtitle="Grouped bars, five series (palette order)"
        categories="${['Q1', 'Q2', 'Q3', 'Q4']}"
        series="${[
            { name: 'North', data: [12, 17, 9, 14] },
            { name: 'South', data: [8, 11, 13, 9] },
            { name: 'East', data: [5, 8, 7, 10] },
            { name: 'West', data: [9, 6, 11, 7] },
            { name: 'Central', data: [4, 7, 6, 8] },
        ]}" /></div>
    <div id="s-line" style="height:360px"><${Chart} type="line" animate="${false}"
        title="Sessions" subtitle="Three line series"
        categories="${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}"
        series="${[
            { name: 'Desktop', data: [30, 42, 38, 51, 47, 60] },
            { name: 'Mobile', data: [18, 25, 31, 28, 39, 45] },
            { name: 'Tablet', data: [8, 11, 9, 14, 12, 16] },
        ]}" /></div>
    <div id="s-donut" style="height:420px"><${Chart} type="pie" innerradius="${0.62}" animate="${false}"
        title="Charity allocations"
        series="${[{ data: [
            { name: 'Health care', value: 34 },
            { name: 'Education', value: 27 },
            { name: 'Youth programmes', value: 22 },
            { name: 'Poverty measures', value: 8 },
            { name: 'Elderly care', value: 6 },
            { name: 'Other', value: 3 },
        ] }]}" /></div>
    <div id="s-arc" style="height:420px"><${Chart} type="arcdiagram" animate="${false}"
        title="Main train connections in Europe"
        series="${[{ data: [
            { from: 'Hamburg', to: 'Stuttgart', value: 1 }, { from: 'Hamburg', to: 'Frankfurt', value: 1 },
            { from: 'Hamburg', to: 'München', value: 1 }, { from: 'Hannover', to: 'Wien', value: 1 },
            { from: 'Hannover', to: 'München', value: 1 }, { from: 'Berlin', to: 'Wien', value: 1 },
            { from: 'Berlin', to: 'München', value: 1 }, { from: 'Berlin', to: 'Köln', value: 1 },
            { from: 'Berlin', to: 'Frankfurt', value: 1 }, { from: 'München', to: 'Düsseldorf', value: 1 },
            { from: 'München', to: 'Wien', value: 1 }, { from: 'München', to: 'Frankfurt', value: 1 },
            { from: 'Paris', to: 'Brest', value: 1 }, { from: 'Paris', to: 'Nantes', value: 1 },
            { from: 'Paris', to: 'Bayonne', value: 1 }, { from: 'Paris', to: 'Bordeaux', value: 1 },
            { from: 'Paris', to: 'Toulouse', value: 1 }, { from: 'Paris', to: 'Montpellier', value: 1 },
            { from: 'Paris', to: 'Marseille', value: 1 }, { from: 'Paris', to: 'Nice', value: 1 },
            { from: 'Paris', to: 'Milano', value: 1 }, { from: 'Frankfurt', to: 'Paris', value: 1 },
            { from: 'Milano', to: 'Roma', value: 1 }, { from: 'Milano', to: 'Bari', value: 1 },
            { from: 'Roma', to: 'Napoli', value: 1 }, { from: 'Milano', to: 'Venezia', value: 1 },
        ] }]}" /></div>
    <div id="s-pyramid" style="height:440px"><${Chart} type="bar" horizontal mirror animate="${false}"
        title="Population pyramid for Andorra, 2023" subtitle="Source: countryeconomy.com" valuesuffix="%"
        categories="${['0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-40', '40-45', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '80+']}"
        series="${[
            { name: 'Male', data: [1.4, 2.1, 2.5, 2.8, 3.0, 3.8, 4.2, 3.9, 4.3, 4.8, 4.7, 4.3, 3.7, 2.6, 1.9, 1.5, 0.8, 0.7] },
            { name: 'Female', data: [1.3, 2.0, 2.4, 2.6, 2.7, 3.1, 3.5, 3.5, 3.9, 4.4, 4.1, 3.8, 3.3, 2.4, 1.8, 1.3, 1.1, 1.2] },
        ]}" /></div>
    <div id="s-pack" style="height:460px"><${Chart} type="packedbubble" animate="${false}"
        title="Carbon emissions around the world (2022)" subtitle="Source: Wikipedia"
        series="${[
            { name: 'Europe', data: [
                { name: 'Germany', value: 594 }, { name: 'UK', value: 318 }, { name: 'Italy', value: 306 },
                { name: 'France', value: 283 }, { name: 'Poland', value: 286 }, { name: 'Spain', value: 214 },
            ] },
            { name: 'Africa', data: [
                { name: 'Egypt', value: 240 }, { name: 'South Africa', value: 393 }, { name: 'Algeria', value: 160 },
            ] },
            { name: 'Oceania', data: [{ name: 'Australia', value: 373 }] },
            { name: 'North America', data: [
                { name: 'USA', value: 4700 }, { name: 'Canada', value: 517 }, { name: 'Mexico', value: 462 },
            ] },
            { name: 'South America', data: [
                { name: 'Brazil', value: 434 }, { name: 'Argentina', value: 168 },
            ] },
            { name: 'Asia', data: [
                { name: 'China', value: 11397 }, { name: 'India', value: 2830 }, { name: 'Japan', value: 990 },
                { name: 'Russia', value: 1652 }, { name: 'Iran', value: 686 }, { name: 'Korea', value: 573 },
                { name: 'Indonesia', value: 674 },
            ] },
        ]}" /></div>
    <div id="s-waterfall" style="height:380px"><${Chart} type="waterfall" animate="${false}"
        title="Cash flow"
        categories="${['Start', 'Product', 'Services', 'Fixed costs', 'Variable costs', 'Balance']}"
        series="${[{ data: [120, 56, 30, -45, -61, 0] }]}" /></div>
    <div id="s-radar" style="height:400px"><${Chart} type="radar" animate="${false}"
        title="Skills assessment"
        categories="${['Sales', 'Marketing', 'Dev', 'Support', 'IT', 'Admin']}"
        series="${[
            { name: 'Allocated', data: [43, 19, 60, 35, 17, 10] },
            { name: 'Actual', data: [50, 39, 42, 31, 26, 14] },
        ]}" /></div>
    <div id="s-gauge" style="height:380px"><${Chart} type="gauge" animate="${false}"
        title="Revenue this month" ymin="${0}" ymax="${200000}" valueprefix="$"
        plotbands="${[
            { from: 100000, to: 150000, color: '#bd7f40' },
            { from: 150000, to: 200000, color: '#578163' },
            { from: 0, to: 100000, color: '#e6e6e6' },
        ]}"
        series="${[{ name: 'Revenue', data: [80000] }]}" /></div>
    <div id="s-radial" style="height:460px"><${Chart} type="radialbar" animate="${false}"
        title="Winter Olympic medals per existing country (TOP 5)" subtitle="Source: Wikipedia"
        categories="${['Norway', 'United States', 'Germany', 'Austria', 'Canada']}"
        series="${[
            { name: 'Gold medals', color: '#e8c132', data: [132, 105, 92, 64, 73] },
            { name: 'Silver medals', color: '#b6b8bd', data: [125, 110, 86, 81, 64] },
            { name: 'Bronze medals', color: '#b1762b', data: [111, 90, 60, 87, 62] },
        ]}" /></div>
    <div id="s-endline" style="height:380px"><${Chart} type="line" animate="${false}"
        title="Application users last 24 hours" subtitle="All traffic sources combined"
        categories="${['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']}"
        series="${[
            { name: 'Users', data: [900, 1000, 4000, 4300, 7700, 10100, 4200, 1300] },
            { name: 'Average', dashed: true, data: [800, 850, 1100, 2100, 2400, 3100, 2300, 900] },
        ]}" /></div>
    <div id="s-scatter" style="height:420px"><${Chart} type="scatter" animate="${false}"
        title="European olympic athletes by height and weight" subtitle="Source: The Guardian"
        xtitle="Weight (kg)" ytitle="Height (m)"
        series="${[
            { name: 'Triathlon', data: [[46,1.57],[57,1.63],[60,1.63],[63,1.66],[65,1.71],[66,1.68],[68,1.72],[70,1.75],[72,1.78],[73,1.72],[75,1.81],[76,1.83]] },
            { name: 'Volleyball', data: [[62,1.64],[66,1.71],[68,1.82],[70,1.79],[72,1.85],[74,1.87],[76,1.90],[78,1.95],[80,1.92],[83,1.96],[86,1.98],[90,2.00],[95,1.99],[98,2.05]] },
            { name: 'Basketball', data: [[65,1.75],[70,1.80],[75,1.88],[78,1.85],[82,1.90],[86,1.93],[90,1.98],[94,2.02],[98,2.10],[102,2.05],[106,2.08],[112,2.13],[116,2.18]] },
        ]}" /></div>
    <div id="s-bubble" style="height:420px"><${Chart} type="bubble" animate="${false}"
        title="Sugar and fat intake per country" subtitle="Source: Euromonitor and OECD"
        xtitle="Daily fat intake (gr)" ytitle="Daily sugar intake (gr)"
        series="${[{ name: 'Countries', data: [
            { x: 65, y: 126, z: 82, name: 'US' }, { x: 63, y: 83, z: 96, name: 'NZ' },
            { x: 64, y: 51, z: 60, name: 'PT' }, { x: 66, y: 52, z: 91, name: 'HU' },
            { x: 69, y: 20, z: 58, name: 'RU' }, { x: 71, y: 93, z: 80, name: 'UK' },
            { x: 74, y: 83, z: 35, name: 'NO' }, { x: 75, y: 69, z: 55, name: 'FR' },
            { x: 78, y: 70, z: 54, name: 'ES' }, { x: 80, y: 102, z: 60, name: 'NL' },
            { x: 86, y: 103, z: 55, name: 'DE' }, { x: 95, y: 95, z: 45, name: 'BE' },
        ] }]}" /></div>
    <div id="s-pie" style="height:400px"><${Chart} type="pie" animate="${false}"
        title="Support requests" palette="focus"
        series="${[{ data: [
            { name: 'Webform', value: 63 },
            { name: 'Call', value: 20 },
            { name: 'Email', value: 8 },
            { name: 'Webchat', value: 6 },
            { name: 'Other', value: 3 },
        ] }]}" /></div>
    <div id="s-picto" style="height:280px"><${Chart} type="pictogram" icon="person" animate="${false}"
        title="How satisfied are our customers?"
        series="${[{ data: [
            { name: 'Satisfied', value: 78 },
            { name: 'Neutral', value: 46 },
            { name: 'Unhappy', value: 21 },
        ] }]}" /></div>
    <div id="s-picto-cap" style="height:300px"><${Chart} type="pictogram" icon="capsule" animate="${false}"
        title="Adoption by segment"
        colors="${['#bd7f40', '#45889c', '#6342a1', '#c0554a']}"
        series="${[{ data: [
            { name: 'Enterprise', value: 20 },
            { name: 'Mid-market', value: 50 },
            { name: 'SMB', value: 40 },
            { name: 'Consumer', value: 80 },
        ] }]}" /></div>
    <div id="s-waffle" style="height:340px"><${Chart} type="waffle" animate="${false}"
        title="Test coverage" colors="${['#578163']}"
        series="${[{ data: [{ name: 'Covered', value: 63 }] }]}" /></div>
    <div id="s-pie2" style="height:400px"><${Chart} type="pie" animate="${false}"
        title="Traffic share" subtitle="Default categorical palette"
        series="${[{ data: [
            { name: 'Search', value: 42 },
            { name: 'Direct', value: 25 },
            { name: 'Social', value: 15 },
            { name: 'Referral', value: 11 },
            { name: 'Email', value: 7 },
        ] }]}" /></div>
</div>`;

mount(App, document.getElementById('app') as Element);
