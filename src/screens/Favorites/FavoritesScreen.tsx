import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  ScrollView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps";

// Add interfaces for location data
interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    speed: number | null;
  };
  timestamp: number;
}

const FavoritesScreen: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<
    Location.LocationObject[]
  >([]);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [subscription, setSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Khởi tạo và xin quyền
  useEffect(() => {
    (async () => {
      try {
        // Xin quyền truy cập vị trí
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        // Lấy vị trí hiện tại
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
        setLocationHistory([currentLocation]);
      } catch (error: any) {
        setErrorMsg("Error: " + error.message);
      }
    })();
  }, []);

  // Bắt đầu theo dõi vị trí
  const startTracking = async () => {
    try {
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation);
          setLocationHistory((prev) => [...prev, newLocation]);
        }
      );
      setSubscription(locationSubscription);
      setIsTracking(true);
    } catch (error: any) {
      setErrorMsg("Tracking error: " + error.message);
    }
  };

  // Dừng theo dõi vị trí
  const stopTracking = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setIsTracking(false);
  };

  // Xóa lịch sử
  const clearHistory = () => {
    setLocationHistory([]);
  };

  return (
    <View style={styles.container}>
      {/* Phần bản đồ */}
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* Marker hiện tại */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Current Location"
          />

          {/* Đường đi */}
          <Polyline
            coordinates={locationHistory.map((loc) => ({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            }))}
            strokeColor="#000"
            strokeWidth={3}
          />
        </MapView>
      )}

      {/* Phần điều khiển */}
      <View style={styles.controls}>
        <Button
          title={isTracking ? "Stop Tracking" : "Start Tracking"}
          onPress={isTracking ? stopTracking : startTracking}
        />
        <Button title="Clear History" onPress={clearHistory} />
      </View>

      {/* Hiển thị thông tin */}
      <ScrollView style={styles.infoContainer}>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <>
            <Text style={styles.headerText}>Current Location:</Text>
            {location && (
              <View style={styles.locationInfo}>
                <Text>Latitude: {location.coords.latitude}</Text>
                <Text>Longitude: {location.coords.longitude}</Text>
                <Text>Altitude: {location.coords.altitude}</Text>
                <Text>Accuracy: {location.coords.accuracy}m</Text>
                <Text>Speed: {location.coords.speed}m/s</Text>
                <Text>
                  Timestamp: {new Date(location.timestamp).toLocaleString()}
                </Text>
              </View>
            )}
            <Text style={styles.headerText}>
              History Points: {locationHistory.length}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    height: "50%",
    width: "100%",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  infoContainer: {
    flex: 1,
    padding: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  locationInfo: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default FavoritesScreen;
