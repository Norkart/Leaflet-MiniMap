L.Control.RTSMiniMap = L.Control.extend({
	options: {
		position: 'bottomright',
		toggleDisplay: false,
		zoomLevelOffset: -5,
		zoomLevelFixed: false,
		zoomAnimation: false,
		autoToggleDisplay: false,
		width: 150,
		height: 150,
		aimingRectOptions: {
			color: "#ff7800",
			weight: 1,
			clickable: false
		},
	},

	hideText: 'Hide MiniMap',

	showText: 'Show MiniMap',

	clear: function() {
		this._canvasLayer._points = [];
		this._canvasLayer.redraw();
	},

	addPoint: function(position, color) {
		var point = position;
		if (color) {
			if (!color.a) {
				color.a = 128;
			}
			point._pixelColor = color;
		} else {
			point._pixelColor = {r:255,v:0,b:0,a:128};
		}
		this._canvasLayer._points.push(point);
	},

	render: function() {
		if (this._canvasLayer._points.length) {
			if (!this._animatedRender) {
				this._miniMap.fitBounds(this._canvasLayer._points, {animate:false});
				this._animatedRender = true;
			} else {
				this._miniMap.fitBounds(this._canvasLayer._points);
			}
		}
		// Sometimes the fitBounds doesn't change the view
		// so we need to redraw the map manually
		this._canvasLayer.redraw();
	},

	//layer is the map layer to be shown in the minimap
	initialize: function(layer, options) {
		L.Util.setOptions(this, options);
		//Make sure the aiming rects are non-clickable even if the user tries to set them clickable (most likely by forgetting to specify them false)
		this.options.aimingRectOptions.clickable = false;
		this._layer = layer;



	},

	onAdd: function(map) {

		this._mainMap = map;

		//Creating the container and stopping events from spilling through to the main map.
		this._container = L.DomUtil.create('div', 'leaflet-control-minimap leaflet-control-minimap-rts');
		this._container.style.width = this.options.width + 'px';
		this._container.style.height = this.options.height + 'px';
		L.DomEvent.disableClickPropagation(this._container);
		L.DomEvent.on(this._container, 'mousewheel', L.Util.bind(this._onMouseWheel, this));
		L.DomEvent.on(this._container, 'dblclick', L.DomEvent.stopPropagation);

		this._miniMap = new L.Map(this._container, {
			attributionControl: false,
			zoomControl: false,
			dragging: false,
			touchZoom: false,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			boxZoom: false,
			crs: map.options.crs
		});

		this._miniMap.addLayer(this._layer);
		this._canvasLayer = new L.control.minimap.pixelsView();
		this._canvasLayer._miniMap = this._miniMap;
		this._canvasLayer._points = [];
		this._miniMap.addLayer(this._canvasLayer);

		//Keep a record of this to prevent auto toggling when the user explicitly doesn't want it.
		this._userToggledDisplay = false;
		this._minimized = false;

		if (this.options.toggleDisplay) {
			this._addToggleButton();
		}

		this._animatedRender = false;

		this._miniMap.whenReady(L.Util.bind(function() {
			this._aimingRect = L.rectangle(this._mainMap.getBounds(), this.options.aimingRectOptions).addTo(this._miniMap);
			this._mainMap.on('move', this._onMainMapMoving, this);

			this._miniMap.on('mousedown', function(e) {
				this._onMiniMapClick(e);
				L.DomUtil.addClass(this._container, 'mousedown');
				this._miniMap.on('mousemove', this._onMiniMapClick, this);
			}, this);
			this._miniMap.on('mouseup', function() {
				L.DomUtil.removeClass(this._container, 'mousedown');
				this._miniMap.off('mousemove', this._onMiniMapClick, this);
			}, this);


		}, this));

		return this._container;
	},

	addTo: function(map) {
		L.Control.prototype.addTo.call(this, map);
		this._miniMap.setView(this._mainMap.getCenter(), Math.max(this._mainMap.getZoom()-5, 3));
		this._setDisplay(this._decideMinimized());
		return this;
	},

	onRemove: function(map) {
		this._mainMap.off('move', this._onMainMapMoving, this);

		this._miniMap.removeLayer(this._layer);
	},

	_addToggleButton: function() {
		this._toggleDisplayButton = this.options.toggleDisplay ? this._createButton(
			'', this.hideText, 'leaflet-control-minimap-toggle-display', this._container, this._toggleDisplayButtonClicked, this) : undefined;
	},

	_createButton: function(html, title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		var stop = L.DomEvent.stopPropagation;

		L.DomEvent
			.on(link, 'click', stop)
			.on(link, 'mousedown', stop)
			.on(link, 'dblclick', stop)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context);

		return link;
	},

	_toggleDisplayButtonClicked: function() {
		this._userToggledDisplay = true;
		if (!this._minimized) {
			this._minimize();
			this._toggleDisplayButton.title = this.showText;
		} else {
			this._restore();
			this._toggleDisplayButton.title = this.hideText;
		}
	},

	_setDisplay: function(minimize) {
		if (minimize != this._minimized) {
			if (!this._minimized) {
				this._minimize();
			} else {
				this._restore();
			}
		}
	},

	_minimize: function() {
		// hide the minimap
		if (this.options.toggleDisplay) {
			this._container.style.width = '19px';
			this._container.style.height = '19px';
			this._toggleDisplayButton.className += ' minimized';
		} else {
			this._container.style.display = 'none';
		}
		this._minimized = true;
	},

	_restore: function() {
		if (this.options.toggleDisplay) {
			this._container.style.width = this.options.width + 'px';
			this._container.style.height = this.options.height + 'px';
			this._toggleDisplayButton.className = this._toggleDisplayButton.className
				.replace(/(?:^|\s)minimized(?!\S)/g, '');
		} else {
			this._container.style.display = 'block';
		}
		this._minimized = false;
	},

	_onMainMapMoving: function(e) {
		this._aimingRect.setBounds(this._mainMap.getBounds());
	},

	_onMiniMapClick: function(e) {
		this._mainMap.setView(e.latlng, this._mainMap.getZoom(), {
			animate: false
		});
	},

	_onMouseWheel: function(e) {
		var delta = L.DomEvent.getWheelDelta(e),
			containerPoint = this._miniMap.mouseEventToContainerPoint(e),
			latlng = this._miniMap.containerPointToLatLng(containerPoint);

		this._mainMap.setView(latlng, this._mainMap.getZoom() + delta);

		L.DomEvent.stopPropagation(e);
	},

	_decideMinimized: function() {
		if (this._userToggledDisplay) {
			return this._minimized;
		}

		if (this.options.autoToggleDisplay) {
			if (this._mainMap.getBounds().contains(this._miniMap.getBounds())) {
				return true;
			}
			return false;
		}

		return this._minimized;
	}
});

