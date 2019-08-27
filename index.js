import React from 'react'
import MapboxGL  from '@react-native-mapbox-gl/maps'
import Proximiio from 'proximiio-react-native-core'
import Constants from './constants'
import { View, Platform, PixelRatio } from 'react-native';
import nearestPointOnLine from '@turf/nearest-point-on-line'
import along from '@turf/along'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import { lineString } from '@turf/helpers'

const isIOS = Platform.OS === 'ios'

const CORE_API_ROOT = 'https://api.proximi.fi/core'
const GEO_API_ROOT = 'https://api.proximi.fi/v4/geo'

const blueDot = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAA0CAYAAADFeBvrAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAA6ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxOS0wNC0xN1QyMzowNDoxMjwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+UGl4ZWxtYXRvciAzLjY8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzI8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NTI8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4K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'

const jsonize = response => response.json()
const compareLatLngCoordinates = (a, b) => a[0] === b[0] && a[1] === b[1]


const toPoint = coordinates => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates
  }
})

const createGeoJSONCircle = (center, radiusInKm, points) => {
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

class LayerContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      updatedAt: new Date().getTime()
    }
  }

  render() {
    return this.props.children
  }
}

class ProximiioMap {
  constructor() {
    this.setDefaults()
    this.onPoiPress = this.onPoiPress.bind(this)
    this.skipPoiPress = false
  }

  setDefaults() {
    this.loaded = false
    this.style = null
    this.amenities = []
    this.amenityMap = {}
    this.amenityLinks = {}
    this.features = Object.assign({}, DummyCollection)
    this.filteredFeatures = []
    this.featureCache = {}
    this.layerCache = {}
    this.listeners = []
    this.currentLocation = null
    this.userLocationSnapping = true
    this.level = 0
    this.userLevel = 0
    this.route = null
    this.floors = []
    this.showGeoJSON = true
    this.showRaster = true
    this.showPOI = true
    this.bottomLayer = Constants.DEFAULT_BOTTOM_LAYER
    this.lastFloorLayer = this.bottomLayer
    this.userMarkerImage = blueDot
    this.routingStartImage = null
    this.routingFinishImage = null
    this.iconSize = Platform.OS === 'ios' ? 0.5 : 2
    this.imagesIteration = 0
    this.images = {}
    this.font = ["Klokantech Noto Sans Regular"]
    this.routeLineStyle = {
      lineOpacity: 1,
      lineColor: '#00ee00',
      lineWidth: 12
    }
    this.useDottedRouteLine = true
    this.timestamp = (new Date()).getTime()
    this.singleLevel = true
    this.showLevelChangers = false
    this.userMarkerIconSize = this.getIconSize(0.75)
    this.routeIconSize = this.getIconSize(0.5)
    this.routeDotIconSize = this.getIconSize(0.25)
    this.poiTextStyle = {
      textOffset: [0, 2],
      textField: ['get', 'title'],
      textSize: 14,
      textFont: this.font,
      symbolPlacement: 'point',
      textAllowOverlap: false
    }
  }

  get DEFAULT_BOTTOM_LAYER() {
    return Constants.DEFAULT_BOTTOM_LAYER
  }

  destroy() {
    this.setDefaults()
  }

  getIconSize(size) {
    return isIOS ? size : size * 2
  }

  isInsideBounds(coordinates, bounds) {
    if (!(Array.isArray(coordinates) && Array.isArray(bounds))) {
      return false
    }

    const point = toPoint(coordinates)
    const boundPoints = lineString(bounds)
    const box = bbox(boundPoints)
    const polygon = bboxPolygon(box)
    return booleanPointInPolygon(point, polygon)
  }

  cancelFeaturesFiltering() {
    this.filteredFeatures = this.features.features
    this.resetCache()
  }

  filterFeaturesByIds(featureIds) {
    this.filteredFeatures = this.features.features.filter(f => featureIds.includes(f.properties.id))
    this.resetCache()
  }

  filterFeaturesByAmenities(amenityIds) {
    this.filteredFeatures = this.features.features.filter(f => amenityIds.includes(f.properties.amenity))
    this.resetCache()
  }

