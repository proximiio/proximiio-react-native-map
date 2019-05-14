
# proximiio-react-native-map

## Getting started

Install Proximiio React Native Core and Map plugins, React Native Mapbox will be installed
as proximiio-react-native-map depdendency from custom fork.

```
npm i -s https://github.com/proximiio/proximiio-react-native-core
npm i -s https://github.com/proximiio/proximiio-react-native-map
```

## Installation Guide / Android

## `PROJECT_ROOT/android/app/src/main/AndroidManifest.xml`
Remove android:allowBackup field or use tools:override if you need the option.

## `PROJECT_ROOT/android/gradle.properties`
Edit file to include following:

```
android.useAndroidX=true
android.enableJetifier=true
```


## `PROJECT_ROOT/android/build.gradle`
We need to add an additional repository in order to get our dependencies.

* `https://jitpack.io`

```diff
allprojects {
    repositories {
        mavenLocal()
        google()
        jcenter()
+       maven { url "https://jitpack.io" }
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url "$rootDir/../node_modules/react-native/android"
        }
    }
}
```

Make sure that your `buildscript > ext` settings are correct.
We want to be on `28` or higher:

```
buildscript {
    ext {
        buildToolsVersion = "28.0.3"
        minSdkVersion = 20
        compileSdkVersion = 28
        targetSdkVersion = 28
    }
}
```

## `PROJECT_ROOT/android/app/build.gradle`

Add following to the file:

```
android {
    packagingOptions {
        exclude 'META-INF/LICENSE'
        exclude 'META-INF/LICENSE-FIREBASE.txt'
        exclude 'META-INF/NOTICE'
        exclude 'lib/armeabi/libcpaJNI.so'
        exclude 'lib/armeabi/libsqlcipher.so'
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

repositories {
    maven { url "http://proximi-io.bintray.com/proximiio-android" }
    maven { url "http://indooratlas-ltd.bintray.com/mvn-public" }
    maven { url 'https://maven.google.com' }
}

dependencies {
    implementation("androidx.core:core:1.0.1")
    implementation("androidx.versionedparcelable:versionedparcelable:1.0.0")
    implementation("androidx.collection:collection:1.0.0")
    implementation("androidx.annotation:annotation:1.0.0")
    implementation("androidx.lifecycle:lifecycle-runtime:2.0.0")
    implementation("androidx.lifecycle:lifecycle-common:2.0.0")
    implementation("androidx.arch.core:core-common:2.0.0")
    implementation project(':android-mapbox-react-native-mapbox-gl')
    implementation project(':proximiio-react-native-core')
    implementation 'io.proximi.proximiiolibrary:proximiiolibrary:2.8.3'
}
```

You can set the Support Library version or the okhttp version if you use other modules that depend on them:
* `supportLibVersion "28.0.0"`
* `okhttpVersion "3.12.1"`


## `PROJECT_ROOT/android/app/settings.gradle`

Include project, so gradle knows where to find the project

```diff
rootProject.name = <YOUR_PROJECT_NAME>

include ':android-mapbox-react-native-mapbox-gl'
project(':android-mapbox-react-native-mapbox-gl').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-mapbox/maps/android/rctmgl')

include ':proximiio-react-native-core'
project(':proximiio-react-native-core').projectDir = new File(rootProject.projectDir, '../node_modules/proximiio-react-native-core/android')

include ':app'¬
```

## `PROJECT_ROOT/android/app/src/main/java/com/YOUR_PROJECT_NAME/MainApplication.java`

We need to register both proximiio and mapbox packages

```diff
package <YOUR_PROJECT_NAME>;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
+import com.mapbox.rctmgl.RCTMGLPackage;
+import io.proximi.react.RNProximiioReactPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
+  private RNProximiioReactPackage proximiioPackage = new RNProximiioReactPackage();

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
+         new RCTMGLPackage(),
+         proximiioPackage
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}

```

## Installation / IOS

# iOS Installation

