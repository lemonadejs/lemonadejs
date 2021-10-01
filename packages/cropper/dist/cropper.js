/**
 * (c) LemonadeJS components
 *
 * Website: https://lemonadejs.net
 * Description: Image cropper v1.2.1
 *
 * MIT License
 *
 */

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.cropper = factory();
}(this, (function () {

    'use strict';

    if (typeof(require) === 'function') {
        // Load jSuites
        if (typeof(jSuites) == 'undefined') {
            var jSuites = require('jsuites');
        }
        // Set the app extensions
        if (typeof(jSuites.crop) == 'undefined') {
            // Loading App Extensions
            jSuites.crop = require('@jsuites/cropper');
        }
    }

    return (function(photoContainer) {
        var original = photoContainer.getAttribute('data-original') ? 1 : 0;
        var width = photoContainer.getAttribute('width') || 300;
        var height = photoContainer.getAttribute('height') || 240;
        var modal = null;
        var crop = null;

        var self = {};
        self.cropperArea = null;
        self.brightness = 0;
        self.contrast = 0;
        self.greyscale = 0;

        // Methods
        self.createModal = function(o) {
            modal = jSuites.modal(o, {
                closed: true,
                width: '800px',
                height: '680px',
                title: 'Photo Upload',
                padding: '0'
            });
        }

        self.createCropper = function(o) {
            var area = jSuites.getWindowWidth();
            if (area < 800) {
                var a = [ area, area ];
                var c = [ area, area ];
            } else {
                var a = [798, 360];
                var c = [width, height];
            }
            crop = jSuites.crop(o, {
                area: a,
                crop: c ,
                allowResize: false,
                onchange: function(el, image) {
                    if (image) {
                        self.setControls(true);
                    }
                }
            });
        }

        self.updateZoom = function(o) {
            crop.zoom(o.value);
        }

        self.updateRotate = function(o) {
            crop.rotate(o.value);
        }

        self.setBrightness = function(o) {
            crop.brightness(o.value);
        }

        self.setContrast = function(o) {
            crop.contrast(o.value);
        }

        self.setGreyscale = function(o) {
            crop.greyScale(o.value);
        }

        self.updatePhoto = function() {
            // Checks if cropper container is editable
            if (self.cropperArea.classList.contains('jcrop_edition')) {
                self.image.innerHTML = '';
                // Create image with metadata
                var newImage = crop.getCroppedImage();
                // Callback for the blob
                var createImage = function(b) {
                    // Transform to blob
                    var filename = window.URL.createObjectURL(b);
                    // Set upload information
                    var data = {
                        file: filename,
                        content: newImage.src,
                        extension: newImage.content.extension,
                    };
                    // Upload original image
                    if (original == true) {
                        data.original = crop.getImage().src;
                    }
                    // Update file to blob
                    newImage.src = filename;
                    // Integration with jSuites.form
                    if (photoContainer.getAttribute('name')) {
                        photoContainer.content = [data];

                        newImage.classList.remove('jfile');
                    } else {
                        // Legacy
                        newImage.content = data;
                    }
                    self.image.appendChild(newImage);
                }
                // Create image
                crop.getCroppedAsBlob(createImage);
                // Close the modal
                modal.close();
            }
        }

        self.uploadPhoto = function() {
            jSuites.click(crop.getFileInput());
        }

        self.deletePhoto = function() {
            if (self.image) {
                // Reset photo from crop
                crop.reset();
                // Closes modal
                modal.close();
                // Disable controls
                self.setControls(false);
                // Reset from container
                self.image.innerHTML = '';
                // Reset container
                photoContainer.content = null;
            }
        }

        self.setControls = function(state) {
            var controls = photoContainer.querySelectorAll('input.controls');
            if (state == false) {
                for (var i = 0; i < controls.length; i++) {
                    controls[i].setAttribute('disabled', 'disabled');
                }
            } else {
                for (var i = 0; i < controls.length; i++) {
                    controls[i].removeAttribute('disabled');
                }
            }
        }

        self.getValue = function() {
            return photoContainer.content;
        }

        self.setValue = function(data) {
            if (! data) {
                // Reset container
                self.deletePhoto();
            } else {
                if (typeof(data) == 'string') {
                    data = {
                        file: data
                    }
                }
                if (data.file) {
                    var img = document.createElement('img');
                    img.setAttribute('src', data.file);
                    img.setAttribute('tabindex', -1);
                    self.image.innerHTML = '';
                    self.image.appendChild(img);
                }

                if (data.original) {
                    crop.addFromFile(data.original);
                }

                photoContainer.content = [data];
            }
        }

        // Template
        var template = `
            <div @ref='self.image'></div>
            <div @ready='self.createModal(this)'>
                <div @ready='self.createCropper(this)' @ref='self.cropperArea'></div>
                <div @ref='self.controls'>
                    <div role='tabs'>
                        <div role='headers'>
                            <div style="background-color: white; padding: 15px !important;"></div>
                            <div style="background-color: white;"></div>
                        </div>
                        <div role='content' style='background-color: #ccc;'>
                            <div>
                                <div class="center row">
                                    <label class="f1 p6" style="padding-top:0px"> Zoom <input type='range' step='.05' min='0.1' max='5.45' value='1' oninput='self.updateZoom(this)' style="margin-top:10px;" class='jrange controls' disabled='disabled'></label>
                                    <label class="f1 p6" style="padding-top:0px"> Rotate <input type='range' step='.05' min='-1' max='1' value='0' oninput='self.updateRotate(this)' style="margin-top:10px;" class='jrange controls' disabled='disabled'></label>
                                </div>
                            </div>
                            <div>
                                <div class="center row">
                                    <label class="f1 p6" style="padding-top:0px"> Brigthness <input type='range' min='-1' max='1' step='.05' value='0' @bind='self.brightness' oninput='self.setBrightness(this)' style="margin-top:10px;" class='jrange controls' disabled='disabled'></label>
                                    <label class="f1 p6" style="padding-top:0px"> Contrast <input type='range' min='-1' max='1' step='.05' value='0' @bind='self.contrast' oninput='self.setContrast(this)' style="margin-top:10px;" class='jrange controls' disabled='disabled'></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class='row p20 form-group' style='border-top: 1px solid #aaa'>
                        <div class='column p6 f1'>
                            <input type='button' value='Save Photo' class='jbutton dark controls w100' style='min-width: 140px;' onclick='self.updatePhoto()' disabled='disabled'>
                        </div><div class='column p6'>
                            <input type='button' value='Upload Photo' class='jbutton dark w100' style='min-width: 140px;' onclick='self.uploadPhoto()'>
                        </div><div class='column p6' style='text-align:right'>
                            <input type='button' value='Delete Photo' class='jbutton dark controls w100' style='min-width: 140px;' onclick='self.deletePhoto()' disabled='disabled'>
                        </div>
                    </div>
                </div>
            </div>`;

        // Controls
        var createControls = function(o) {
            var tabs = jSuites.tabs(o.children[0], {
                data: [{
                    title: 'Crop',
                    icon: 'crop',
                    width: '100px',
                },
                    {
                        title:'Adjusts',
                        icon: 'image',
                        width: '100px',
                    }],
                padding:'20px',
                animation: true,
                position: 'bottom',
            });

            tabs.content.style.backgroundColor = '#eee';
        }

        // Onclick event
        photoContainer.classList.add('jupload');
        photoContainer.onmousedown = function(e) {
            if (! modal.isOpen()) {
                // Open modal
                modal.open();
                // Create controls for the first time only
                if (! photoContainer.classList.contains('controls')) {
                    // Create controls
                    createControls(self.controls);
                    // Flag controls are ready
                    photoContainer.classList.add('controls');
                }
            }
        }

        // Remove current image
        photoContainer.onkeydown = function(e) {
            if (e.key == 'Delete' && e.target.tagName == 'IMG') {
                self.deletePhoto();
            }
        }

        // Quick reference
        photoContainer.self = self;

        // Create lemonade component
        lemonade.blender(template, self, photoContainer);

        photoContainer.val = function(v) {
            if (v === undefined) {
                return self.getValue();
            } else {
                self.setValue(v);
            }
        }

        return self;
    });
})));