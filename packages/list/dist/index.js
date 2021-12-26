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
        var self = this;

        // The current result
        var result = self.result = self.data;

        // Monitor the search
        self.onchange = function(prop) {
            if (prop === 'data' || prop == 'input') {
                search(self.input)
            } else if (prop == 'page') {
                // Change the page sending the element where the property page is associated
                page();
            }
        }

        // Apply the paginatino after initialization
        self.onload = function() {
            if (self.pagination > 0) {
                self.page = 0;
            }
        }

        var find = function(o, query) {
            for (var key in o) {
                var value = o[key];
                if ((''+value).toLowerCase().search(query) >= 0) {
                    return true;
                }
            }
            return false;
        }

        var search = function(str) {
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
        var page = function() {
            // Pagination
            var p = parseInt(self.pagination);
            // Define the range for this pagination configuration
            if (p && result.length > p) {
                var s = (p * self.page);
                var f = (p * self.page) + p;

                if (result.length < f) {
                    var f = result.length;
                }
            } else {
                var s = 0;
                var f = result.length;
            }

            // Change the page
            p = [];
            for (var i = s; i < f; i++) {
                p.push(result[i]);
            }

            // Set the new results for the view
            self.result = p;

            // Update pagination
            pagination();
        }

        var pagination = function() {
            var pages = [];
            // Update pagination
            if (self.pagination > 0) {
                // Get the number of the pages based on the data
                var n = Math.ceil(result.length / self.pagination);
                if (n > 1) {
                    // Controllers
                    if (self.page < 6) {
                        var s = 0;
                        var f = n < 10 ? n : 10;
                    } else if (n - self.page < 5) {
                        var s = n - 9;
                        var f = n;
                        if (s < 0) {
                            s = 0;
                        }
                    } else {
                        var s = parseInt(self.page) - 4;
                        var f = parseInt(self.page) + 5;
                    }

                    // First page
                    if (s > 0) {
                        pages.push({
                            title: 0,
                            value: 'Â«'
                        });
                    }

                    // Link to each page
                    for (var i = s; i < f; i++) {
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
                            value: 'Â»'
                        });
                    }

                    self.pages = pages;
                }
            }
        }

        var Item = function() {
            return lemonade.element(html, this);
        }

        var Pagination = function() {
            // Pagination
            var self = this;
            var template = `<li onclick="self.parent.page = this.title;" title="{{self.title}}" selected="{{self.selected}}">{{self.value}}</li>`;
            return lemonade.element(template, self);
        }

        var template = `
            <>
                <div class="list-header" data="{{self.data}}">
                    <input type='text' @bind="self.input" search="{{self.search}}"/>
                    <ul page="{{self.page}}">
                        <Pagination @loop="self.pages"/>
                    </ul>
                </div>
                <div class="list-content">
                    <Item @loop="self.result"/>
                </div>
            </>`;

        return lemonade.element(template, self, { Item, Pagination });
    }

})));