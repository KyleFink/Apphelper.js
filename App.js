/*

    Microzone jQuery AppHelper
    Version: 1.0.3

    See Changelog in changelog.txt

*/

var App = {
    _MonthNames: new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'),
    _DayNames: new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
    FormatString: function() {
        var args = [].slice.call(arguments);
        if (this.toString() != '[object Object]') {
            args.unshift(this.toString());
        }

        var pattern = new RegExp('{([1-' + args.length + '])}', 'g');
        return String(args[0]).replace(pattern, function(match, index) { return args[index]; });
    },
    RedirectTo: function(url) {
        window.location.replace(url);
    },
    Cookies: {
        Get: function(name) {
            var i, x, y, arRcookies = document.cookie.split(";");
            for (i = 0; i < arRcookies.length; i++) {
                x = arRcookies[i].substr(0, arRcookies[i].indexOf("="));
                y = arRcookies[i].substr(arRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x == name) {
                    return unescape(y);
                }
            }
            return undefined;
        },
        Set: function(name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var cValue = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = name + "=" + cValue;
        }
    },
    QTip: {
        CreateAjax: function(elem, my, at, url, data, fnSuccess) {
            $(elem).qtip({
                position: {
                    my: my,
                    at: at
                },
                style: {
                    classes: 'ui-tooltip-tipsy'
                },
                content: {
                    text: '<img src="Content/images/loaders/bajax.gif" style="margin-top: 4px" />', // The text to use whilst the AJAX request is loading
                    ajax: {
                        global: false,
                        url: url,
                        type: 'POST',
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(data),
                        success: fnSuccess,
                        converters: {
                            'text json': function(jsonString) {
                                var result = JSON.parse(jsonString, function(key, value) {
                                    var a;
                                    if (typeof value === 'string') {
                                        a = /\/Date\((\d*)\)\//.exec(value);
                                        if (a) {
                                            return new Date(+a[1]);
                                        }
                                    }
                                    return value;
                                });
                                return result;
                            }
                        },
                        timeout: 30000,
                        async: true,
                        cache: false
                    }
                }
            });
        }
    },
    Map: {
        _geocoder: undefined,
        initGoogleGeoCoder: function() {
            _geocoder = new google.maps.Geocoder();
        },
        Create: function(elem, centerLat, centerLng, zoomLevel) {
            var $elem = $(elem).gmap3({
                action: 'init',
                options: {
                    center: [centerLat, centerLng],
                    zoom: zoomLevel,
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
                    },
                    navigationControl: true,
                    scrollwheel: true,
                    streetViewControl: true
                },
                events: {
                    bounds_changed: function(map) {
                        console.log(map.getBounds().getCenter());
                        var bounds = map.getBounds();
                        var ne = bounds.getNorthEast();
                        var sw = bounds.getSouthWest();
                    }
                }
            });
        },
        AddMarker: function(elem, lat, lng, data, iconUrl) {
            $(elem).gmap3({
                action: 'addMarkers',
                markers: [
                    {
                        lat: lat,
                        lng: lng,
                        data: data,
                        options: { icon: new google.maps.MarkerImage(iconUrl) }
                    }
                ],
                marker: {
                    options: {
                        draggable: false
                    }
                }
            });
        },
        GetLatLong: function(address, fnCallback) {
            _geocoder.geocode({ address: address }, function (results, status) {
                if (status.toLowerCase() == 'ok') {
                    var loc = results[0].geometry.location;
                    fnCallback(true, loc);
                } else {
                    fnCallback(false);
                }
            });
            return false;
        }
    },
    Calendar: {
        Create: function(elem, ratio, url, data, fnCallback) {
            $(elem).fullCalendar({
                aspectRatio: ratio,
                events: {
                    url: url,
                    type: 'POST',
                    dataFilter: function(jsonString, type) {
                        if (type === 'json') {
                            // convert things that look like Dates into a UTC Date string and completely replace them. 
                            jsonString = jsonString.replace(/(.*?")(\\\/Date\([0-9\-]+\)\\\/)(")/g,
                                function(fullMatch, $1, $2, $3) {
                                    try {
                                        return $1 + new Date(parseInt($2.substr(7))).toUTCString() + $3;
                                    } catch(e) {
                                    }
                                    // something miserable happened, just return the original string            
                                    return $1 + $2 + $3;
                                });
                        }
                        return jsonString;
                    },
                    data: data,
                    error: function() {
                        alert('Error, there was an error while fetching events!');
                    }
                },
                eventRender: fnCallback,
                dayClick: function (date, allDay, jsEvent, view) {
                    $(elem).fullCalendar('gotoDate', date);
                    $(elem).fullCalendar('changeView', 'basicDay');
                },
                header: {
                    right: 'today prev,next,month,basicWeek,basicDay'
                }
            });
            return false;
        },
        RefreshCalendar: function(elem) {
            $(elem).fullCalendar('refetchEvents');
            return false;
        }
    },
    Select2: {
        Create: function(elem) {
            $(elem || '.chzn').select2();
        },
        SetSelectedData: function(elem, data) {
            $(elem).select2('data', data);
        },
        CreateAjax: function(elem, fnId, defaultText, url, fnData, fnFormatResult, fnFormatSelection) {
            var $elem = $(elem);
            $elem.select2({
                id: fnId,
                placeholder: defaultText,
                minimumInputLength: 3,
                ajax: {
                    url: url,
                    dataType: 'json',
                    data: fnData,
                    results: function(data) {
                        return { results: data };
                    }
                },
                formatResult: fnFormatResult,
                formatSelection: fnFormatSelection
            });
        }
    },
    Form: {
        IsValid: function(elem) {
            return $(elem).validate().form();
        },
        GetData: function(elem) {
            var paramObj = {};
            var formArray = $(elem).serializeArray();
            $.each(formArray, function(_, kv) {
                if (paramObj.hasOwnProperty(kv.name)) {
                    paramObj[kv.name] = $.makeArray(paramObj[kv.name]);
                    paramObj[kv.name].push(kv.value);
                } else {
                    paramObj[kv.name] = kv.value;
                }
            });
            return paramObj;
        },
        Reset: function (elem) {
            $(elem).find(':checkbox:checked').removeAttr('checked');
            $(elem).find(':radio:selected').removeAttr('selected');
            $(elem).find(':input:not([type="hidden"])').val('');
            $(elem).find('[multiselect="multiselect"]:selected').removeAttr('selected');
        }
    },
    Dialog : {
        Create: function (elem, title, height, width, fnOnOpen) {
            $(elem).dialog({
                title: title,
                autoOpen: false,
                height: height,
                width: width,
                modal: true,
                show: "drop",
                hide: "blind",
                open: fnOnOpen
            });
            return false;
        },
        Open: function (elem, html) {
            if (html)
                $(elem).html(html);
            $(elem).dialog('open');
            return false;
        },
        Close: function(elem) {
            $(elem).dialog('close');
            return false;
        }
    },
    Handlebars: {
        Init : function() {
            App.Handlebars.Templates.Options = Handlebars.compile('<option value="-1">SELECT AN OPTION</option>' +
                '{{#each this}}' +
                '{{#if Selected}}' +
                '<option value="{{Value}}" selected="selected">{{Text}}</option>' +
                '{{else}}' +
                '<option value="{{Value}}">{{Text}}</option>' +
                '{{/if}}' +
                '{{/each}}');
            Handlebars.registerHelper('Data_Item', function (obj) {
                var d = JSON.stringify(obj);
                var attr = 'data-item';
                attr = Handlebars.Utils.escapeExpression(attr);
                d = Handlebars.Utils.escapeExpression(d);

                var result = attr + '="' + d + '"';

                return new Handlebars.SafeString(result);
            });
            Handlebars.registerHelper('Currency', function (d) {
                return jQuery('<span></span>').append(d).formatCurrency({
                    region: 'en-ZA'
                }).html();
            });
        },
        Templates : {
            Options : undefined
        },
        CreateTemplate : function(elem) {
            return Handlebars.compile($(elem).html());
        }
    },
    Ajax : {
        Post: function (url, data, fnOnSuccess) {
            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(data),
                success: fnOnSuccess,
                error: function (a, b, c) {
                    alert(a.responseText);
                },
                converters: {
                    'text json': function (jsonString) {
                        var result = JSON.parse(jsonString, function (key, value) {
                            var a;
                            if (typeof value === 'string') {
                                a = /\/Date\((\d*)\)\//.exec(value);
                                if (a) {
                                    return new Date(+a[1]);
                                }
                            }
                            return value;
                        });
                        return result;
                    }
                },
                timeout: 30000,
                async: true,
                cache: false
            });
            return false;
        },
        GetHtml: function (url, data, fnOnSuccess) {
            if (data)
                url = url + '?' + $.param(data);
            $.ajax({
                url: url,
                type: 'GET',
                timeout: 30000,
                async: true,
                cache: false,
                dataType: 'html',
                contentType: 'application/json; charset=utf-8',
                success: fnOnSuccess,
                error: function (a, b, c) {
                    alert(a.responseText);
                }
            });
            return false;
        },
        Download: function(url, data) {
            if (url && data) {
                //data can be string of parameters or array/object
                data = typeof data == 'string' ? data : $.param(data);
                //split params into form inputs
                var inputs = '';
                var count = 0;
                $.each(data.split('&'), function () {
                    var pair = this.split('=');
                    var regex = new RegExp('([0-9]{2})%2F([0-9]{2})%2F([0-9]{4})', 'm');
                    if (regex.test(pair[1]))
                        pair[1] = pair[1].replace(/%2F/g, '/');
                    inputs += '<input type="hidden" name="' + pair[0] + '" value="' + pair[1] + '" />';
                    count++;
                });
                //send request
                $('<form action="' + url + '" method="' + 'post' + '">' + inputs + '</form>').appendTo('body').submit().remove();
            }
        }
    },
    DataTables: {
        Init: function() {
            $.fn.dataTableExt.oApi.fnReloadAjax = function (oSettings, sNewSource, fnCallback, bStandingRedraw) {
                if (typeof sNewSource != 'undefined' && sNewSource != null) {
                    oSettings.sAjaxSource = sNewSource;
                }
                this.oApi._fnProcessingDisplay(oSettings, true);
                var that = this;
                var iStart = oSettings._iDisplayStart;

                oSettings.fnServerData(oSettings.sAjaxSource, [], function (json) {
                    /* Clear the old information from the table */
                    that.oApi._fnClearTable(oSettings);

                    /* Got the data - add it to the table */
                    var aData = (oSettings.sAjaxDataProp !== "") ?
                        that.oApi._fnGetObjectDataFn(oSettings.sAjaxDataProp)(json) : json;

                    for (var i = 0; i < json.aaData.length; i++) {
                        that.oApi._fnAddData(oSettings, json.aaData[i]);
                    }

                    oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
                    that.fnDraw();

                    if (typeof bStandingRedraw != 'undefined' && bStandingRedraw === true) {
                        oSettings._iDisplayStart = iStart;
                        that.fnDraw(false);
                    }

                    that.oApi._fnProcessingDisplay(oSettings, false);

                    /* Callback user function - for event handlers etc */
                    if (typeof fnCallback == 'function' && fnCallback != null) {
                        fnCallback(oSettings);
                    }
                }, oSettings);
            };
            $.fn.dataTableExt.oApi.fnToggleDetails = function (oSettings, elem, fnFormatDetails) {
                var that = this;
                $(that).on('click', elem, function (e) {
                    e.preventDefault();
                    var nTr = this.parentNode.parentNode;
                    if ($(this).hasClass('details_open')) {
                        $(this).removeClass('details_open').addClass('details_close');
                        that.fnClose(nTr);
                    } else {
                        var aData = that.fnGetData(nTr);
                        $(this).removeClass('details_close').addClass('details_open');
                        that.fnOpen(nTr, fnFormatDetails(that, nTr, aData), 'details_row');
                    }
                });
            };
        },
        Create : function(elem) {
            var oTable = jQuery(elem).dataTable({
                sPaginationType: 'full_numbers'
            });
            return oTable;
        },
        CreateAjax: function (elem, url, data, columns, serverside) {
            var oTable = jQuery(elem).dataTable({
                bServerSide: serverside || false,
                sAjaxSource: url,
                fnServerData: function (sSource, aoData, fnCallback) {
                    var d = { aoData: aoData };
                    if (typeof (data) !== "function") {
                        jQuery.extend(d, data);
                    } else {
                        jQuery.extend(d, data());
                    }
                    App.Ajax.Post(sSource, d, fnCallback);
                },
                sPaginationType: 'full_numbers',
                aoColumns: columns
            });
            return oTable;
        }
    },
    Dates : {
        Init: function() {
            Date.prototype.toShortDateString = function() {
                var d = this;
                return App.FormatString('{1}/{2}/{3}', d.getDate(), d.getMonth() + 1, d.getFullYear());
            };
            Date.prototype.toLongDateString = function () {
                var d = this;
                return App.FormatString('{1}, {2} {3} {4}', App._DayNames[d.getDay()], d.getDate(), App._MonthNames[d.getMonth()], d.getFullYear());
            };
            Date.prototype.toShortDateTimeString = function () {
                var d = this;
                var h;
                h = d.getHours();
                var ap = (d.getHours() < 12) ? 'AM' : 'PM';
                return App.FormatString('{1}/{2}/{3} {4}:{5}:{6} {7}', d.getDate(), d.getMonth() + 1, d.getFullYear(), h, d.getMinutes(), d.getSeconds(), ap);
            };
            Date.prototype.toLongDateTimeString = function () {
                var d = this;
                var h = d.getHours();
                var ap = (d.getHours() < 12) ? 'AM' : 'PM';
                return App.FormatString('{1}, {2} {3} {4} {5}:{6}:{7} {8}', App._DayNames[d.getDay()], d.getDate(), App._MonthNames[d.getMonth()], d.getFullYear(), h, d.getMinutes(), d.getSeconds(), ap);
            };
            Date.prototype.toTimeString = function () {
                var d = this;
                var h = d.getHours();
                var ap = (d.getHours() < 12) ? 'AM' : 'PM';
                return App.FormatString('{1}:{2}:{3} {4}', h, d.getMinutes(), d.getSeconds(), ap);
            };
        },
        DatePicker : function(elem) {
            $(elem || '.datepicker, .date').datepicker({
                dateFormat: "dd/mm/yy",
                changeMonth: true,
                changeYear: true,
                showOn: 'focus'
            });
        },
        DateTimePicker : function(elem) {
            $(elem || '.datetime, .datetimepicker').datetimepicker({
                dateFormat: "dd/mm/yy",
                timeFormat: "hh:mm:ss TT"
            });
        }
    }
};

