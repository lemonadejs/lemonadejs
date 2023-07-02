/**
 * Official Type definitions for JSS edition bar
 * https://lemonadejs.net
 * Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
 */

interface Datagrid {
    (): any
    [key: string]: any
}

interface options {
    /** The data that will be displayed on the grid based on the columns attribute. */
    data: object[];
    /** Each object represents a column of data to be displayed. The key 'name' refers to the data object key. */
    columns: object[];
    /** Enable the pagination and define the number of items per page. */
    pagination?: number;
    /** Enable the search. Default: false */
    search?: boolean;
    /** The grid is editable. Default: false */
    editable?: boolean;
    /** Called when a search happens. */
    onsearch?: (self) => void
    /** Called when the user changes the page. */
    onchangepage?: (self) => void
    /** Called when cell data is changed. */
    onupdate?: (self, object) => void
}

interface instance {
    /** Array<Object>	Change the state of data. */
    data: object[];
    /**  Number	Change the page index. */
    page: number;
    /**  Number	Enable pagination. */
    pagination: number;
    /** Boolean	Enable search. */
    search: boolean;
    /** Function(sortBy: String, sortAsc: Boolean)	Sort the data. */
    sort: (sortBy: string, sortAsc: boolean) => void;
    /** Function(x: Number | String, y: Number, value: String)	Set the value of a cell. */
    setValue: (x: number | string, y: number, value: string) => void;
}

export declare function Datagrid(mixed: string | options, options?: options): instance;
