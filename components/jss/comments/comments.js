/**
 * Advanced comments extension for the JSS data grid — LemonadeJS v6.
 *
 * ES module: import it and pass it to jspreadsheet.setExtensions({ comments }).
 * The context menu is the @lemonadejs/contextmenu catalog block.
 */
import { html, mount, store } from 'lemonadejs';
import Modal from '@lemonadejs/modal';
import Contextmenu from '@lemonadejs/contextmenu';

const permissionLevels = {
    reader: 0,
    editor: 1,
    owner: 2,
};

const T = jSuites.translate;
let JSS = null;
let config = {};

const defaultAvatar = `data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' height='48' width='48'%3E%3Cpath d='M24 23.95Q20.7 23.95 18.6 21.85Q16.5 19.75 16.5 16.45Q16.5 13.15 18.6 11.05Q20.7 8.95 24 8.95Q27.3 8.95 29.4 11.05Q31.5 13.15 31.5 16.45Q31.5 19.75 29.4 21.85Q27.3 23.95 24 23.95ZM8 40V35.3Q8 33.4 8.95 32.05Q9.9 30.7 11.4 30Q14.75 28.5 17.825 27.75Q20.9 27 24 27Q27.1 27 30.15 27.775Q33.2 28.55 36.55 30Q38.1 30.7 39.05 32.05Q40 33.4 40 35.3V40ZM11 37H37V35.3Q37 34.5 36.525 33.775Q36.05 33.05 35.35 32.7Q32.15 31.15 29.5 30.575Q26.85 30 24 30Q21.15 30 18.45 30.575Q15.75 31.15 12.6 32.7Q11.9 33.05 11.45 33.775Q11 34.5 11 35.3ZM24 20.95Q25.95 20.95 27.225 19.675Q28.5 18.4 28.5 16.45Q28.5 14.5 27.225 13.225Q25.95 11.95 24 11.95Q22.05 11.95 20.775 13.225Q19.5 14.5 19.5 16.45Q19.5 18.4 20.775 19.675Q22.05 20.95 24 20.95ZM24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45Q24 16.45 24 16.45ZM24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Q24 37 24 37Z'/%3E%3C/svg%3E`;

const License = function() {
    let txt = '';
    if (this.status === 8) {
        if (! this.scope || this.scope.indexOf('comments') === -1) {
            txt = 'The comments extension is not included on the scope of this license';
        }
    } else {
        txt = 'This is only available in the Premium Edition';
    }

    if (! txt) {
        let v = JSS.version();
        if (! v || ! v.version || parseInt(v.version) < 10) {
            txt = 'This extension requires JSS version 10 or higher.';
        }
    }

    return txt;
}

const clone = function(data) {
    return Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [];
}

const prettyDate = function(d) {
    if (d && jSuites.calendar && typeof jSuites.calendar.prettify === 'function') {
        return jSuites.calendar.prettify(d) || d;
    }
    return d || '';
}

/**
 * Create a plugin object
 * @param {object} spreadsheet object.
 * @param {object} plugin options
 */
