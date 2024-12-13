import Colors from '@/src/constants/Colors';
import { LocationMap } from '@/src/shared/type';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  PermissionsAndroid,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import MapView, {PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';

interface MapModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
  location: LocationMap;
  zoomLevel?: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
  canMarkerMove: boolean;
  onSetAddressCoordinates?: (coordinates: LocationMap) => void;
}

export default function MapModal({
  open,
  onClose,
  location,
  zoomLevel = {
    latitudeDelta: 0.003,
    longitudeDelta: 0.003,
  },
  canMarkerMove = false,
  onSetAddressCoordinates = () => {},
}: MapModalProps) {
  const [currentPosition, setCurrentPosition] = useState<LocationMap | null>({
    // latitude: location.latitude,
    // longitude: location.longitude,
    latitude: 10.841254037529868,
    longitude: 106.80992591014189,
  });

  // 10.841254037529868, 106.80992591014189
  const [markerPosition, setMarkerPosition] = useState<LocationMap>({
    latitude: location.latitude,
    longitude: location.longitude,
  });

  const [destination] = useState({
    latitude: 10.835321,
    longitude: 106.807673,
  });

  useEffect(() => {
    setMarkerPosition({ latitude: location.latitude, longitude: location.longitude });
  }, [location, canMarkerMove]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 1000,
        fastestInterval: 1000,
      }
    );
  };

  useEffect(() => {
    requestLocationPermission();
    return () => {
      Geolocation.stopObserving();
    };
  }, []);

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    if (!canMarkerMove) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (markerPosition) {
      onSetAddressCoordinates(markerPosition);
      onClose(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide">
      <View style={styles.modalMapContainer}>
      {currentPosition && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
            latitudeDelta: zoomLevel.latitudeDelta,
            longitudeDelta: zoomLevel.longitudeDelta,
          }}
          zoomEnabled={true}
          zoomControlEnabled={true}
        >
          <Marker
            coordinate={currentPosition}
            title="Current Location"
          />
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="blue"
          />
          <Polyline
            coordinates={[currentPosition, destination]}
            strokeColor="#000"
            strokeWidth={2}
          />
        </MapView>
      )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={() => onClose(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
          {canMarkerMove && (
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>Confirm Location</Text>
            </TouchableOpacity>
          )}
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
  map: {
    flex: 0.7,
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
    alignItems: 'center',
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
});