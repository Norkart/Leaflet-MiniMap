# Leaflet.MiniMap

Leaflet.MiniMap is a simple minimap control that you can drop into your leaflet map, and it will create a small map in the corner which shows the same as the main map with a set zoom offset. (By default it is -5.)

## Using the MiniMap control

The control can be inserted in two lines: First you have to construct a layer for it to use, and then you create and attach the minimap control. (Don't reuse the layer you added to the main map, strange behaviour will ensue...)

From the [example](http://norkart.github.com/Leaflet-MiniMap/example.html):
    
    var osm2 = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 13, attribution: osmAttrib});
    var miniMap = new L.Control.MiniMap(osm2).addTo(map);

As the minimap control inherits from leaflet's control, positioning is handled automatically by leaflet. However, you can still style the minimap and set its size by modifying the css file.

## Available Options
 The mini map uses options which can be set in the same way as other leaflet options, and these are the available options:

`position:` The standard Leaflet.Control position parameter, used like all the other controls. Defaults to 'bottomright'.

`width:` The width of the minimap in pixels. Defaults to 150.

`height:` The height of the minimap in pixels. Defaults to 150.

`toggleDisplay:` When set to true, adds a button to minimize or maximize the minimap.

`zoomLevelOffset:` The offset applied to the zoom in the minimap compared to the zoom of the main map. Can be positive or negative, defaults to -5.

`zoomLevelFixed:` Overrides the offset to apply a fixed zoom level to the minimap regardless of the main map zoom. Set it to any valid zoom level, if unset `zoomLevelOffset` is used instead.

`zoomAnimation:` Sets whether the minimap should have an animated zoom. (Will cause it to lag a bit after the movement of the main map.) Defaults to false.