L.Map.mergeOptions({
	miniMapControl: false
});

L.Map.addInitHook(function() {
	if (this.options.miniMapControl) {
		this.miniMapControl = (new L.Control.MiniMap()).addTo(this);
	}
});

L.control.minimap = function(options) {
	return new L.Control.MiniMap(options);
};

L.control.minimap.pixelsView = L.CanvasLayer.extend({
	render: function() {
		var canvas = this.getCanvas(),
			ctx = canvas.getContext('2d'),
			ctxWidth = canvas.width,
			ctxHeight = canvas.height;

		// Clear the view
		ctx.clearRect(0, 0, ctxWidth, ctxHeight);
		// ctx.fillStyle = 'rgba(0,0,0,0.1)'
		// ctx.fillRect(0, 0, ctxWidth, ctxHeight);

		var canvasData = this._ctx.getImageData(0, 0, ctxWidth, ctxHeight),
			data = canvasData.data;

		// Draw the points in a oldschool way (ctx.fillRect is not fun enough)
		var points = this._points;
		for (var i = 0, l = points.length; i < l; ++i) {
			var p = points[i];
			var pos = this._miniMap.latLngToLayerPoint(p);
			var color = p._pixelColor;

			var x = pos.x,
				y = pos.y;

			var pixel = (x + y * ctxWidth) * 4;

			data[pixel] = color.r;
			data[pixel + 1] = color.g;
			data[pixel + 2] = color.b;
			data[pixel + 3] = Math.min(color.a + data[pixel + 3], 255);

			if (x < ctxWidth) {
				pixel += 4;
				data[pixel] = color.r;
				data[pixel + 1] = color.g;
				data[pixel + 2] = color.b;
				data[pixel + 3] = Math.min(color.a + data[pixel + 3], 255);
			}

			if (y < ctxHeight) {
				pixel += ctxHeight * 4 - 4;
				data[pixel] = color.r;
				data[pixel + 1] = color.g;
				data[pixel + 2] = color.b;
				data[pixel + 3] = Math.min(color.a + data[pixel + 3], 255);
				if (x < ctxWidth) {
					pixel += 4;
					data[pixel] = color.r;
					data[pixel + 1] = color.g;
					data[pixel + 2] = color.b;
					data[pixel + 3] = Math.min(color.a + data[pixel + 3], 255);
				}
			}
		}

		ctx.putImageData(canvasData, 0, 0);
	}
});