#! /usr/bin/env node

require('jsdom-global')(undefined, { url: 'https://localhost' })
const lemonade = require('./dist/lemonade.js')
const { expect } = require('chai')

global.lemonade = lemonade
global.root = document.createElement('div')
global.render = function(Component) {
    let self = {};
    // Render LemonadeJS component
    lemonade.render(Component, root, self);

    return {
        assert: function(result, validation) {
            expect(validation.call(self)).to.equal(result);
        }
    }
}

document.body.appendChild(global.root)

exports.mochaHooks = {
    afterEach(done) {
        // Reset the component
        global.root.textContent = '';

        done()
    }
}