## Using CocoaPods

To install with CocoaPods, add the following to your `Podfile`:

```
  # Flexbox Layout Manager Used By React Native
  pod 'yoga', :path => '../node_modules/react-native/ReactCommon/yoga/Yoga.podspec'

  # React Native
  pod 'React', path: '../node_modules/react-native', subspecs: [
    # Comment out any unneeded subspecs to reduce bundle size.
    'Core',
    'DevSupport',
    'RCTActionSheet',
    'RCTAnimation',
    'RCTBlob',
    'RCTCameraRoll',
    'RCTGeolocation',
    'RCTImage',
    'RCTNetwork',
    'RCTPushNotification',
    'RCTSettings',
    'RCTText',
    'RCTVibration',
    'RCTWebSocket',
    'RCTLinkingIOS'
  ]

  # Mapbox
  pod 'react-native-mapbox-gl', :path => '../node_modules/@react-native-mapbox/maps'

  # Third party
  pod 'Folly', :podspec => '../node_modules/react-native/third-party-podspecs/Folly.podspec'

  post_install do |installer|
    installer.pods_project.targets.each do |target|
      if target.name == "React"
        target.remove_from_project
      end
    end
  end
```

Then run `pod install` and rebuild your project.

## Manual Installation

### Add Native Mapbox SDK Framework

Select your project in the `Project navigator`. Click `General` tab then add `node_modules/@react-native-mapbox/maps/ios/Mapbox.framework` to `Embedded Binaries`. :collision: **Important, make sure you're adding it to general -> `Embedded Binaries` :collision:**

Click 'Add other' to open the file browser and select Mapbox.framework.

![](https://s3.systemlevel.com/docs-public/addother.png)

Select the 'Copy items if needed' checkbox.

![](https://s3.systemlevel.com/docs-public/copyitems.png)

After adding Mapbox.framework it should be listed in your Embedded Binaries:

![](https://s3.systemlevel.com/docs-public/embeddedbinaries.png)

<!-- ![](https://cldup.com/s4U3JfS_-l.png) -->

### Add React Native Mapbox SDK Files

In Xcode's `Project navigator`, right click on the `Libraries` folder ➜ `Add Files to <...>`. Add `node_modules/@react-native-mapbox/maps/ios/RCTMGL.xcodeproj`.

![](https://s3.systemlevel.com/docs-public/addfilesto.png)

Then in Xcode navigate to `Build Phases` click on it and you should see `Link Binary with Libraries`, we need to add `libRCTMGL.a`.

![](https://s3.systemlevel.com/docs-public/buildphases.png)

After you add 'libRCTMGL.a' it should be listed as such:

![](https://s3.systemlevel.com/docs-public/buildphasesadd.png)

### Add Framework Header Search Paths

In the `Build Settings` of your application target search for `FRAMEWORK_SEARCH_PATHS`.

![](https://s3.systemlevel.com/docs-public/frameworksearch.png)

Add `$(PROJECT_DIR)/../node_modules/@react-native-mapbox/maps/ios` non-recursive to your `Framework Search Paths`.

![](https://s3.systemlevel.com/docs-public/frameworksearchadd.png)

**Important** If there is a select input under `Debug` line, choose `Any iOS SDK`.

### Add Run Script

In the `Build Phases` tab, click the plus sign and then `New Run Script Phase`.

![](https://cldup.com/jgt8p_dHjD.png)

Open the newly added `Run Script` and paste:

```bash
 "${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/Mapbox.framework/strip-frameworks.sh"
```

![](https://s3.systemlevel.com/docs-public/runscript.png)


## Usage / Javascript

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

Filter Features by IDs:
```
ProximiioMap.filterFeaturesByIds([featureId1, featureId2])
```

Filter Features by Amenities:
```
ProximiioMap.filterFeaturesByAmenities([amenityId1, amenityId2])
```

Cancel feature filtering:
```
ProximiioMap.cancelFeaturesFiltering()
```