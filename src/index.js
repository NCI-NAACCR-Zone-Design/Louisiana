// require these so they get webpacked
require('./index.html');
require('./index.scss');
require('./leaflet-topojson.js');
require('./leaflet-choroplethlegend.scss');
require('./leaflet-choroplethlegend.js');
require('./leaflet-layerpicker.scss');
require('./leaflet-layerpicker.js');
require('./leaflet-boxzoom.scss');
require('./leaflet-boxzoom.js');
require('./leaflet-singleclick.js');

require('./printing-leaflet-easyPrint.js');



//
// CONSTANTS
// for reasons unknown, can't use "const" here; Webpack 4...
//

// the map and some constants
var MAP;
var MAP_BBOX = [[32, -124.7 ], [42, -114]];
var MIN_ZOOM = 6;
var MAX_ZOOM = 15;

// for the geocoder: our Bing API key
var BING_API_KEY = '';

// colors for the incidence bar chart
var BARCHART_COLOR_ALL = '#446374';
var BARCHART_COLOR_FEMALE = '#8caec0';
var BARCHART_COLOR_MALE = '#c4deec';

// URLs of our data files, storage for them in memory for filtering and querying, and raw copies for exporting
var DATA_URL_CTAGEOM = 'static/data/cta.json';
var DATA_URL_CANCER = 'static/data/cancerincidence.csv';
var DATA_URL_DEMOGS = 'static/data/demographics.csv';
var DATA_URL_CTACOUNTY = 'static/data/counties_by_cta.csv';
var DATA_URL_CTACITY = 'static/data/cities_by_cta.csv';

// the set of options for search filters: cancer site, race, and time period
// each definition is the field value from the incidence CSV, mapped onto a human-readable label
// remember that cancer site and sex and time period, are used to find a specific row in cancerincidence.csv
// while race determines which column/field to use within that row
// e.g. CTA + sex + cancersite + timeperiod = filter to 1 incidence row, then race=B means to use B_AAIR, B_LCI, B_UCI
var SEARCHOPTIONS_CANCERSITE = [  // filter values for "cancer" field
    { value: 'AllSite', label: "All Cancer Sites" },
    { value: 'Breast', label: "Breast Cancer" },
    { value: 'CRC', label: "Colorectal Cancer" },
    { value: 'Kidney', label: "Kidney and Renal Pelvis Cancer" },
    { value: 'Liver', label: "Liver Cancer" },
    { value: 'Lung', label: "Lung Cancer" },
    { value: 'Lymph', label: "Non-Hodgkins Lymphoma" },
    { value: 'Mela', label: "Melanoma of the Skin" },
    { value: 'Pancreas', label: "Pancreatic Cancer" },
    { value: 'Prostate', label: "Prostate Cancer" },
    { value: 'Thyroid', label: "Thyroid Cancer" },
    { value: 'Urinary', label: "Urinary Bladder Cancer" },
    { value: 'Uterine', label: "Uterine Corpus Cancer" },
];
var SEARCHOPTIONS_SEX = [  // filter values for "sex" field
    { value: 'Both', label: "All Sexes" },
    { value: 'Male', label: "Male" },
    { value: 'Female', label: "Female" },
];
var SEARCHOPTIONS_TIME = [  // filter values for "years" field
    { value: '05yrs', label: "5-Year: 2012-2016" },
    { value: '10yrs', label: "10-Year: 2010-2019" },
    //{ value: '01yr', label: "1-Year: 2015" },
    //{ value: '05yrs', label: "5-Year: 2011-2015" },
    //{ value: '10yrs', label: "10-Year: 2006-2015" },
];
var SEARCHOPTIONS_RACE = [  // field prefix for AAIR, LCI, UCI fields within the incidence row
    { value: '', label: "All Ethnicities" },
    { value: 'W', label: "Non-Hispanic White" },
    { value: 'B', label: "Non-Hispanic Black" },
    { value: 'H', label: "Hispanic" },
    { value: 'A', label: "Asian/Pacific Islander" },
];

// the styles for CTA polygons by incidence rate
// see also performSearchMap() which assigns colors based on math
var CTA_STYLE_NODATA = { fillOpacity: 0.25, fillColor: '#cccccc', color: 'black', opacity: 0.2, weight: 1 };
var CTA_BORDER_DEFAULT = { color: '#b3b3b3', opacity: 1, weight: 1, fill: false };
var CTA_BORDER_SELECTED = { color: '#293885', opacity: 1, weight: 5, fill: false };

var CTA_STYLE_INCIDENCE = {
    Q1: { fillOpacity: 0.75, fillColor: '#ffffb3', stroke: false },
    Q2: { fillOpacity: 0.75, fillColor: '#ffe066', stroke: false },
    Q3: { fillOpacity: 0.75, fillColor: '#f99e26', stroke: false },
    Q4: { fillOpacity: 0.75, fillColor: '#b36093', stroke: false },
    Q5: { fillOpacity: 0.75, fillColor: '#873d6a', stroke: false },
};

var CTA_STYLE_DEMOG = {
    Q1: { fillOpacity: 0.75, fillColor: '#e6eaff', stroke: false },
    Q2: { fillOpacity: 0.75, fillColor: '#abb4e0', stroke: false },
    Q3: { fillOpacity: 0.75, fillColor: '#7683c2', stroke: false },
    Q4: { fillOpacity: 0.75, fillColor: '#4b5aa3', stroke: false },
    Q5: { fillOpacity: 0.75, fillColor: '#293885', stroke: false },
};


//
// STORAGE
// these are declarations, and not onstants that you should need to modify
//

// storage for the parsed TopoJSON document, the parsed CSV rows, etc.
// these are mutated during the init functions to become constants
var CTATOPOJSONDATA, DATA_CANCER, DATA_DEMOGS, DATA_CTACITY, DATA_CTACOUNTY;

// a cache of geocoder results, so we don't have to re-geocode every time the form changes
// saves big on API keys, e.g. we don't need to hit Bing if someone changes the cancer site filter
var GEOCODE_CACHE = {};


//
// INIT
//

$(document).ready(function () {
    // promises, a much nicer way to fetch, fetch, fetch
    const waitforparsing = [
        new Promise(function(resolve) {
            $.get(DATA_URL_CTAGEOM, (data) => { resolve(data); }, 'json');
        }),
        new Promise(function(resolve) {
            Papa.parse(DATA_URL_DEMOGS, {
                download: true,
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: function (csvdata) {
                    resolve(csvdata.data);
                },
            });
        }),
        new Promise(function(resolve) {
            Papa.parse(DATA_URL_CANCER, {
                download: true,
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: function (csvdata) {
                    resolve(csvdata.data);
                },
            });
        }),
        new Promise(function(resolve) {
            Papa.parse(DATA_URL_CTACOUNTY, {
                download: true,
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: function (csvdata) {
                    resolve(csvdata.data);
                },
            });
        }),
        new Promise(function(resolve) {
            Papa.parse(DATA_URL_CTACITY, {
                download: true,
                header: true,
                skipEmptyLines: 'greedy',
                dynamicTyping: true,
                complete: function (csvdata) {
                    resolve(csvdata.data);
                },
            });
        }),
    ];

    Promise.all(waitforparsing).then(function (datasets) {
        // save these to the globals that we'll read/filter/display
        // then send them to postprocessing for data fixes
        CTATOPOJSONDATA = datasets[0];
        DATA_DEMOGS = datasets[1];
        DATA_CANCER = datasets[2];
        DATA_CTACOUNTY = datasets[3];
        DATA_CTACITY = datasets[4];

        initFixDemographicDataset();
        initFixCancerDataset();

        // and we can finally get started!
        initMapAndPolygonData();
        initDataFilters();
        initTooltips();
        initPrintPage();
        initDownloadButtons();
        initFaqAccordion();
        initGoogleAnalyticsHooks();

        initLoadInitialState();
        performSearch();
        initUrlParamUpdater();
    });
});


function initUrlParamUpdater () {
    setInterval(() => {
        updateUrlParams();
    }, 1 * 1000);
}


