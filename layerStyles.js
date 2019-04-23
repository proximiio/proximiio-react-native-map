import MapboxGL from '@mapbox/react-native-mapbox-gl'
const StyleSheet = MapboxGL.StyleSheet

export default StyleSheet.create({
  floors: {
    fillColor: StyleSheet.identity('color'),
    fillOpacity: 0.7
  },
  floorsLines: {
    lineColor: StyleSheet.identity('color')
  },
  baseFloor: {
    fillColor: StyleSheet.identity('color')
  },
  rood: {
    fillColor: StyleSheet.identity('color')
  },
  areas: {
    fillColor: '#80F080'
  },
  parkingBase: {
    fillColor: StyleSheet.identity('color')
  },
  shops: {
    fillExtrusionColor: StyleSheet.identity('color'),
    fillExtrusionHeight: StyleSheet.identity('height'),
    fillExtrusionBase: 0.1,
    fillExtrusionOpacity: 0.8
  },
  rooms: {
    fillColor: StyleSheet.identity('color')
  },
  holes: {
    fillColor: StyleSheet.identity('color')
  },
  walls: {
    fillExtrusionColor: StyleSheet.identity('color'),
    fillExtrusionHeight: 4,
    fillExtrusionBase: 0.1,
    fillExtrusionOpacity: 1
  },
  paths: {
    lineOpacity: 1,
    lineColor: '#0080c0',
    lineWidth: 8
  },
  pathsSymbols: {
    iconImage: StyleSheet.identity('amenity'),
    iconSize: 0.7,
    symbolPlacement: 'line',
    symbolSpacing: 200,
    iconRotationAlignment: 'map'
  },
  pathsNames: {
    textField: StyleSheet.identity('name'),
    iconPitchAlignment: 'map',
    textPitchAlignment: 'map',
    textMaxWidth: 10,
    textLineHeight: 1.2,
    textJustify: 'center',
    textMaxAngle: 180,
    textRotate: 0,
    textPadding: 2,
    textKeepUpright: true,
    textOffset: [0, 0],
    textAllowOverlap: true,
    textIgnorePlacement: false,
    textOptional: false,
    textSize: 12,
    textFont: [ "Klokantech Noto Sans Regular" ],
    textTransform: 'uppercase',
    textLetterSpacing: 0.1,
    textRotationAlignment: 'map',
    symbolSpacing: 50,
    symbolPlacement: 'line',
    visibility: 'none',
    textColor: '#ffffff'
  },
  levelChangers: {
    iconImage: StyleSheet.identity('levelchanger'),
    iconSize: 0.9,
    textOffset: [0, 1],
    textFont: [ "Klokantech Noto Sans Regular" ],
    textField: StyleSheet.identity('title'),
    textSize: 14,
    symbolPlacement: 'point',
    iconAllowOverlap: true,
    textAllowOverlap: true
  },
  poisIcons: {
    iconImage: StyleSheet.identity('amenity'),
    iconSize: 0.9,
    textOffset: [0, 2],
    textFont: [ "Klokantech Noto Sans Regular" ],
    textSize: 14,
    symbolPlacement: 'point',
    iconAllowOverlap: true,
    textAllowOverlap: true
  },
  poisLabels: {
    textOffset: [0, 2],
    textFont: [ "Klokantech Noto Sans Regular" ],
    textField: StyleSheet.identity('title'),
    textSize: 14,
    symbolPlacement: 'point',
    iconAllowOverlap: true,
    textAllowOverlap: false
  },
  routeLine: {
    lineOpacity: 0.9,
    lineColor: '#00ee00',
    lineWidth: 12
  },
  routeSymbol: {
    iconImage: StyleSheet.identity('icon'),
    iconSize: 1,
    iconAllowOverlap: true
  },
  userAccuracy: {
    fillColor: '#0080c0',
    fillOpacity: 0.3
  },
  userPosition: {
    iconImage: 'bluedot',
    iconSize: 1,
    iconAllowOverlap: true
  },
  routeSymbols: {
    iconImage: 'arrow',
    iconSize: 0.4,
    symbolPlacement: 'line',
    iconRotationAlignment: 'map',
  },
  routeFinish: {
    iconImage: StyleSheet.identity('icon'),
    iconSize: 0.5,
    symbolPlacement: 'point',
    textField: 'Destination'
  },
  polygonsAbovePaths: {
    fillExtrusionColor: StyleSheet.identity('color'),
    fillExtrusionHeight: StyleSheet.identity('height'),
    fillExtrusionBase: 0.1,
    fillExtrusionOpacity: 0.8
  }
})
