// ==UserScript==
// @name		    PQ_Viewer
// @description	    Shows caches from pocket queries on the map on geocaching.com
// @include			/^https?://.*geocaching\.com/map/.*$/
// @version			0.0.1
// ==/UserScript==

var dataStore = {};
var canvasRenderer;
var L = unsafeWindow.L;
var layerGroup = L.layerGroup();
var map;

function handlePQFile(data) {
    parser = new DOMParser();
    doc = parser.parseFromString(data, 'text/xml');
    if (!doc || doc.documentElement.tagName != 'gpx') {
        $('#dropzone').css('background-color', 'lightRed');
        $('#dropzone').text("Invalid - try an other file");
        return;
    }
    handleParsedDocument(doc);
}

function handleParsedDocument(doc) {
    var waypoints = doc.documentElement.getElementsByTagName('wpt');
    if (waypoints.length === 0) {
        $('#dropzone').css('background-color', 'lightRed');
        $('#dropzone').text("No caches found - try an other file");
        return;
    }

    var timeElement = doc.documentElement.getElementsByTagName('time')[0];
    var time = new Date();
    if (timeElement) {
        var timeString = timeElement.textContent;
        var time = (new Date(timeString)).getTime();
    }
    handleWaypoints(waypoints, time);
}

function updateCachesOnMap() {
    layerGroup.clearLayers();

    var keys = Object.keys(dataStore);

    for (var j = 0; j < keys.length; j++) {
        addCacheToLayer(dataStore[keys[j]]);
    }
}

function addCacheToLayer(cache) {
    var marker = L.circleMarker([cache["lat"], cache["lon"]], {
        color: cacheColorMapping[cache["type"]]
        // renderer: canvasRenderer
    });
    marker.addTo(layerGroup);
    marker.bringToBack();
    marker.bindPopup(createPopup(cache), { "maxWidth": 350, "minWidth": 350 });
}

function createPopup(cache) {
    elem = $('<div></div>').link(createPopupData(cache), "#cachePopupTemplate")[0];
    oldElem = $(elem).find(".links.Clear");
    $(oldElem[0]).remove();
    oldElem[1].innerHTML = "";
    oldElem[1].style = "text-align: center;";
    $('<a style="font-size:1.5em;font-weight:1.5;cursor: pointer;">Open Description</a>').appendTo(oldElem[1]).click(function () {
        var newWindow = window.open();
        var newPageContent = "";

        if (cache["shortDescription"].length > 0) {
            if (cache["isShortDescriptionHtml"] != "True") {
                newPageContent += "<pre>";
            }
            newPageContent += cache["shortDescription"];
            if (cache["isShortDescriptionHtml"] != "True") {
                newPageContent += "<pre>";
            }
            newPageContent += "<br><hr>";
        }

        if (cache["longDescription"].length > 0) {
            if (cache["isLongDescriptionHtml"] != "True") {
                newPageContent += "<pre>";
            }
            newPageContent += cache["longDescription"];
            if (cache["isLongDescriptionHtml"] != "True") {
                newPageContent += "<pre>";
            }
        }

        newWindow.document.body.innerHTML = newPageContent;
    });
    return elem;
}

function createPopupData(cache) {
    var data =
        {
            "data": [
                {
                    "name": cache["name"],
                    "gc": cache["gcCode"],
                    "g": "",
                    "available": cache["available"] == "True",
                    "archived": cache["archived"] == "True",
                    "subrOnly": false,
                    "li": true,
                    "fp": "not available",
                    "difficulty": {
                        "text": cache["difficulty"],
                        "value": cache["difficulty"].replace(".", "_")
                    },
                    "terrain": {
                        "text": cache["terrain"],
                        "value": cache["terrain"].replace(".", "_")
                    },
                    "hidden": (new Date(cache["timePlaced"])).toLocaleDateString(),
                    "container": {
                        "text": cache["container"],
                        "value": cache["container"].toLowerCase() + ".gif"
                    },
                    "type": {
                        "text": cache["type"],
                        "value": cacheTypeMapping[cache["type"]] || ""
                    },
                    "owner": {
                        "text": cache["owner"],
                        "value": ""
                    }
                }
            ]
        };
    return data;
}

function handleWaypoints(waypoints, time) {
    for (var i = 0; i < waypoints.length; i++) {
        var wp = waypoints[i];
        var gcCode = wp.getElementsByTagName("name")[0].textContent;
        if (dataStore.hasOwnProperty(gcCode)) {
            var stored = dataStore[gcCode];
            if (stored["lastUpdate"] > time) {
                continue;
            }
        }
        else {
            var stored = {};
            dataStore[gcCode] = stored;
        }

        var isArchived = wp.getElementsByTagName("groundspeak:cache")[0].getAttribute("archived");

        if (isArchived != "False") {
            delete dataStore[gcCode];
            continue;
        }

        stored["lastUpdate"] = time;
        stored["gcCode"] = gcCode;
        stored["lat"] = wp.getAttribute("lat");
        stored["lon"] = wp.getAttribute("lon");
        stored["name"] = wp.getElementsByTagName("groundspeak:name")[0].textContent;
        stored["type"] = wp.getElementsByTagName("groundspeak:type")[0].textContent;
        stored["container"] = wp.getElementsByTagName("groundspeak:container")[0].textContent;
        stored["difficulty"] = wp.getElementsByTagName("groundspeak:difficulty")[0].textContent;
        stored["terrain"] = wp.getElementsByTagName("groundspeak:terrain")[0].textContent;
        stored["hint"] = wp.getElementsByTagName("groundspeak:encoded_hints")[0].textContent;
        stored["owner"] = wp.getElementsByTagName("groundspeak:owner")[0].textContent;
        stored["shortDescription"] = wp.getElementsByTagName("groundspeak:short_description")[0].textContent;
        stored["longDescription"] = wp.getElementsByTagName("groundspeak:long_description")[0].textContent;
        stored["isShortDescriptionHtml"] = wp.getElementsByTagName("groundspeak:short_description")[0].getAttribute("html");
        stored["isLongDescriptionHtml"] = wp.getElementsByTagName("groundspeak:long_description")[0].getAttribute("html");
        stored["timePlaced"] = wp.getElementsByTagName("time")[0].textContent;
        stored["available"] = wp.getElementsByTagName("groundspeak:cache")[0].getAttribute("available");
        stored["archived"] = isArchived;
    }

    localStorage.setItem('pq_Database', JSON.stringify(dataStore));

    if ($("#pqCheckbox")[0].checked) {
        updateCachesOnMap();
    }
}

