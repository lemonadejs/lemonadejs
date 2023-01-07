;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.List = factory();
}(this, (function () {

    // Load lemonadejs
    if (typeof(lemonade) == 'undefined') {
        if (typeof(require) === 'function') {
            var lemonade = require('lemonadejs');
        } else if (window.lemonade) {
            var lemonade = window.lemonade;
        }
    }

    return function(html) {
        // Lemonade element
        let self = this;
        // The current result
        let result = self.result = self.data;

        // Monitor the search
        self.onchange = function(prop) {
            if (prop === 'data' || prop === 'input') {
                search(self.input);

                if (typeof(self.onsearch) == 'function') {
                    self.onsearch(self);
                }
            } else if (prop === 'page') {
                // Change the page sending the element where the property page is associated
                page();

                if (typeof(self.onchangepage) == 'function') {
                    self.onchangepage(self);
                }
            }
        }

        // Apply the pagination after initialization
        self.onload = function() {
            if (self.pagination > 0) {
                self.page = 0;
            }
        }

        const find = function(o, query) {
            for (let key in o) {
                let value = o[key];
                if ((''+value).toLowerCase().search(query) >= 0) {
                    return true;
                }
            }
            return false;
        }

        const search = function(str) {
            // Filter the data
            result = self.result = self.data.filter(function(item) {
                return find(item, str);
            });
            // Go back to page zero
            self.page = 0;
        }

        /**
         * Change the page when pagination is defined
         */
        const page = function() {
            // Pagination
            let p = parseInt(self.pagination);
            let s;
            let f;
            // Define the range for this pagination configuration
            if (p && result.length > p) {
                s = (p * self.page);
                f = (p * self.page) + p;

                if (result.length < f) {
                    f = result.length;
                }
            } else {
                s = 0;
                f = result.length;
            }

            // Change the page
            p = [];
            for (let i = s; i < f; i++) {
                p.push(result[i]);
            }

            // Set the new results for the view
            self.result = p;

            // Update pagination
            pagination();
        }

        const pagination = function() {
            let pages = [];
            // Update pagination
            if (self.pagination > 0) {
                // Get the number of the pages based on the data
                let n = Math.ceil(result.length / self.pagination);
                if (n > 1) {
                    let s;
                    let f;
                    // Controllers
                    if (self.page < 6) {
                        s = 0;
                        f = n < 10 ? n : 10;
                    } else if (n - self.page < 5) {
                        s = n - 9;
                        f = n;
                        if (s < 0) {
                            s = 0;
                        }
                    } else {
                        s = parseInt(self.page) - 4;
                        f = parseInt(self.page) + 5;
                    }

                    // First page
                    if (s > 0) {
                        pages.push({
                            title: 0,
                            value: '«'
                        });
                    }

                    // Link to each page
                    let i;
                    for (i = s; i < f; i++) {
                        pages.push({
                            title: i,
                            value: i+1,
                            selected: self.page == i,
                        });
                    }

                    // Last page
                    if (f < n) {
                        pages.push({
                            title: f + i,
                            value: '»'
                        });
                    }
                }
            }

            self.pages = pages;
        }

        const Item = function() {
            return lemonade.element(html, this);
        }

        const Pagination = function() {
            // Pagination
            let template = `<li onclick="self.parent.page = this.title;" title="{{self.title}}" selected="{{self.selected}}">{{self.value}}</li>`;
            return lemonade.element(template, this);
        }

        let template = `<>
            <div class="list-header" data="{{self.data}}">
                <input type='text' @bind="self.input" search="{{self.search}}"/>
                <ul page="{{self.page}}"><Pagination @loop="self.pages"/></ul>
            </div>
            <div class="list-content" @ref="self.container" data-message="{{self.message}}"><Item @loop="self.result"/></div>
        </>`;


        return lemonade.element(template, self, { Item, Pagination });
    }

})));