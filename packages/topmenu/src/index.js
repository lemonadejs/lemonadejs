import lemonade from '../../../dist/lemonade'
import Contextmenu from './contextmenu.js';
import './style.css';
import '../../modal/dist/style.css'

function T(t) {
    return t;
}

const options = [
    {
        title: T('File'),
        submenu: [
            {
                title: T('New Spreadsheet'),
                icon: 'add_box',
                submenu: [{
                    title: 'Test',
                    submenu: [{
                        title: 'Aloura'
                    }]
                }],
                onclick: function() {
                },
            },
            {
                title: T('Open'),
                icon: 'folder',
                onclick:function() {
                },
            },
            {
                type: 'line'
            },
            {
                title: T('Share'),
                icon: 'share',
                onclick:function() {
                },
            },
            {
                title: T('Download'),
                icon: 'file_download',
                submenu: [
                    {
                        title:'Microsoft Excel',
                        onclick:function() {
                        },
                    },
                    {
                        title:'CSV',
                        onclick:function() {

                        },
                    },
                    {
                        title:'TSV',
                        onclick:function() {

                        },
                    },
                ]
            },
            {
                title: T('Print'),
                icon: 'printer',
                onclick:function() {
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
                onclick:function() {
                },
            },
            {
                title: T('Move to trash'),
                icon: 'delete',
                onclick:function() {
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
    },
    {
        title: T('Edit'),
        submenu: [
            {
                title: T('Undo'),
                icon: 'undo',
                onclick:function() {
                },
                shortcut: 'Ctrl+Z',
            },
            {
                title: T('Redo'),
                icon: 'redo',
                onclick:function() {
                },
                shortcut: 'Ctrl+Y',
            },
            {
                type:'line'
            },
            {
                title:  T('Cut'),
                icon: 'content_cut',
                onclick:function() {
                },
                shortcut: 'Ctrl+X',
            },
            {
                title: ('Copy'),
                icon: 'content_copy',
                onclick:function() {
                },
                shortcut: 'Ctrl+C',
            },
            {
                title: ('Paste'),
                icon: 'content_paste',
                onclick:function() {
                },
                shortcut: 'Ctrl+V',
            },
            {
                type: 'line'
            },
            {
                title: T('Delete'),
                icon: 'delete',
                submenu: [
                    {
                        title: T('Selected cells'),
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Selected rows'),
                        onclick:function() {
                        },
                    },
                    {
                        title: T('Selected columns'),
                        onclick:function() {
                        },
                    },
                ]
            },
            {
                title: T('Find and replace'),
                icon: 'find_replace',
                onclick:function() {
                },
                shortcut: 'Ctrl+F',
            },
        ]
    },
    {
        title: T('Insert'),
        submenu: [
            {
                title: T('Rows'),
                icon: 'table_rows',
                submenu: [
                    {
                        title: T('Add a new line before'),
                        onclick:function() {
                        },
                    },
                    {
                        title: ('Add a new line after'),
                        onclick:function() {
                        },
                    }
                ],
            },
            {
                title: T('Columns'),
                icon: 'view_column',
                submenu: [
                    {
                        title: T('Add a new column before'),
                        onclick:function() {
                        },
                    },
                    {
                        title: T('Add a new column after'),
                        onclick:function() {
                        },
                    }
                ],
            },
            {
                title: T('Create a new worksheet'),
                icon: 'table_columns',
                onclick:function() {
                },
            },
            {
                type: 'line'
            },
            {
                title: T('Add chart'),
                icon: 'insert_chart_outlined',
                onclick: function() {
                },
            },
            {
                type: 'line'
            },
            {
                title: 'Link',
                icon: 'link',
                onclick: function() {
                }
            },
            {
                title: T('Checkbox'),
                icon: 'check_box',
                onclick: function() {
                }
            },
            {
                title: T('Comments'),
                icon: 'insert_comment',
                onclick: function() {
                }
            }
        ]
    },
    {
        title: T('Format'),
        submenu: [
            {
                title: T('Format'),
                icon: '123',
                submenu: [
                    {
                        title: T('Text'),
                        onclick: function() {
                        },
                    },
                    {
                        title: T('Number'),
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Percentage'),
                        shortcut: '10.00%',
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Currency'),
                        shortcut: '$ 10.00',
                        onclick: function() {
                        }
                    },
                    {
                        type: 'line'
                    },
                    {
                        title: T('Date'),
                        shortcut: '25/07/1998',
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Hour'),
                        shortcut: '12:59:59',
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Date and hour'),
                        shortcut: '25/07/1998 12:59:59',
                        onclick: function() {
                        }
                    },
                    {
                        type: 'line'
                    },
                    {
                        title: T('Custom'),
                        onclick: function() {
                        }
                    },
                ]
            },
            {
                title: T('Text'),
                icon: 'format_bold',
                submenu: [
                    {
                        title: T('Bold'),
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Italic'),
                        onclick: function() {

                        }
                    },
                    {
                        title: T('Underline'),
                        onclick: function() {

                        }
                    },
                    {
                        title: T('Line through'),
                        onclick: function() {

                        }
                    }
                ]
            },
            {
                title: T('Rotate'),
                submenu: [
                    {
                        title: '+90deg',
                        icon: 'text_rotate_up',
                        onclick: function() {

                        }
                    },
                    {
                        title: '+45deg',
                        icon: 'text_rotation_angleup',
                        onclick: function() {

                        }
                    },
                    {
                        title: '0deg',
                        icon: 'text_rotation_none',
                        onclick: function() {

                        }
                    },
                    {
                        title: '-45deg',
                        icon: 'text_rotation_angledown',
                        onclick: function() {

                        }
                    },
                    {
                        title: '-90deg',
                        icon: 'text_rotation_down',
                        onclick: function() {

                        }
                    },
                ]
            },
            {
                type: 'line'
            },
            {
                title: T('Font size'),
                icon: 'format_size',
                submenu: [
                    {
                        title: '6',
                        onclick: function() {

                        }
                    },
                    {
                        title: '7',
                        onclick: function() {

                        }
                    },
                    {
                        title: '8',
                        onclick: function() {

                        }
                    },
                    {
                        title: '9',
                        onclick: function() {
                        }
                    },
                    {
                        title: '10',
                        onclick: function() {

                        },
                    },
                    {
                        title: '11',
                        onclick: function() {

                        }
                    },
                    {
                        title: '12',
                        onclick: function() {

                        }
                    },
                    {
                        title: '14',
                        onclick: function() {

                        }
                    },
                    {
                        title: '16',
                        onclick: function() {

                        },
                    },
                    {
                        title: '18',
                        onclick: function() {

                        }
                    },
                    {
                        title: '24',
                        onclick: function() {

                        }
                    },
                    {
                        title: '36',
                        onclick: function() {

                        }
                    },
                ]
            },
            {
                type: 'line'
            },
            {
                title: T('Alternate colors'),
                icon: 'opacity',
                submenu: [
                    {
                        title: T('Add'),
                        onclick: function() {
                        }
                    },
                    {
                        title: T('Remove'),
                        onclick: function() {
                        }
                    }
                ],
            },
            {
                title: T('Remove all format'),
                icon: 'format_clear',
                onclick:function() {
                },
                shortcut: 'Ctrl+\\'
            },
        ]
    },
    {
        title: T('Data'),
        submenu: [
            {
                title: 'Sorting',
                submenu: [
                    {
                        title: T('Sorting column from A to Z'),
                        onclick:function() {

                        },
                    },
                    {
                        title: T('Sorting column from Z to A'),
                        onclick:function() {

                        },
                    },
                ],
            },
            {
                title: T('Toggle filters'),
                icon: 'filter_alt',
                onclick: function(a,b,c) {

                }
            },
            {
                title: T('Data validations'),
                icon: 'grading',
                onclick: function() {

                }
            }
        ]
    },
    {
        title: T('Tools'),
        submenu: [
            {
                title: T('Create forms'),
                icon: 'post_add',
                onclick:function() {

                },
            },
        ]
    },
    {
        title: T('Help'),
        submenu: [
            {
                title: T('Help'),
                icon: 'help_outline',
                onclick:function() {
                },
            },
            {
                type: 'line'
            },
            {
                title: T('Privacy Police'),
                icon: 'article',
                onclick:function() {
                },
            },
            {
                title: T('Terms and conditions'),
                icon: 'article',
                onclick:function() {
                },
            },
            {
                type: 'line'
            },
            {
                title: T('Function list'),
                icon: 'functions',
                onclick: function() {
                }
            }
        ]
    }
];

function Test() {
    let self = this;

    self.options = options[0].submenu;

    console.log(self.options)

    return `<Contextmenu :options="self.options" />`
}

lemonade.render(Test, root);