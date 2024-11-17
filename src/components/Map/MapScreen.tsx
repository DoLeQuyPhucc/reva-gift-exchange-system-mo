import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Hàm gọi Geocoding API để tìm tọa độ
const fetchCoordinates = async (address: string) => {
  const API_KEY = 'AIzaSyCINoldLz1xCfN4XSJ4ti5d4Lt4hBGzots'; // Thay bằng API Key của bạn
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${API_KEY}`;

  console.log(url)

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      Alert.alert('Error', 'Không thể tìm thấy địa chỉ.');
      return null;
    }
  } catch (error) {
    Alert.alert('Error', 'Lỗi kết nối với Geocoding API.');
    console.error(error);
    return null;
  }
};

const MapScreen = () => {
  const [address, setAddress] = useState('');
  const [markerPosition, setMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  // Xử lý khi nhấn nút tìm kiếm
  const handleSearch = async () => {
    console.log('Searching for:', address);
    const coordinates = await fetchCoordinates(address);
    if (coordinates) {
      setMarkerPosition(coordinates);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa chỉ (VD: Thủ Đức, Hồ Chí Minh)"
          value={address}
          onChangeText={setAddress}
        />
        <Button title="Tìm địa chỉ" onPress={handleSearch} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 10.8231,
            longitude: 106.6297,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setMarkerPosition({ latitude, longitude });
          }}
        >
          {markerPosition && (
            <Marker
              coordinate={markerPosition}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setMarkerPosition({ latitude, longitude });
              }}
              title="Vị trí của bạn"
              description={`Lat: ${markerPosition.latitude}, Lng: ${markerPosition.longitude}`}
            />
          )}
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: 'white',
    zIndex: 1,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  mapContainer: {
    flex: 0.5,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
