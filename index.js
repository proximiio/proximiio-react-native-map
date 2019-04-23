import React, { Component, Headers } from 'react'
import MapboxGL from '@mapbox/react-native-mapbox-gl'
import Proximiio from 'proximiio-react-native-core'
import generateSource from './indoorLayers'
import layerStyles from './layerStyles'

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
let indoorCache = null

const BOTTOM_MAP_LAYER = 'country_label-en'
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
    this.lastFloorLayer = BOTTOM_MAP_LAYER
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
    // console.log('map on floor change', floor)
    if (floor !== null) {
      this.level = floor.level
    }
  }

  get styleURL() {
    return `${GEO_API_ROOT}/style?token=${TOKEN}&expr=false&basic=true`
  }

  async routeTo(coordinates, level) {
    if (this.currentLocation === null) {
      console.log('routing not possible, current location (source) not available')
      return
    }

    // console.log('route to', coordinates, level)

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

  featuresForLevel(level) {
    if (typeof this.featureCache[level] === 'undefined') {
      this.featureCache[level] = {
        type: 'FeatureCollection',
        features: this.features.features.filter(f => {
          if (f.properties.usecase && f.properties.usecase === 'levelchanger') {
            return f.properties.level_min <= level && f.properties.level_max >= level
          } else {
            return f.properties.level === level
          }
        })
      }
    }

    return this.featureCache[level]
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
      const layer = `proximiio-floorplan-${floor.id}`
      layers.push(layer)
      return (
        <MapboxGL.Animated.ImageSource
          key={`floorplan-source-${floor.id}`}
          id="floorplan"
          coordinates={[
            [floor.anchors[0].lng, floor.anchors[0].lat],
            [floor.anchors[1].lng, floor.anchors[1].lat],
            [floor.anchors[3].lng, floor.anchors[3].lat],
            [floor.anchors[2].lng, floor.anchors[2].lat]
          ]}
          url={ floor.floorplan_image_url }>
          <MapboxGL.RasterLayer id={layer} aboveLayerID={BOTTOM_MAP_LAYER} minZoomLevel={12}/>
        </MapboxGL.Animated.ImageSource>
      )
    })

    this.lastFloorLayer = layers.length > 0 ? layers[layers.length - 1] : BOTTOM_MAP_LAYER
    return sources
  }

  shapeSourceForLevel(level) {
    return generateSource(this.featuresForLevel(level), {}, level)
  }

  imageSource() {
    return (
      <MapboxGL.ShapeSource
        id="image-source"
        key="image-source"
        shape={DummyCollection}
        images={this.amenityLinks}
        maxZoomLevel={28}/>
      )
  }

  routingSource(level) {
    if (!this.route) {
      return null
    }

    const path = this.route.levelPaths[level]

    if (!path) {
      return null
    }

    // console.log('path', this.route)

    path.properties.usecase = 'route-line'
    const routeStartCurrent = path.geometry.coordinates[0]
    const routeStartOriginal = this.route.nearestPoint.geometry.coordinates
    const isRouteStart = compareLatLngCoordinates(routeStartCurrent, routeStartOriginal)
    const routeFinishCurrent = path.geometry.coordinates[path.geometry.coordinates.length - 1]
    const routeFinishPath = this.route.levelPaths[this.route.finish.properties.level]
    const routeFinishOriginal = routeFinishPath.geometry.coordinates[routeFinishPath.geometry.coordinates.length - 1]
    const isRouteFinish = compareLatLngCoordinates(routeFinishCurrent, routeFinishOriginal)

    const collection = {
      type: 'FeatureCollection',
      features: [
        this.route.levelPaths[level],
        {
          type: 'Feature',
          id: 'route-start',
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
          id: 'route-finish',
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

    return (
      <MapboxGL.ShapeSource
        id="routing-source"
        key="routing-source"
        shape={collection}
        cluster={false}
        images={{
          route_start: this.amenityLinks.route_start,
          route_finish: this.amenityLinks.route_finish
        }}
        minZoomLevel={10}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id="routing-symbols"
          aboveLayerID={ this.showGeoJSON ? 'proximiio-holes' : (this.showRaster ? this.lastFloorLayer : BOTTOM_MAP_LAYER)}
          style={layerStyles.routeSymbol}/>

        <MapboxGL.LineLayer
          id="routing-layer"
          minZoomLevel={10}
          maxZoomLevel={24}
          aboveLayerID={ this.showGeoJSON ? 'proximiio-holes' : (this.showRaster ? this.lastFloorLayer : BOTTOM_MAP_LAYER)}
          filter={
            [ "all", ["==", "usecase", "route-line"] ]
          }
          style={layerStyles.routeLine}/>

      </MapboxGL.ShapeSource>
    )
  }

  userPositionSource(level) {
    if (!this.currentLocation) {
      return null
    }

    const coordinates = [ this.currentLocation.lng, this.currentLocation.lat ]
    const collection = {
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
            coordinates: [ createGeoJSONCircle(coordinates, this.currentLocation.accuracy / 1000, 50) ]
          },
          properties: {
            usecase: 'user-location-accuracy',
            level: this.userLevel
          }
        }
      ]
    }
    const topLayer = this.showGeoJSON ? "proximiio-polygons-above-paths" : (this.showRaster ? this.lastFloorLayer : BOTTOM_MAP_LAYER)
    // console.log('user collection', collection, 'userLevel', this.userLevel, 'mapLevel', level, 'topLayer', topLayer)

    return (
      <MapboxGL.ShapeSource
        id="proximiio-routing-source"
        key="proximiio-routing-source"
        shape={collection}
        cluster={false}
        images={{
          bluedot: { uri: 'https://www.timeflux.org/bluedot.png' }
        }}
        minZoomLevel={1}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id="proximiio-user-position"
          filter={[ "all", ["==", "usecase", "user-location"], ["==", "level", level] ]}
          aboveLayerID={topLayer}
          style={layerStyles.userPosition} />

        <MapboxGL.FillLayer
          id="proximiio-user-accuracy"
          filter={[ "all", ["==", "usecase", "user-location-accuracy"], ["==", "level", level] ]}
          aboveLayerID={topLayer}
          style={layerStyles.userAccuracy} />
      </MapboxGL.ShapeSource>
    )
  }

  indoorSources(level, showRaster, showGeoJSON) {
    this.showRaster = showRaster
    this.showGeoJSON = showGeoJSON

    const sources = [ this.imageSource(level) ]
    if (showRaster) { sources.push(this.floorplanSource(level)) }
    if (showGeoJSON) { sources.push(this.shapeSourceForLevel(level)) }
    sources.push(this.routingSource(level))
    sources.push(this.userPositionSource(level))
    return sources
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