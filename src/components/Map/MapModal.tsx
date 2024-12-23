import Colors from "@/src/constants/Colors";
import { LocationMap } from "@/src/shared/type";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { goongApi } from "@/src/services/goongApi";

interface MapModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
  sourceLocation: LocationMap; // Địa điểm đi
  destinationLocation: LocationMap; // Địa điểm đến
}

export default function MapModal({
  open,
  onClose,
  sourceLocation,
  destinationLocation,
}: MapModalProps) {
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    coordinates: { latitude: number; longitude: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [traveledDistance, setTraveledDistance] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      setRouteInfo(null);
      setTraveledDistance(0);
    } else {
      calculateRoute();
    }
  }, [open]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    if (open) {
      (async () => {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (newLocation) => {
            setCurrentLocation(newLocation);
            if (routeInfo?.coordinates) {
              const currentPoint = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              };
              const closestIndex = findClosestPointIndex(
                currentPoint,
                routeInfo.coordinates
              );
              setTraveledDistance(closestIndex);
            }
          }
        );
      })();
    }
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [open, routeInfo]);

  const calculateRoute = async () => {
    setIsLoading(true);
    try {
      const response = await goongApi.getDirections(
        [sourceLocation.latitude, sourceLocation.longitude],
        [destinationLocation.latitude, destinationLocation.longitude]
      );

      if (response.routes && response.routes.length > 0) {
        const route = response.routes[0];
        const polylineString = route.overview_polyline?.points;

        if (polylineString) {
          const points = goongApi.decodePolyline(polylineString);
          const coordinates = points.map((point) => ({
            latitude: point[0],
            longitude: point[1],
          }));

          setRouteInfo({
            distance: route.legs?.[0]?.distance?.text || "N/A",
            duration: route.legs?.[0]?.duration?.text || "N/A",
            coordinates,
          });
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findClosestPointIndex = (
    currentPoint: { latitude: number; longitude: number },
    routePoints: { latitude: number; longitude: number }[]
  ) => {
    let closestIndex = 0;
    let minDistance = Number.MAX_VALUE;

    routePoints.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(currentPoint.latitude - point.latitude, 2) +
          Math.pow(currentPoint.longitude - point.longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  return (
    <Modal visible={open} transparent animationType="slide">
      <View style={styles.modalMapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1, width: "100%" }}
          initialRegion={{
            latitude: sourceLocation.latitude,
            longitude: sourceLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Current Location Marker với icon xe */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Vị trí hiện tại"
            >
              <View style={styles.carMarker}>
                <Text style={styles.carEmoji}>🚗</Text>
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          <Marker
            coordinate={{
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            }}
            title="Điểm đến"
          />

          {/* Chia polyline thành 2 phần: đã đi và chưa đi */}
          {routeInfo && routeInfo.coordinates.length > 0 && (
            <>
              <Polyline
                coordinates={routeInfo.coordinates.slice(0, traveledDistance)}
                strokeColor={Colors.gray400} // Màu nhạt cho phần đã đi
                strokeWidth={5}
              />
              <Polyline
                coordinates={routeInfo.coordinates.slice(traveledDistance)}
                strokeColor={Colors.orange500} // Màu cam cho phần chưa đi
                strokeWidth={5}
              />
            </>
          )}
        </MapView>

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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  carMarker: {
    padding: 5,
    backgroundColor: "white",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.orange500,
  },
  carEmoji: {
    fontSize: 20,
  },
});
