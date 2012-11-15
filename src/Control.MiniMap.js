L.Control.MiniMap = L.Control.extend({
	options: {
		position: 'bottomright',
		zoomLevelOffset: -5,
		zoomAnimation: false
	},
	//layer is the map layer to be shown in the minimap
	initialize: function (layer, options) {
		L.Util.setOptions(this, options);
		this._layer = layer;
	},

	onAdd: function (map) {

		this._mainMap = map;

		this._container = L.DomUtil.create('div', 'leaflet-control-minimap');
		L.DomEvent.disableClickPropagation(this._container);
		L.DomEvent.on(this._container, 'mousewheel', L.DomEvent.stopPropagation);

		this._miniMap = new L.Map(this._container, 
		{
			attributionControl: false, 
			zoomControl: false, 
			zoomAnimation: this.options.zoomAnimation
		});
		this._miniMap.addLayer(this._layer);

		/*Curious workaround: For some reason (possibly the DOM not being completely set up so that the map window
		* is not actually drawn yet?) if you set the view here the minimap window will not manage
		* to calculate tile positions properly and you get a corrupted map. Defer this one millisecond so that this
		* method finishes and the DOM catches up, and it works fine. */
		setTimeout(L.Util.bind(function () 
			{
				this._miniMap.setView(this._mainMap.getCenter(), this._mainMap.getZoom() + this.options.zoomLevelOffset);
			}, this), 1);

		//These bools are used to prevent infinite loops of the two maps notifying each other that they've moved.
		this._mainMapMoving = false;
		this._miniMapMoving = false;

		this._mainMap.on('moveend', this._onMainMapMoved, this);
		this._miniMap.on('moveend', this._onMiniMapMoved, this);

		return this._container;
	},

	onRemove: function (map) {
		map.off('moveend', this._onMainMapMoved)
	},
	
	_onMainMapMoved: function (e) {
		if (!this._miniMapMoving) {
			this._mainMapMoving = true;
			this._miniMap.setView(this._mainMap.getCenter(), this._mainMap.getZoom() + this.options.zoomLevelOffset);
		} else {
			this._miniMapMoving = false;
		}
	},

	_onMiniMapMoved: function (e) {
	if (!this._mainMapMoving) {
			this._miniMapMoving = true;
			this._mainMap.setView(this._miniMap.getCenter(), this._miniMap.getZoom() - this.options.zoomLevelOffset);
		} else {
			this._mainMapMoving = false;
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
