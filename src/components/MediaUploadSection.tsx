import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MediaUploadSectionProps {
  images: string[];
  video: string;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({ 
  images, 
  video, 
  onPickImage, 
  onPickVideo, 
  onRemoveImage, 
  onRemoveVideo 
}) => {
  const screenWidth = Dimensions.get('window').width;
  const imageSize = (screenWidth - 48) / 3;

  return (
    <View style={styles.container}>
      {/* Image Upload Button */}
      <TouchableOpacity 
        style={styles.uploadBox} 
        onPress={onPickImage}
        disabled={images.length >= 5}
      >
        <Icon name="photo-camera" size={32} color="#f97314" />
        <Text style={styles.uploadText}>ĐĂNG TỪ 01 ĐẾN 05 HÌNH</Text>
      </TouchableOpacity>

      {/* Video Upload Button */}
      <TouchableOpacity 
        style={[styles.uploadBox, { marginTop: 12 }]} 
        onPress={onPickVideo}
        disabled={video !== ''}
      >
        <Icon name="videocam" size={32} color="#f97314" />
        <Text style={styles.uploadText}>
          ĐĂNG TỐI ĐA 01 VIDEO
        </Text>
        <Text style={styles.subText}>
          BẠN ĐÃ ĐĂNG 0/20 VIDEO TRONG THÁNG
        </Text>
      </TouchableOpacity>

      {/* Image Previews */}
      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={[styles.imageWrapper, { width: imageSize, height: imageSize }]}>
              <Image
                source={{ uri }}
                style={styles.image}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveImage(index)}
              >
                <Icon name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Video Preview */}
      {video && (
        <View style={styles.videoWrapper}>
          <Image
            source={{ uri: video }}
            style={styles.videoThumbnail}
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveVideo}
          >
            <Icon name="close" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#f97314',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF5ED',
  },
  uploadText: {
    marginTop: 8,
    color: '#f97314',
    fontSize: 14,
    fontWeight: '500',
  },
  subText: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    position: 'relative',
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    height: 200,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
});

export default MediaUploadSection;