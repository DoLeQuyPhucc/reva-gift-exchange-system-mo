import Colors from "@/src/constants/Colors";
import { LocationMap } from "@/src/shared/type";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { Modal } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { goongApi } from "@/src/services/goongApi";
import { Buffer } from "buffer";
import axiosInstance from "@/src/api/axiosInstance";

interface MapModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
  sourceLocation: LocationMap;
  destinationLocation: LocationMap;
  transactionId?: string;
}

interface QRModalState {
  visible: boolean;
  qrCode: string | null;
}

interface RouteInfo {
  coordinates: LocationMap[];
  distance: number;
  duration: number;
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

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default function MapModal({
  open,
  onClose,
  sourceLocation,
  destinationLocation,
  transactionId,
}: MapModalProps) {
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    coordinates: number[][];
  } | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [routeProgress, setRouteProgress] = useState(0);

  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [traveledDistance, setTraveledDistance] = useState(0);

  const [qrModal, setQrModal] = useState<QRModalState>({
    visible: false,
    qrCode: null,
  });

  const findClosestPointIndex = (
    currentPoint: any,
    routePoints: number[][]
  ) => {
    let minDistance = Infinity;
    let closestIndex = 0;

    routePoints.forEach((point: number[], index: number) => {
      const distance = Math.sqrt(
        Math.pow(currentPoint.coords.longitude - point[0], 2) +
          Math.pow(currentPoint.coords.latitude - point[1], 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const fetchQRCode = async (transactionId: string) => {
    try {
      const response = await axiosInstance.get(
        `qr/generate?transactionId=${transactionId}`,
        {
          responseType: "arraybuffer",
        }
      );
      const base64Image = `data:image/png;base64,${Buffer.from(
        response.data,
        "binary"
      ).toString("base64")}`;
      setQrModal({ visible: true, qrCode: base64Image });
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 0.5,
        },
        (newLocation) => {
          setCurrentLocation(newLocation);

          const distance = calculateDistance(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            destinationLocation.latitude,
            destinationLocation.longitude
          );

          if (distance <= 10 && transactionId && !qrModal.qrCode) {
            fetchQRCode(transactionId);
          }

          if (routeInfo?.coordinates && routeInfo.coordinates.length > 0) {
            const closestIndex = findClosestPointIndex(
              newLocation,
              routeInfo.coordinates
            );

            if (closestIndex > 0) {
              setTraveledDistance(closestIndex);
            }
          }
        }
      );
    };

    if (open && routeInfo?.coordinates) {
      requestLocationPermission();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [open, routeInfo, destinationLocation, transactionId]);

  useEffect(() => {
    MapboxGL.setAccessToken(GOONG_ACCESS_TOKEN);
    MapboxGL.setTelemetryEnabled(false);
  }, []);

  useEffect(() => {
    if (open) {
      calculateRoute();
    }
  }, [open, sourceLocation, destinationLocation]);

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

  const QRCodeModal = () => (
    <Modal
      visible={qrModal.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setQrModal({ ...qrModal, visible: false })}
    >
      <View style={styles.qrModalContainer}>
        <View style={styles.qrModalContent}>
          <Text style={styles.qrModalTitle}>Quét mã QR để xác nhận</Text>
          {qrModal.qrCode && (
            <Image
              source={{ uri: qrModal.qrCode }}
              style={{ width: 220, height: 220 }}
            />
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setQrModal({ ...qrModal, visible: false })}
          >
            <Text style={styles.buttonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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

          {/* Route Line */}
          {routeInfo &&
            routeInfo.coordinates &&
            routeInfo.coordinates.length > 0 && (
              <>
                {/* Traveled Route Line */}
                {/* {traveledDistance > 0 && (
                  <MapboxGL.ShapeSource
                    key="traveledRoute"
                    id="traveledRouteSource"
                    shape={{
                      type: "Feature",
                      properties: { "z-index": 1 },
                      geometry: {
                        type: "LineString",
                        coordinates: routeInfo.coordinates.slice(
                          0,
                          Math.min(
                            traveledDistance,
                            routeInfo.coordinates.length
                          )
                        ),
                      },
                    }}
                  >
                    <MapboxGL.LineLayer
                      id="traveledLineLayer"
                      style={{
                        lineColor: "#808080",
                        lineWidth: 7,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )} */}

                {/* Remaining Route Line */}
                {traveledDistance < routeInfo.coordinates.length && (
                  <MapboxGL.ShapeSource
                    key="remainingRoute"
                    id="remainingRouteSource"
                    shape={{
                      type: "Feature",
                      properties: { "z-index": 1 },
                      geometry: {
                        type: "LineString",
                        coordinates:
                          routeInfo.coordinates.slice(traveledDistance),
                      },
                    }}
                  >
                    <MapboxGL.LineLayer
                      id="remainingLineLayer"
                      style={{
                        lineColor: "#2E64FE",
                        lineWidth: 7,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )}

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

                {currentLocation && (
                  <MapboxGL.PointAnnotation
                    id="currentLocation"
                    coordinate={[
                      currentLocation.coords.longitude,
                      currentLocation.coords.latitude,
                    ]}
                  >
                    <View
                      style={[styles.currentLocationMarker, { zIndex: 999 }]}
                    >
                      <View style={styles.currentLocationDot}>
                        <View style={styles.currentLocationInnerDot} />
                      </View>
                      <View style={styles.currentLocationPulse} />
                    </View>
                  </MapboxGL.PointAnnotation>
                )}
              </>
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

        <QRCodeModal />
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
  currentLocationMarker: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  currentLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4285F4",
    borderWidth: 3,
    borderColor: "white",
    zIndex: 2,
  },
  currentLocationInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  currentLocationPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    position: "absolute",
    zIndex: 1,
  },
  qrModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  qrModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
});
