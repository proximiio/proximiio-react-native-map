import React from 'react';
import MapboxGL from '@mapbox/react-native-mapbox-gl'
import layerStyles from './layerStyles'

export default (shape, images, level) => (
  <MapboxGL.ShapeSource
    id="proximiio-indoor"
    key="proximiio-indoor"
    shape={shape}
    maxZoomLevel={24}>

    <MapboxGL.FillLayer
      id="proximiio-floors"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "floor"], ["==", "category", "base_floor"], ["==", "level", level]]
      }
      style={layerStyles.floors}/>

    <MapboxGL.LineLayer
      id="proximiio-floors-lines"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "floor"], ["==", "category", "room"], ["==", "level", level]]
      }
      style={layerStyles.floorsLines}/>

    <MapboxGL.FillLayer
      id="proximiio-base_floor"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "base_floor"], ["==", "level", level]]
      }
      style={layerStyles.baseFloor}/>

    <MapboxGL.FillLayer
      id="proximiio-road"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "road"], ["==", "level", level]]
      }
      style={layerStyles.road}/>

    <MapboxGL.FillLayer
      id="proximiio-areas"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "area"], ["==", "level", level]]
      }
      style={layerStyles.areas}/>

    <MapboxGL.FillLayer
      id="proximiio-parking_base"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "parking_base"], ["==", "level", level]]
      }
      style={layerStyles.parkingBase}/>

    <MapboxGL.FillExtrusionLayer
      id="proximiio-shops"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "shop"], ["==", "level", level]]
      }
      style={layerStyles.shops}/>

    <MapboxGL.FillLayer
      id="proximiio-rooms"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "floor"], ["==", "category", "room"], ["==", "level", level]]
      }
      style={layerStyles.rooms}/>

    <MapboxGL.FillLayer
      id="proximiio-holes"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "hole"], ["==", "level", level]]
      }
      style={layerStyles.holes}/>

    <MapboxGL.FillExtrusionLayer
      id="proximiio-walls"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "wall"], ["==", "level", level]]
      }
      style={layerStyles.walls}/>

    {/* <MapboxGL.LineLayer
      id="proximiio-paths"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "class", "path"], ["==", "visibility", "visible"], ["==", "level", level]]
      }
      style={layerStyles.paths}/>

    <MapboxGL.SymbolLayer
      id="proximiio-paths-symbols"
      minZoomLevel={14}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "class", "path"], ["==", "showSymbols", true], ["==", "visibility", "visible"], ["==", "level", level]]
      }
      style={layerStyles.pathsSymbols}/>

    <MapboxGL.SymbolLayer
      id="proximiio-paths-names"
      minZoomLevel={1level}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "class", "path"], ["==", "showName", true], ["==", "visibility", "visible"], ["has", "name"], ["==", "level", level]]
      }
      style={layerStyles.pathsNames}/> */}


    <MapboxGL.SymbolLayer
      id="proximiio-levelchangers"
      minZoomLevel={16}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "usecase", "levelchanger"], ["<=", "level_min", level], [">=", "level_max", level]]
      }
      style={layerStyles.levelChangers}/>

    <MapboxGL.SymbolLayer
      id="proximiio-pois-icons"
      minZoomLevel={16}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "usecase", "poi"], ["==", "level", level] ]
      }
      style={layerStyles.poisIcons}/>

    <MapboxGL.SymbolLayer
      id="proximiio-pois-labels"
      minZoomLevel={18}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "usecase", "poi"], ["==", "level", level] ]
      }
      style={layerStyles.poisLabels}/>

    <MapboxGL.FillExtrusionLayer
      id="proximiio-polygons-above-paths"
      minZoomLevel={12}
      maxZoomLevel={24}
      filter={
        [ "all", ["==", "type", "polygon_above_path"], ["==", "level", 0]]
      }
      style={layerStyles.polygonsAbovePaths}/>
  </MapboxGL.ShapeSource>
)