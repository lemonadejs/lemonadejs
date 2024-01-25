title: LemonadeJS v1 Native Methods
keywords: LemonadeJS, two-way binding, frontend, javascript library, javascript plugin, javascript, methods
description: The LemonadeJS methods to create amazing javascript components.

LemonadeJS Methods
==================

The following table lists the native LemonadeJS methods.  

| Method                              | Description                                                                                                                        |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| template(string, object)            | It will create the DOM elements based on a HTML template and bind the scope with the self object and return a DOM Element container. |`lemonade.template(template, self) => DOMElement`
| render(DOMElement, DOMElement)      | It will append the new created lemonadejs DOMElement to a DOMElement in the exising DOM.                                           |`lemonade.render(lemonadeElement, rootElement) => void`
| blender(string, object, DOMElement) | The blender executes both methods above.  `lemonade.blender(template, self, rootElement) => void`                                  |
| apply(DOMElement, self)             | Bind the self scope to an existing DOMElement already in the DOM.  `lemonade.apply(rootElement, self) => void`                     |