App.init = function () {
    $.validator.methods["date"] = function (a, b) {
        return this.optional(b) || /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((1[6-9]|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((1[6-9]|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((1[6-9]|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/i.test(a);
    };
    var originalSerializeArray = $.fn.serializeArray;
    $.fn.extend({
        serializeArray: function () {
            var brokenSerialization = originalSerializeArray.apply(this);
            var checkboxValues = $(this).find('input[type=checkbox]').map(function () {
                return { 'name': this.name, 'value': this.checked };
            }).get();
            var checkboxKeys = $.map(checkboxValues, function (element) { return element.name; });
            var withoutCheckboxes = $.grep(brokenSerialization, function (element) {
                return $.inArray(element.name, checkboxKeys) == -1;
            });

            return $.merge(withoutCheckboxes, checkboxValues);
        }
    });
};

//TODO: Remove all the unused script, and replace the scripts with the new scripts

App.Get = function (url, data, callback) {
    if (typeof(callback) !== "function") {
        //overwrite to avoid exception
        callback = function () {

        };
    }
    var returns;
    $.ajax({
        url: url,
        type: 'GET',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
    }).done(function (data) {
        returns = data;
        callback(data);
    }).fail(function (xhr, ajaxOptions, thrownError) {
       
    }).always(function (data) {

    });

    return returns;
};

App.Post = function (url, d, callback) {
    if (typeof (callback) !== "function") {
        //overwrite to avoid exception
        callback = function () {

        };
    }
    var returns;
    $.ajax({
        url: url,
        type: 'POST',
        data: JSON.stringify(d),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
    }).done(function (data) {
        returns = data;
        callback(data);
    }).fail(function (xhr, ajaxOptions, thrownError) {
        
    }).always(function (data) {

    });

    return returns;
};


App.Dropdown = function (options, placeholer) {
    if (placeholer) {
        options.Placeholder = true;
    } else {
        options.Placeholder = false;
    }
    var template = Handlebars.compile('{{#if this.Placeholder}}' +
                                        '<option></option>' +
                                      '{{/if}}' +
                                      '{{#each this}}' +
                                        '{{#if this.Selected}}' +
                                        '<option selected="selected" value="{{this.Value}}">' +
                                        '{{else}}' +    
                                        '<option value="{{this.Value}}">' +
                                        '{{/if}}'  +
                                        '{{this.Text}}' +
                                        '</option>'  +
                                      '{{/each}}');

    return template(options);        
};

// =================================================================================

jQuery.fn.chosenRefresh = function () {
    jQuery(this).trigger('liszt:updated');
    return this;
};


jQuery.fn.outerHtml = function () {
    return $("<div/>").append(this.eq(0).clone()).html();
};



jQuery.fn.numericOnly = function () {
    var $this = $(this);
    $this.on("keydown", function (event) {
        var character = String.fromCharCode(event.which);
        if (isNaN(character) && character != '\b' && character != '-') {
            event.preventDefault();
        }
    });
    return $this;
};


jQuery.fn.decimalOnly = function () {
    var $this = $(this);

    $this.on("keydown", function (event) {
        var e = window.event || event;
        var keyUnicode = e.charCode || e.keyCode;
        switch (keyUnicode) {
            case 16:
                break;
                // Shift
            case 27:
                this.value = '';
                break;
                // Esc: clear entry
            case 35:
                break;
                // End
            case 36:
                break;
                // Home
            case 37:
                break;
                // cursor left
            case 38:
                break;
                // cursor up
            case 39:
                break;
                // cursor right
            case 40:
                break;
                // cursor down
            case 78:
                break;
                // N (Opera 9.63+ maps the "." from the number key section to the "N" key too!) (See: http://unixpapa.com/js/key.html search for ". Del")
            case 110:
                break;
                // . number block (Opera 9.63+ maps the "." from the number block to the "N" key (78) !!!)
            case 190:
                break;
                // .
            case 8:
                break;
                // Backspace
            case 46:
                break;
                // Backspace
            case 109:
                break;
                // - minus sign
            default:
                {

                    if ((keyUnicode >= 96 & keyUnicode <= 105) || (keyUnicode >= 48 && keyUnicode <= 57)) {
                        // do nothing
                    } else {
                        event.preventDefault();
                    }
                }
        }
    });
    return $this;
};

function roundNumber(num, dec) {
    var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    return result;
}

// Get a collection of selected options in a dropdown list or list box
jQuery.fn.getSelectedOptions = function () {
    var d = [];
    jQuery(this).find('option:selected').each(function (index, elem) {
        d.push(jQuery(elem).val());
    });
    return d;
};

// Call the anchor link as an ajax call, and do a callback function. This is for a delete link not any other links
jQuery.fn.deleteAjax = function (options) {
    var $base = this;
    var settings = jQuery.extend({
        href: undefined,
        confirmMsg: 'Are you sure you want to delete this record?',
        callback: function (url) {
            window.location.href = url;
        }
    }, options);
    $base.live('click', function (e) {
        e.preventDefault();
        settings.href = $(this).attr('href');
        jConfirm(settings.confirmMsg, 'System message', function (r) {
            if (r) {
                jQuery.ajax({
                    url: settings.href,
                    type: 'POST',
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json',
                    success: function (data) {
                        if (data.Status) {
                            jAlert(data.Message, 'System message', function () {
                                settings.callback(data.ReturnUrl);
                            });
                        } else {
                            jQuery.jGrowl(data.Message);
                        }
                    }
                });
            }
        });
    });
};

jQuery.fn.slideFadeToggle = function (speed, easing, callback) {
    return this.animate({ opacity: 'toggle', height: 'toggle' }, speed, easing, callback);
};


jQuery.fn.optgroup = function (data) {

    var $this = $(this).empty();

    $.each(data.Sets, function (i, selectItem) {
        var ogroup = $("<optgroup></optgroup>", {
            label: selectItem.Name
        });

        $.each(selectItem.Values, function (k, option) {

            var opt = $("<option></option>", {
                text: option.Name,
                value: option.Value,
            });

            if (option.Selected == true) {
                opt.attr("selected", "selected");
            }

            ogroup.append(opt);
        });


        $this.append(ogroup);


    });

    return $this;



};


jQuery.fn.populate = function (data) {

    var $this = $(this).empty();

    $.each(data, function (i, item) {
        var toAppend = $("<option></option>", {
            text: item.Text,
            value: item.Value
        });

        if (item.Selected) {
            toAppend.attr("selected", "selected");
        }

        $this.append(toAppend);
    });

    return $this;



};
