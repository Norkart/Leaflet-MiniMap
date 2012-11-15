L.Control.MiniMap = L.Control.extend({
	options: {
		position: 'bottomright',
		zoomLevelOffset: -5,
		zoomLevelFixed: false,
		zoomAnimation: false,
		width: 150,
		height: 150
	},
	//layer is the map layer to be shown in the minimap
	initialize: function (layer, options) {
		L.Util.setOptions(this, options);
		this._layer = layer;
	},

	onAdd: function (map) {

		this._mainMap = map;

		//Creating the container and stopping events from spilling through to the main map.
		this._container = L.DomUtil.create('div', 'leaflet-control-minimap');
		this._container.style.width = this.options.width + 'px';
		this._container.style.height = this.options.height + 'px';
		L.DomEvent.disableClickPropagation(this._container);
		L.DomEvent.on(this._container, 'mousewheel', L.DomEvent.stopPropagation);

		this._miniMap = new L.Map(this._container, 
		{
			attributionControl: false, 
			zoomControl: false, 
			zoomAnimation: this.options.zoomAnimation,
			touchZoom: !this.options.zoomLevelFixed,
			scrollWheelZoom: !this.options.zoomLevelFixed,
			doubleClickZoom: !this.options.zoomLevelFixed,
			boxZoom: !this.options.zoomLevelFixed,
		});
		this._miniMap.addLayer(this._layer);

		/*Curious workaround: For some reason (possibly the DOM not being completely set up so that the map window
		* is not actually drawn yet?) if you set the view here the minimap window will not manage
		* to calculate tile positions properly and you get a corrupted map. Defer this one millisecond so that this
		* method finishes and the DOM catches up, and it works fine. */
		setTimeout(L.Util.bind(function () 
			{
				this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(true));
				this._aimingRect = L.rectangle(this._mainMap.getBounds(), {color: "#ff7800", weight: 1, clickable: false}).addTo(this._miniMap);
			}, this), 1);

		//These bools are used to prevent infinite loops of the two maps notifying each other that they've moved.
		this._mainMapMoving = false;
		this._miniMapMoving = false;

		this._mainMap.on('moveend', this._onMainMapMoved, this);
		this._mainMap.on('move', this._onMainMapMoving, this);
		this._miniMap.on('moveend', this._onMiniMapMoved, this);

		return this._container;
	},

	onRemove: function (map) {
		map.off('moveend', this._onMainMapMoved)
	},
	
	_onMainMapMoved: function (e) {
		if (!this._miniMapMoving) {
			this._mainMapMoving = true;
			this._miniMap.setView(this._mainMap.getCenter(), this._decideZoom(true));
		} else {
			this._miniMapMoving = false;
		}
		this._aimingRect.setBounds(this._mainMap.getBounds());
	},

	_onMainMapMoving: function (e) {
		this._aimingRect.setBounds(this._mainMap.getBounds());
	},

	_onMiniMapMoved: function (e) {
	if (!this._mainMapMoving) {
			this._miniMapMoving = true;
			this._mainMap.setView(this._miniMap.getCenter(), this._decideZoom(false));
		} else {
			this._mainMapMoving = false;
		}
	},

	_decideZoom: function (fromMaintoMini) {
		if (!this.options.zoomLevelFixed) {
			if (fromMaintoMini)
				return this._mainMap.getZoom() + this.options.zoomLevelOffset;
			else
				return this._miniMap.getZoom() - this.options.zoomLevelOffset;
		} else {
			if (fromMaintoMini)
				return this.options.zoomLevelFixed;
			else
				return this._mainMap.getZoom();
		}
	}

});

L.Map.mergeOptions({
	miniMapControl: false
});

L.Map.addInitHook(function () {
	if (this.options.miniMapControl) {
		this.miniMapControl = (new L.Control.MiniMap()).addTo(this);
	}
});

L.control.minimap = function (options) {
	return new L.Control.MiniMap(options);
};