  async authorize(token) {
    TOKEN = token

    const floorsURL = `${CORE_API_ROOT}/floors?token=${TOKEN}&size=1000`
    const amenitiesURL = `${GEO_API_ROOT}/amenities?token=${TOKEN}&size=1000`
    const featuresURL = `${GEO_API_ROOT}/features?token=${TOKEN}&size=1000`

    this.floors = await fetch(floorsURL, { headers: { authorization: `Bearer ${TOKEN}` }} ).then(jsonize)
    this.features = await fetch(featuresURL).then(jsonize)
    this.filteredFeatures = [...this.features.features]
    this.style = await fetch(this.styleURL).then(jsonize)
    this.amenities = await fetch(amenitiesURL).then(jsonize)
    this.amenityLinks = {}
    this.amenityBaseLinks = {}

    this.amenityMap = this.amenities.reduce((acc, item) => {
      if (item.icon && item.icon.match(/data:image/)) {
        acc[item.id] = item.icon
        this.amenityBaseLinks[item.id] = { uri: item.icon }
        this.amenityLinks[item.id] = { uri: `${GEO_API_ROOT}/amenities/${item.id}.png?token=${TOKEN}` }
      }
      return acc
    }, {})

    if (this.routingStartImage === null) {
      this.routingStartImage = this.amenityBaseLinks.route_start
    }

    if (this.routingFinishImage === null) {
      this.routingFinishImage = this.amenityBaseLinks.route_finish
    }

    this.updateImages()

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
    this.updateImages()
  }

  get styleURL() {
    return `${GEO_API_ROOT}/style?token=${TOKEN}&expr=false&basic=true`
  }

  async routeTo(coordinates, level, accessibility = false, skipRender = false) {
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
    const url = `${GEO_API_ROOT}/route/${lngStart},${latStart},${levelStart}%3B${lngFinish},${latFinish},${levelFinish}?token=${TOKEN}&accessibility=${accessibility}`
    try {
      const route = await fetch(url).then(jsonize)
      if (!route.levelPaths) {
        return null
      }

      if (!skipRender) {
        this.route = route
      }
      this.notify('route:change', route)
      return route
    } catch (e) {
      console.error('received error route response', e)
      return null
    }
  }

  selectFeature (feature) {
    this.filterFeaturesByIds([ feature.properties.id ])
    this.resetCache()
    this.updateImages()
  }

  cancelRoute() {
    this.route = null
  }

  iconForAmenity(id) {
    return this.amenityMap[id]
  }

  get sortedPOIs() {
    if (!poiCache) {
      poiCache = this.filteredFeatures
        .filter(feature => feature.properties.usecase === 'poi')
        .sort((a, b) => a.properties.title > b.properties.title ? -1 : 1)
        .sort((a, b) => a.properties.level > b.properties.level ? 1 : -1)
    }
    return poiCache
  }

  resetCache () {
    this.featureCache = {}
    this.poiCache = {}
    this.timestamp = (new Date()).getTime()
  }

  featuresForLevel(level, isPoi) {
    const cacheKey = `${level}-${isPoi ? 'poi' : 'other'}`
    if (typeof this.featureCache[cacheKey] === 'undefined') {
      this.featureCache[cacheKey] = {
        type: 'FeatureCollection',
        features: (isPoi ? this.filteredFeatures : this.features.features).filter(f => {
          if (!f.properties) {
            return false
          }

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
    const visibility = this.showRaster ? 'visible' : 'none'

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
            aboveLayerID={this.bottomLayer}
            minZoomLevel={12}
            style={{
              visibility
            }} />
        </MapboxGL.Animated.ImageSource>
      )
    })

    this.lastFloorLayer = layers.length > 0 ? layers[layers.length - 1] : this.bottomLayer
    return sources
  }

  onPoiPress(event, b) {
    if (!this.skipPoiPress) {
      this.notify('press:poi', event.nativeEvent.payload)
      this.skipPoiPress = true
      setTimeout(() => {
        this.skipPoiPress = false
      }, 100)
    }
  }

  poiSourceForLevel(level) {
    const visibility = this.showPOI ? 'visible' : 'none'
    const rasterLayer = this.showRaster ? this.lastFloorLayer : this.bottomLayer
    const topLayer = this.showGeoJSON ? Constants.LAYER_HOLES : rasterLayer
    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_POI}
        key={`${Constants.SOURCE_POI}-${this.timestamp}`}
        shape={this.featuresForLevel(level, true)}
        onPress={this.onPoiPress}
        minZoomLevel={12}
        maxZoomLevel={30}>

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_POIS_ICONS}
        key={Constants.LAYER_POIS_ICONS}
        aboveLayerID={Constants.LAYER_HOLES}
        minZoomLevel={12}
        maxZoomLevel={30}
        filter={isIOS ?
          [
            'all',
            ['==', 'usecase', "poi"],
            ['==', 'level', level]
          ] :
          [
            'all',
            ['==', ['get', 'usecase'], "poi"],
            ['==', ['to-number', ['get', 'level']], level]
          ]
        }
        style={{
          iconImage: '{amenity}',
          iconSize: this.iconSize,
          symbolPlacement: 'point',
          iconAllowOverlap: true,
          textAllowOverlap: false,
          visibility
        }} />

