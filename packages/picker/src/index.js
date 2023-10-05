import lemonade from '../../../dist/lemonade'
import Modal from '../../modal/dist/index';
import Contextmenu from '../../contextmenu/dist/index';
import Picker from '../dist/index';
import '../../contextmenu/dist/style.css'
import '../dist/style.css';
import '../../modal/dist/style.css'

function T(t) {
    return t;
}

const options = [
    {
        title: T('New Spreadsheet'),
        icon: 'add_box',
        submenu: [{
            title: 'Test',
            submenu: [{
                title: 'Aloura'
            }]
        }],
        onclick: function () {
        },
    },
    {
        title: T('Open'),
        icon: 'folder',
        onclick: function (a, b, c) {
            console.log('dfsdfdsfsdfsdf')
        },
    },
    {
        type: 'line'
    },
    {
        title: T('Share'),
        icon: 'share',
        onclick: function () {
        },
    },
    {
        title: T('Download'),
        icon: 'file_download',
        submenu: [
            {
                title: 'Microsoft Excel',
                onclick: function () {
                },
            },
            {
                title: 'CSV',
                onclick: function () {

                },
            },
            {
                title: 'TSV',
                onclick: function () {

                },
            },
        ]
    },
    {
        title: T('Print'),
        icon: 'printer',
        onclick: function () {
            getActive(self).parent.tools.exportPdf(true);
        },
    },
    // {
    //     title: T('Fill templates'),
    //     icon: 'picture_as_pdf',
    //     onclick:function() {
    //         getActive(self).parent.tools.htmlToPdf(true);
    //     },
    // },
    {
        type: 'line'
    },
    {
        title: T('Rename'),
        icon: 'drive_file_rename_outline',
        onclick: function () {
        },
    },
    {
        title: T('Move to trash'),
        icon: 'delete',
        onclick: function () {
        },
    },
    {
        type: 'line'
    },
    {
        title: T('History'),
        icon: 'history',
        onclick: function () {
        },
        restricted: true,
    }
]


function Test() {
    let self = this;

    window.test = self;

    self.options = options

    return `<div style="width: 200px">
            <Picker title="Hey" :options="self.options" />
        </div>`
}

lemonade.render(Test, root);