function initLoadInitialState () {
    const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');
    const params = new URLSearchParams(window.location.search);

    // a very simple model: params are named same as their widget, and are straight-up values
    ['address', 'site', 'sex', 'race', 'time'].forEach((fieldname) => {
        const $widget = $searchwidgets.filter(`[name="${fieldname}"]`);
        const value = params.get(fieldname);

        if (value) {
            $widget.val(value);
        }
    });

    // on page load, fill in the address box too BUT ALSO set its hasbeenchanged attribute so that performSearch() will zoom to the CTA Zone
    // there is behavior not to re-zoom the map if a non-address field was the cause, e.g. changing sex should not re-zoom the map
    if (params.get('address')) {
        const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');
        const $addrbox = $searchwidgets.filter('[name="address"]');
        $addrbox.data('hasbeenchanged', true);
    }

    // map overlays and chorpopleth choice, are managed via map controls
    if (params.get('overlays')) {
        const enablethese = params.get('overlays').split(',');

        MAP.layerpicker.getLayerStates().forEach(function (layerinfo) {
            const turnon = enablethese.indexOf(layerinfo.id) != -1;
            MAP.layerpicker.toggleLayer(layerinfo.id, turnon);
        });
    }
    if (params.get('choropleth')) {
        MAP.choroplethcontrol.setSelection(params.get('choropleth'));
    }
    else {
        MAP.choroplethcontrol.setSelection('AAIR');
    }
}


function initTooltips () {
    // tooltip I icons, are I with data-tooltip attribute, correcponding to #tooltip_contents DIVs

    $('i[data-tooltip]').each(function () {
        const $trigger = $(this);
        const tooltipid = $(this).attr('data-tooltip');

        $trigger
        .attr('data-tooltip-content', `#tooltip_contents > div[data-tooltip="${tooltipid}"]`)
        .tooltipster({
            trigger: 'click',
            animation: 'fade',
            animationDuration: 150,
            distance: 0,
            maxWidth: 300,
            side: [ 'right', 'bottom', 'top' ],
            contentCloning: true,
            interactive: true, // don't auto-dismiss on mouse activity inside, let user copy text, follow links, ...
            functionBefore: function (instance, helper) {  // close open ones before opening this one
                jQuery.each(jQuery.tooltipster.instances(), function (i, instance) {
                    instance.close();
                });
            },
        });
    });
}


function initFixCancerDataset () {
    // various data fixes to the DATA_CANCER now that we have it

    // no fixes necessary at this time

    // console.log(DATA_CANCER);
}


function initFixDemographicDataset () {
    // various data fixes to the DATA_DEMOGS now that we have it

    // no data fixes at the moment; see docs where I describe re-exporting the CSV to fix number formats

    // console.log(DATA_DEMOGS);
}


function initPrintPage () {
    // with a map it's never simple to change sizes, and with them in table cells side-by-side it's even weirder
    // entering print mode, we want the left-side content hidden (it is, via nopprint) then to expand the map's cell to full-width, then trigger Leaflet resize
    // leaving print mode, need to undo all of that
    //
    // also, have the Print button change text, so folks don't get impatient waiting for that delay as we redraw the map
    //
    // also, the chart is now on the edge so gets clipped, so try to resize it and not do that

    const $printbutton = $('#printpagebutton');
    const $mapdomnode = $('#map').parent('div').get(0);
    const originalclasslist = $mapdomnode.className;

    const $incidencebarchart = $('#incidence-barchart');
    const $demogtablecolumns = $('div.demog-readouts > div.row > div')

    $printbutton.data('ready-html', $printbutton.html() );  // fetch whatever the HTML is when the page loads, so we don't have to repeat ourselves here
    $printbutton.data('busy-html', '<i class="fa fa-clock"></i> Printing');

    $printbutton.click(function () {
        $mapdomnode.className = 'col-12';
        MAP.invalidateSize();
        $printbutton.html( $printbutton.data('busy-html') );

        $incidencebarchart.addClass('printing');
        window.dispatchEvent(new Event('resize'));

        $demogtablecolumns.removeClass('col-md-6').addClass('col-12')

        setTimeout(function () {
            window.print();

            $incidencebarchart.removeClass('printing');

            $demogtablecolumns.addClass('col-md-6').removeClass('col-12')

            $mapdomnode.className = originalclasslist;
            MAP.invalidateSize();
            $printbutton.html( $printbutton.data('ready-html') );
        }, 1 * 1000);
    });
}


function initDownloadButtons () {
    const $downloadtogglebutton = $('#downloadbutton');
    const $downloadtogglecaret = $downloadtogglebutton.children('i.fa').last();
    const $downloadoptions = $('#downloadoptions');
    const $downloadlinks = $downloadoptions.find('a');
    const $printmapbutton = $downloadlinks.filter('[data-export="map"]');

    // clicking the button toggles the download options
    // clicking a download option should not propagate and click the button, effectively collapsing it
    $downloadtogglebutton.click(function () {
        const already = $downloadoptions.not('.d-none').length;
        if (already) {
            $downloadtogglecaret.addClass('fa-caret-down').removeClass('fa-caret-up');
            $downloadoptions.addClass('d-none');
            $downloadoptions.attr('aria-expanded', 'false');
        }
        else {
            $downloadtogglecaret.addClass('fa-caret-up').removeClass('fa-caret-down');
            $downloadoptions.removeClass('d-none');
            $downloadoptions.attr('aria-expanded', 'true');
        }
    });
    $downloadlinks.click(function (event) {
        event.stopPropagation();
    });

    // Zone Data and All Data are plain hyperlinks to static ZIP files
    // but Zone Data changes its URL to whatever CTA Zone is selected; see performSearchUpdateDataDownloadLinks()
    // $downloadinks.filter('[data-export="zonedata"]');
    // $downloadinks.filter('[data-export="all"]');

    // Download Map is a tedious slog, because we want to hide some Leaflet controls, leave some, and customize some others
    // this means hooks in some specific controls such as MAP.choroplethcontrol.setPrintMode()
    // we also want the print button to change text because printing can take several seconds...
    $printmapbutton.click(() => {
        // the filename is based on the choropleth selection; .png is added automatically
        const choroplethlabel = MAP.choroplethcontrol.getSelectionLabel().replace('%', 'Percent').replace(/\W/, '');
        const filename = `MapExport-${choroplethlabel}`;
        MAP.printplugin.printMap('CurrentSize', filename);
    });

    $printmapbutton.data('ready-html', $printmapbutton.html() );  // fetch whatever the HTML is when the page loads, so we don't have to repeat ourselves here
    $printmapbutton.data('busy-html', '<i class="fa fa-clock"></i> One Moment');
    MAP.on('easyPrint-start', () => {
        $printmapbutton.html( $printmapbutton.data('busy-html') );
    });
    MAP.on('easyPrint-finished', () => {
        $printmapbutton.html( $printmapbutton.data('ready-html') );
    });

    MAP.on('easyPrint-start', () => {
        // workaround for a bug in easyPrint: set an explicit width & height on the map DIV, so easyPrint will get the size right
        // without this, big empty space aorund the map inside a giant canvas, and predefined print sizes fail
        // see the easyPrint-finished event handler, which clears these so the map can be respinsive again
        const mapsize = MAP.getSize();
        const mapdiv = MAP.getContainer();
        mapdiv.style.width = `${mapsize.x}px`;
        mapdiv.style.height = `${mapsize.y}px`;

        // enable the "print mode hacks" in the map controls that were kept visible
        MAP.choroplethcontrol.setPrintMode(true);
    });
    MAP.on('easyPrint-finished', () => {
        // workaround for a bug in easyPrint: an explicit W&H were asserted above; clear those so the map can again be responsive
        const mapdiv = MAP.getContainer();
        mapdiv.style.removeProperty('width');
        mapdiv.style.removeProperty('height');

        // clear the "print mode hacks" in the map controls that were kept visible
        MAP.choroplethcontrol.setPrintMode(false);
    });
}


