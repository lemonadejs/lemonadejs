title: Reactive Shopping Cart Example
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple shopping cart using LemonadeJS and Jsuites templates

Shopping
========

The shopping is a simple online store model created using LemonadeJS. You can add products to your cart and remove them, and see the selected items by clicking on the counter in the upper right corner of the example  
  

A working example
-----------------

  

Source code
-----------

```javascript
var Shopping = (function() {
    var self = {};

    self.quantity = "0";
    self.totalPrice = "$0.00";
    self.cartItems = [];
    self.itemState = [];

    self.cartItems.toString = function(v) {
        var str = '';
        for (var i = 0; i < this.length; i++) {
            str += `
                <div>
                    <div class="row">
                        <div class="column f3 p10">
                            <img class="users-large left mr1" alt="${this[i].Description}" src="${this[i].img}">
                            ${this[i].Title}
                        </div>
                        <div class="column f1 p6 center" style="align-self:center;">$${this[i].Price}</div>
                    </div>
                </div>
            `
        }
        return str;
    }

    var list = null;
    var modal = null;
    
    self.modalElement = null;
    
    self.updateCart = function(o) {
        var itemIndex = o.parentNode.parentNode.parentNode.getAttribute("data-index");
        var item = list.options.data[itemIndex];
        self.itemState[itemIndex].active = ! self.itemState[itemIndex].active;

        if (self.itemState[itemIndex].active) {
            self.quantity = Number(self.quantity) + 1;
            self.cartItems.push(item);
            self.updateTotalPrice(item.Price); 
        } else {
            self.quantity = Number(self.quantity) - 1;
            self.cartItems.splice(self.cartItems.indexOf(item),1);
            self.updateTotalPrice(-item.Price); 
        }
        self.cartItems.refresh();
        self.changeItemState(o,itemIndex);
    }

    self.changeItemState = function(o,index) {
       if(self.itemState[index].active) {
            o.style.background = "#fe4a49";
            o.textContent = "Delete Item"
       }else {
            o.style.background = "";
            o.textContent = "Add to cart";
       }
    }

    self.updateTotalPrice = function(item_price) {
        item_price = Number(item_price);
        self.totalPrice = Number(self.totalPrice.substr(1,self.totalPrice.length));
        self.totalPrice = "$" + (self.totalPrice + item_price).toFixed(2);
    }

    self.createModal = function(o) {
        modal = jSuites.modal(o, {
            closed: true,
            width: "550px",
            height: "600px",
        });
    }

    self.showModal = function() {
        modal.open();
    }

    self.removeCartItem = function(o) {
        list.removeItem(o.parentNode.parentNode);
    }

    self.list = function(o) {
        var index = 0;
        var pagNumber = 0;
        list = jSuites.template(o, {
            url: "/v1/examples/products.json",
            template: {
                item: function(data) {
                    if(pagNumber != list.getPage()) {
                        pagNumber = list.getPage();
                        index = pagNumber * 5;
                    }
                    return lemonade.element(`
                        <div data-index="${index++}">
                            <div class="row">
                                <div class="column f1 p10">
                                    <img class="users-large left mr1" alt="${data.Description}" src="${data.img}">
                                    ${data.Title}
                                </div>
                                <div class="column f1 p6 center">$${data.Price}</div>
                                <div class="column f1 p10">
                                    <button class="jbutton dark" onclick="self.updateCart(this)">Add to cart</button>
                                </div>
                            </div>
                        </div>
                    `,self);
                }
            },
            onupdate: function(o) {
                var items = o.lastChild.children;
                for(var i = 0; i < items.length; i ++) {
                    var itemIndex = items[i].getAttribute('data-index');
                    var itemButton = items[i].children[0].children[2].children[0];
                    self.changeItemState(itemButton,itemIndex);
                }
            },
            search: true,
            pagination: 5,
        }); 
        for(var i = 0; i < 15; i ++) {
            self.itemState.push({ active: false });
        }
    }
   
    var template = `
        <div style="position: relative;">
            <div @ready="self.createModal(this)" @ref="self.modalElement">
                <div style="max-width: 420px;">{{ self.cartItems }}</div>
                <div class="shopping-total-price">TOTAL PRICE: {{ self.totalPrice }}</div>
            </div>
            <div onclick="self.showModal()" class="shopping-counter">{{ self.quantity }}</div>
            <div @ready="self.list(this)"></div>
        </div>`;

    return lemonade.element(template, self);
});

lemonade.render(Shopping, document.getElementById('root'));
```