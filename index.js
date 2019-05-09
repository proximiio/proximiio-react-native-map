import React, { Component, Headers } from 'react'
import MapboxGL from '@mapbox/react-native-mapbox-gl'
import Proximiio from 'proximiio-react-native-core'
import Constants from './constants'

const StyleSheet = MapboxGL.StyleSheet

const CORE_API_ROOT = 'https://api.proximi.fi/core'
const GEO_API_ROOT = 'https://api.proximi.fi/v4/geo'

const jsonize = response => response.json()
const compareLatLngCoordinates = (a, b) => a[0] === b[0] && a[1] === b[1]

var createGeoJSONCircle = function(center, radiusInKm, points) {
  if(!points) points = 64;

  var coords = {
      latitude: center[1],
      longitude: center[0]
  };

  var km = radiusInKm;

  var ret = [];
  var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
  var distanceY = km/110.574;

  var theta, x, y;
  for(var i=0; i<points; i++) {
      theta = (i/points)*(2*Math.PI);
      x = distanceX*Math.cos(theta);
      y = distanceY*Math.sin(theta);

      ret.push([coords.longitude+x, coords.latitude+y]);
  }
  ret.push(ret[0]);

  return ret
}

const DummyFeature = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
}

const DummyCollection = {
  type: 'FeatureCollection',
  features: [ DummyFeature ]
}

let TOKEN = null
let poiCache = null

class ProximiioMap {
  constructor() {
    this.loaded = false
    this.style = null
    this.amenities = []
    this.amenityMap = {}
    this.amenityLinks = {}
    this.features = Object.assign({}, DummyCollection)
    this.featureCache = {}
    this.layerCache = {}
    this.listeners = []
    this.currentLocation = null
    this.level = 0
    this.userLevel = 0
    this.route = null
    this.floors = []
    this.showGeoJSON = true
    this.showRaster = true
    this.showPOI = true
    this.lastFloorLayer = Constants.DEFAULT_BOTTOM_LAYER
  }

  async authorize(token) {
    TOKEN = token

    const floorsURL = `${CORE_API_ROOT}/floors?token=${TOKEN}&size=1000`
    const amenitiesURL = `${GEO_API_ROOT}/amenities?token=${TOKEN}&size=1000`
    const featuresURL = `${GEO_API_ROOT}/features?token=${TOKEN}&size=1000`

    this.floors = await fetch(floorsURL, { headers: { authorization: `Bearer ${TOKEN}` }} ).then(jsonize)
    this.features = await fetch(featuresURL).then(jsonize)
    this.style = await fetch(this.styleURL).then(jsonize)
    this.amenities = await fetch(amenitiesURL).then(jsonize)

    this.amenityLinks = {}

    this.amenityMap = this.amenities.reduce((acc, item) => {
      if (item.icon && item.icon.match(/data:image/)) {
        acc[item.id] = item.icon
        this.amenityLinks[item.id] = { uri: `${GEO_API_ROOT}/amenities/${item.id}.png?token=${TOKEN}` }
      }
      return acc
    }, {})

    this.loaded = true

    this.subscriptions = {
      positionUpdates: Proximiio.subscribe(Proximiio.Events.PositionUpdated, this.onPositionUpdate.bind(this)),
      floorChange: Proximiio.subscribe(Proximiio.Events.FloorChanged, this.onFloorChange.bind(this))
    }

    this.notify('ready', this)
  }

  async onPositionUpdate(position) {
    this.currentLocation = position
    const floor = await Proximiio.currentFloor()
    if (floor) {
      this.userLevel = floor.level
    }
  }

  onFloorChange(floor) {
    if (floor !== null) {
      this.level = floor.level
    }
  }

  get styleURL() {
    return `${GEO_API_ROOT}/style?token=${TOKEN}&expr=false&basic=true`
  }

  async routeTo(coordinates, level) {
    if (this.currentLocation === null) {
      //console.log('routing not possible, current location (source) not available')
      return
    }

    const lngStart = this.currentLocation.lng
    const latStart = this.currentLocation.lat
    const levelStart = this.userLevel
    const lngFinish = coordinates[0]
    const latFinish = coordinates[1]
    const levelFinish = level
    const url = `${GEO_API_ROOT}/route/${lngStart},${latStart},${levelStart}%3B${lngFinish},${latFinish},${levelFinish}?token=${TOKEN}`
    try {
      this.route = await fetch(url).then(jsonize)
      this.notify('route:change', this.route)
      return this.route
    } catch (e) {
      console.error('received error route response', e)
      return null
    }
  }

