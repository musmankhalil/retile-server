var param = document.URL.split('/')[3];
console.log(param);

var client = new ClientJS();
var fingerprint = client.getFingerprint();

var counter = 1;
var logoffTimer;
var usedisplay = null;
var productData = {};
var storeid = null;
var alertTimer = '';
var _scannerIsRunning = false;
var gridposition = null;

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

$(document).ready(function () {
    $.get('/getToken', function (data) {
        var JWTtoken = data ? data : "";

        var socketOptions = {
            'query': {
                'type': 'remote',
                'uid': fingerprint,
                'token': JWTtoken
            }
        }


        var socket = io(socketOptions);
        socket.on('connect', () => {
            socket.emit('getStoreId', '');
        });

        socket.on('error', () => {
            console.log('error');
        });

        socket.on('setStoreId', function (id) {
            storeid = id;
            usedisplay = socket.query.usedisplay;
        });

        socket.on('setUseDisplay', function (displayid) {
            if ('' === usedisplay) {
                usedisplay = usedisplay;
            }
        });

        /// <summary>
        /// Socket hook to receive the product data and assemble the remote interface.
        /// </summary>
        socket.on('setProductData', function (data) {
            $('#ui-remote').html(' ');

            if (null === data) {
                $('#alert').addClass('uk-alert-danger');
                $('#alert p').html('Product Not Found. Try again.');
                $('#alert').slideDown();
                alertTimer = setTimeout(function () { $('#alert').slideUp(); }, 3000);
                socket.emit('log', { 'type': `{"loading error":"Product Not Found. Try again."}`, 'gridposition': `${window.gridposition}`, 'sku': '', 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'error' });
                window.gridposition = null;
            } else {
                productData = JSON.parse(data);
                var buynow = productData.properties.find(el => el.command == 'buy-now');
                //console.log('Buy Now', buynow.value);

                $.each(productData.widgets, function (index, value) {
                    console.log(value);
                    // REPLACE INDEX > 0 TO SHOW IN REMOTE VARIABLE WHEN AVAILABLE
                    if (value.visible && index > 0) {
                        var show_on_remote = true;
                        if ("colorpicker" === value.type) {
                            show_on_remote = false;
                            if (value.value.hasOwnProperty('color1') && 'undefined' !== typeof value.value.color1.name) { show_on_remote = true; }
                            if (value.value.hasOwnProperty('color2') && 'undefined' !== typeof value.value.color2.name) { show_on_remote = true; }
                            if (value.value.hasOwnProperty('color3') && 'undefined' !== typeof value.value.color3.name) { show_on_remote = true; }
                        }

                        if (show_on_remote) {
                            $('#ui-remote').append(`<button id='${value.command}' class='uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom uk-button-large retile-action ${(1 === index) ? 'active uk-box-shadow-small' : ''}' index='${index}' type='${value.type}' command='${value.command}' >${value.name}</button>`);
                        }
                        // ADD FIELD TO INCLUDE CUSTOM TOOLS
                        if (show_on_remote && ('custom' === value.type || 'colorpicker' === value.type)) {
                            $('#ui-remote').append(`<div id='widget-${value.command}' widget-index='${index}' class='widget' style='display:none'></div>`).ready(function () {
                                // INCLUDE COLOR CARDS ON COLOR PICKER
                                if ('colorpicker' === value.type) {
                                    $('#widget-' + value.command).load(`/color-picker-widget`, function () {
                                        if (value.value.hasOwnProperty('color1') && 'undefined' !== typeof value.value.color1.name) {
                                            $(`#widget-${value.command}`).children('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='1' command='${value.command}' index=${index} style='background-color:${value.value.color1.hex} !important;'><p class="uk-h5">${value.value.color1.name}</p></div></div>`);
                                        }
                                        if (value.value.hasOwnProperty('color2') && 'undefined' !== typeof value.value.color2.name) {
                                            $(`#widget-${value.command}`).children('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='2' command='${value.command}' index=${index} style='background-color:${value.value.color2.hex} !important;'><p class="uk-h5">${value.value.color2.name}</p></div></div>`);
                                        }
                                        if (value.value.hasOwnProperty('color3') && 'undefined' !== typeof value.value.color3.name) {
                                            $(`#widget-${value.command}`).children('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='3' command='${value.command}' index=${index} style='background-color:${value.value.color3.hex} !important;'><p class="uk-h5">${value.value.color3.name}</p></div></div>`);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });

                if ('undefined' !== typeof (buynow.value)) {
                    $('#ui-remote').append(`<button id='buynow' class='uk-button uk-button-primary uk-width-1-1 uk-margin-small-bottom uk-button-large'>Buy Now</button>`);
                }

                $('#ui-remote').append(`<button id='back' class='uk-button uk-button-secondary uk-width-1-1 uk-margin-small-bottom'>Back</button>`);

                // $('#ui-remote').append(`<div id='social' class="uk-card uk-card-default uk-card-body uk-padding-small"><p><span class="uk-text-middle">share:</span><a href="#share-by-email" class="uk-icon-button" uk-icon="icon:mail; ratio: 1.5" uk-toggle></a> <span class='uk-position-right uk-padding-small'><a href="" class="uk-icon-button" uk-icon="icon:facebook; ratio: 1.5"></a><a href="" class="uk-icon-button" uk-icon="icon:instagram; ratio: 1.5"></a><a href="" class="uk-icon-button" uk-icon="icon:pinterest; ratio: 1.5"></a></span></p></div>`);

                $('#searchbox').hide();

                socket.emit('log', { 'type': `{"loading":"${productData.core.sku.value}"}`, 'gridposition': `${window.gridposition}`, 'sku': productData.core.sku.value, 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });
            }
        });

        /// <summary>
        /// Socket hook to receive the display data and assemble the remote interface.
        /// </summary>
        socket.on('setdisplay', function (data) {
            socket.query.usedisplay = data;
            //console.log('DISPLAY SOCKET', data);
            $('div').removeClass('hide');
            if (!$.cookie("retile_error")) {
                console.log('good');
            } else {
                console.log('no good');
                $.removeCookie("retile_error");
                //document.location.reload();
            }
        });

        /// <summary>
        /// Socket hook to process logout.
        /// </summary>
        socket.on('logout', function (data) {
            show_logout_alert();
        });

        /// <summary>
        /// Socket hook to set display status as busy.
        /// </summary>
        socket.on('busy', function (data) {
            UIkit.modal.alert('<h2>This display is busy.</h2><p>The content will be displayed in your phone!</p>').then(function () {
                document.location = 'http://lowes.com';
            });
        });






        $(document).ready(function () {

            logoff();

            $('#scan').click(function (e) {
                console.log('scan');

                if (_scannerIsRunning) {
                    Quagga.stop();
                } else {
                    startScanner();
                }
            });

            /// <summary>
            /// Event hook to share product by email.
            /// </summary>
            $('#bt-share-by-email').click(function (e) {


                var email_to = $('#share-email-to').val();
                var my_email = $('#share-my-email').val();
                var my_name = $('#share-my-name').val();
                var msg = null;


                if ('undefined' === email_to || !isEmail(email_to)) {
                    $('#share-email-to').addClass('uk-form-danger'); msg = 'error';
                } else { $('#share-email-to').removeClass('uk-form-danger'); }

                if ('undefined' === my_name || '' === my_name.trim()) {
                    $('#share-my-name').addClass('uk-form-danger'); msg = 'error';
                } else { $('#share-my-name').removeClass('uk-form-danger'); }

                if ('undefined' === my_email || !isEmail(my_email)) {
                    $('#share-my-email').addClass('uk-form-danger'); msg = 'error';
                } else { $('#share-my-email').removeClass('uk-form-danger'); }

                if (null != msg) {
                    $('#share-msg').children('p').html('<strong>Error:</strong> Please verify the fields below and try again.');
                    $('#share-msg').slideDown();
                    return false;
                } else {
                    $('#share-msg').hide();
                }

                // HAVE TO SEND EMAIL USING SENDGRID
                try {
                    $('#share-msg').removeClass('uk-alert-danger').addClass('uk-alert-success');
                    $('#share-msg').children('p').html('<strong>Sent:</strong> Thank you for sharing your experience.');
                    $('#share-msg').slideDown();
                    $('#share-by-email form').hide();
                    setTimeout(function () {
                        UIkit.modal('#share-by-email').hide();
                        $('#share-by-email form input').val(' ');
                        $('#share-by-email form textarea').val(' ');
                        $('#share-msg').removeClass('uk-alert-success').addClass('uk-alert-danger');
                        $('#share-msg').children('p').html('');
                        $('#share-msg').hide();
                        $('#share-by-email form').show();
                    }, 5000);

                } catch (e) {
                    console.log('error');
                }

                e.preventDefault();
                return false;
            });

            $('#myButton').click(function (e) {
                if (isconnected_to_display()) {
                    console.log('from-remote ' + counter);
                    counter++;
                    logoff();
                }
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $('#interactive').click(function (e) {
                if (isconnected_to_display()) {
                    socket.emit('show-interactive', { displayid: socket.query.usedisplay });
                    console.log('show interactive');
                    $('#log').html(socket.query.usedisplay);
                    logoff();
                }
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $('#grid').click(function (e) {
                if (isconnected_to_display()) {
                    socket.emit('show-grid', { displayid: socket.query.usedisplay });
                    console.log('show grid');
                    $('#log').html(socket.query.usedisplay);
                    logoff();
                }
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $('#reload').click(function (e) {
                if (isconnected_to_display()) {
                    socket.emit('reload', { displayid: socket.query.usedisplay });
                }
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $('#reset').click(function (e) {
                if (isconnected_to_display()) {
                    socket.emit('reset', { displayid: socket.query.usedisplay });
                }
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $('#query').on('input', function (e) {
                if ($(this).val().length > 4) {
                    $('#alert').addClass('uk-alert-primary');
                    $('#alert p').html('If searching for and Item number, proceed typing. Otherwise, review the locator number before press the View Product buttom.');
                    $('#alert').slideDown();
                } else {
                    $('#alert').slideUp();
                    $('#alert').removeClass('uk-alert-primary');
                    $('#alert p').html(' ');

                }
            });


            $('#search').click(function (e) {
                var query = $('#query').val();

                socket.emit('searchProduct', { 'query': query.toUpperCase(), 'storeid': storeid, 'displayid': usedisplay });
                socket.emit('log', { 'type': `{"search":"${query.toUpperCase()}"}`, 'gridposition': `0`, 'sku': '', 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });

                window.gridposition = query;

                e.preventDefault(); // prevents page reloading
                return false;
            });

            $(document).on('click', '#back', function (e) {
                $('#ui-remote').html(' ');
                $('#query').val('');
                $('#searchbox').show();
                e.preventDefault(); // prevents page reloadin 
                return false;
            });

            $(document).on('click', '#buynow', function (e) {
                socket.emit('messageTo', { 'messageName': 'thankyou', 'displayid': usedisplay });
                socket.emit('log', { 'type': `{"buynow":"${productData.core.sku.value}"}`, 'gridposition': `${window.gridposition}`, 'sku': productData.core.sku.value, 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });
                var buynow = window.productData.properties.find(el => el.command == 'buy-now');

                if ('undefined' !== typeof (buynow.value)) {
                    window.location.replace(buynow.value);
                }

                e.preventDefault(); // prevents page reloadin 
                return false;
            });

            $(document).on('click', '.retile-action', function (e) {

                var type = $(this).attr('type');
                var command = $(this).attr('command');
                var id = $(this).attr('id');
                var index = $(this).attr('index');

                socket.emit('log', { 'type': `{"type":"${type}","command":"${command}","index":"${index}","id":"${id}"}`, 'gridposition': `${window.gridposition}`, 'sku': productData.core.sku.value, 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });

                if ($(this).hasClass('active')) {
                    console.log('already active');
                    e.preventDefault();
                    return false;
                }

                //socket.emit('log', type);

                $('.widget').slideUp();
                $('button.retile-action').removeClass('active uk-box-shadow-small');
                $(this).addClass('active uk-box-shadow-small');

                if ('custom' === type || 'colorpicker' === type) {

                    // Process info on remote
                    // https://api.jquery.com/load/

                    if ('custom' === type) {
                        $('#widget-' + command).load(`/widgets/${type}-${command}.html`, function () {
                            $('#widget-' + command).slideDown();
                        });
                    }

                    if ('colorpicker' === type) {
                        $('#widget-' + command).slideDown('normal', function () {
                            var brand = ('grout-selector' === command) ? 'mapei' : 'valspar';
                            socket.emit('messageTo', { 'messageName': type, 'displayid': usedisplay, 'index': index, 'brand': brand, 'command': command });
                        });
                    }

                } else {
                    // Send Command to Display
                    socket.emit('messageTo', { 'messageName': type, 'displayid': usedisplay, 'index': index, 'command': command });
                }

                console.log($(this).attr('id'));

                logoff();
                e.preventDefault(); // prevents page reloading
                return false;
            });

            $(document).on('click', '.pickcolor', function (e) {
                var index = $(this).attr('index');
                var color = $(this).attr('colorindex');
                var brand = ('grout-selector' === $(this).attr('command')) ? 'mapei' : 'valspar';

                socket.emit('messageTo', { 'messageName': 'pickedcolor', 'displayid': usedisplay, 'index': index, 'brand': brand, 'color': color, 'command': 'pickedcolor' });

                logoff();
                e.preventDefault(); // prevents page reloading
                return false;
            });
        });
    });
});

// used to validate any action before send command to menu
function isconnected_to_display() {
    if (socket.query.usedisplay != null) {
        return true;
    } else {
        // USE TEMPORARELY SHOULD HAVE A PROPER DISCONNECT FUNCTION;
        show_logout_alert();
    }
    return false;
}

//TIMER FOR INNACTIVITY DISCONNECT
function logoff() {
    console.log('Timer On');
    clearTimeout(logoffTimer);
    logoffTimer = setTimeout(function () {
        // add log off logic here
        // you can also check session activity here
        // and perhaps emit a logoff event to the client as mentioned
        socket.emit("hello", { reason: "Logged off due to inactivity", id: socket.id });
        //show_logout_alert();
    }, 2 * 90 * 1000);
}

//SHOW ALERT AND REDIRECT USER AFTER DISCONNECT
function show_logout_alert() {
    socket.disconnect();
    alert('Disconnected by Inactivity');
    window.location.replace('http://lowes.com');
}

//SCANNER 
//https://ourcodeworld.com/articles/read/460/how-to-create-a-live-barcode-scanner-using-the-webcam-in-javascript
// https://codepen.io/muhanad40/pen/rdjBLV
// https://medium.com/@Carmichaelize/enabling-the-microphone-camera-in-chrome-for-local-unsecure-origins-9c90c3149339
function startScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner-window'),
            constraints: {
                width: 300,
                height: 300,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "upc_reader",
                "upc_e_reader"
            ],
            debug: {
                showCanvas: true,
                showPatches: true,
                showFoundPatches: true,
                showSkeleton: true,
                showLabels: true,
                showPatchLabels: true,
                showRemainingPatchLabels: true,
                boxFromPatches: {
                    showTransformed: true,
                    showTransformedBox: true,
                    showBB: true
                }
            },
            multiple: false
        },

    }, function (err) {
        if (err) {
            console.log(err);
            return
        }

        console.log("Initialization finished. Ready to start");
        Quagga.start();

        // Set flag to is running
        _scannerIsRunning = true;
    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
            }
        }
    });


    Quagga.onDetected(function (result) {
        console.log("Barcode detected and processed : [" + result.codeResult.code + "]", result);
    });
}