      <MapboxGL.SymbolLayer
        id={Constants.LAYER_POIS_LABELS}
        key={Constants.LAYER_POIS_LABELS}
        aboveLayerID={Constants.LAYER_HOLES}
        minZoomLevel={16}
        maxZoomLevel={30}
        filter={isIOS ?
          [
            'all',
            ['==', 'usecase', "poi"],
            ['==', 'level', -1]
          ] :
          [
            'all',
            ['==', ['get', 'usecase'], "poi"],
            ['==', ['to-number', ['get', 'level']], level]
          ]
        }
        style={{...this.poiTextStyle, visibility }} />
      </MapboxGL.ShapeSource>
    )
  }

  shapeSourceForLevel(level) {
    const topLayer = this.showRaster ? this.lastFloorLayer : this.bottomLayer
    const visibility = this.showGeoJSON ? 'visible' : 'none'
    const collection = this.featuresForLevel(level, false)

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_GEOJSON_FLOORPLAN}
        key={Constants.SOURCE_GEOJSON_FLOORPLAN}
        shape={collection}
        maxZoomLevel={24}>

        <MapboxGL.FillLayer
          id={Constants.LAYER_FLOORS}
          aboveLayerID={topLayer}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "floor"],
              ["==", "category", "base_floor"],
              ["==", "level", level]
            ] :
            [
              'all',
              ['==', ['get', 'type'], "floor"],
              ['==', ['get', 'category'], "base_floor"],
              ['==', ['to-number', ['get', 'level']], level]
            ]}
          style={{
            fillColor: ["get", "color"],
            fillOpacity: 0.7,
            visibility
          }} />

        <MapboxGL.LineLayer
          id={Constants.LAYER_FLOORS_LINES}
          aboveLayerID={Constants.LAYER_FLOORS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "floor"],
              ["==", "category", "room"],
              ["==", "level", level]
            ] :
            [
              'all',
              ['==', ['get', 'type'], "floor"],
              ['==', ['get', 'category'], "room"],
              ['==', ['to-number', ['get', 'level']], level]
            ]
          }
          style={{
            lineColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_BASE_FLOOR}
          aboveLayerID={Constants.LAYER_FLOORS_LINES}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={
            isIOS ?
            [
              "all",
              ["==", "type", "base_floor"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "base_floor"],
            ['==', ['to-number', ['get', 'level']], level]
            ]
          }
          style={{
            fillColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_ROAD}
          aboveLayerID={Constants.LAYER_BASE_FLOOR}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "road"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "road"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_AREAS}
          aboveLayerID={Constants.LAYER_ROAD}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "area"],
              ["==", "level", level]
            ] :
            [
              'all',
              ['==', ['get', 'type'], "area"],
              ['==', ['to-number', ['get', 'level']], level]
            ]
          }
          style={{
            fillColor: '#80F080',
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_PARKING_BASE}
          aboveLayerID={Constants.LAYER_AREAS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "parking_base"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "parking_base"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_SHOPS}
          aboveLayerID={Constants.LAYER_PARKING_BASE}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "shop"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "shop"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillExtrusionColor: ['get', 'color'],
            fillExtrusionHeight: ['to-number', ['get', 'height']],
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 0.8,
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_ROOMS}
          aboveLayerID={Constants.LAYER_SHOPS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "floor"],
              ["==", "category", "room"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "floor"],
            ['==', ['get', 'category'], "room"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillLayer
          id={Constants.LAYER_HOLES}
          aboveLayerID={Constants.LAYER_ROOMS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "hole"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "hole"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillColor: ['get', 'color'],
            visibility
          }} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_WALLS}
          aboveLayerID={Constants.LAYER_HOLES}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "wall"],
              ["==", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "wall"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillExtrusionColor: ['get', 'color'],
            fillExtrusionHeight: 4,
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 1,
            visibility
          }} />

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_LEVELCHANGERS}
          aboveLayerID={Constants.LAYER_HOLES}
          minZoomLevel={14}
          maxZoomLevel={30}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "levelchanger"],
              ["<=", "level_min", level],
              [">=", "level_max", level]
            ] :
            [
            'all',
            ['==', ['get', 'usecase'], "levelchanger"]
          ]}
          style={{
            iconImage: '{levelchanger}',
            iconSize: this.iconSize,
            textOffset: [0, 1],
            textField: ['get', 'title'],
            textSize: 14,
            symbolPlacement: 'point',
            iconAllowOverlap: true,
            textAllowOverlap: true,
            visibility: this.showLevelChangers ? 'visible' : 'none'
          }} />

        <MapboxGL.FillExtrusionLayer
          id={Constants.LAYER_POLYGONS_ABOVE_PATHS}
          aboveLayerID={Constants.LAYER_LEVELCHANGERS}
          minZoomLevel={12}
          maxZoomLevel={24}
          filter={isIOS ?
            [
              "all",
              ["==", "type", "polygon_above_path"],
              [">=", "level", level]
            ] :
            [
            'all',
            ['==', ['get', 'type'], "polygon_above_path"],
            ['==', ['to-number', ['get', 'level']], level]
          ]}
          style={{
            fillExtrusionColor: ['get', 'color'],
            fillExtrusionHeight: ['to-number', ['get', 'height']],
            fillExtrusionBase: 0.1,
            fillExtrusionOpacity: 0.8,
            visibility
          }} />
      </MapboxGL.ShapeSource>
    )
  }

  updateImages () {
    const amenityIds = new Set(
      this.features.features.filter(f => f.properties && f.properties.usecase === 'poi' && f.properties.amenity)
                            .map(f => f.properties.amenity)
    )

    const images = {}

    amenityIds.forEach(id => {
      images[id] = this.amenityBaseLinks[id]
    })

    this.amenities
      .filter(a => a.category === 'levelchangers')
      .forEach(amenity => {
        images[amenity.id] = { uri: amenity.icon }
      })

    images.bluedot = { uri: this.userMarkerImage }
    images[Constants.IMAGE_ROUTING_START] = this.routingStartImage
    images[Constants.IMAGE_ROUTING_FINISH] = this.routingFinishImage

    this.images = images
    this.imagesIteration++
  }

  imageSource() {
    if (!this.loaded) {
      return null
    }

    return (
      <MapboxGL.ShapeSource
        id="proximiio-image-source"
        key={`proximiio-image-source-${this.imagesIteration}`}
        shape={DummyCollection}
        images={this.images}
        minZoomLevel={1}
        maxZoomLevel={30}/>
      )
  }

  routingSource(level) {
    let ignore = false
    let path = null

    if (!this.route) {
      ignore = true
    } else if (this.route.levelPaths) {
      path = this.singleLevel ? this.route.linestring.path : this.route.levelPaths[level]
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
          {
            type: 'Feature',
            id: Constants.FEATURE_ROUTING_START,
            geometry: {
              type: 'Point',
              coordinates: path.geometry.coordinates[0]
            },
            properties: {
              usecase: 'route-symbol',
              icon: Constants.IMAGE_ROUTING_START
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
              usecase: 'route-symbol',
              icon: Constants.IMAGE_ROUTING_FINISH
            }
          }
        ]
      }

      if (!this.useDottedRouteLine) {
        collection.features.push(path)
      }

      if (this.useDottedRouteLine) {
        const distance = this.route.distance
        let distanceRemaining = distance
        const separator = 1 // 1 meter
        const chunks = []
        let i = 0
        while (distanceRemaining > separator) {
          const point = along(path, (separator + i) / 1000)
          point.properties.usecase = 'route-line-symbol'
          chunks.push(point)
          distanceRemaining -= separator
          i += separator
        }
        collection.features = [...collection.features, ...chunks]
      }
    }

    const rasterLayer = this.showRaster ? this.lastFloorLayer : this.bottomLayer
    const topLayer = this.showGeoJSON ? Constants.LAYER_HOLES : rasterLayer
    const visibility = !ignore ? 'visible' : 'none'
    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_ROUTING}
        key={Constants.SOURCE_ROUTING}
        shape={collection}
        cluster={false}
        minZoomLevel={10}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_ROUTING_SYMBOLS}
          aboveLayerID={topLayer}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "route-symbol"]
            ] :
            [
              '==',
              ['get', 'usecase'], "route-symbol"
            ]
          }
          style={{
            iconImage: '{icon}',
            iconSize: this.routeIconSize,
            symbolPlacement: 'point',
            iconAllowOverlap: true,
            textAllowOverlap: false
          }}
          visibility={visibility} />

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_ROUTING_SYMBOLS + '_line'}
          aboveLayerID={topLayer}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "route-line-symbol"]
            ] :
            [
              '==',
              ['get', 'usecase'], "route-line-symbol"
            ]
          }
          style={{
            iconImage: 'bluedot',
            iconSize: this.routeDotIconSize,
            symbolPlacement: 'point',
            iconAllowOverlap: false,
            textAllowOverlap: false
          }}
          visibility={visibility} />

        <MapboxGL.LineLayer
          id={Constants.LAYER_ROUTING_LINE}
          minZoomLevel={10}
          maxZoomLevel={24}
          aboveLayerID={topLayer}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "route-line"],
            ] :
            ['==', ['get', 'usecase'], "route-line"]
          }
          style={this.routeLineStyle}
          visibility={visibility} />

      </MapboxGL.ShapeSource>
    )
  }

  nearestPointForPath = (point, path) => {
    const nearest = nearestPointOnLine(path, point, {units: 'kilometers'})
    nearest.properties.dist = path.dist
    nearest.properties.location = path.location
    nearest.properties.level = path.level
    return nearest
  }

  userPositionSource(level) {
    const hasLocation = this.currentLocation !== null
    const userLocation = hasLocation ? [ this.currentLocation.lng, this.currentLocation.lat ] : [0, 0]
    let coordinates = userLocation

    if (this.route) {
      coordinates = nearestPointOnLine(this.route.levelPaths[level], coordinates).geometry.coordinates
    }

    if (!this.route && this.userLocationSnapping) {
      let nearestPath = null
      let nearestPathPoint = null
      let nearestPathPointDistance = Infinity
      const paths = this.filteredFeatures.filter(feature => feature.properties.class === 'path' && feature.properties.level === level)
      paths.forEach((path, index) => {
        const nearest = this.nearestPointForPath(path, coordinates)
        const nearestDistance = turf.distance(path, nearest)
        if (nearestDistance <= nearestPathPointDistance)
          nearestPath = path
          nearestPathPoint = nearest
          nearestPathPointDistance = nearestDistance
      }) 
      coordinates = nearestPathPoint.geometry.coordinates
    }

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

    const topRasterLayer = this.showRaster ? this.lastFloorLayer : this.bottomLayer
    const topLayer = this.showGeoJSON ? Constants.LAYER_POLYGONS_ABOVE_PATHS : topRasterLayer

    return (
      <MapboxGL.ShapeSource
        id={Constants.SOURCE_USER_LOCATION}
        key={Constants.SOURCE_USER_LOCATION}
        shape={collection}
        cluster={false}
        minZoomLevel={1}
        maxZoomLevel={24}>

        <MapboxGL.SymbolLayer
          id={Constants.LAYER_USER_MARKER}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "user-location"],
              ["==", "level", level]
            ] :
            [
              'all',
              ['==', ['get', 'usecase'], "user-location"],
              ['==', ['to-number', ['get', 'level']], level]
            ]
          }
          aboveLayerID={topLayer}
          style={{
            iconImage: 'bluedot',
            iconSize: this.userMarkerIconSize,
            iconAllowOverlap: true,
            iconPitchAlignment: 'map',
            iconAllowOverlap: false
          }}
          visibility={hasLocation ? 'visible' : 'none'}/>

        <MapboxGL.FillLayer
          id={Constants.LAYER_USER_ACCURACY}
          filter={isIOS ?
            [
              "all",
              ["==", "usecase", "user-location-accuracy"],
              ["==", "level", level]
            ] :
            [
              'all',
              ['==', ['get', 'usecase'], "user-location-accuracy"],
              ['==', ['to-number', ['get', 'level']], level]
            ]
          }
          aboveLayerID={topLayer}
          style={{
            fillColor: '#0080c0',
            fillOpacity: 0.3
          }}
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