function initMapAndPolygonData () {
    // the map basics
    // a scale bar
    MAP = L.map('map', {
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
    })
    .fitBounds(MAP_BBOX);

    L.control.scale().addTo(MAP);

    L.Control.boxzoom({
        position:'topleft',
    }).addTo(MAP);

    // a marker for address searches
    var blackIcon = L.icon({
        iconUrl: 'static/map_marker.svg',

        iconSize:     [36.25, 51.25], // size of the icon
        iconAnchor:   [17.75, 41.25], // point of the icon which will correspond to marker's location
    });
    
    MAP.addressmarker = L.marker([0, 0], {
        pane: 'popupPane',
        icon: blackIcon
    });

    // some overlays, some of which are always on and not present in the LayerPicker control
    // note some contrived layer stacking using panes and zIndex
    // so we can stack CTA vector layers and these tile layers in some unusual ways, e.g. streets in between two vector layers, labels always at top, ...
    // some of this is possible only because we do not use popups nor markers, so we can use their panes
    // if we were to introduce markers/popups some re-engineering would be required
    MAP.overlays = {
        basemap: L.tileLayer('https://api.mapbox.com/styles/v1/greeninfo/cjwtpm0wu0z151cmnk860muld/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ3JlZW5pbmZvIiwiYSI6Ik1HUWRtdEkifQ.aWQKcu787DGrDq7LN5r2iA', {
            pane: 'tilePane',
            zIndex: 0,
            attribution: 'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>.<br />Data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributings</a>',
        }),
        labels: L.tileLayer('https://api.mapbox.com/styles/v1/greeninfo/cjwuuxwam0x8t1cl8ga2qsexs/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ3JlZW5pbmZvIiwiYSI6Ik1HUWRtdEkifQ.aWQKcu787DGrDq7LN5r2iA', {
            pane: 'popupPane',
            zIndex: 999,
            attribution: 'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>.<br />Data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributings</a>',
        }),
        counties: L.tileLayer('https://gin-public-tiles.s3.us-east-2.amazonaws.com/counties_ca/{z}/{x}/{y}.png', {
            pane: 'popupPane',
            zIndex: 10,
        }),
        cities: L.tileLayer('https://gin-public-tiles.s3.us-east-2.amazonaws.com/cities_ca/{z}/{x}/{y}.png', {
            pane: 'popupPane',
            zIndex: 10,
        }),
        streets: L.tileLayer('https://api.mapbox.com/styles/v1/greeninfo/cjwtq3r3s2bep1cpcfdm9t8ua/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ3JlZW5pbmZvIiwiYSI6Ik1HUWRtdEkifQ.aWQKcu787DGrDq7LN5r2iA', {
            pane: 'markerPane',  // between CTA lines and CTA fills
            attribution: 'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>.<br />Data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributings</a>',
            opacity: 0.75,
        }),
    };
    MAP.overlays.basemap.addTo(MAP);

    MAP.layerpicker = new L.Control.LayerPicker({
        expanded: true,
        layers: [
            { id: 'labels', label: "Labels", layer: MAP.overlays.labels, checked: true },
            { id: 'counties', label: "Counties", layer: MAP.overlays.counties },
            { id: 'cities', label: "Cities", layer: MAP.overlays.cities },
            { id: 'streets', label: "Streets", layer: MAP.overlays.streets },
        ],
        onLayerChange: function (layerid, show) {
            logGoogleAnalyticsEvent('map', show ? 'overlay-on' : 'overlay-off', layerid);
        },
    }).addTo(MAP);

    // for printing, see initDownloadButtons()
    // this includes events to toggle the button between Download and Wait modes, which differs from the approach used by CSV exporter
    // and includes CSS hacks to modify the style of some elements in the printout, e.g. select element borders
    // see also initDownloadButtons() which has peripheral triggers, e.g. prepare the map, hide the print button, etc.
    MAP.printplugin = L.easyPrint({
      	sizeModes: ['Current'],  // no other eize really works, and makes the map vanish as it is resized for printing anyway; yuck
      	exportOnly: true,
        hidden: true,  // no UI button, we have our own
        // don't print controls... well, except...
        hideControlContainer: false,
        hideClasses: [
            // hide these other controls
            'leaflet-layerpicker-control', 'leaflet-control-attribution',
            'leaflet-control-zoom', 'leaflet-control-boxzoom',
            // within the choroplethlegend control which we do not hide, setPrintMode() sets certain CSS to show/hide those items
        ],
    }).addTo(MAP);

    // another hack for printing; the printing system fails if there are any tile errors
    // try to catch those and create new transparent PNGs for missing tiles, to appease it
    function handleTileError (error) {
        error.tile.src = 'static/transparent_256x256.png';
    }
    MAP.overlays.cities.on('tileerror', handleTileError);
    MAP.overlays.counties.on('tileerror', handleTileError);

    // the TopoJSON layer of CTAs
    // and a custom control to color them forming a choropleth, and to change that coloring
    // but nothing's ever easy!
    // they decided later that they want to stick a tilelayer in between the fills and the boundary lines,
    // so there are in fact two JSON layers, and performSearchMap() manages both of them to highlight one, color the other, ...
    // the tilelayer then has a zindex within markerPane to fit it in between

    MAP.ctapolygonfills = L.topoJson(CTATOPOJSONDATA, {
        pane: 'shadowPane',
        style: CTA_STYLE_NODATA,  // see performSearchMap() where these are reassigned based on filters
    })
    .addTo(MAP);

    MAP.ctapolygonbounds = L.topoJson(CTATOPOJSONDATA, {
        pane: 'tooltipPane',
        style: CTA_BORDER_DEFAULT,  // see performSearchMap() where these are reassigned based on filters
    })
    .addTo(MAP);

    MAP.choroplethcontrol = new L.Control.ChoroplethLegend({
        expanded: true,
        onChoroplethChange: (picked) => {
            performSearch();
            logGoogleAnalyticsEvent('map', 'choropleth', picked);
        },
    }).addTo(MAP);

    // clicking the map = find latlng, set this as a latlng address search, and let performSearch() take its course
    MAP.on('singleclick', function (event) {
        const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');
        const $addressbox = $searchwidgets.filter('[name="address"]');
        const address = `${event.latlng.lat.toFixed(5)},${event.latlng.lng.toFixed(5)}`;
        $addressbox.val(address).change();
    });
}


function initDataFilters () {
    // part 1: fill in the SELECT options from the configurable constants
    const $searchwidgets_site = $('div.data-filters select#data-filters-site');
    const $searchwidgets_sex = $('div.data-filters select#data-filters-sex');
    const $searchwidgets_race = $('div.data-filters select#data-filters-race');
    const $searchwidgets_time = $('div.data-filters select#data-filters-time');

    SEARCHOPTIONS_CANCERSITE.forEach(function (option) {
        $(`<option value="${option.value}">${option.label}</option>`).appendTo($searchwidgets_site);
    });
    SEARCHOPTIONS_RACE.forEach(function (option) {
        $(`<option value="${option.value}">${option.label}</option>`).appendTo($searchwidgets_race);
    });
    SEARCHOPTIONS_SEX.forEach(function (option) {
        $(`<option value="${option.value}">${option.label}</option>`).appendTo($searchwidgets_sex);
    });
    SEARCHOPTIONS_TIME.forEach(function (option) {
        $(`<option value="${option.value}">${option.label}</option>`).appendTo($searchwidgets_time);
    });

    if (getOptionCount('time') < 2) {  // some datasets have only 1 option, sop  showing this is silly
        $searchwidgets_time.closest('div.input-group').hide();
    }

    // part 2: add actions to the search widgets
    // the search widgets: select race/sex/cancer and trigger a search
    // some selections may need to force others, e.g. some cancer selections will force a sex selection
    const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');
    const $filtersummary = $('div.data-filters-summary');

    $searchwidgets.change(function () {
        // look for some forced selections based on our new selection
        const $this = $(this);
        const autopick_sex = $this.find('option:selected').attr('data-sex');

        if (autopick_sex) {
            $searchwidgets.filter('[name="sex"]').val(autopick_sex);
        }

        // go ahead and search
        performSearch();
    });


    // performSearch() will zoom the map to the searched CTA Zone, but only if the reason for the search was a changed address search
    // e.g. changing sex should not re-zoom the map
    // this hasbeenchanged datum is how we detect that an address change is the reason for the re-search
    $searchwidgets.filter('[name="address"]')
    .keydown(function (event) {
        // don't update our flag if the keypress was a tab; it was probably a screenreader just passing through
        if (event.keyCode != 9) $(this).data('hasbeenchanged', true);

        if (event.keyCode == 13) $(this).blur();
    });

    // the anti-filters: Xs in the div.data-filters-summary which will clear a specific filter
    // how we clear the filter varies: most are select, one is text
    // at any rate, upon clearing the filter trigger its change to re-search
    $filtersummary.on('keypress', 'div', function (event) {
        if (event.keyCode == 13) $(this).click();  // ARIA/508 translate hitting enter as clicking
    });
    $filtersummary.on('click', 'div', function () {
        const whichfilter = $(this).closest('span').attr('data-filter');
        const $widget = $searchwidgets.filter(`[name="${whichfilter}"]`);

        if ($widget[0].tagName == 'SELECT') {
            // select element; reset to first option, whatever that is
            const value = $widget.find('option').first().prop('value');
            $widget.val(value).change();
        }
        else if ($widget[0].tagName == 'INPUT' && $widget.prop('type') == 'text') {
            // text element, blank its value
            $widget.val('').change();
        }
        else {
            throw "Clear filter: unknown filter type";
        }
    });
}


