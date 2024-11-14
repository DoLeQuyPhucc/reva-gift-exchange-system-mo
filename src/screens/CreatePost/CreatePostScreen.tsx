import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/src/layouts/types/navigationTypes';
import * as ImagePicker from 'expo-image-picker';
import Video from 'react-native-video';
import MediaUploadSection from '@/src/components/MediaUploadSection';

interface Category {
  id: string;
  name: string;
}

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, 'CreatePost'>;
  navigation: NavigationProp<RootStackParamList>;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation, route }) => {
  const initialCategory = route.params?.category;
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    initialCategory || null
  );
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [isFreeGift, setIsFreeGift] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [showTitleHint, setShowTitleHint] = useState<boolean>(false);
  const [showDescriptionHint, setShowDescriptionHint] = useState<boolean>(false);

  const categories: Category[] = [
    { id: '1', name: 'Điện thoại' },
    { id: '2', name: 'Máy tính' },
    { id: '3', name: 'Đồ gia dụng' },
  ];

  const conditions = [
    { id: '1', name: 'Mới' },
    { id: '2', name: 'Đã sử dụng (còn tốt)' },
    { id: '3', name: 'Đã sử dụng (cũ)' },
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        setVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
  };

  const removeVideo = () => {
    setVideo('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng Tin</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh Mục</Text>
          <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory?.id || ''}
            onValueChange={(value) => {
              const category = categories.find(cat => cat.id === value);
              setSelectedCategory(category || null);
            }}
          >
              <Picker.Item label="Chọn danh mục" value="" />
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
          
          <MediaUploadSection
            images={images}
            video={video}
            onPickImage={pickImage}
            onPickVideo={pickVideo}
            onRemoveImage={removeImage}
            onRemoveVideo={removeVideo}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={condition}
              onValueChange={(value) => setCondition(value)}
            >
              <Picker.Item label="Chọn tình trạng" value="" />
              {conditions.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={item.name}
                  value={item.id}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={isFreeGift ? 'checked' : 'unchecked'}
              onPress={() => setIsFreeGift(!isFreeGift)}
            />
            <Text>Tôi muốn cho tặng miễn phí</Text>
          </View>
        </View>

        {/* Title and Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIÊU ĐỀ TIN ĐĂNG VÀ MÔ TẢ CHI TIẾT</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Tiêu đề tin đăng"
            value={title}
            onChangeText={setTitle}
            onFocus={() => setShowTitleHint(true)}
            onBlur={() => setShowTitleHint(false)}
          />
          {showTitleHint && (
            <Text style={styles.hint}>
              Tiêu đề tốt nên ngắn gọn, đầy đủ thông tin quan trọng
            </Text>
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            onFocus={() => setShowDescriptionHint(true)}
            onBlur={() => setShowDescriptionHint(false)}
          />
          {showDescriptionHint && (
            <Text style={styles.hint}>
              Không được phép ghi thông tin liên hệ trong mô tả
            </Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN NGƯỜI BÁN</Text>
          <TextInput
            style={styles.input}
            placeholder="Địa chỉ"
            value={address}
            onChangeText={setAddress}
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.previewButton]}
          onPress={() => {/* Handle preview */}}
        >
          <Text style={{color: "black"}}>Xem trước</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.footerButton, styles.publishButton]}
          onPress={() => {/* Handle publish */}}
        >
          <Text style={styles.buttonText}>Đăng bài</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 24,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  uploadButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: '#f0f0f0',
  },
  publishButton: {
    backgroundColor: '#f97314',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;