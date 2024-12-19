import Colors from "@/src/constants/Colors";
import { LocationMap } from "@/src/shared/type";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { TouchableOpacity } from "react-native";
import { Modal } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { goongApi } from "@/src/services/goongApi";

interface MapModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
  sourceLocation: LocationMap; // Địa điểm đi
  destinationLocation: LocationMap; // Địa điểm đến
}

const GOONG_ACCESS_TOKEN = "EiVlij4sGBI3kqNoebCG5eTotTTdvJ1ZzIMsUlp0";

const calculateProgressAlongRoute = (
  currentPoint: number[],
  routePoints: number[][]
) => {
  for (let i = 0; i < routePoints.length - 1; i++) {
    const [x1, y1] = routePoints[i];
    const [x2, y2] = routePoints[i + 1];
    const [x, y] = currentPoint;

    // Check if point is between current segment
    if (
      x >= Math.min(x1, x2) &&
      x <= Math.max(x1, x2) &&
      y >= Math.min(y1, y2) &&
      y <= Math.max(y1, y2)
    ) {
      return i / (routePoints.length - 1);
    }
  }
  return 0;
};

export default function MapModal({
  open,
  onClose,
  sourceLocation,
  destinationLocation,
}: MapModalProps) {
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    coordinates: number[][];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [routeProgress, setRouteProgress] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (routeInfo) {
      console.log("Route coordinates:", routeInfo.coordinates);
    }
  }, [routeInfo]);

  useEffect(() => {
    MapboxGL.setAccessToken(GOONG_ACCESS_TOKEN);
    MapboxGL.setTelemetryEnabled(false);
  }, []);

  useEffect(() => {
    if (open) {
      calculateRoute();
    }
  }, [open, sourceLocation, destinationLocation]);

  useEffect(() => {
    if (open) {
      const watchId = MapboxGL.locationManager.start();

      MapboxGL.locationManager.addListener(
        (location: {
          coords: {
            latitude: number;
            longitude: number;
            isMock?: boolean;
            speed?: number;
            heading?: number;
          };
        }) => {
          const { coords } = location;

          // Accept both real and mock locations in development
          if (__DEV__ || !coords.isMock) {
            console.log("Location update:", {
              latitude: coords.latitude,
              longitude: coords.longitude,
              isMock: coords.isMock,
              speed: coords.speed,
              heading: coords.heading,
            });

            setUserLocation([coords.longitude, coords.latitude]);

            if (coords.latitude && coords.longitude) {
              calculateRoute({
                latitude: coords.latitude,
                longitude: coords.longitude,
              });
            }
          }
        }
      );

      return () => {
        MapboxGL.locationManager.stop();
      };
    }
  }, [open]);

  const calculateRoute = async (currentLocation?: LocationMap) => {
    setIsLoading(true);
    try {
      const startLocation = currentLocation || sourceLocation;
      const response = await goongApi.getDirections(
        [startLocation.latitude, startLocation.longitude],
        [destinationLocation.latitude, destinationLocation.longitude]
      );

      if (response.routes && response.routes.length > 0) {
        const route = response.routes[0];
        const polylineString = route.overview_polyline?.points;

        if (polylineString) {
          const points = goongApi.decodePolyline(polylineString);
          const mapboxPoints = points.map((point) => [point[1], point[0]]);

          if (currentLocation) {
            const currentPoint = [
              currentLocation.longitude,
              currentLocation.latitude,
            ];
            const progress = calculateProgressAlongRoute(
              currentPoint,
              mapboxPoints
            );
            setRouteProgress(progress);
          }

          if (points.length > 0) {
            // Convert points về format [longitude, latitude] cho Mapbox
            const mapboxPoints = points.map((point) => [point[1], point[0]]);

            setRouteInfo({
              distance: route.legs?.[0]?.distance?.text || "N/A",
              duration: route.legs?.[0]?.duration?.text || "N/A",
              coordinates: mapboxPoints,
            });

            // Tính bounds dựa trên mapboxPoints
            const bounds = mapboxPoints.reduce(
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
                ne: [mapboxPoints[0][0], mapboxPoints[0][1]],
                sw: [mapboxPoints[0][0], mapboxPoints[0][1]],
              }
            );

            cameraRef.current?.fitBounds(bounds.ne, bounds.sw, 50, 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide">
      <View style={styles.modalMapContainer}>
        <MapboxGL.MapView
          style={{ flex: 1, width: "100%" }}
          styleURL="https://tiles.goong.io/assets/goong_map_web.json?api_key=x6ttXfdpoNErTLWmdGzUgTeRhtrTTXsj2v1MGnfE"
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={12}
            centerCoordinate={[
              sourceLocation.longitude,
              sourceLocation.latitude,
            ]}
          />

          <MapboxGL.UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
            androidRenderMode={
              Platform.OS === "android" ? "compass" : undefined
            }
            minDisplacement={1}
          />

          {/* Source Marker */}
          <MapboxGL.PointAnnotation
            id="source"
            coordinate={[sourceLocation.longitude, sourceLocation.latitude]}
          >
            <MapboxGL.Callout title="Điểm đi" />
          </MapboxGL.PointAnnotation>

          {/* Destination Marker */}
          <MapboxGL.PointAnnotation
            id="destination"
            coordinate={[
              destinationLocation.longitude,
              destinationLocation.latitude,
            ]}
          >
            <MapboxGL.Callout title="Điểm đến" />
          </MapboxGL.PointAnnotation>

          {/* Route Line */}
          {routeInfo && (
            <MapboxGL.ShapeSource
              id="routeSource"
              shape={{
                type: "Feature",
                properties: { "z-index": 1 },
                geometry: {
                  type: "LineString",
                  coordinates: routeInfo.coordinates,
                },
              }}
            >
              <MapboxGL.LineLayer
                id="lineLayer"
                style={{
                  lineColor: "#2E64FE",
                  lineWidth: 10,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => onClose(false)}
          >
            <Text style={styles.buttonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalMapContainer: {
    flex: 1,
    position: "relative",
  },
  buttonContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row",
    gap: 10,
    zIndex: 1,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#000000aa",
  },
  confirmButton: {
    backgroundColor: Colors.orange500,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  routeLine: {
    lineColor: Colors.orange500,
    lineWidth: 3,
  } as MapboxGL.LineLayerStyle,
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
    top: 40,
    left: 20,
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
    fontSize: 14,
    marginBottom: 4,
  },
});
