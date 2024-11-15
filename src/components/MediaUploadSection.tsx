import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MediaUploadSectionProps {
  images: string[];
  video: string;
  selectedImage: string | null;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
  isLoading?: boolean;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  video,
  onPickImage,
  onPickVideo,
  onRemoveImage,
  onRemoveVideo,
  isLoading = false
}) => {
  const screenWidth = Dimensions.get('window').width;
  const boxSize = (screenWidth - 48 - 32) / 5;

  const renderUploadBox = () => {
    if (isLoading) {
      return (
        <View style={styles.uploadContent}>
          <ActivityIndicator size="small" color="#f97314" style={styles.spinner} />
          <Text style={[styles.uploadText, { marginTop: 8 }]}>Đang tải...</Text>
        </View>
      );
    }

    return (
      <View style={styles.uploadContent}>
        <Icon name="add" size={32} color="#f97314" />
        <Text style={styles.imageCount}>{images.length}/5</Text>
      </View>
    );
  };

  const renderFirstUploadBox = () => {
    if (isLoading) {
      return (
        <>
          <ActivityIndicator size="large" color="#f97314" />
          <Text style={[styles.uploadText, { marginTop: 8 }]}>Đang tải...</Text>
        </>
      );
    }

    return (
      <>
        <Icon name="camera-alt" size={32} color="#f97314" />
        <Text style={styles.uploadText}>Thêm hình ảnh</Text>
        <Text style={styles.imageCount}>{images.length}/5</Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <View style={styles.imageGrid}>
          {images.length === 0 ? (
            <TouchableOpacity 
              style={styles.originalUploadBox} 
              onPress={onPickImage}
              disabled={isLoading}
            >
              <View style={styles.uploadContent}>
                {renderFirstUploadBox()}
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.uploadBox, { width: boxSize, height: boxSize }]} 
                onPress={onPickImage}
                disabled={images.length >= 5 || isLoading}
              >
                {renderUploadBox()}
              </TouchableOpacity>

              {images.map((uri, index) => (
                <View key={index} style={[styles.imageContainer, { width: boxSize, height: boxSize }]}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveImage(index)}
                    disabled={isLoading}
                  >
                    <Icon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      </View>

      {/* Video Upload Section */}
      <TouchableOpacity 
        style={styles.videoUploadBox} 
        onPress={onPickVideo}
        disabled={video !== '' || isLoading}
      >
        <Icon name="videocam" size={32} color="#f97314" />
        <Text style={styles.uploadText}>ĐĂNG TỐI ĐA 01 VIDEO</Text>
        <Text style={styles.subText}>BẠN ĐÃ ĐĂNG 0/20 VIDEO TRONG THÁNG</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  originalUploadBox: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  uploadBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
  },
  uploadContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  videoUploadBox: {
    padding: 16,
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  subText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  imageCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  spinner: {
    transform: [{ scale: 1.2 }]
  },
});

export default MediaUploadSection;