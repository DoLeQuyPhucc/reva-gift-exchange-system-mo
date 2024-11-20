import Colors from "@/src/constants/Colors";
import { LocationMap } from "@/src/shared/type";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";
import { Modal } from "react-native";
import MapView, { Marker } from "react-native-maps";

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
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>({ latitude: location.latitude, longitude: location.longitude });

  useEffect(() => {
    setMarkerPosition({ latitude: location.latitude, longitude: location.longitude });
  }, [location, canMarkerMove]);

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
        <MapView
          style={{ flex: 1, width: "100%" }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            ...zoomLevel,
          }}
          onPress={handleMapPress}
        >
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              title={"Location"}
              description={"location.description"}
            />
          )}
        </MapView>
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