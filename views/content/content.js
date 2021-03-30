
var param = document.URL.split('/')[4];
var client = new ClientJS();
var fingerprint = client.getFingerprint();
var socket = io({ 'query': { 'type': 'content', 'uid': fingerprint } });
var logoffTimer;
var productData = {};
var alertTimer = '';
var _scannerIsRunning = false;
var storeid = null;
var qs = null;
var gridposition = null;

const image_path = 'http://admin.retile.com/wp-content/uploads/';

try {
    var qs = new URLSearchParams(atob(param));
    storeid = qs.get('storeid');
} catch (e) { qs = null; }

socket.on('connect', () => {

});


function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2, 4})+$/;
    return regex.test(email);
}

function logoff() { }

$(document).ready(function () {

    $('footer').hide(function () { });

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

        socket.emit('searchProduct', { 'query': query.toUpperCase().trim(), 'storeid': storeid });
        window.gridposition = query;

        e.preventDefault(); // prevents page reloading
        return false;
    });

    $('#goback').click(function (e) {
        console.log('here');
        $('#product-view').fadeOut(function () {
            $('body').removeAttr('style');
            $('#searchbox').children('input').val('');
            $('#searchbox').fadeIn();
            $('#logo-content-on-remote').slideDown();
            $('footer').slideUp();
            $(this).children('div#ui-content-on-remote').html('');
            $(this).children('h1').html('');
            $('#product-view').attr('display', 'none');
        });
        return false;
        e.preventDefault(); // prevents page reloading
    });

    $(document).on('click', '.pickcolor', function (e) {
        var index = $(this).attr('index');
        var color = $(this).attr('colorindex');
        var colorname = productData.widgets[index].value['color' + color].name;
        var hex = productData.widgets[index].value['color' + color].hex;

        $('#color-name').html(colorname);
        $('body').css('backgroundColor', hex);



        e.preventDefault();
        return false;
    });

    $('#menu-selector').change(function (e) {


        var command = $(this).children("option:selected").attr('command');
        var type = $(this).children("option:selected").attr('type');
        var index = $(this).children("option:selected").attr('index');
        var buynow = productData.properties.find(el => el.command == 'buy-now');

        socket.emit('log', { 'type': `{"type":"${type}","command":"${command}","index":"${index}","location":"on-remote"}`, 'gridposition': `${window.gridposition}`, 'sku': productData.core.sku.value, 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });

        if ('image' === type) {
            $('#video').attr('src', ' ');
            $('#ui-content-on-remote').html('');
            $('body').removeAttr('style');
            $('#ui-content-on-remote').html(`<div class="uk-position-center">
        <div style='display:table-row; height:2vh;'><p>${productData.widgets[index].name}</p></div>
        <div style='display:table-row; height:auto'><img src='${image_path}${productData.widgets[index].value}' style='max-width:90vw; max-height:60vh;'></div>
        </div>`);
        }

        if ('fsimage' === type) {
            $('#video').attr('src', ' ');
            $('#ui-content-on-remote').html('');
            $('body').removeAttr('style');
            var bgimage = image_path + productData.widgets[index].value;
            $('body').attr('style', `background-image:url(${bgimage}); background-size:cover;`)
            console.log(bgimage);
        }

        if ('embed-video' === type) {
            $('#video').attr('src', ' ');

            $('#ui-content-on-remote').attr('style', ' ');
            $('#ui-content-on-remote').html(`<a href='${image_path}${productData.widgets[index].value}'>Video</a>`);
            $('#video').attr('loop', true);

            $('#video').attr('src', `${image_path}${productData.widgets[index].value}`);
            $('#video').get(0).currentTime = 0;
            $('#video').get(0).play();
            $('#video-block').css('display', 'block');
        };

        if ('custom' === type || 'colorpicker' === type) {
            $('#video').attr('src', ' ');
            $('body').removeAttr('style');
            $('#ui-content-on-remote').attr('style', ' ');

            if ('custom' === type) {
                $('#ui-content-on-remote').html('<div class="uk-position-center uk-padding"></div>');
                $('#ui-content-on-remote').children('div').load(`/widgets/${type}-${command}.html`);
            }

            if ('colorpicker' === type) {
                $('#ui-content-on-remote').html('');
                var color = productData.widgets[index].value['color1'].hex;
                var color_name = productData.widgets[index].value['color1'].name;
                var image = productData.widgets[index].value['image'];
                $('body').attr('style', `background:url('${image_path}/${image}'); background-repeat:repeat; background-postion:center; background-size: 100vw auto; background-color:${color};`);

                $('#ui-content-on-remote').html(`<div class="uk-position-bottom-center uk-padding-small uk-card uk-card-default" style="margin-bottom:100px; width:80vw;"><h2>Select a Color</h2><div id="colorpicker-cards" class="uk-child-width-1-3 uk-grid-small uk-grid-match uk-text-center uk-flex-center" uk-grid></div><div><small>Color Name: <span id='color-name'>${color_name}</span></small></div>`);

                if (productData.widgets[index].value.hasOwnProperty('color1') && 'undefined' !== typeof productData.widgets[index].value.color1.name) {
                    $('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='1' command='${command}' index=${index} style='background-color:${productData.widgets[index].value.color1.hex} !important;'></div></div>`);
                }

                if (productData.widgets[index].value.hasOwnProperty('color2') && 'undefined' !== typeof productData.widgets[index].value.color2.name) {
                    $('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='2' command='${command}' index=${index} style='background-color:${productData.widgets[index].value.color2.hex} !important;'></div></div>`);
                }

                if (productData.widgets[index].value.hasOwnProperty('color3') && 'undefined' !== typeof productData.widgets[index].value.color2.name) {
                    $('#colorpicker-cards').append(`<div><div class="uk-tile uk-tile-default pickcolor" colorindex='3' command='${command}' index=${index} style='background-color:${productData.widgets[index].value.color3.hex} !important;'></div></div>`);
                }
            }

        }

        if ('buy-now' === command) {
            $('#video').attr('src', ' ');
            window.location.replace(buynow.value);
        }

        if ('share-by-mail' === command) {
            UIkit.modal("#share-by-email").show();
        }

        if ('share-on-social' === command) {
            UIkit.modal("#share-on-social").show();
        }

        console.log(command);

        e.preventDefault(); // prevents page reloading
        return false;
    });

    socket.on('setProductData', function (data) {
        $('#ui-content-on-remote').html('');
        $('#menu-selector').html('');



        if (null === data) {
            $('#alert').addClass('uk-alert-danger');
            $('#alert p').html('Product Not Found. Try again.');
            $('#alert').slideDown();
            alertTimer = setTimeout(function () { $('#alert').slideUp(); }, 3000);
            window.gridposition = null;
            socket.emit('log', { 'type': `{"loading on remote error":"Product Not Found. Try again."}`, 'gridposition': window.gridposition, 'sku': '', 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'error' });
        } else {
            productData = JSON.parse(data);
            var buynow = productData.properties.find(el => el.command == 'buy-now');

            $('#product-sku').html(productData.core.sku.value);

            $.each(productData.widgets, function (index, value) {
                console.log(value);
                if (value.visible && index > 0) {
                    $('#menu-selector').append(`<option value='${value.command}' command='${value.command}' type='${value.type}' index='${index}'>${value.name}</option>`);

                    if (index === 1) {
                        $('#ui-content-on-remote').html(`<div class="uk-position-center">
                                    <div style='display:table-row; height:2vh;'><p>${productData.widgets[1].name}</p></div>
					                <div style='display:table-row; height:auto'><img src='${image_path}${productData.widgets[1].value}' style='max-width:90vw; max-height:60vh;'></div>
                                    </div>`);
                    }
                }
            });

            console.log(buynow);
            if ('undefined' !== typeof (buynow)) {
                $('#menu-selector').append(`<option value='buynow' command='buy-now' link='${buynow.value}'>Buy Online</option>`);
            }

            $('#menu-selector').append(`<option value='share-by-mail' command='share-by-mail'>Share by Mail</option>`);
            $('#menu-selector').append(`<option value='share-on-social' command='share-on-social'>Share on Social Media</option>`);

            $('#searchbox').slideUp(function () {
                $('#logo-content-on-remote').slideUp();
                $('footer').slideDown();
                $('#product-view').attr('display', 'table');
                $('#product-view').fadeIn();
            });

            socket.emit('log', { 'type': `{"loading on remote":"${productData.core.sku.value}"}`, 'gridposition': window.gridposition, 'sku': productData.core.sku.value, 'fingerprint': fingerprint, 'storeid': window.storeid, 'displayid': 0, 'screenid': 0, 'level': 'info' });
        }
    });

});

