// custom crafted control for this one project
// a legend control to switch between Cases and Incidence choropleths
L.Control.ChoroplethLegend = L.Control.extend({
	options: {
		position: 'topright',
        expanded: false,
        onChoroplethChange: function () {},
	},
	initialize: function(options) {
		L.setOptions(this,options);
	},
	onAdd: function (map) {
		this._map = map;

		// create our container
		this.container = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-choroplethlegend-control leaflet-choroplethlegend-collapsed');
		this.content_collapsed = L.DomUtil.create('div', 'leaflet-choroplethlegend-button', this.container);
		this.content_expanded = L.DomUtil.create('div', 'leaflet-choroplethlegend-content', this.container);

        // our closed state: a button to open
		this.content_collapsed.innerHTML = '<i class="fa fa-bars"></i>';

        // expanded content

        // close button
        this.closebutton = L.DomUtil.create('i', 'leaflet-choroplethlegend-closebutton', this.content_expanded);
        this.closebutton.innerHTML = '&times;';

        // head text
        this.headtext = L.DomUtil.create('div', 'leaflet-choroplethlegend-headtext', this.content_expanded);
        this.headtext.innerHTML = 'Color By';

        // gradient type selector
        this.choroplethselector = L.DomUtil.create('select', 'leaflet-choroplethlegend-select', this.content_expanded);
		this.choroplethselector.setAttribute('aria-label', 'Select how to color the map');

        this.option_cases = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_cases.innerHTML = 'Cases';
        this.option_cases.value = 'Cases';
        this.option_cases.setAttribute('data-legend', 'incidence');

        this.option_aair = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_aair.innerHTML = 'Incidence';
        this.option_aair.value = 'AAIR';
        this.option_aair.setAttribute('data-legend', 'incidence');

        this.option_aair = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_aair.innerHTML = 'Socioeconomic Status';
        this.option_aair.value = 'NSES';
        this.option_aair.setAttribute('data-legend', 'demographic');

        this.option_unins = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_unins.innerHTML = '% Uninsured';
        this.option_unins.value = 'Uninsured';
        this.option_unins.setAttribute('data-legend', 'demographic');

        this.option_white = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_white.innerHTML = '% Non-Hispanic White';
        this.option_white.value = 'White';
        this.option_white.setAttribute('data-legend', 'demographic');

        this.option_black = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_black.innerHTML = '% Non-Hispanic Black';
        this.option_black.value = 'Black';
        this.option_black.setAttribute('data-legend', 'demographic');

        this.option_hisp = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_hisp.innerHTML = '% Hispanic';
        this.option_hisp.value = 'Hispanic';
        this.option_hisp.setAttribute('data-legend', 'demographic');

        this.option_asian = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_asian.innerHTML = '% Asian/Pacific Islander';
        this.option_asian.value = 'Asian';
        this.option_asian.setAttribute('data-legend', 'demographic');

        this.option_foreign = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_foreign.innerHTML = '% Foreign-Born';
        this.option_foreign.value = 'Foreign';
        this.option_foreign.setAttribute('data-legend', 'demographic');

        this.option_rural = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_rural.innerHTML = '% Rural';
        this.option_rural.value = 'Rural';
        this.option_rural.setAttribute('data-legend', 'demographic');
        
        this.option_checkups = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_checkups.innerHTML = '% Routine Checkups';
        this.option_checkups.value = 'Checkups';
        this.option_checkups.setAttribute('data-legend', 'demographic');
        
        this.option_delayed = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_delayed.innerHTML = '% Delayed Care';
        this.option_delayed.value = 'Delayed';
        this.option_delayed.setAttribute('data-legend', 'demographic');
        
        this.option_colorectal = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_colorectal.innerHTML = '% Colorectal Cancer Screening';
        this.option_colorectal.value = 'Colorectal';
        this.option_colorectal.setAttribute('data-legend', 'demographic');
        
        this.option_mammogram = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_mammogram.innerHTML = '% Mammograms';
        this.option_mammogram.value = 'Mammogram';
        this.option_mammogram.setAttribute('data-legend', 'demographic');
        
        this.option_pap = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_pap.innerHTML = '% Pap Smears';
        this.option_pap.value = 'Pap';
        this.option_pap.setAttribute('data-legend', 'demographic');
        
        this.option_prevmen = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_prevmen.innerHTML = '% Preventive Care (Men, 65+ years)';
        this.option_prevmen.value = 'PrevMen';
        this.option_prevmen.setAttribute('data-legend', 'demographic');
        
        this.option_prevwomen = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_prevwomen.innerHTML = '% Preventive Care (Women, 65+ years)';
        this.option_prevwomen.value = 'PrevWomen';
        this.option_prevwomen.setAttribute('data-legend', 'demographic');
        
        this.option_obesity = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_obesity.innerHTML = '% Adult Obesity';
        this.option_obesity.value = 'Obesity';
        this.option_obesity.setAttribute('data-legend', 'demographic');
        
        this.option_foodinsecure = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_foodinsecure.innerHTML = '% Food Insecure';
        this.option_foodinsecure.value = 'FoodInsecure';
        this.option_foodinsecure.setAttribute('data-legend', 'demographic');
        
        this.option_activity = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_activity.innerHTML = '% Physical Activity';
        this.option_activity.value = 'Activity';
        this.option_activity.setAttribute('data-legend', 'demographic');
        
        this.option_smoking = L.DomUtil.create('option', '', this.choroplethselector);
        this.option_smoking.innerHTML = '% Smoking';
        this.option_smoking.value = 'Smoking';
        this.option_smoking.setAttribute('data-legend', 'demographic');

        // the gradient legend and the min/max value words
        this.legendgradient = L.DomUtil.create('div', 'leaflet-choroplethlegend-legendgradient', this.content_expanded);
        this.legendminvalue = L.DomUtil.create('div', 'leaflet-choroplethlegend-minvalue', this.content_expanded);
        this.legendmaxvalue = L.DomUtil.create('div', 'leaflet-choroplethlegend-maxvalue', this.content_expanded);

		// stop mouse events from falling through (Leaflet 1.x)
        L.DomEvent.disableClickPropagation(this.container);
        L.DomEvent.disableScrollPropagation(this.container);

		// click X to close & click closed version to open
        // ARIA/508 translate hitting enter as clicking
		L.DomEvent.addListener(this.content_collapsed, 'keydown', (event) => {
            if (event.keyCode == 13) this.content_collapsed.click();
		});
		L.DomEvent.addListener(this.closebutton, 'keydown', (event) => {
            if (event.keyCode == 13) this.closebutton.click();
		});

		L.DomEvent.addListener(this.content_collapsed, 'click', () => {
			this.expand();
		});
		L.DomEvent.addListener(this.closebutton, 'click', () => {
			this.collapse();
		});
        if (this.options.expanded) {
            setTimeout(() => {
                this.expand();
            }, 0.5 * 1000);
        }

		// enable keyboard interactions
        if (this._map.options.keyboard) {
            this.content_collapsed.tabIndex = 0;
            this.closebutton.tabIndex = 0;
        }

        // when the selector is changed, call the suppled callback
        // see also setMinMax()
        L.DomEvent.addListener(this.choroplethselector, 'change', () => {
			// call our callback to do whatever it is they wanted
            const value = this.getSelection();
            this.options.onChoroplethChange(value);

			// reassign our legend gradient's CSS class to match the newly-selected layer
			const whichlegend = this.choroplethselector.options[this.choroplethselector.selectedIndex].getAttribute('data-legend');
			L.DomUtil.removeClass(this.legendgradient, 'leaflet-choroplethlegend-ramp-demographic');
			L.DomUtil.removeClass(this.legendgradient, 'leaflet-choroplethlegend-ramp-incidence');
			L.DomUtil.addClass(this.legendgradient, `leaflet-choroplethlegend-ramp-${whichlegend}`);
        });

		// all done
		return this.container;
	},
	expand: function (html) {
		L.DomUtil.addClass(this.container, 'leaflet-choroplethlegend-expanded');
		L.DomUtil.removeClass(this.container, 'leaflet-choroplethlegend-collapsed');
	},
	collapse: function (html) {
		L.DomUtil.removeClass(this.container, 'leaflet-choroplethlegend-expanded');
		L.DomUtil.addClass(this.container, 'leaflet-choroplethlegend-collapsed');
	},
    getSelection: function () {
        const value = this.choroplethselector.options[this.choroplethselector.selectedIndex].value;
        return value;
    },
	getSelectionLabel: function () {
        const text = this.choroplethselector.options[this.choroplethselector.selectedIndex].innerHTML;
        return text;
	},
	setSelection(newvalue) {
		// see also the event listener that makes stuff happen
		this.choroplethselector.value = newvalue;

		var event = new Event('change');
		this.choroplethselector.dispatchEvent(event);
	},
    setMinMax: function (minvalue, maxvalue) {
        this.legendminvalue.innerHTML = minvalue;
        this.legendmaxvalue.innerHTML = maxvalue;
    },
	setPrintMode: function (printmodeon) {
		// highly contrived to this use case: CSS rules exist to suppress and alter some elements when in "print mode"
		if (printmodeon) {
			L.DomUtil.addClass(this._container, 'leaflet-choroplethlegend-printmode');
		}
		else {
			L.DomUtil.removeClass(this._container, 'leaflet-choroplethlegend-printmode');
		}
	},
});