  cancelRoute() {
    this.route = null
  }

  iconForAmenity(id) {
    return this.amenityMap[id]
  }

  get sortedPOIs() {
    if (!poiCache) {
      poiCache = this.features.features
        .filter(feature => feature.properties.usecase === 'poi')
        .sort((a, b) => a.properties.title > b.properties.title ? -1 : 1)
        .sort((a, b) => a.properties.level > b.properties.level ? 1 : -1)
    }
    return poiCache
  }

  featuresForLevel(level, isPoi) {
    const cacheKey = `${level}-${isPoi ? 'poi' : 'other'}`
    if (typeof this.featureCache[cacheKey] === 'undefined') {
      this.featureCache[cacheKey] = {
        type: 'FeatureCollection',
        features: this.features.features.filter(f => {
          if ((isPoi && f.properties.usecase !== 'poi') || (!isPoi && f.properties.usecase === 'poi')) {
            return false
          }

          if (f.properties.usecase && f.properties.usecase === 'levelchanger') {
            return f.properties.level_min <= level && f.properties.level_max >= level
          } else {
            return f.properties.level === level
          }
        })
      }
    }

    return this.featureCache[cacheKey]
  }

  floorplanSource(level) {
    // 0, 1, 3, 2
    const floors = this.floors.filter(floor =>
      floor.level === level &&
      (Array.isArray(floor.anchors) && floor.anchors.length === 4) &&
      floor.floorplan_image_url != null && floor.floorplan_image_url.length > 0
    )

    const layers = []
    const sources = floors.map(floor => {
      const layer = `${Constants.LAYER_RASTER_FLOORPLAN}-${floor.id}`
      layers.push(layer)
      return (
        <MapboxGL.Animated.ImageSource
          key={`${Constants.SOURCE_RASTER_FLOORPLAN}-${floor.id}`}
          id={`${Constants.SOURCE_RASTER_FLOORPLAN}-${floor.id}`}
          coordinates={[
            [floor.anchors[0].lng, floor.anchors[0].lat],
            [floor.anchors[1].lng, floor.anchors[1].lat],
            [floor.anchors[3].lng, floor.anchors[3].lat],
            [floor.anchors[2].lng, floor.anchors[2].lat]
          ]}
          url={ floor.floorplan_image_url }>
          <MapboxGL.RasterLayer
            id={layer}
            aboveLayerID={Constants.DEFAULT_BOTTOM_LAYER}
            minZoomLevel={12}
            style={StyleSheet.create({
              visibility: this.showRaster ? 'visible' : 'none'
            })} />
        </MapboxGL.Animated.ImageSource>
      )
    })

    this.lastFloorLayer = layers.length > 0 ? layers[layers.length - 1] : Constants.DEFAULT_BOTTOM_LAYER
    return sources
  }