function initFaqAccordion () {
    // in the FAQ, clicking a DT toggles the DD
    const $buttons = $('#learn-faq button.usa-accordion__button');
    $buttons.click(function (event) {
        const $this = $(this);
        const $definition = $this.closest('h2').next('.usa-accordion__content');
        const isvisible = $this.attr('aria-expanded') == 'true';

        if (isvisible) {
            $this.attr('aria-expanded', 'false');
            $definition.attr('hidden', '');
        }
        else {
            $this.attr('aria-expanded', 'true');
            $definition.removeAttr('hidden');
        }

        // don't try to follow the link, which is # instead of javascript:void(0) to satisfy WAVE
        event.preventDefault();
    });

    const $toggleall = $('#learn-faq .faqs_toggle button');
    $toggleall.click(function () {
        const $this = $(this);
        const allexpanded = $this.text() == 'Collapse All FAQs';

        if (allexpanded) {
            $buttons.filter('[aria-expanded="true"]').click();
            $this.text('Expand All FAQs');
        }
        else {
            $buttons.filter('[aria-expanded="false"]').click();
            $this.text('Collapse All FAQs');
        }
    });
}


function initGoogleAnalyticsHooks () {
    // the search widgets
    $('div.data-filters select[name="site"]').change(function () {
        const value = getLabelFor('site', $(this).val());
        logGoogleAnalyticsEvent('search', 'site', value);
    });
    $('div.data-filters select[name="sex"]').change(function () {
        const value = getLabelFor('sex', $(this).val());
        logGoogleAnalyticsEvent('search', 'sex', value);
    });
    $('div.data-filters select[name="race"]').change(function () {
        const value = getLabelFor('race', $(this).val());
        logGoogleAnalyticsEvent('search', 'race', value);
    });
    $('div.data-filters input[name="address"]').change(function () {
        const value = $(this).val();
        if (! value) return;
        logGoogleAnalyticsEvent('search', 'address', value);
    });

    // print/export stuff
    $('#printpagebutton').click(function () {
        logGoogleAnalyticsEvent('export', 'print');
    });
    $('#downloadoptions a[data-export="map"]').click(function () {
        logGoogleAnalyticsEvent('export', 'mapimage');
    });
    $('#downloadoptions a[data-export="zonedata"]').click(function () {
        const value = $(this).attr('data-ctaid');
        logGoogleAnalyticsEvent('export', 'zonedata', value);
    });
    $('#downloadoptions a[data-export="alldata"]').click(function () {
        logGoogleAnalyticsEvent('export', 'alldata');
    });

    // switching tab sections in the bottom Learn area
    $('#learn-text ul.nav a[data-toggle="tab"]').on('shown.bs.tab', function () {
        const value = $(this).text();  // text of the A that changed the tab selection
        logGoogleAnalyticsEvent('learn', 'tabchange', value);
    });

    // map events, including some reall custom mods to the controls to the custom controls to capture these events
    // MAP.choroplethcontrol -- see the constructor's onChoroplethChange callback
    // MAP.layerpicker -- see the constructor's onLayerChange callback
}


//
// FUNCTIONS
//

function performSearch () {
    // clear these validation and markers; we may put them back in just a moment
    toggleAddressSearchFailure(false);
    MAP.addressmarker.setLatLng([0, 0]).removeFrom(MAP);

    // was this search due to a manual address change? this affects some results handlers, e.g. zoom to selected area
    const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');
    const $addrbox = $searchwidgets.filter('[name="address"]');
    const causedbyaddresschange = $addrbox.data('hasbeenchanged');
    $addrbox.data('hasbeenchanged', false);

    // get the search params so we can filter to the specific row
    // if we have an address to geocode, then do that as well
    const params = compileParams();

    // the CTA ID and CTA Name are figured here, since we need to find the CTA just to proceed to performSearchReally()
    // may as well just capture it here and include it into the searchparams
    params.ctaid = 'Statewide';
    params.ctaname = 'Statewide';
    if (params.address) {
        // address search can never be easy  :)
        // the address may be a latlng string, or a CTA ID, or a CTA ID buried inside a longer string, ... or maybe even an address!
        const isctaid = params.address.match(/^\s*((A|B)\d\d\d\d)\s*$/);
        const conainsctaid = params.address.match(/\(((A|B)\d\d\d\d)\)/);

        if (isctaid || conainsctaid) {
            // this isn't an address but a CTA ID; search for it, then do simialrly to what we would do for an address hit
            const ctaid = isctaid ? isctaid[1] : conainsctaid[1];
            const cta = findCTAById(ctaid);

            if (cta) {
                // now do the search
                params.ctaid = cta.feature.properties.Zone;
                params.ctaname = cta.feature.properties.ZoneName.replace(/\_\d+$/, '');  // trim off the end
                params.bbox = causedbyaddresschange ? cta.getBounds() : null;
                performSearchReally(params);
            }
            else {
                // show an address error
                toggleAddressSearchFailure('Could not find that CTA');
            }
        }
        else {
            // some other address (including latlng, whch Bing just returns instantly), I guess go ahead and geocode it
            geocodeAddress(params.address, function (latlng) {
                if (! latlng) return toggleAddressSearchFailure('Could not find that address');

                // find the CTA containing this point, if any
                // if there isn't one, a popup alert is super annoying; we have a special UI thing when that happens
                const searchlatlng = [ latlng[0], latlng[1] ];
                const cta = findCTAContainingLatLng(searchlatlng);

                if (cta) {
                    // now do the search
                    params.ctaid = cta.feature.properties.Zone;
                    params.ctaname = cta.feature.properties.ZoneName.replace(/\_\d+$/, '');  // trim off the end
                    params.latlng = searchlatlng;
                    params.bbox = causedbyaddresschange ? cta.getBounds() : null;
                    performSearchReally(params);
                }
                else {
                    // show an address error
                    MAP.addressmarker.setLatLng(searchlatlng).addTo(MAP);
                    toggleAddressSearchFailure('Data not available for that location');
                }
            });
        }
    }
    else {
        // now do the search
        performSearchReally(params);
    }
}


function performSearchReally (searchparams) {
    // performSearch() was a wrapper to figure out what CTA to focus
    // ultimately they come here for the real data filtering and display

    // the incidence readout, the map, the demog chart, the bar chart, ... all display something completely different
    // - incidence chart is the one selected CTA filtered by cancer, sex, race
    // - demogs are the one selected CTA but have no connection to cancer type, sex, etc.
    // - map is of all CTAs, filtered for the given cancer types and race
    // - bar chart is of the one selected CTA but of all sexes and races
    // so really they're all different at the most basic levels, and have completely different needs from the site data
    // and it doesn't make sense to try our usual design pattern of filtering data then handing off to a renderer

    performSearchShowFilters(searchparams);
    performSearchDemographics(searchparams);
    performSearchPlaces(searchparams);
    performSearchIncidenceReadout(searchparams);
    performSearchIncidenceChart(searchparams);
    performSearchMap(searchparams);
    performSearchUpdateDataDownloadLinks(searchparams);
}


