;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.lazyLoading = factory();
}(this, (function () {

    'use strict';

    return function (el, options) {
        let obj = {
            options: options
        };
        let itemDefaultHeight = 0;

        const appendChildren = function (start) {
            // Remove all items
            while (itemsWrapper.firstChild) {
                itemsWrapper.firstChild.remove();
            }
            // Append new items
            if (obj.options.items && obj.options.items.length) {
                itemDefaultHeight = 0;
                let items = obj.options.items;
                let numOfItems = items.length;
                let height = 0;
                let t = document.createElement('div');

                for (let i = start; i < numOfItems; i++) {
                    if (items[i].visible !== false) {
                        // Create the item element
                        if (!items[i].el) {
                            let e = obj.options.render(items[i]);
                            if (isDOM(e)) {
                                items[i].el = e;
                            } else {
                                t.innerHTML = e;
                                items[i].el = t.firstChild;
                                t.innerHTML = '';
                            }
                        }
                        // Append child
                        itemsWrapper.appendChild(items[i].el);

                        // Total height
                        let h = items[i].el.offsetHeight
                        height += h;

                        if (!itemDefaultHeight) {
                            itemDefaultHeight = h
                        }

                        // Do not add more elements
                        if (height >= obj.options.height) {
                            break;
                        }
                    }
                }
            }
        }

        obj.refresh = function () {
            // Append first batch
            appendChildren(0);

            // Default height for
            if (obj.options.items && obj.options.items.length) {
                scrollSize.style.height = itemDefaultHeight * obj.options.items.length;
            }

            if (typeof (obj.options.onupdate) === 'function') {
                obj.options.onupdate.call(obj, el);
            }
        }

        obj.setData = function (items) {
            if (items) {
                obj.options.items = items;
            }

            obj.refresh();
        }

        let scrollSize = document.createElement("div");
        scrollSize.classList.add('lm-lazy-scroll')
        el.appendChild(scrollSize);

        let itemsWrapper = document.createElement("div");
        itemsWrapper.classList.add('lm-lazy-items')
        el.appendChild(itemsWrapper);

        // Config element
        if (obj.options.height) {
            itemsWrapper.style.height = obj.options.height + 'px';
        }
        el.classList.add('lm-lazy');

        // setup
        obj.refresh();

        // Controls
        const scrollControls = function (e) {
            appendChildren(Math.floor(el.scrollTop / itemDefaultHeight));
        }

        // Onscroll
        el.onscroll = function (e) {
            scrollControls(e);
        }

        el.onwheel = function (e) {
            scrollControls(e);
        }

        return obj;
    }

}}});