Lemonadejs
==========

jExcel is a super lightweight vanilla javascript library (3Kb) to help deliver reusable components. It does not require transpilers, babel or hundreds of other dependencies and work just fine in any javascript dev environment.

```html
<html>
<script src="https://lemonadejs.net/v1/lemonadejs.js"></script>

<div id="root"></div>

<script>
function Component() {
    const self = this;
    self.count = 1;
    var template = `<div>
        <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">
            Click me
        </button>
    </div>`;

    return lemonade.element(template, self);
}
lemonade.render(Component, document.getElementById('root'))
</script>
</html>
```
```javascript
import lemonade from 'lemonadejs';

export default function Component() {
    const self = this;
    self.count = 1;
    var template = `<div>
        <p>You clicked {{self.count}} times</p>
        <button onclick="self.count++;">
            Click me
        </button>
    </div>`;

    return lemonade.element(template, self);
}
```

*   Make rich and user-friendly web interfaces and applications
*   You can easily handle complicated data inputs in a way users are used to
*   Improve your user software experience
*   Create rich CRUDS and beautiful UI
*   Compatibility with excel spreadsheets: users can move data around with common copy and paste shortcuts
*   Easy customizations with easy third-party plugin integrations
*   Lean, fast and simple to use
*   Thousands of successfully user cases
*   Speed up your work dealing with difficult data entry in a web-based software
*   Create and share amazing online spreadsheets

  

Installation
------------

```bash
npm install jexcel
```

