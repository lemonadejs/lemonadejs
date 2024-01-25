title: JavaScript Timeline Example
description: LemonadeJS Timeline is a framework-agnostic JavaScript plugin that can be used with pure JavaScript but also integrated perfectly with Vue, React, and Angular developers
keywords: JavaScript timeline plugin, LemonadeJS Timeline, framework-agnostic JavaScript tool, Vue compatible timeline, React timeline component, Angular timeline integration, customizable timeline plugin, interactive logs JavaScript, roadmap visualization tool, monthly event grouping, data visualization JavaScript, UI component for developers, web development tools, timeline navigation feature.

JavaScript Timeline
===============

LemonadeJS Timeline is a framework-agnostic JavaScript plugin that offers integration with **Vue**, **React**, and **Angular**. If you wish to know more about the attributes and options, please visit the [JavaScript Timeline Documentation](/docs/plugins/timeline).

```html
<div id="root"></div>

<script>
const root = document.getElementById("root")

let data = [];
for (let i = 0; i < 500; i++) {
    data.push({
        date: faker.date.between({ from: new Date(2023, 0, 1), to: new Date(2023, 11, 31)}),
        title: faker.commerce.productName(),
        subtitle: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
    })
}

const timeline = Timeline(root, {
    data: data,
    type: 'monthly',
    align: 'left',
    width: 500,
    height: 500,
})
</script>
```