function performSearchShowFilters (searchparams) {
    // the filter reiteration, with little Xs to clear a single filter
    // we show all the filters all the time, e.g. even "Statewide" and "Both" sexes
    // but of course Statewide/Both/All options doesn't make sense to have an X
    // also, some filters need TLC to remap their values onto the text labels displayed in the selector, so again each filter is a snowflake
    // see initDataFilters() for delegated event handler when these are clicked

    const $filtersummary = $('div.data-filters-summary');
    $filtersummary.empty();

    {
        const text = searchparams.ctaname == 'Statewide' ? searchparams.ctaname : `${searchparams.ctaname} (${searchparams.ctaid})`;
        const $box = $('<span data-filter="address"></span>').text(text).appendTo($filtersummary);
        if (searchparams.ctaname != 'Statewide') {
            $box.prop('tabindex', '0').addClass('data-filter-clear').append('<div class="summary-close"><i class="fa fa-times noprint" tabindex="0" aria-label="Click to clear this filter"></i></div>');
        }
    }

    {
        const text = getLabelFor('time', searchparams.time);
        if (getOptionCount('time') > 1) {  // some datasets have only 1 option, so reiterating it with an X to clear it, is silly
            const $box = $('<span data-filter="time"></span>').text(text).appendTo($filtersummary);
            $box.prop('tabindex', '0').addClass('data-filter-clear').append('<div class="summary-close"><i class="fa fa-times noprint" tabindex="0" aria-label="Click to clear this filter"></i></div>');
        }
    }

    {
        const text = getLabelFor('site', searchparams.site);
        const $box = $('<span data-filter="site"></span>').text(text).appendTo($filtersummary);
        if (searchparams.site != 'AllSite') {
            $box.prop('tabindex', '0').addClass('data-filter-clear').append('<div class="summary-close"><i class="fa fa-times noprint" tabindex="0" aria-label="Click to clear this filter"></i></div>');
        }
    }

    {
        const text = getLabelFor('sex', searchparams.sex);
        const $box = $('<span data-filter="sex"></span>').text(text).appendTo($filtersummary);
        if (searchparams.sex != 'Both') {
            $box.prop('tabindex', '0').addClass('data-filter-clear').append('<div class="summary-close"><i class="fa fa-times noprint" tabindex="0" aria-label="Click to clear this filter"></i></div>');
        }
    }

    {
        const text = getLabelFor('race', searchparams.race);
        const $box = $('<span data-filter="race"></span>').text(text).appendTo($filtersummary);
        if (searchparams.race != "") {
            $box.prop('tabindex', '0').addClass('data-filter-clear').append('<div class="summary-close"><i class="fa fa-times noprint" tabindex="0" aria-label="Click to clear this filter"></i></div>');
        }
    }
}


