title: Simple BMI Calculation Form with LemonadeJS
keywords: LemonadeJS, two-way data binding, frontend, javascript library, javascript plugin, javascript, github, contributions, open-source
description: A simple example using LemonadeJS to create a calculation from a user input.

BMI Calculation
===============

The body mass index, known as BMI, is a technique used to check the nutritional status and observe if the person is within the normal range with regard to their weight and height. In this tutorial we will explan how to create a basic JavaScript version of the IBM Calculator using about 50 lines of code.  
  

A working example
-----------------

[See this example on jsfiddle.net](https://jsfiddle.net/joaovmvini/njugzarx/6/)

  

Soure Code
----------

```html
<html>
<link rel="stylesheet" href="https://jsuites.net/jsuites.layout.css" type="text/css" />
<script src="https://lemonadejs.net/v1/lemonade.js"></script>
<div id='root'></div>
<script>
var bmi = (function(container) {
  var self = {};

  self.nameElement = null;
  self.heightElement = null;
  self.weightElement = null; 
  self.resultElement = null;
  
  self.calculate = function() {
    var name = self.nameElement.value;
    var height = self.heightElement.value;
    var weight = self.weightElement.value;
    if (name && Number(height) && Number(weight)) {
      var bmi = (weight / Math.pow(height,2)).toFixed(2);
      var text = `${name}, your BMI is ${bmi} and `;
      if (bmi < 18.5) {
        self.result = text + "you are very underweight.";
      } else if(bmi <= 24.5) {
        self.result = text + "you are at an ideal weight.";
      } else if(bmi <= 29.9) {
        self.result = text + "you are overweight.";
      } else if(bmi <= 39.9) {
        self.result = text + "you are at an obesity level.";
      } else if(bmi >= 39.9) {
        self.result = text + "you have morbid obesity.";
      }
      alert(self.result)
    } else {
      alert("Invalid input values");
    }
  }

  var template = `
  <div class="column" style="color: #051e3e; font-weight: 600; background: #e6e6ea; border-radius: 8px; box-shadow: 0px 1px 5px 1px rgba(0,0,0,0.65);">
    <span class="row center" style="display: block; font-size: 1.8em; border-bottom: 2px solid #051e3e;">Calculator - BMI</span>
    <div class="row p15">
      <div class="form-group">
            <label for="name">Name:</label>
            <input @ref="self.nameElement" type="text" id="name" class="bmi-input"/>
      </div>
      <div class="form-group">
          <label for="height">Height:</label>
          <input  @ref="self.heightElement" type="text" id="height" class="bmi-input"/>
      </div>
      <div class="form-group">
        <label for="weight">Weight:</label>
        <input  @ref="self.weightElement" type="number" min="0" id="weight" class="bmi-input"/>			
      </div>
    </div>
    <div class="row p10" style="justify-content: center;">
      <button class="jbutton dark" onclick="self.calculate()" style="align-self: center;">Calculate</button>
    </div>
  </div>
  `
  return lemonade.element(template, self);
});
lemonade.render(bmi, document.getElementById('root'));
</script>
```