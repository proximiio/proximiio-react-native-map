
# react-native-proximiio-react-native-map

## Getting started

1. Install React Native Mapbox GL (https://github.com/nitaliano/react-native-mapbox-gl)
2. Install Proximiio React Native Map plugin:

```
npm i -s https://github.com/proximiio/proximiio-react-native-map
```

## Usage

```
import Proximiio from 'proximiio-react-native-core'
import ProximiioMap from 'proximiio-react-native-map'


componentDidMount() {
	this.initMapData()
}

async initMapData() {
	ProximiioMap.on('ready', proximiioMap => {
		this.setState({ mapDataReady: true })
	})
	ProximiioMap.on('route:change', async route => {
		await this.setState({ route })
	})
	ProximiioMap.authorize(TOKEN)
}
```

in component render:

```
<MapboxGL.MapView
	ref={c => (this._map = c)}
	zoomLevel={16}
	centerCoordinate={this.state.mapLocation}
	style={styles.matchParent}
	styleURL={ProximiioMap.styleURL}>

	{ ProximiioMap.indoorSources(this.state.level, this.state.showFloorplan, this.state.showGeoJSON) }
</MapboxGL.MapView>
```

request routing:

```
ProximiioMap.routeTo([lng, lat], targetLevel)
```

cancel routing:
```
ProximiioMap.cancelRoute()
```

POI access:
```
ProximiioMap.sortedPOIs
```