function performSearchDemographics (searchparams) {
    // distill demographic data for the selected CTA
    // no connection to the cancer dataset at all

    const demogdata_cta = DATA_DEMOGS.filter(function (row) {
        return row.Zone == searchparams.ctaid;
    })[0];
    const demogdata_state = DATA_DEMOGS.filter(function (row) {
        return row.Zone == 'Statewide';
    })[0];

    // show/hide the CTA columns (well, actually, each individual cell)
    if (searchparams.ctaid == 'Statewide') {
        $('div.demog-readouts [data-region="cta"]').hide();
    }
    else {
        $('div.demog-readouts [data-region="cta"]').show();
    }

    // now fill in the blanks
    const ctanametext = searchparams.ctaname;
    const ctaidtext = searchparams.ctaid == 'Statewide' ? '' : `(${demogdata_cta.Zone})`;
    $('div.demog-readouts span[data-statistics="ctaname"]').text(ctanametext);
    $('div.demog-readouts span[data-statistics="ctaid"]').text(ctaidtext);
    $('div.demog-readouts span[data-statistics="ctaname"]').closest('span.subtitle').prop('aria-label', ctanametext + ' ' + ctaidtext);

    $('div.demog-readouts span[data-region="cta"][data-statistic="population"]').text( demogdata_cta.PopAll.toLocaleString() );
    $('div.demog-readouts span[data-region="cta"][data-statistic="uninsured"]').text(`${demogdata_cta.PerUninsured.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="white"]').text(`${demogdata_cta.PerWhite.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="black"]').text(`${demogdata_cta.PerBlack.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="hispanic"]').text(`${demogdata_cta.PerHispanic.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="asian"]').text(`${demogdata_cta.PerAPI.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="foreign"]').text(`${demogdata_cta.PerForeignBorn.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="rural"]').text(`${demogdata_cta.PerRural.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="cta"][data-statistic="nses"]').text(demogdata_cta.QNSES);

    $('div.demog-readouts span[data-region="state"][data-statistic="population"]').text( demogdata_state.PopAll.toLocaleString() );
    $('div.demog-readouts span[data-region="state"][data-statistic="uninsured"]').text(`${demogdata_state.PerUninsured.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="white"]').text(`${demogdata_state.PerWhite.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="black"]').text(`${demogdata_state.PerBlack.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="hispanic"]').text(`${demogdata_state.PerHispanic.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="asian"]').text(`${demogdata_state.PerAPI.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="foreign"]').text(`${demogdata_state.PerForeignBorn.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="rural"]').text(`${demogdata_state.PerRural.toFixed(1)} %`);
    $('div.demog-readouts span[data-region="state"][data-statistic="nses"]').text(' ');  // by definition stats SNES is undefined

    $('div.demog-readouts span[data-region="cta"][data-statistic="pctcolonscreen"]').text(!isNaN(parseFloat(demogdata_cta.PerFOBT)) ? `${demogdata_cta.PerFOBT.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctmammogram"]').text(!isNaN(parseFloat(demogdata_cta.PerMammo)) ? `${demogdata_cta.PerMammo.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctcare65m"]').text(!isNaN(parseFloat(demogdata_cta.PerMenPrev)) ? `${demogdata_cta.PerMenPrev.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctcare65f"]').text(!isNaN(parseFloat(demogdata_cta.PerWomenPrev)) ? `${demogdata_cta.PerWomenPrev.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctcheckups"]').text(!isNaN(parseFloat(demogdata_cta.PerDocvisit)) ? `${demogdata_cta.PerDocvisit.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctpap"]').text(!isNaN(parseFloat(demogdata_cta.PerPap)) ? `${demogdata_cta.PerPap.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctdelayedcare"]').text(!isNaN(parseFloat(demogdata_cta.PerDelayCare)) ? `${demogdata_cta.PerDelayCare.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctsmoke"]').text(!isNaN(parseFloat(demogdata_cta.PerCurrSmk)) ? `${demogdata_cta.PerCurrSmk.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctfoodinsecure"]').text(!isNaN(parseFloat(demogdata_cta.PerFoodInsec)) ? `${demogdata_cta.PerFoodInsec.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctphysactive"]').text(!isNaN(parseFloat(demogdata_cta.Per150minPA)) ? `${demogdata_cta.Per150minPA.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="cta"][data-statistic="pctobese"]').text(!isNaN(parseFloat(demogdata_cta.PerObese)) ? `${demogdata_cta.PerObese.toFixed(1)} %` : '-');

    $('div.demog-readouts span[data-region="state"][data-statistic="pctcolonscreen"]').text(!isNaN(parseFloat(demogdata_state.PerFOBT)) ? `${demogdata_state.PerFOBT.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctmammogram"]').text(!isNaN(parseFloat(demogdata_state.PerMammo)) ? `${demogdata_state.PerMammo.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctcare65m"]').text(!isNaN(parseFloat(demogdata_state.PerMenPrev)) ? `${demogdata_state.PerMenPrev.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctcare65f"]').text(!isNaN(parseFloat(demogdata_state.PerWomenPrev)) ? `${demogdata_state.PerWomenPrev.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctcheckups"]').text(!isNaN(parseFloat(demogdata_state.PerDocvisit)) ? `${demogdata_state.PerDocvisit.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctpap"]').text(!isNaN(parseFloat(demogdata_state.PerPap)) ? `${demogdata_state.PerPap.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctdelayedcare"]').text(!isNaN(parseFloat(demogdata_state.PerDelayCare)) ? `${demogdata_state.PerDelayCare.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctsmoke"]').text(!isNaN(parseFloat(demogdata_state.PerCurrSmk)) ? `${demogdata_state.PerCurrSmk.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctfoodinsecure"]').text(!isNaN(parseFloat(demogdata_state.PerFoodInsec)) ? `${demogdata_state.PerFoodInsec.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctphysactive"]').text(!isNaN(parseFloat(demogdata_state.Per150minPA)) ? `${demogdata_state.Per150minPA.toFixed(1)} %` : '-');
    $('div.demog-readouts span[data-region="state"][data-statistic="pctobese"]').text(!isNaN(parseFloat(demogdata_state.PerObese)) ? `${demogdata_state.PerObese.toFixed(1)} %` : '-');
}


function performSearchPlaces (searchparams) {
    // fetch a list of places (cities and counties) in the selected CTA, display it into its list(s)

    // statewide, we don't display a list at all; bail
    if (searchparams.ctaid == 'Statewide') return;

    // find the cities and counties here from our preared data
    const counties = DATA_CTACOUNTY.filter(row => row.Zone == searchparams.ctaid).map(row => `${row.County} County`);
    const cities = DATA_CTACITY.filter(row => row.Zone == searchparams.ctaid).map(row => row.City);
    counties.sort();
    cities.sort();

    // create the target area and position it
    // design is that it comes in the middle of the data-filters-summary, which is kind of brittle if we change that layout, and also weird UX, but that was the decision
    const $filtersummary = $('div.data-filters-summary');
    const $putafterthisone = $filtersummary.find('span[data-filter="address"]');
    const $box = $('<span data-statistic="locations"></span>').insertAfter($putafterthisone);

    if (counties.length) {
        const text = counties.join(', ');
        const $block = $('<div></div>').html(`<b>Counties: </b>`).appendTo($box);
        $('<span></span>').text(text).appendTo($block);
    }
    if (cities.length) {
        const text = cities.join(', ');
        const $block = $('<div></div>').html(`<b>Cities: </b>`).appendTo($box);
        $('<span></span>').text(text).appendTo($block);
    }
}


function performSearchIncidenceReadout (searchparams) {
    // incidence data is two rows:
    // one row of the incidence CSV for CTA+cancer+sex+date combiantion
    // plus the Statewide row for the same cancer+sex+date combination
    // the race does not filter a row, but rather determines which fields are the relevant incidence/MOE numbers
    //
    // note that we could end up with 0 rows e.g. there is no row for Male Uterine nor Female Prostate
    // we could also end up with null values for some data, e.g. low sample sizes so they chose not to report a value
    const cancerdata_cta = DATA_CANCER.filter(row => row.Zone == searchparams.ctaid && row.years == searchparams.time && row.cancer == searchparams.site && row.sex == searchparams.sex)[0];
    const cancerdata_state = DATA_CANCER.filter(row => row.Zone == 'Statewide' && row.years == searchparams.time && row.cancer == searchparams.site && row.sex == searchparams.sex)[0];

    let text_cases_cta = 'no data';
    let text_aair_cta = 'no data';
    let text_lciuci_cta = '';
    if (cancerdata_cta) {
        const value_cases = searchparams.race ? cancerdata_cta[`${searchparams.race}_Cases`] : cancerdata_cta['Cases'];
        const value_aair = searchparams.race ? cancerdata_cta[`${searchparams.race}_AAIR`] : cancerdata_cta['AAIR'];
        const value_lci = searchparams.race ? cancerdata_cta[`${searchparams.race}_LCI`] : cancerdata_cta['LCI'];
        const value_uci = searchparams.race ? cancerdata_cta[`${searchparams.race}_UCI`] : cancerdata_cta['UCI'];

        if (value_cases != null) text_cases_cta = value_cases.toLocaleString();
        if (value_aair != null) text_aair_cta = value_aair.toFixed(1);

        if (value_cases != null && value_aair != null) {
            const lcitext = (searchparams.race ? cancerdata_cta[`${searchparams.race}_LCI`] : cancerdata_cta['LCI']).toFixed(1);
            const ucitext = (searchparams.race ? cancerdata_cta[`${searchparams.race}_UCI`] : cancerdata_cta['UCI']).toFixed(1);
            text_lciuci_cta = `(${lcitext}, ${ucitext})`;
        }
    }

    let text_cases_state = 'no data';
    let text_aair_state = 'no data';
    let text_lciuci_state = '';
    if (cancerdata_state) {
        const value_cases = searchparams.race ? cancerdata_state[`${searchparams.race}_Cases`] : cancerdata_state['Cases'];
        const value_aair = searchparams.race ? cancerdata_state[`${searchparams.race}_AAIR`] : cancerdata_state['AAIR'];
        const value_lci = searchparams.race ? cancerdata_state[`${searchparams.race}_LCI`] : cancerdata_state['LCI'];
        const value_uci = searchparams.race ? cancerdata_state[`${searchparams.race}_UCI`] : cancerdata_state['UCI'];

        if (value_cases != null) text_cases_state = value_cases.toLocaleString();
        if (value_aair != null) text_aair_state = value_aair.toFixed(1);

        if (value_cases != null && value_aair != null) {
            const lcitext = (searchparams.race ? cancerdata_state[`${searchparams.race}_LCI`] : cancerdata_state['LCI']).toFixed(1);
            const ucitext = (searchparams.race ? cancerdata_state[`${searchparams.race}_UCI`] : cancerdata_state['UCI']).toFixed(1);
            text_lciuci_state = `(${lcitext}, ${ucitext})`;
        }
    }

    // show/hide the CTA columns (well, actually, each individual cell)
    if (searchparams.ctaid == 'Statewide') {
        $('div.data-readouts [data-region="cta"]').hide();
    }
    else {
        $('div.data-readouts [data-region="cta"]').show();
    }

    // now fill in the blanks
    $('div.data-readouts span[data-region="cta"][data-statistic="cases"]').text(text_cases_cta);
    $('div.data-readouts span[data-region="cta"][data-statistic="aair"]').text(text_aair_cta);
    $('div.data-readouts span[data-region="cta"][data-statistic="lciuci"]').text(text_lciuci_cta);

    $('div.data-readouts span[data-region="state"][data-statistic="cases"]').text(text_cases_state);
    $('div.data-readouts span[data-region="state"][data-statistic="aair"]').text(text_aair_state);
    $('div.data-readouts span[data-region="state"][data-statistic="lciuci"]').text(text_lciuci_state);
}


function performSearchIncidenceChart (searchparams) {
    // incidence chart is multipl rows:
    // filter by CTA and cancer, but keep data for all sex rows, and categorize by race

    // fill in this text; they want to re-re-state the cancer selection here too
    let cancertext = getLabelFor('site', searchparams.site);
    $('div.data-readouts span[data-statistic="cancersite"]').text(cancertext);

    // filter to the cancer + CTA then sub-=filter by sex
    // note that we could end up with 0 rows for some of these, e.g. there is no row for Male Uterine nor Female Prostate
    const cancerdata = DATA_CANCER.filter(row => row.Zone == searchparams.ctaid && row.years == searchparams.time && row.cancer == searchparams.site);
    const cancerdata_both = cancerdata.filter(row => row.sex == 'Both')[0];
    const cancerdata_female = cancerdata.filter(row => row.sex == 'Female')[0];
    const cancerdata_male = cancerdata.filter(row => row.sex == 'Male')[0];

    // form the chart series, categorizing by race (which is a field, not a filter)
    const barchart_categories = [
        getLabelFor('race', ''),
        getLabelFor('race', 'W'),
        getLabelFor('race', 'B'),
        getLabelFor('race', 'H'),
        getLabelFor('race', 'A'),
    ];
    const barchart_all = [
        cancerdata_both ? cancerdata_both.AAIR : 0,
        cancerdata_both ? cancerdata_both.W_AAIR : 0,
        cancerdata_both ? cancerdata_both.B_AAIR : 0,
        cancerdata_both ? cancerdata_both.H_AAIR : 0,
        cancerdata_both ? cancerdata_both.A_AAIR : 0,
    ];
    const barchart_female = [
        cancerdata_female ? cancerdata_female.AAIR : 0,
        cancerdata_female ? cancerdata_female.W_AAIR : 0,
        cancerdata_female ? cancerdata_female.B_AAIR : 0,
        cancerdata_female ? cancerdata_female.H_AAIR : 0,
        cancerdata_female ? cancerdata_female.A_AAIR : 0,
    ];
    const barchart_male = [
        cancerdata_male ? cancerdata_male.AAIR : 0,
        cancerdata_male ? cancerdata_male.W_AAIR : 0,
        cancerdata_male ? cancerdata_male.B_AAIR : 0,
        cancerdata_male ? cancerdata_male.H_AAIR : 0,
        cancerdata_male ? cancerdata_male.A_AAIR : 0,
    ];

    const chartseries = [
        { name: 'All Sexes', data: barchart_all, color: BARCHART_COLOR_ALL },
        { name: 'Female', data: barchart_female, color: BARCHART_COLOR_FEMALE },
        { name: 'Male', data: barchart_male, color: BARCHART_COLOR_MALE },
    ];

    // chart it!
    // a special hack here to insert "data not calculated" text any place where data are 0
    // for this dataset, we know that 0 never happens and above we set nulls to be 0 for our purposes
    // we also have data labels so there will be a value label with the text 0 in it
    // the hack is to, after the chart draws, look for these labels that say "0" and replace their text

    const hackChartForNullValues = function () {
        $('#incidence-barchart g.highcharts-data-label tspan').each(function () {
            const $this = $(this);

            if ($this.text() == '0') {
                $this.text('Data cannot be calculated').get(0).classList.add('lighten');
            }
        });
    };

    Highcharts.chart('incidence-barchart', {
        chart: {
            type: 'bar',
            events: {
                load: hackChartForNullValues,
            },
        },
        plotOptions: {
            series: {
                groupPadding: 0.15,
                maxPointWidth: 12,
                animation: {
                    duration: 0
                },
                accessibility: {
                    pointDescriptionFormatter: function (point) {
                        return `${point.category}, ${point.series.name}, AAIR ${point.y}`;
                    },
                },
            },
            bar: {
                dataLabels: {
                    enabled: true,
                },
            },
        },
        legend: {
            layout: 'horizontal',
            floating: true,
            verticalAlign: 'top',
            y: -16,
            symbolRadius: 0,  // square swatches
        },
        title: null,
        xAxis: {
            categories: barchart_categories,
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: null,
            },
        },
        tooltip: false,
        credits: {
            enabled: true,
        },
        series: chartseries,
    });
}


function performSearchMap (searchparams) {
    //
    // PART 1: zoom map, highlight selected area
    //

    // if we were given a bbox, zoom to it
    if (searchparams.bbox) {
        MAP.fitBounds(searchparams.bbox);
    }

    // highlight the selected CTA
    MAP.ctapolygonbounds.eachLayer((layer) => {
        const ctaid = layer.feature.properties.Zone;
        const istheone = ctaid == searchparams.ctaid;

        if (istheone) {
            layer.setStyle(CTA_BORDER_SELECTED);
            layer.bringToFront();
        }
        else {
            layer.setStyle(CTA_BORDER_DEFAULT);
        }
    });

    // if a latlng was given in the search, place the marker
    if (searchparams.latlng) {
        MAP.addressmarker.setLatLng(searchparams.latlng).addTo(MAP);
    }
    else {
        MAP.addressmarker.setLatLng([0, 0]).removeFrom(MAP);
    }

    //
    // PART 2: choropleth
    //

    // the map has a CTA polygons layer, showing all CTAs
    // the choropleth shown depends on the cancer+sex filters and race column, kind of like the incidence readout
    // but the choropleth and its legend will be quantiled by EITHER the Cases or AAIR count,
    // depending on a UI in a map control  (why I don't believe in components; nothing ever has "single resonsibility")

    // rank the CTAs by what... depends on this crazy map control
    const rankthemby = MAP.choroplethcontrol.getSelection();

    // the data for ramp scoring: may be cancer data, may be demogaphic data
    // hash out a dict: CTA/Zone ID => score, for quick access later when we want to score the polygons
    // scores may be based on cancerdata row, or may be based on demographics
    const ctascores = {};

    if (['Cases', 'AAIR'].indexOf(rankthemby) != -1) {
        DATA_CANCER
        .filter(row => row.Zone != 'Statewide')
        .filter(row => row.years == searchparams.time && row.cancer == searchparams.site && row.sex == searchparams.sex)
        .forEach((row) => {
            let choropleth_score;
            switch (rankthemby) {
                case 'Cases':
                    choropleth_score = searchparams.race ? row[`${searchparams.race}_Cases`] : row.Cases;
                    break;
                case 'AAIR':
                    choropleth_score = searchparams.race ? row[`${searchparams.race}_AAIR`] : row.AAIR;
                    break;
            }
            ctascores[row.Zone] = choropleth_score;
        });
    }

    if (['NSES', 'Uninsured', 'White', 'Black', 'Hispanic', 'Asian', 'Foreign', 'Rural', 'Checkups', 'Delayed', 'Colorectal', 'Mammogram', 'Pap', 'PrevMen', 'PrevWomen', 'Obesity', 'FoodInsecure', 'Activity', 'Smoking'].indexOf(rankthemby) != -1) {
        DATA_DEMOGS
        .forEach((row) => {
            let choropleth_score;
            switch (rankthemby) {
                case 'NSES':
                    choropleth_score = row.QNSES;  // technically QSNES is already a quintile number; they did the math correctly so when we compute quintiles below, they match up perfectly
                    break;
                case 'Uninsured':
                    choropleth_score = row.PerUninsured;
                    break;
                case 'White':
                    choropleth_score = row.PerWhite;
                    break;
                case 'Black':
                    choropleth_score = row.PerBlack;
                    break;
                case 'Hispanic':
                    choropleth_score = row.PerHispanic;
                    break;
                case 'Asian':
                    choropleth_score = row.PerAPI;
                    break;
                case 'Foreign':
                    choropleth_score = row.PerForeignBorn;
                    break;
                case 'Rural':
                    choropleth_score = row.PerRural;
                    break;
                case 'Checkups':
                    choropleth_score = row.PerDocvisit;
                    break;
                case 'Delayed':
                    choropleth_score = row.PerDelayCare;
                    break;
                case 'Colorectal':
                    choropleth_score = row.PerFOBT;
                    break;
                case 'Mammogram':
                    choropleth_score = row.PerMammo;
                    break;
                case 'Pap':
                    choropleth_score = row.PerPap;
                    break;
                case 'PrevMen':
                    choropleth_score = row.PerMenPrev;
                    break;
                case 'PrevWomen':
                    choropleth_score = row.PerWomenPrev;
                    break;
                case 'Obesity':
                    choropleth_score = row.PerObese;
                    break;
                case 'FoodInsecure':
                    choropleth_score = row.PerFoodInsec;
                    break;
                case 'Activity':
                    choropleth_score = row.Per150minPA;
                    break;
                case 'Smoking':
                    choropleth_score = row.PerCurrSmk;
                    break;
            }
            ctascores[row.Zone] = choropleth_score;
        });
    }

    // find the min and max
    // again we may end up with bunk data, e.g. no data for All Breast or Male Uterine
    // and we need to mak pretty versions: commas for ints, and 1 decimal for floats, depending on the value we're showing
    const allscores = Object.values(ctascores).filter(function (score) { return score; });
    const scoringmin = Math.min(...allscores);
    const scoringmax = Math.max(...allscores);

    let scoremintext = scoringmin == Infinity ? 'No Data' : scoringmin;
    let scoremaxtext = scoringmax == -Infinity ? 'No Data' : scoringmax;
    switch (rankthemby) {
        case 'Cases':  // integers; add commas
            scoremaxtext = isNaN(scoremaxtext) ? scoremaxtext : scoremaxtext.toLocaleString();
            scoremintext = isNaN(scoremintext) ? scoremintext : scoremintext.toLocaleString();
            break;
        case 'AAIR': // floats, round to 1 decimal
        case 'Uninsured':
        case 'White':
        case 'Black':
        case 'Hispanic':
        case 'Asian':
        case 'Foreign':
        case 'Rural':
        case 'Checkups':
        case 'Delayed':
        case 'Colorectal':
        case 'Mammogram':
        case 'Pap':
        case 'PrevMen':
        case 'PrevWomen':
        case 'Obesity':
        case 'FoodInsecure':
        case 'Activity':
        case 'Smoking':
            scoremaxtext = isNaN(scoremaxtext) ? scoremaxtext : scoremaxtext.toFixed(1);
            scoremintext = isNaN(scoremintext) ? scoremintext : scoremintext.toFixed(1);
            break;
    }
    MAP.choroplethcontrol.setMinMax(scoremintext, scoremaxtext);

    // find quantiles to make up 5 classes, for use in the choropleth assignments coming up
    // thanks to buboh at https://stackoverflow.com/questions/48719873/how-to-get-median-and-quartiles-percentiles-of-an-array-in-javascript-or-php
    const asc = arr => arr.sort((a, b) => a - b);
    const quantile = (arr, q) => {
        const sorted = asc(arr);
        const pos = ((sorted.length) - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if ((sorted[base + 1] !== undefined)) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };

    const q1brk = quantile(allscores, .20);
    const q2brk = quantile(allscores, .40);
    const q3brk = quantile(allscores, .60);
    const q4brk = quantile(allscores, .80);

    // choropleth assignments: based on the quantile AND which color ramp we want to use, to style the polygon fills
    let whichcolorramp;
    switch (rankthemby) {
        case 'Cases':
        case 'AAIR':
            whichcolorramp = CTA_STYLE_INCIDENCE;
            break;
        case 'NSES':
        case 'Uninsured':
        case 'White':
        case 'Black':
        case 'Hispanic':
        case 'Asian':
        case 'Foreign':
        case 'Rural':
        case 'Checkups':
        case 'Delayed':
        case 'Colorectal':
        case 'Mammogram':
        case 'Pap':
        case 'PrevMen':
        case 'PrevWomen':
        case 'Obesity':
        case 'FoodInsecure':
        case 'Activity':
        case 'Smoking':
            whichcolorramp = CTA_STYLE_DEMOG;
            break;
    }

    MAP.ctapolygonfills.eachLayer((layer) => {
        const ctaid = layer.feature.properties.Zone;
        const score = ctascores[ctaid];

        let style;
        if (score == null || score == undefined) {
            style = Object.assign({}, CTA_STYLE_NODATA);
        }
        else {
            let bucket = 'Q5';
            if (score <= q1brk) bucket = 'Q1';
            else if (score <= q2brk) bucket = 'Q2';
            else if (score <= q3brk) bucket = 'Q3';
            else if (score <= q4brk) bucket = 'Q4';

            style = Object.assign({}, whichcolorramp[bucket]);  // take a copy!
        }

        layer.setStyle(style);
    });
}


function performSearchUpdateDataDownloadLinks (searchparams) {
    const $downloadlink = $('#downloadoptions a[data-export="zonedata"]');

    if (searchparams.ctaid == 'Statewide') {
        $downloadlink.hide().prop('href', 'javascript:void(0);');
    }
    else {
        const zipfilename = `zone_${searchparams.ctaid}.zip`;
        const zipurl = `static/downloads/${zipfilename}`;
        $downloadlink.show().prop('href', zipurl).attr('data-ctaid', searchparams.ctaid);
    }
}


function geocodeAddress (address, callback) {
    // if it looks like a lat,lng string then just split it up and hand it back
    // that's used for zooming to a specific latlng point, and by clicking the map to see what zone is there
    const islatlng = address.match(/\s*(\-?\d+\.\d+)\s*,\s*(\-?\d+\.\d+)\s*/);
    if (islatlng) {
        const coordinates = [parseFloat(islatlng[1]), parseFloat(islatlng[2])];
        return callback(coordinates);
    }

    // if this is in the cache already, just hand it back as-is
    if (GEOCODE_CACHE[address]) {
        return callback(GEOCODE_CACHE[address]);
    }

    // send it off to Bing geocoder
    if (! BING_API_KEY) return alert("Cannot look up addresses because BING_API_KEY has not been set.");

    const url = `https://dev.virtualearth.net/REST/v1/Locations?query=${encodeURIComponent(address)}&key=${BING_API_KEY}&s=1`;
    $.ajax({
        url: url,
        dataType: "jsonp",
        jsonp: "jsonp",
        success: function (results) {
            if (results.resourceSets && results.resourceSets[0].resources.length) {
                const result = results.resourceSets[0].resources[0];
                GEOCODE_CACHE[address] = result.point.coordinates;  // add it to the cache, this is L.LatLng compatible
                callback(result.point.coordinates);
            }
            else {
                callback(null);
            }
        },
        error: function (e) {
            return alert("There was a problem finding that address. Please try again.");
        }
    });
}


function getLabelFor (fieldname, value) {
    // utility function: examine the given SELECT element and find the text for the given value
    // thus the pickers' options become the source of truth for labeling these
    // which we do in a bunch of places: bar chart series, text readouts demographic readouts, ...

    const $picker = $(`div.data-filters select[name="${fieldname}"]`);
    const $option = $picker.find(`option[value="${value}"]`);
    const labeltext = $option.text();

    return labeltext;
}


function getOptionCount (fieldname) {
    const $picker = $(`div.data-filters select[name="${fieldname}"]`);
    const $options = $picker.find('option');
    return $options.length;
}


function compileParams (addextras=false) {
    const $searchwidgets = $('div.data-filters input[type="text"], div.data-filters select');

    // these params are always present: the core search params
    const params = {
        address: $searchwidgets.filter('[name="address"]').val(),
        sex: $searchwidgets.filter('[name="sex"]').val(),
        site: $searchwidgets.filter('[name="site"]').val(),
        race: $searchwidgets.filter('[name="race"]').val(),
        time: $searchwidgets.filter('[name="time"]').val(),
    };

    // these are only used for some weird cases such as URL params not for searching
    if (addextras) {
        params.overlays = MAP.layerpicker.getLayerStates()
            .filter(layerinfo => layerinfo.checked)
            .map(layerinfo => layerinfo.id)
            .join(',');
        if (! params.overlays) params.overlays = 'none';  // so we always have something, even if it's all layers off

        params.choropleth = MAP.choroplethcontrol.getSelection();
    }

    // done
    return params;
}

function updateUrlParams () {
    const baseurl = document.location.href.indexOf('?') == -1 ? document.location.href : document.location.href.substr(0, document.location.href.indexOf('?'));
    const params = compileParams(true);
    const url = baseurl + '?' + jQuery.param(params);
    window.history.replaceState({}, '', url);
}


function findCTAContainingLatLng (inputlatlng) {
    // accept a [lat,lng] or a L.LatLng, and standardize on one... let's go with L.LatLng object
    const latlng = inputlatlng.hasOwnProperty('length') ? L.latLng(inputlatlng[0], inputlatlng[1]) : inputlatlng;

    // yay Leaflet-PIP
    const containingcta = leafletPip.pointInLayer(latlng, MAP.ctapolygonfills);

    return containingcta[0];
}


function findCTAById (ctaid) {
    const targetcta = MAP.ctapolygonfills.getLayers().filter(function (layer) {
        return layer.feature.properties.Zone == ctaid;
    });
    return targetcta[0];
}


function toggleAddressSearchFailure (message) {
    const $textarea = $('div.data-filters label[for="data-filters-address"] span');

    if (message) {
        $textarea.text(message).removeClass('d-none');
    }
    else {
        $textarea.text('').addClass('d-none');
    }
}


// Google Analytics wrapper cuz we log a whole lot of small actions such as clickers being clicked
function logGoogleAnalyticsEvent (type, subtype, detail) {
    // console.debug([ 'Google Analytics Event', type, subtype, detail]);

    if (typeof gtag !== 'function') return;  // they may not have it set up

    gtag('event', type, {
        'event_category': subtype,
        'event_label': detail,
    });
}
