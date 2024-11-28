import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Button,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Checkbox, RadioButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/src/layouts/types/navigationTypes';
import * as ImagePicker from 'expo-image-picker';
import { CustomAlert } from '@/src/components/CustomAlert';
import { getDayOfWeek, formatDaysOfWeek } from '@/src/utils/dateUtils';

import MediaUploadSection from '@/src/components/MediaUploadSection';
import { Category, ConditionOption, ItemCondition, SubCategory } from '@/src/shared/type';

import useCategories from '@/src/hooks/useCategories';
import useCreatePost from '@/src/hooks/useCreatePost';
import { useCategoryStore } from '@/src/stores/categoryStore';
import Colors from '@/src/constants/Colors';
import { CustomTimeSection } from '@/src/components/CustomTimeSection';

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, 'CreatePost'>;
  navigation: NavigationProp<RootStackParamList>;
}

type TimeSlot = {
  label: string;
  value: string;
};

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 25 }).map((_, idx) => {
  const hour = Math.floor(idx / 2) + 9;
  const minute = idx % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  return {
    label: time,
    value: time,
  };
});

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, 'CreatePost'>;
  navigation: NavigationProp<RootStackParamList>;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation, route }) => {
  const initialCategory = route.params?.category;
  const initialCategoryId = route.params?.categoryId;
  const initialSubCategory = route.params?.subCategory;
  const initialSubCategoryId = route.params?.subCategoryId;
  
  const { categories, subCategories, getSubCategories } = useCategories();
  const { addressData, loading, submitPost } = useCreatePost();
  const setCategoryStore = useCategoryStore(state => state.setCategory);
  const setSubCategoryStore = useCategoryStore(state => state.setSubCategory);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
    if (initialCategory) {
      setCategoryStore(initialCategory);
      return initialCategory;
    }
    if (initialCategoryId) {
      const category = categories.find(cat => cat.id === initialCategoryId);
      if (category) setCategoryStore(category);
      return category || null;
    }
    return null;
  });

  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(() => {
    if (initialSubCategory) {
      setSubCategoryStore(initialSubCategory);
      return initialSubCategory;
    }
    if (initialSubCategoryId) {
      const subCategory = subCategories.find(subCat => subCat.id === initialSubCategoryId);
      if (subCategory) setSubCategoryStore(subCategory);
      return subCategory || null;
    }
    return null;
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string>('');
  const [condition, setCondition] = useState<ItemCondition | ''>('');
  const [isExchange, setIsExchange] = useState<boolean>(false);
  const [isGift, setIsGift] = useState<boolean>(false);
  const [isFreeGift, setIsFreeGift] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showTitleHint, setShowTitleHint] = useState<boolean>(false);
  const [showDescriptionHint, setShowDescriptionHint] = useState<boolean>(false);
  const [desiredCategoryId, setDesiredCategoryId] = useState<string>('');
  const [desiredSubCategoryId, setDesiredSubCategoryId] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [timePreference, setTimePreference] = useState<string>('all_day');
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customEndTime, setCustomEndTime] = useState<string>('21:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    if (addressData.length > 0) {
      const defaultAddress = addressData.find(addr => addr.isDefault);
      setSelectedAddressId(defaultAddress?.addressId || addressData[0].addressId);
    }
  }, [addressData]);

  useEffect(() => {
    if (desiredCategoryId) {
      getSubCategories(desiredCategoryId);
    }
  }, [desiredCategoryId]);

  useEffect(() => {
    if (selectedCategory) {
      getSubCategories(selectedCategory.id);
    }
  }, [selectedCategory]);

  const conditions: ConditionOption[] = [
    { id: ItemCondition.NEW, name: 'Mới' },
    { id: ItemCondition.USED, name: 'Đã sử dụng' },
  ];

  const WEEKDAYS = [
    { label: "Thứ 2", value: "mon" },
    { label: "Thứ 3", value: "tue" },
    { label: "Thứ 4", value: "wed" },
    { label: "Thứ 5", value: "thu" },
    { label: "Thứ 6", value: "fri" },
    { label: "Thứ 7", value: "sat" },
    { label: "Chủ nhật", value: "sun" },
  ];

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handlePostTypeChange = (type: 'exchange' | 'gift') => {
    if (type === 'exchange') {
      setIsExchange(true);
      setIsGift(false);
    } else {
      setIsExchange(false);
      setIsGift(true);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    setSelectedCategory(category || null);
    setSelectedSubCategory(null);
    if (category) {
      setCategoryStore(category);
      setSubCategoryStore(null);
    }
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    const subCategory = subCategories.find(subCat => subCat.id === subCategoryId);
    setSelectedSubCategory(subCategory || null);
    if (subCategory) {
      setSubCategoryStore(subCategory);
    }
  };

  const getAvailableTimeString = (timePreference: string) => {
    switch (timePreference) {
      case 'allDay':
        return 'allDay 09:00_21:00 mon_tue_wed_thu_fri_sat_sun';
      case 'officeHours':
        return 'officeHours 09:00_17:00 mon_tue_wed_thu_fri';
      case 'evening':
        return 'evening 17:00_21:00 mon_tue_wed_thu_fri_sat_sun';
      case 'custom':
        return `custom ${customStartTime}_${customEndTime} ${selectedDays.sort().join('_')}`;
      default:
        return '';
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Vui lòng nhập tiêu đề tin đăng');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Vui lòng nhập mô tả chi tiết');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Vui lòng chọn danh mục');
      return false;
    }
    if (!condition) {
      Alert.alert('Error', 'Vui lòng chọn tình trạng sản phẩm');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Vui lòng tải lên ít nhất 1 ảnh');
      return false;
    }
    if (!timePreference) {
      Alert.alert('Error', 'Vui lòng chọn giờ nhận');
      return false;
    }
    if (!desiredCategoryId && isExchange) {
      Alert.alert('Error', 'Vui lòng chọn sản phẩm mong muốn trao đổi');
      return false;
    }
    return true;
  };
  
  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    try {
      console.log('Starting upload process with URI:', uri);
  
      // Create file object
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
  
      console.log('File details:', {
        filename,
        type
      });
  
      const formData = new FormData();
  
      // Append file with proper structure
      const fileData = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = 'gift_system';
      const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dt4ianp80/image/upload';
  
      console.log('FormData file object:', fileData);
      formData.append('file', fileData as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
      console.log('Cloudinary URL:', CLOUDINARY_URL);
      console.log('Upload preset:', CLOUDINARY_UPLOAD_PRESET);
  
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Response status:', response.status);
      
      // Get detailed error message if available
      const responseData = await response.json();
      console.log('Response data:', responseData);
  
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${JSON.stringify(responseData)}`);
      }
  
      return responseData.secure_url;
    } catch (error: any) {
      console.error('Detailed upload error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };
  
  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
  
        const imageUrl = await uploadImageToCloudinary(uri);
        setImages(prev => [...prev, imageUrl]);
        console.log('Image uploaded successfully:', imageUrl);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload Failed', 'Please try again');
    } finally {
      setIsUploadingImage(false);
    }
  };

    const uploadVideoToCloudinary = async (uri: string): Promise<string> => {
    try {
      console.log('Starting video upload process with URI:', uri);
  
      const filename = uri.split('/').pop() || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';
  
      console.log('Video file details:', {
        filename,
        type
      });
  
      const formData = new FormData();
  
      const fileData = {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: type,
      };
  
      const CLOUDINARY_UPLOAD_PRESET = 'gift_system';
      const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dt4ianp80/video/upload';
  
      console.log('FormData video object:', fileData);
      formData.append('file', fileData as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
      console.log('Sending video upload request to Cloudinary...');
      console.log('Cloudinary URL:', CLOUDINARY_URL);
  
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });
  
      console.log('Video upload response status:', response.status);
  
      const responseData = await response.json();
      console.log('Video upload response data:', responseData);
  
      if (!response.ok) {
        throw new Error(`Video upload failed: ${response.status} - ${JSON.stringify(responseData)}`);
      }
  
      return responseData.secure_url;
    } catch (error: any) {
      console.error('Detailed video upload error:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };
  
  const pickVideo = async () => {
    try {
      console.log('Starting video picker...');
  
      setIsUploadingImage(true);
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        videoMaxDuration: 60,
      });
  
      console.log('Video picker result:', result);
  
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log('Selected video URI:', uri);
  
        const videoUrl = await uploadVideoToCloudinary(uri);
        console.log('Video uploaded successfully to Cloudinary:', videoUrl);

        setVideo(videoUrl);
      }
    } catch (error) {
      console.error('Error in video picking/upload process:', error);
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again');
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Update the removeVideo function to log the action
  const removeVideo = () => {
    console.log('Removing video from state');
    setVideo('');
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    navigation.navigate('Main' , {
      screen: 'Home'
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    console.log('Submitting post:');
    
  
    try {
      setIsLoading(true);
  
      const postData = {
        name: title.trim(),
        description: description.trim(),
        subCategoryId: selectedSubCategory!.id,
        isGift: isFreeGift,
        quantity: 1,
        condition: condition,
        images,
        availableTime: getAvailableTimeString(timePreference),
        addressId: selectedAddressId,
        desiredSubCategoryId: desiredSubCategoryId
      };

      console.log("Form Data: ", postData);
  
      const response = await submitPost(postData);

      console.log('Submit response:', response);
      
      
      if (response === true) {
        setShowSuccessAlert(true);
      }
  
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
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
          <View style={styles.categoryContainer}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory?.id || ''}
                onValueChange={handleCategoryChange}
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

            {selectedCategory && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedSubCategory?.id || ''}
                  onValueChange={handleSubCategoryChange}
                >
                  <Picker.Item label="Chọn danh mục phụ" value="" />
                  {subCategories.map((subCategory) => (
                    <Picker.Item
                      key={subCategory.id}
                      label={subCategory.subCategoryName}
                      value={subCategory.id}
                    />
                  ))}
                </Picker>
              </View>
            )}

            {selectedCategory && selectedSubCategory && (
              <View style={styles.selectedCategoryDisplay}>
                <Text style={styles.selectedCategoryText}>
                  Danh mục đã chọn: {selectedCategory.name} - {selectedSubCategory.subCategoryName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
          
          <MediaUploadSection
            images={images}
            video={video}
            selectedImage={selectedImage}
            isLoading={isUploadingImage}
            onPickImage={handleImageUpload}
            onPickVideo={pickVideo}
            onRemoveImage={removeImage}
            onRemoveVideo={removeVideo}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={condition}
              onValueChange={(value: ItemCondition | '') => setCondition(value)}
            >
              <Picker.Item label="Tình trạng" value="" />
              {conditions.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={item.name}
                  value={item.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Post Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HÌNH THỨC</Text>
          <View style={styles.postTypeContainer}>
            <RadioButton.Group
              onValueChange={value => handlePostTypeChange(value as 'exchange' | 'gift')}
              value={isExchange ? 'exchange' : 'gift'}
            >
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn trao đổi"
                  value="exchange"
                  position="trailing"
                />
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn cho tặng miễn phí"
                  value="gift"
                  position="trailing"
                />
              </View>
            </RadioButton.Group>
          </View>
          
          {isExchange && (
            <Text style={styles.exchangeHint}>
              Bạn nên ghi rõ món đồ mình cần trao đổi để có được trải nghiệm tốt nhất.
            </Text>
          )}
        </View>

        {/* New section for categories and subcategories */}
        {isExchange && (
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục muốn trao đổi</Text>
          
          <Picker
            selectedValue={desiredCategoryId}
            onValueChange={(itemValue) => {
              setDesiredCategoryId(itemValue);
              setDesiredSubCategoryId('');
            }}
            style={styles.picker}
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

          {desiredCategoryId && (
            <Picker
              selectedValue={desiredSubCategoryId}
              onValueChange={(itemValue) => setDesiredSubCategoryId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Chọn danh mục phụ" value="" />
              {subCategories.map((subCategory) => (
                <Picker.Item
                  key={subCategory.id}
                  label={subCategory.subCategoryName}
                  value={subCategory.id}
                />
              ))}
            </Picker>
          )}
        </View>
        )}

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

        {/* Time Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THỜI GIAN CÓ THỂ NHẬN</Text>
          <RadioButton.Group
            onValueChange={value => setTimePreference(value)}
            value={timePreference}
          >
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Cả ngày (9h - 21h hằng ngày)"
                value="allDay"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Giờ hành chính (9h - 17h)"
                value="officeHours"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Chỉ buổi tối (17h - 21h)"
                value="evening"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Khung giờ tự chọn"
                value="custom"
                position="trailing"
              />
            </View>
          </RadioButton.Group>

          {timePreference === 'custom' && (
            <CustomTimeSection
              customStartTime={customStartTime}
              setCustomStartTime={setCustomStartTime}
              customEndTime={customEndTime}
              setCustomEndTime={setCustomEndTime}
              selectedDays={selectedDays}
              handleDayToggle={handleDayToggle}
              TIME_SLOTS={TIME_SLOTS}
              WEEKDAYS={WEEKDAYS}
            />
          )}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐỊA CHỈ</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <View style={styles.addressContainer}>
              {addressData.map((address) => (
                <TouchableOpacity
                  key={address.addressId}
                  style={[
                    styles.addressCard,
                    selectedAddressId === address.addressId && styles.selectedAddressCard
                  ]}
                  onPress={() => setSelectedAddressId(address.addressId)}
                >
                  <View style={styles.addressRadioContainer}>
                    <View style={styles.radioOuter}>
                      {selectedAddressId === address.addressId && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.addressTextContainer}>
                      <Text style={styles.addressText}>{address.address}</Text>
                      {address.isDefault && (
                        <Text style={styles.defaultBadge}>Mặc định</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Đăng bài</Text>
        </TouchableOpacity>
      </View>

      {/* Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        title="Thành công"
        message="Bài đăng của bạn đã được tạo thành công!"
        onConfirm={handleAlertConfirm}
      />
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
  addressContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
  postTypeContainer: {
    marginBottom: 16,
  },
  radioOption: {
    marginVertical: 4,
  },
  exchangeHint: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timePicker: {
    flex: 1,
    marginLeft: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  addressCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAddressCard: {
    borderColor: Colors.orange500,
    backgroundColor: Colors.orange50,
  },
  addressRadioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.orange500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange500,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  defaultBadge: {
    fontSize: 12,
    color: Colors.orange500,
    marginTop: 4,
  },
  categoryContainer: {
    gap: 12,
  },
  selectedCategoryDisplay: {
    backgroundColor: Colors.orange50,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedCategoryText: {
    color: Colors.orange600,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1ABC9C',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  customTimeContainer: {
    gap: 16,
    marginTop: 16,
  },
  timeSection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  weekdaySection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerWrapper: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: 8,
  },
  enhancedTimePicker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 48,
  },
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekdayChip: {
    marginBottom: 8,
  },
});

export default CreatePostScreen;