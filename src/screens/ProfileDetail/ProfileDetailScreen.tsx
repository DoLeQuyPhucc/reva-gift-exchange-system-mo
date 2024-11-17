import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosInstance from '@/src/api/axiosInstance';
import { Picker } from '@react-native-picker/picker';
import Colors from '@/src/constants/Colors';
import { User } from '@/src/shared/type';

const DEFAULT_PROFILE_PICTURE = 'https://res.cloudinary.com/djh9baokn/image/upload/v1731336465/png-clipart-man-wearing-blue-shirt-illustration-computer-icons-avatar-user-login-avatar-blue-child_ijzlxf.png';

const ProfileDetailScreen = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<User>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: DEFAULT_PROFILE_PICTURE,
    address: '',
    dob: null,
    gender: '',
    addressCoordinates: {
      latitude: '',
      longitude: ''
    },
    point: 0,
    dateJoined: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('user/profile');
      if (response.data.isSuccess) {
        setProfile(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.put('user/profile', formData);
      if (response.data.isSuccess) {
        Alert.alert('Success', 'Profile updated successfully');
        setProfile(formData);
        setIsEditing(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profilePicture: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, dob: selectedDate.toISOString() });
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={isEditing ? pickImage : undefined}
        >
          <Image
            source={{ uri: formData.profilePicture }}
            style={styles.profileImage}
          />
          {isEditing && (
            <View style={styles.editImageOverlay}>
              <Text style={styles.editImageText}>Edit</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading}
        >
          <Text style={styles.editButtonText}>
            {loading ? 'Saving...' : isEditing ? 'Save' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            editable={isEditing}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            editable={isEditing}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
            editable={isEditing}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            onPress={() => isEditing && setShowDatePicker(true)}
            style={styles.input}
          >
            <Text>
              {formData.dob ? new Date(formData.dob).toLocaleDateString() : 'Not set'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender</Text>
          {isEditing ? (
            <Picker
              selectedValue={formData.gender}
              style={styles.picker}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <Picker.Item label="Select gender" value={null} />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          ) : (
            <Text style={styles.input}>{formData.gender || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date Joined</Text>
          <Text style={styles.input}>
            {profile.dateJoined ? new Date(profile.dateJoined).toLocaleDateString() : 'Not set'}
          </Text>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dob ? new Date(formData.dob) : new Date()}
          mode="date"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    alignItems: 'center',
  },
  editImageText: {
    color: '#fff',
    fontSize: 12,
  },
  editButton: {
    backgroundColor: Colors.orange500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinateInput: {
    flex: 0.48,
  },
});

export default ProfileDetailScreen;