import lemonade from '../../../dist/lemonade'
import Modal from '../../modal/dist/index';
import '../dist/style.css';
import '../../modal/dist/style.css'

function T(t) {
    return t;
}

/**
 * Default toolbar items
 */
component.getDefault = function() {
    let items = [];


    items.push({
        content: 'undo',
        onclick: function() {
        }
    });

    items.push({
        content: 'redo',
        onclick: function() {
        }
    });

    items.push({
        content: 'save',
        onclick: function () {
        }
    });

    items.push({
        type:'divisor',
    });

    items.push({
        type:'select',
        width: '120px',
        options: [ 'Default', 'Verdana', 'Arial', 'Courier New' ],
        render: function(e) {
            return '<span style="font-family:' + e + '">' + e + '</span>';
        },
        onchange: function(a,b,c,d,e) {
        },
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        type: 'select',
        width: '48px',
        content: 'format_size',
        options: ['x-small','small','medium','large','x-large'],
        render: function(e) {
            return '<span style="font-size:' + e + '">' + e + '</span>';
        },
        onchange: function(a,b,c,d) {
        },
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        type: 'select',
        options: ['left','center','right','justify'],
        render: function(e) {
            return '<i class="material-icons">format_align_' + e + '</i>';
        },
        onchange: function(a,b,c,d) {
        },
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        content: 'format_bold',
        onclick: function(a,b,c) {
        },
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        type: 'color',
        content: 'format_color_text',
        k: 'color',
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        type: 'color',
        content: 'format_color_fill',
        k: 'background-color',
        updateState: function(a,b,c,d) {
        }
    });

    let verticalAlign = [ 'top','middle','bottom' ];

    items.push({
        type: 'select',
        options: [ 'vertical_align_top','vertical_align_center','vertical_align_bottom' ],
        render: function(e) {
            return '<i class="material-icons">' + e + '</i>';
        },
        value:  1,
        onchange: function(a,b,c,d,e) {
        },
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        content: 'web',
        onclick: function() {
        },
        tooltip: T('Merge the selected cells'),
        updateState: function(a,b,c,d) {
        }
    });

    items.push({
        type: 'select',
        data: [ 'border_all', 'border_outer', 'border_inner', 'border_horizontal', 'border_vertical', 'border_left', 'border_top', 'border_right', 'border_bottom', 'border_clear' ],
        columns: 5,
        render: function(e) {
            return '<i class="material-icons">' + e + '</i>';
        },
        right: true,
        onchange: function(a,b,c,d) {
        },
        onload: function(a, b) {
        },
        updateState: function(a,b,c,d) {
        }
    });


    items.push({
        type:'divisor',
    });

    items.push({
        content: 'add_photo_alternate',
        onclick: function(a,b,c) {
            if (J.current) {
                c.children[1].style.display = 'block';
            }
        },
        tooltip: 'Add image',
        render: function(a) {
        }
    });

    items.push({
        content: 'fullscreen',
        onclick: function(a,b,c) {
            let w = getActive();
            if (c.children[0].textContent === 'fullscreen') {
                w.fullscreen(true);
                c.children[0].textContent = 'fullscreen_exit';
            } else {
                w.fullscreen(false);
                c.children[0].textContent = 'fullscreen';
            }
        },
        tooltip: 'Toggle Fullscreen',
        updateState: function(a,b,c,d) {
            if (d.parent.config.fullscreen === true) {
                c.children[0].textContent = 'fullscreen_exit';
            } else {
                c.children[0].textContent = 'fullscreen';
            }
        }
    });

    items.push({
        content: 'search',
        onclick: function(a,b,c) {
            let w = getActive();
            if (typeof(spreadsheet.tools.search) !== 'undefined') {
                spreadsheet.tools.search.open(true);
            } else {
                if (c.children[0].textContent === 'search') {
                    Search.show.call(w);
                    c.children[0].textContent = 'search_off';
                } else {
                    Search.hide.call(w);
                    c.children[0].textContent = 'search';
                }
            }
        },
        tooltip: 'Toggle Search',
        updateState: function(a,b,c,d) {
            if (d.options.search === true) {
                c.children[0].textContent = 'search_off';
            } else {
                c.children[0].textContent = 'search';
            }
        }
    });

    return items;
}


function Test() {
    let self = this;

    self.options = options;

    return `<Topmenu :options="self.options" />`
}

lemonade.render(Test, root);