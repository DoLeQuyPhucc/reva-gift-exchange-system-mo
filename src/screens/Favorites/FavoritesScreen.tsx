// components/GoongMapComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { goongApi } from "@/src/services/goongApi";
import { LineLayerStyle } from "@rnmapbox/maps";

interface Coordinate {
  longitude: number;
  latitude: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: number[][];
}

const GOONG_ACCESS_TOKEN = "EiVlij4sGBI3kqNoebCG5eTotTTdvJ1ZzIMsUlp0";
const INITIAL_COORDS: [number, number] = [105.83991, 21.028]; // Hà Nội

const GoongMapComponent: React.FC = () => {
  const [markers, setMarkers] = useState<Coordinate[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    MapboxGL.setAccessToken(GOONG_ACCESS_TOKEN);
    MapboxGL.setConnected(true);
  }, []);

  const handleMapPress = async (event: any) => {
    const coordinate = event.geometry.coordinates;
    const newMarker = { longitude: coordinate[0], latitude: coordinate[1] };

    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);

    if (updatedMarkers.length === 2) {
      await calculateRoute(updatedMarkers[0], updatedMarkers[1]);
    }
  };

  const calculateRoute = async (
    origin: Coordinate,
    destination: Coordinate
  ) => {
    setIsLoading(true);
    try {
      const response = await goongApi.getDirections(
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      );

      if (response.status === "OK" && response.routes.length > 0) {
        const route = response.routes[0];
        const points = goongApi.decodePolyline(route.overview_polyline.points);

        setRouteInfo({
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
          coordinates: points,
        });

        // Điều chỉnh camera để hiển thị toàn bộ tuyến đường
        const bounds = points.reduce(
          (bounds, coord) => {
            bounds.ne = [
              Math.max(bounds.ne[0], coord[0]),
              Math.max(bounds.ne[1], coord[1]),
            ];
            bounds.sw = [
              Math.min(bounds.sw[0], coord[0]),
              Math.min(bounds.sw[1], coord[1]),
            ];
            return bounds;
          },
          {
            ne: [points[0][0], points[0][1]],
            sw: [points[0][0], points[0][1]],
          }
        );

        cameraRef.current?.fitBounds(
          [bounds.ne[0], bounds.ne[1]],
          [bounds.sw[0], bounds.sw[1]],
          50,
          1000
        );
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setMarkers([]);
    setRouteInfo(null);
    cameraRef.current?.setCamera({
      centerCoordinate: INITIAL_COORDS,
      zoomLevel: 12,
      animationDuration: 1000,
    });
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="https://tiles.goong.io/assets/goong_map_web.json?api_key=x6ttXfdpoNErTLWmdGzUgTeRhtrTTXsj2v1MGnfE"
        onPress={handleMapPress}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={INITIAL_COORDS}
        />

        {markers.map((marker, index) => (
          <MapboxGL.PointAnnotation
            key={`point-${index}`}
            id={`point-${index}`}
            coordinate={[marker.longitude, marker.latitude]}
          >
            <MapboxGL.Callout title={index === 0 ? "Điểm đi" : "Điểm đến"} />
          </MapboxGL.PointAnnotation>
        ))}

        {routeInfo && (
          <MapboxGL.ShapeSource
            id="routeSource"
            shape={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeInfo.coordinates,
              },
            }}
          >
            <MapboxGL.LineLayer id="routeLine" style={styles.routeLine} />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {routeInfo && (
        <View style={styles.routeInfoContainer}>
          <Text style={styles.routeInfoText}>
            Khoảng cách: {routeInfo.distance}
          </Text>
          <Text style={styles.routeInfoText}>
            Thời gian: {routeInfo.duration}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
        <Text style={styles.buttonText}>Xóa tất cả</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  clearButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  routeLine: {
    lineColor: "#00b0ff",
    lineWidth: 3,
  } as LineLayerStyle,
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  routeInfoContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoText: {
    fontSize: 16,
    marginBottom: 4,
  },
});

export default GoongMapComponent;
