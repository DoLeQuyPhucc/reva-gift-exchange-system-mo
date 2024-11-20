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
}

export default function MapModal({
  open,
  onClose,
  location,
  zoomLevel = {
    latitudeDelta: 0.08,
    longitudeDelta: 0.04,
  },
  canMarkerMove = false,
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
          onPress={handleMapPress} // Lấy tọa độ khi nhấn
        >
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              title={location.title || "Location"}
              description={location.description}
            />
          )}
        </MapView>
        <TouchableOpacity
          style={styles.mapCloseButton}
          onPress={() => onClose(false)}
        >
          <Text style={styles.mapCloseButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalMapContainer: {
    flex: 1,
    position: "relative",
  },
  mapCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#000000aa",
    padding: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  mapCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
