var cropper = (function(photoContainer) {
    // Square propertion
    var square = photoContainer.getAttribute('data-square') ? 1 : 0;
    var cover = photoContainer.getAttribute('data-cover') ? 1 : 0;
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
            height: '600px',
            title: 'Photo Upload',
            padding: '0'
          });
    }

    self.createCropper = function(o) {
        var area = jSuites.getWindowWidth();
        if (area < 800) {
            var a = [ area, area * 0.66 ];
            var c = [ area, 300 ];
        } else {
            var a = [ 798, 300 ];
            var c = [ 300, 200 ];
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
            // Image should be the size of the container?
            newImage.style.width = '100%';
            // Cover
            newImage.setAttribute('data-cover', cover);
            // Callback for the blob
            var createImage = function(b) {
                newImage.content = newImage.src;
                // Get blob URL
                newImage.src = window.URL.createObjectURL(b);
                // Append image
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
    photoContainer.onmouseup = function(e) {
        if (! modal.isOpen()) {
            // Open modale
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

    // Quick reference
    photoContainer.self = self;

    // Template
    var template = `
        <div @ref='self.image'></div>
        <div @ready='self.createModal(this)'>
            <div @ready='self.createCropper(this)' @ref='self.cropperArea'></div>
            <div @ref='self.controls'>
                <div role='tabs'>
                    <div role='headers'>
                        <div class='p10' style="background-color: white;"></div>
                        <div class='p10' style="background-color: white;"></div>
                    </div>
                    <div role='content' style='background-color: #ccc;'>
                        <div>
                            <label style="text-align: center; display: inline-block;"> Zoom <input type='range' step='.05' min='0.1' max='5.45' value='1' oninput='self.updateZoom(this)' style="display: block;" class='jslider controls' disabled='disabled'></label>
                            <label style="text-align: center; display: inline-block; margin-left: 20px;"> Rotate <input type='range' step='.05' min='-1' max='1' value='0' oninput='self.updateRotate(this)' style="display: block;" class='jslider controls' disabled='disabled'></label>
                        </div>
                        <div>
                            <label style="text-align: center; display: inline-block;"> Brigthness <input type='range' min='-1' max='1' step='.05' value='0' @bind='self.brightness' oninput='self.setBrightness(this)' style="display: block;" class='jslider controls' disabled='disabled'></label>
                            <label style="text-align: center; display: inline-block; margin-left: 20px;"> Contrast <input type='range' min='-1' max='1' step='.05' value='0' @bind='self.contrast' oninput='self.setContrast(this)' style="display: block;" class='jslider controls' disabled='disabled'></label>
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

    // Create lemonade component
    lemonade.blender(template, self, photoContainer); 
});