const advanceComments = (function(spreadsheet, opt) {

    // Reactive state driving the comments box (one set per spreadsheet)
    const data = store([]);
    const comment = store('');
    const license = store('');
    // open shows the Modal; selected makes it interactive (hover preview otherwise)
    const open = store(false);
    const selected = store(false);
    const posTop = store(0);
    const posLeft = store(0);

    // Imperative references owned by the plugin
    let worksheet = null;
    let cellName = null;
    let inputEl = null;
    let menu = null;

    const canEdit = function(item) {
        return ! item.user_id ||
            config.permission === permissionLevels.owner ||
            (config.permission === permissionLevels.editor && item.user_id === config.user_id);
    }

    const setValue = function(cell, records) {
        let value = {}
        if (records.length) {
            value[cell] = records;
        } else {
            value[cell] = '';
        }

        worksheet.setComments(value);
    }

    const saveEntry = function(item, text) {
        let records = clone(data.value);
        let entry = records[data.value.indexOf(item)];
        if (entry) {
            entry.comments = text;
            if (item.user_id !== config.user_id) {
                entry.edited = T('edited');
            }
        }
        setValue(cellName, records);
    }

    const removeEntry = function(item) {
        let records = clone(data.value);
        records.splice(data.value.indexOf(item), 1);
        setValue(cellName, records);
    }

    const save = function() {
        let records = clone(data.value);
        // Add new comments
        if (comment.value) {
            let temp = {
                date: new Date().toISOString().replace('T', ' ').substr(0, 19),
                comments: comment.value,
            }

            if (config.user_id) {
                temp.user_id = config.user_id;
            }

            if (config.name) {
                temp.name = config.name;
            }

            if (config.image) {
                temp.image = config.image;
            }

            records.push(temp);
        }

        setValue(cellName, records);
    }

    const close = function() {
        selected.value = false;
        open.value = false;
    }

    const cancel = function() {
        // Reset input
        comment.value = '';
        // Close
        close();
    }

    const Entry = function(props, { state }) {
        const editing = state(false);
        const draft = state(props.item.comments);

        const openMenu = function(e) {
            const rect = e.target.getBoundingClientRect();
            menu.open([
                {
                    title: T('Edit this post'),
                    icon: 'edit',
                    onclick: function() {
                        editing.value = true;
                    }
                },
                {
                    title: T('Delete this post'),
                    icon: 'delete',
                    onclick: function() {
                        removeEntry(props.item);
                    }
                }
            ], rect.x, rect.y);
        }

        const actions = canEdit(props.item)
            ? html`<div class="jss_style_p6 jss_comments_actions" style="margin-left: 5px" onclick="${openMenu}"><i class="material-icons cursor">arrow_drop_down</i></div>`
            : '';

        const image = props.item.image || defaultAvatar;

        return html`<div class="p4 jss_comments_entry" style="border-bottom: 1px solid #ddd">
            <div class="jss_style_row">
                <div class="jss_style_p6">
                    <div><img src="${image}" onerror="${(e) => { e.target.src = defaultAvatar; }}" /></div>
                </div><div class="jss_style_p6 jss_style_f1">
                    <div>${props.item.name || ''}</div>
                    <div class="small" title="${props.item.date || ''}">${prettyDate(props.item.date)}</div>
                </div>
                <div class="jss_style_row">
                    <span style="font-size: 0.85em; color: #9f9e9e; font-style: italic;">${props.item.edited || ''}</span>
                    ${actions}
                </div>
            </div>
            <div class="jss_style_row jss_style_p6" style="padding-top: 0;">
                <div class="small" style="${() => editing.value ? 'display: none' : ''}">${props.item.comments}</div>
                <div style="${() => editing.value ? '' : 'display: none'}">
                    <textarea bind="${draft}" class="jss_object lm-input"></textarea><br>
                    <input type="button" value="${T('Save')}" class="jss_style_button" style="width:90px" onclick="${() => saveEntry(props.item, draft.value)}" />
                    <input type="button" value="${T('Cancel')}" class="jss_style_button" style="width:90px" onclick="${() => { draft.value = props.item.comments; editing.value = false; }}" />
                </div>
            </div>
        </div>`;
    }

    const canComment = typeof(config.permission) === 'undefined' || config.permission >= permissionLevels.reader;

    const Box = function() {
        const input = canComment
            ? html`<div class="jss_comments_input">
                <div class="jss_style_p2"><textarea class="jss_object" bind="${comment}" ref="${(el) => { inputEl = el; }}"></textarea></div>
                <div class="jss_style_row">
                    <div class="jss_style_f1 jss_style_p2"><input type="button" value="${T('Save')}" class="jss_style_button" disabled="${() => ! comment.value}" onclick="${save}" /></div>
                    <div class="jss_style_f1 jss_style_p2"><input type="button" value="${T('Cancel')}" class="jss_style_button" onclick="${cancel}" /></div>
                </div>
            </div>`
            : '';

        return html`<${Modal} bind="${open}" header="${false}" focus="${false}" autoadjust="${true}" top="${posTop}" left="${posLeft}">
            <div class="${() => 'jss_comments_box' + (selected.value ? ' selected' : '')}">
                <${Contextmenu} ref="${(api) => { menu = api; }}" />
                <div>${() => data.value.map((item) => html`<${Entry} item="${item}" />`)}</div>
                ${input}
                <div class="center p4 small">${license}</div>
            </div>
        </${Modal}>`;
    }

    // Plugin object
    const plugin = {}

    plugin.show = function(x, y) {
        let cell = this.records[y][x];
        if (cell && cell.c && Array.isArray(cell.c)) {
            data.value = clone(cell.c);
        } else {
            data.value = [];
        }

        // Anchor the modal at the right edge of the cell (viewport coords)
        let rect = this.records[y][x].element.getBoundingClientRect();
        posTop.value = Math.round(rect.top) + 1;
        posLeft.value = Math.round(rect.right) + 1;

        // Reset textarea value
        comment.value = '';
        // Reset references
        worksheet = this;
        cellName = this.helpers.getCellNameFromCoords(x,y);

        // License
        license.value = License.call(this.parent);

        // Show the modal (position/data above are read on open)
        open.value = true;

        if (inputEl) {
            inputEl.focus();
        }
    }

    plugin.onevent = function(method,w,a,b,c) {
        if (method === 'oncreatecell') {
            let cell = w.records[c][b]
            if (cell && cell.c) {
                if (cell.c && Array.isArray(cell.c)) {
                    a.classList.add('jss_comments');
                    a.removeAttribute('title');
                }
            }
        } else if (method === 'onselection' || method === 'onblur') {
            close();
        } else if (method === 'oncomments') {
            let k = Object.keys(a);
            for (let i = 0; i < k.length; i++) {
                let t = w.helpers.getCoordsFromColumnName(k[i]);
                if (w.records[t[1]][t[0]].element) {
                    if (Array.isArray(a[k[i]])) {
                        w.records[t[1]][t[0]].element.removeAttribute('title');
                        w.records[t[1]][t[0]].element.classList.add('jss_comments');

                        data.value = clone(a[k[i]]);
                        comment.value = '';
                    } else {
                        w.records[t[1]][t[0]].element.classList.remove('jss_comments');
                        close();
                    }
                }
            }
        }
    }

    plugin.contextMenu = function(w, x, y, e, items, section) {
        if (section === 'cell') {
            let index = 0;
            for (let i = 0; i < items.length; i++) {
                if (items[i].icon === 'notes') {
                    index = i
                    break;
                }
            }

            if (index < items.length) {
                items.splice(index, 0, {
                    icon: 'rate_review',
                    title: T('Comments'),
                    onclick: function() {
                        // Show container
                        selected.value = true;
                        // Show dialog
                        plugin.show.call(w,x,y);
                    }
                });
            }
        }

        return items;
    }

    plugin.init = function(worksheet) {
        worksheet.content.addEventListener('mouseover', function(e) {
            e = e || window.event;
            let mouseButton;
            if (e.buttons) {
                mouseButton = e.buttons;
            } else if (e.button) {
                mouseButton = e.button;
            } else {
                mouseButton = e.which;
            }

            if (! mouseButton) {
                if (e.target.classList.contains('jss_comments') && ! selected.value) {
                    let x = e.target.getAttribute('data-x');
                    let y = e.target.getAttribute('data-y');
                    if (x !== undefined && y !== undefined) {
                        // Hover preview: modal open but not selected (non-interactive)
                        plugin.show.call(worksheet, x, y);
                    }
                } else if (! selected.value) {
                    open.value = false;
                }
            }
        });

        worksheet.content.addEventListener('mouseup', function(e) {
            if (e.target.classList.contains('jss_comments')) {
                let x = e.target.getAttribute('data-x');
                let y = e.target.getAttribute('data-y');
                if (x !== undefined && y !== undefined) {
                    if (worksheet.records[y][x] &&
                        worksheet.records[y][x].element &&
                        worksheet.records[y][x].element.classList.contains('jss_cursor') &&
                        worksheet.records[y][x].element.classList.contains('jss_comments')) {
                        selected.value = true;

                        plugin.show.call(worksheet, x, y);
                    } else {
                        close();
                    }
                }
            }
        });

        worksheet.content.addEventListener('scroll', function(e) {
            close();
        });
    }

    const d = document.createElement('div');
    spreadsheet.tools.appendChild(d);
    mount(Box, d);

    return plugin;
});


/**
 * Create a plugin object
 * @param {object} spreadsheet object.
 * @param {object} plugin options
 */
const P = (function(opt) {
    if (opt) {
        if (opt.name) {
            config.name = opt.name;
        }
        if (opt.image) {
            config.image = opt.image;
        }
        if (opt.user_id) {
            config.user_id = opt.user_id;
        }
        if (opt.permission) {
            config.permission = opt.permission;
        }
    }

    return true;
});

/**
 * on create spreadsheet
 * @param {type} spreadsheet
 * @param {type} options
 * @returns {undefined}
 */
P.oninit = function(spreadsheet, options) {
    let message = License.call(spreadsheet);
    if (message) {
        console.error(message);
    } else {
        spreadsheet.setPlugins({
            comments: advanceComments
        });
    }
}

P.license = function(v) {
    // Jspreadsheet binding
    if (JSS === null) {
        JSS = this;
    }
}

export default P;