function init() {
    dataStore = JSON.parse(localStorage.getItem('pq_Database') || "{}");

    map = unsafeWindow.MapSettings.Map;
    // canvasRenderer = L.canvas();
    map.addLayer(layerGroup);
    // layerGroup.bringToBack();

    $("head").append($(document.createElement("style")).html(sliderCss));

    $('<div style="width: 95%; vertical-align: middle; text-align: center; line-height: 50px; font-size: 1.5em;" ><label class="switch"><input id="pqCheckbox" type="checkbox"><span class="slider"></span></label></div>')
        .appendTo("#scrollbar")
        .find("#pqCheckbox")
        .prop('checked', (localStorage.getItem('pq_OnOff') || "true") == "true")
        .on("change", function () {
            if ($("#pqCheckbox")[0].checked) {
                updateCachesOnMap();
                localStorage.setItem('pq_OnOff', 'true');
            }
            else {
                layerGroup.clearLayers();
                localStorage.setItem('pq_OnOff', 'false');
            }
        });

    $('<div id="dropzone" style="border: 2px dashed #ccc; width: 95%; height: 50px; vertical-align: middle; text-align: center; line-height: 50px; font-size: 1.5em;" >Drop pocket query files here</div>')
        .appendTo("#scrollbar")
        .on({
            dragenter: function (e) {
                $(this).css('background-color', 'lightBlue');
            },
            dragleave: function (e) {
                $(this).css('background-color', 'white');
            },
            dragover: function (e) {
                e.preventDefault();
                e.stopPropagation();
            },
            drop: function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.originalEvent.dataTransfer.files.length > 0) {
                    fr = new FileReader();
                    fr.onload = function (event) {
                        $('#dropzone').css('background-color', 'lightOrange');
                        handlePQFile(event.target.result);
                        $('#dropzone').css('background-color', 'lightGreen');
                        $('#dropzone').text("Success - drop an other file");
                    };
                    fr.readAsText(e.originalEvent.dataTransfer.files[0]);
                }
            },
            dblclick: function () {
                if (confirm('Are you sure you want to delete all caches from the pq database?')) {
                    dataStore = {};
                    localStorage.setItem('pq_Database', "{}");
                    layerGroup.clearLayers();
                    localStorage.setItem('pq_OnOff', 'false');
                    $("#pqCheckbox")[0].checked = false;
                }
            }
        });

    if ($("#pqCheckbox")[0].checked) {
        updateCachesOnMap();
    }
}

var cacheTypeMapping =
    {
        "Traditional Cache": "2",
        "Multi-cache": "3",
        "Unknown Cache": "8",
        "Letterbox Hybrid": "5",
        "Webcam Cache": "11",
        "Virtual Cache": "4",
        "Wherigo Cache": "1858",
        "Earthcache": "137",
        "Event Cache": "6",
        "Cache In Trash Out Event": "13",
        "Lost and Found Event Cache": "3653",
        "Mega-Event Cache": "453"
    };

var cacheColorMapping =
    {
        "Traditional Cache": "#009900",
        "Multi-cache": "#ff9900",
        "Unknown Cache": "#0000e6",
        "Letterbox Hybrid": "#0000e6",
        "Webcam Cache": "#99ccff",
        "Virtual Cache": "#99ccff",
        "Wherigo Cache": "#0000e6",
        "Earthcache": "#99ccff",
        "Event Cache": "#cc0000",
        "Cache In Trash Out Event": "#cc0000",
        "Lost and Found Event Cache": "#cc0000",
        "Mega-Event Cache": "#cc0000"
    };

var sliderCss = '.switch{position:relative;display:inline-block;width:60px;height:34px}.switch input{display:none}.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;-webkit-transition:.4s;transition:.4s}.slider:before{position:absolute;content:"";height:26px;width:26px;left:4px;bottom:4px;background-color:#fff;-webkit-transition:.4s;transition:.4s}input:checked + .slider{background-color:#2196F3}input:focus + .slider{box-shadow:0 0 1px #2196F3}input:checked + .slider:before{-webkit-transform:translateX(26px);-ms-transform:translateX(26px);transform:translateX(26px)}';

$(document).ready(function () {
    setTimeout(init, 20);
});