  poiSourceForLevel(level) {
    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_POI}
        key={Constants.SOURCE_POI}
        shape={this.featuresForLevel(level, true)}
        maxZoomLevel={24}>

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_POIS_ICONS}
        minZoomLevel={16}
        maxZoomLevel={24}
        filter={
          [ "all", ["==", "usecase", "poi"], ["==", "level", level] ]
        }
        style={StyleSheet.create({
          iconImage: StyleSheet.identity('amenity'),
          iconSize: 0.9,
          textOffset: [0, 2],
          textFont: [ "Klokantech Noto Sans Regular" ],
          textSize: 14,
          symbolPlacement: 'point',
          iconAllowOverlap: true,
          textAllowOverlap: true,
          visibility: this.showPOI ? 'visible' : 'none'
        })} />

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_POIS_LABELS}
        minZoomLevel={18}
        maxZoomLevel={24}
        filter={
          [ "all", ["==", "usecase", "poi"], ["==", "level", level] ]
        }
        style={StyleSheet.create({
          textOffset: [0, 2],
          textFont: [ "Klokantech Noto Sans Regular" ],
          textField: StyleSheet.identity('title'),
          textSize: 14,
          symbolPlacement: 'point',
          iconAllowOverlap: true,
          textAllowOverlap: false,
          visibility: this.showPOI ? 'visible' : 'none'
        })} />
      </MapboxGL.ShapeSource>
    )
  }

  shapeSourceForLevel(level) {
    const visibility = this.showGeoJSON ? 'visible' : 'none'
    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_GEOJSON_FLOORPLAN}
        key={Constants.SOURCE_GEOJSON_FLOORPLAN}
        shape={this.featuresForLevel(level, false)}
        maxZoomLevel={24}>

        <MapboxGL.FillLayer
          id={Constants.LAYER_FLOORS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "floor"], ["==", "category", "base_floor"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            fillOpacity: 0.7,
            visibility
          })} />

        <MapboxGL.LineLayer
          id={Constants.LAYER_FLOORS_LINES}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "floor"], ["==", "category", "room"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            lineColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_BASE_FLOOR}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "base_floor"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_ROAD}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "road"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_AREAS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "area"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: '#80F080',
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_PARKING_BASE}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "parking_base"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_SHOPS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "shop"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillExtrusionColor: StyleSheet.identity('color'),
            fillExtrusionHeight: StyleSheet.identity('height'),
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 0.8,
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_ROOMS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "floor"], ["==", "category", "room"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_HOLES}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "hole"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillColor: StyleSheet.identity('color'),
            visibility
          })} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_WALLS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "wall"], ["==", "level", level]]
          }
          style={StyleSheet.create({
            fillExtrusionColor: StyleSheet.identity('color'),
            fillExtrusionHeight: 4,
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 1,
            visibility
          })} />

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_LEVELCHANGERS}
          minZoomLevel={16}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "usecase", "levelchanger"], ["<=", "level_min", level], [">=", "level_max", level]]
          }
          style={StyleSheet.create({
            iconImage: StyleSheet.identity('levelchanger'),
            iconSize: 0.9,
            textOffset: [0, 1],
            textFont: [ "Klokantech Noto Sans Regular" ],
            textField: StyleSheet.identity('title'),
            textSize: 14,
            symbolPlacement: 'point',
            iconAllowOverlap: true,
            textAllowOverlap: true,
            visibility
          })} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_POLYGONS_ABOVE_PATHS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            [ "all", ["==", "type", "polygon_above_path"], ["==", "level", 0]]
          }
          style={StyleSheet.create({
            fillExtrusionColor: StyleSheet.identity('color'),
            fillExtrusionHeight: StyleSheet.identity('height'),
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 0.8,
            visibility
          })} />
      </MapboxGL.ShapeSource>
    )
  }

  imageSource() {
    return (
      <MapboxGL.ShapeSource
        id="proximiio-image-source"
        key="proximiio-image-source"
        shape={DummyCollection}
        images={this.amenityLinks}
        maxZoomLevel={28}/>
      )
  }

  routingSource(level) {
    let ignore = false
    let path = null
    if (!this.route) {
      ignore = true
    } else {
      path = this.route.levelPaths[level]
    }

    if (!path) {
      ignore = true
    }

    let collection = DummyCollection

    if (!ignore) {
      path.properties.usecase = 'route-line'
      const routeStartCurrent = path.geometry.coordinates[0]
      const routeStartOriginal = this.route.nearestPoint.geometry.coordinates
      const isRouteStart = compareLatLngCoordinates(routeStartCurrent, routeStartOriginal)
      const routeFinishCurrent = path.geometry.coordinates[path.geometry.coordinates.length - 1]
      const routeFinishPath = this.route.levelPaths[this.route.finish.properties.level]
      const routeFinishOriginal = routeFinishPath.geometry.coordinates[routeFinishPath.geometry.coordinates.length - 1]
      const isRouteFinish = compareLatLngCoordinates(routeFinishCurrent, routeFinishOriginal)

      collection = {
        type: 'FeatureCollection',
        features: [
          this.route.levelPaths[level],
          {
            type: 'Feature',
            id: Constants.FEATURE_ROUTING_START,
            geometry: {
              type: 'Point',
              coordinates: path.geometry.coordinates[0]
            },
            properties: {
              usecase: 'routing-symbol',
              icon: isRouteStart ? 'route_start' : 'route_start_continue'
            }
          },
          {
            type: 'Feature',
            id: Constants.FEATURE_ROUTING_FINISH,
            geometry: {
              type: 'Point',
              coordinates: path.geometry.coordinates[path.geometry.coordinates.length - 1]
            },
            properties: {
              usecase: 'routing-symbol',
              icon: isRouteFinish ? 'route_finish' : 'route_finish_continue'
            }
          }
        ]
      }
    }

    const rasterLayer = this.showRaster ? this.lastFloorLayer : Constants.DEFAULT_BOTTOM_LAYER
    const topLayer = this.showGeoJSON ? Constants.LAYER_HOLES : rasterLayer

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_ROUTING}
        key={Constants.SOURCE_ROUTING}
        shape={collection}
        cluster={false}
        images={{
          route_start: this.amenityLinks.route_start,
          route_finish: this.amenityLinks.route_finish
        }}
        minZoomLevel={10}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_ROUTING_SYMBOLS}
          aboveLayerID={topLayer}
          style={StyleSheet.create({
            iconImage: StyleSheet.identity('icon'),
            iconSize: 1,
            iconAllowOverlap: true
          })}
          visibility={ !ignore ? 'visible' : 'none' } />

        <MapboxGL.LineLayer
          id={Constants.LAYER_ROUTING_LINE}
          minZoomLevel={10}
          maxZoomLevel={24}
          aboveLayerID={topLayer}
          filter={
            [ "all", ["==", "usecase", "route-line"] ]
          }
          style={StyleSheet.create({
            lineOpacity: 0.9,
            lineColor: '#00ee00',
            lineWidth: 12
          })}
          visibility={ !ignore ? 'visible' : 'none' } />

      </MapboxGL.ShapeSource>
    )
  }

  userPositionSource(level) {
    const hasLocation = this.currentLocation !== null
    const userLocation = hasLocation ? [ this.currentLocation.lng, this.currentLocation.lat ] : [0, 0]
    const coordinates = this.route ? this.route.nearestPoint.geometry.coordinates : userLocation
    const accuracy = hasLocation ? this.currentLocation.accuracy / 1000 : 0

    let collection = DummyCollection

    if (hasLocation || this.route) {
      collection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates
            },
            properties: {
              usecase: 'user-location',
              level: this.userLevel
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [ createGeoJSONCircle(coordinates, accuracy, 50) ]
            },
            properties: {
              usecase: 'user-location-accuracy',
              level: this.userLevel
            }
          }
        ]
      }
    }

    const topRasterLayer = this.showRaster ? this.lastFloorLayer : Constants.DEFAULT_BOTTOM_LAYER
    const topLayer = this.showGeoJSON ? Constants.LAYER_POLYGONS_ABOVE_PATHS : topRasterLayer

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_USER_LOCATION}
        key={Constants.SOURCE_USER_LOCATION}
        shape={collection}
        cluster={false}
        images={{
          bluedot: { uri: 'https://www.timeflux.org/bluedot.png' }
        }}
        minZoomLevel={1}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_USER_MARKER}
          filter={[ "all", ["==", "usecase", "user-location"], ["==", "level", level] ]}
          aboveLayerID={topLayer}
          style={StyleSheet.create({
            iconImage: 'bluedot',
            iconSize: 1,
            iconAllowOverlap: true
          })}
          visibility={hasLocation ? 'visible' : 'none'}/>

        <MapboxGL.FillLayer
          id={Constants.LAYER_USER_ACCURACY}
          filter={[ "all", ["==", "usecase", "user-location-accuracy"], ["==", "level", level] ]}
          aboveLayerID={topLayer}
          style={StyleSheet.create({
            fillColor: '#0080c0',
            fillOpacity: 0.3
          })}
          visibility={hasLocation ? 'visible' : 'none'} />
      </MapboxGL.ShapeSource>
    )
  }

  indoorSources(level, showRaster, showGeoJSON) {
    this.showRaster = showRaster
    this.showGeoJSON = showGeoJSON
    return [
      this.imageSource(level),
      this.floorplanSource(level),
      this.shapeSourceForLevel(level),
      this.poiSourceForLevel(level),
      this.routingSource(level),
      this.userPositionSource(level)
    ]
  }

  // event handling
  on(event, fn) {
    if (typeof this.listeners[event] === 'undefined') {
      this.listeners[event] = []
    }
    this.listeners[event].push(fn)
  }

  off(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== fn)
    }
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data))
    }
  }

}

const instance = new ProximiioMap()
export default instance