Or download from our [Github Official](http://github.com/paulhodel/jexcel "The javascript spreadsheet official github repository")  
  
  

Create amazing online spreasheets
---------------------------------

A example how to embed a simple javascript spreadsheet in your application. You can check out for more [examples](/jexcel/v4/examples "Examples") here.
  

### Spreadsheet source code example

```html
<html>
<script src="https://bossanova.uk/jexcel/v4/jexcel.js"></script>
<link rel="stylesheet" href="https://bossanova.uk/jexcel/v4/jexcel.css" type="text/css" />

<script src="https://bossanova.uk/jsuites/jsuites.js"></script>
<link rel="stylesheet" href="https://bossanova.uk/jsuites/jsuites.css" type="text/css" />

<div id="spreadsheet"></div>

<script>
var data = [
    ['Jazz', 'Honda', '2019-02-12', '', true, '$ 2.000,00', '#777700'],
    ['Civic', 'Honda', '2018-07-11', '', true, '$ 4.000,01', '#007777'],
];

jexcel(document.getElementById('spreadsheet'), {
    data:data,
    columns: [
        {
            type: 'text',
            title:'Car',
            width:90
        },
        {
            type: 'dropdown',
            title:'Make',
            width:120,
            source:[
                "Alfa Romeo",
                "Audi",
                "Bmw",
                "Chevrolet",
                "Chrystler",
                // (...)
              ]
        },
        {
            type: 'calendar',
            title:'Available',
            width:120
        },
        {
            type: 'image',
            title:'Photo',
            width:120
        },
        {
            type: 'checkbox',
            title:'Stock',
            width:80
        },
        {
            type: 'numeric',
            title:'Price',
            mask:'$ #.##,00',
            width:80,
            decimal:','
        },
        {
            type: 'color',
            width:80,
            render:'square',
        },
     ]
});
</script>
</html>
```
  
jExcel History
--------------

### Jexcel 4.2.3

*   The spreadsheet plugin now compatible with Jsuites v3.
*   New flags, security implementation
*   New DOM element references in the Toolbar and tabs spreadsheet worksheet events

### Jexcel 4.0.0

A special thank to the [FDL - Fonds de Dotation du Libre](https://www.fdl-lef.org/) support and sponsorship that make the new online spreadsheet version possible with so many nice features.

*   The online spreadsheet with Support workbooks/tabs
*   Create a dynamic spreadsheet table from a HTML static element
*   Highlight the selected cells in the spreadsheet after CTRL+C
*   Footer with formula support
*   Multiple columns resize
*   JSON update support (Helpers to update a remote server)
*   Javascript spreadsheet global super event (centralized method to dispatch all events in one)
*   Custom helpers: =PROGRESS (progressbar), =RATING (5 star rating)
*   Custom helpers: =COLUMN, =ROW, =CELL, =TABLE, =VALUE information to be used on formula execution
*   Dynamic nested header updates
*   A new column type for HTML editing
*   New flags such as: includeHeadersOnCopy, persistance, filters, autoCasting, freezeColumns
*   New events such as: onevent, onchangepage, onbeforesave, onsave
*   More examples and documentation

  

### Jexcel 3.9.0

*   New methods
*   General fixes

  

### Jexcel 3.6.0

*   Better spreadsheet formula parsing
*   New javascript spreadsheet events
*   New initialization options
*   General fixes

  

### Jexcel 3.2.3

*   getMeta, setMeta methods
*   Npm package with jSuites
*   General fixes

  

### Jexcel 3.0.1

jExcel v3 is a complete rebuilt of the javascript spreasheet jquery plugin version. For that reason it was not possible to keep a complete compatibility with the previous version. If you are upgraging you might need to implement a few updates in your code. If you have questions, you can review the article upgraging from jExcel Spreadsheet v2 or Handsontable.

The jExcel v3 brings lot of great new features:

*   Drag and drop columns
*   Resizable rows
*   Merge columns
*   Search
*   Pagination
*   Lazy loading
*   Full screen flag
*   Image upload
*   Native color picker
*   Better mobile compatibility
*   Better nested headers compatibily
*   Amazing keyboard navegation support
*   Better hidden column management
*   Great data picker: dropdown, autocomplete, multiple, group options and icons
*   Importing from XSLX (experimental)

Big improviments are included, such as:

*   Complete new formula engine with no external depencies with much faster results.
*   Absolutely no selectors, means a much faster application
*   New native columns
*   No jQuery is required
*   React, Vue and Angular examples
*   XLXS support using a custom sheetjs (Experimental).

  

### Jexcel 2.1.0

We are glad to bring you the latest jquery plugin version, with the following improvements:

*   Mobile touch fixes
*   Paste fixes & New CSV parser

### Jexcel 2.0.0

*   New radio column
*   New dropdown with autocomplete and multiple selection options
*   Header/body separation for a better scroll/column resize behavior and compatibility
*   Better text-wrap including alt+enter excel compatibility
*   New set/get meta information
*   New set/get config parameters
*   New set/get programmatically cell style
*   New set/get cell comments
*   New table custom toolbar
*   New responsive calendar picker

### Jexcel 1.5.7

*   Checkbox column type improvements
*   Destroy jquery table updates

### Jexcel 1.5.1

*   Spreadsheet data overflow and fixed headers. See an [example](/jexcel/examples/table-with-fixed-headers)
*   Navigation improvements

### Jexcel 1.5.0

*   Relative insertRow, deleteRow, insertColumn, deleteColumn. See an [example](/jexcel/examples/working-with-the-data)
*   Redo, Undo action tracker for insertRow, deleteRow, insertColumn, deleteColumn, moveRow
*   New formula column recursive chain
*   New alternative design option bootstrap-like. See an [example](/jexcel/examples/a-custom-table-design)
*   updateSettings updates

  
  

Javascript spreadsheet examples
-------------------------------
  

Copyright and license
---------------------

jExcel is released under the MIT license.

The software is registered under UK law, copyrights belong to [Paul Hodel](mailto:paul.hodel@gmail.com)

  
  

About jExcel
------------

The jExcel is a full original javascript software created to facilitate the data manipulation in web based applications. It was created to be an easy javascript data input tool for users and it was created inspired on the Handsontable and the Microsoft Excel.  
  
This software is free and was created to be a light alternative to Handsontable javascript spreadsheet. So, some keywords in the configuration and initialization directives could be similar to make easy any migration from Handsontable to jExcel.  
  
The first time we were involved in a web based spreadsheet development was in 2005, when we created the datagrid inspired in dhmlx. But, because the lack of audience we decided to discontinuate its development. A few years ago, we found and started to use Handsontable. It is a great piece of software. But, in a certain extension very complicated for integrations and sometimes limited, for example it is not possible to have a simple key-value dropdown. So, we decided to build something from the scratch, complete original but with a goal to keep as simple as possible any transition between any Handsontable to jExcel.  
  
If you are a developer and likes Microsoft Excel, Handsontable, Datagrid or would like to give users a new user-friendly experience, you are in the right place. You can manipulate the jExcel javascript spreadsheet data with JSON, CSV or simple arrays, so it will be easy to integrate jExcel to any of your applications. We would like to make sure you will have a great start with our tool, so if you have any question, just let us know. We are always willing to help. All for free!  
  
All trademarks belong to their respective owners.