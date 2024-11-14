import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Spacing from "@/src/constants/Spacing";
import FontSize from "@/src/constants/FontSize";
import Colors from "@/src/constants/Colors";
import Font from "@/src/constants/Font";
import AppTextInput from "@/src/components/AppTextInput";
import { useNavigation } from "@/src/hooks/useNavigation";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import axiosInstance from "@/src/api/axiosInstance";

interface AddressItem {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code?: number;
  district_code?: number;
}

interface Province extends AddressItem {
  phone_code: number;
  districts?: District[];
}

interface District extends AddressItem {
  province_code: number;
  wards?: Ward[];
}

interface Ward extends AddressItem {
  district_code: number;
}
const RegisterScreen = () => {
  const navigation = useNavigation();
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  // Address states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [address, setAddress] = useState('');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState<(Province | District | Ward)[]>([]);
  const [modalType, setModalType] = useState<'province' | 'district' | 'ward'>('province');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch districts when province is selected
  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.code);
      setSelectedDistrict(null);
      setSelectedWard(null);
    }
  }, [selectedProvince]);

  // Fetch wards when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict.code);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // API calls for address
  const fetchProvinces = async () => {
    try {
      setLoadingAddress(true);
      const response = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch provinces');
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchDistricts = async (provinceCode: number) => {
    try {
      setLoadingAddress(true);
      const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const data: Province = await response.json();
      setDistricts(data.districts || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch districts');
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchWards = async (districtCode: number) => {
    try {
      setLoadingAddress(true);
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      setWards(data.wards);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch wards');
    } finally {
      setLoadingAddress(false);
    }
  };

  // Modal handlers
  const openModal = (type: 'province' | 'district' | 'ward') => {
    switch (type) {
      case 'province':
        setModalData(provinces);
        break;
      case 'district':
        setModalData(districts);
        break;
      case 'ward':
        setModalData(wards);
        break;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (item: Province | District | Ward) => {
    switch (modalType) {
      case 'province':
        setSelectedProvince(item as Province);
        break;
      case 'district':
        setSelectedDistrict(item as District);
        break;
      case 'ward':
        setSelectedWard(item as Ward);
        break;
    }
    setModalVisible(false);
  };

  // Form submission
  const resetForm = () => {
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setBirthYear('');
    setGender('');
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setAddress('');
  };

  const registerUser = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard || !address) {
      Alert.alert('Error', 'Please select your complete address');
      return;
    }

    setLoading(true);
    const data = {
      name,
        phoneNumber,
        password,
        birthYear,
        gender,
        address: {
          province: selectedProvince.name,
          district: selectedDistrict.name,
          ward: selectedWard.name,
          address,
        },
    };

    console.log(data);

    try {
      // const response = await axiosInstance.post('/auth/register', data);

      // if (response.status === 200) {
      //   Alert.alert('Success', 'Account created successfully');
      //   resetForm();
      //   navigation.navigate('LoginScreen');
      // }
    } catch (error) {
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Address Selection Modal
  const SelectionModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalType === 'province' ? 'Select Province' :
               modalType === 'district' ? 'Select District' :
               'Select Ward'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={modalData}
            keyExtractor={(item) => item.code.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ padding: Spacing * 2 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.header}>Create account</Text>
            <Text style={styles.subHeader}>
              Create an account so you can exchange every thing you want with other users
            </Text>
          </View>

          <View style={{ marginVertical: Spacing * 3 }}>
            <AppTextInput placeholder="Tên" value={name} onChangeText={setName} />
            <AppTextInput placeholder="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} />
            <AppTextInput placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
            <AppTextInput placeholder="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <AppTextInput placeholder="Ngày sinh" value={birthYear} onChangeText={setBirthYear} keyboardType="numeric" />
            <AppTextInput placeholder="Giới tính" value={gender} onChangeText={setGender} />

            {/* Address Selection */}
            <TouchableOpacity
              style={styles.addressInput}
              onPress={() => openModal('province')}
              disabled={loadingAddress}
            >
              <Text style={styles.addressInputText}>
                {selectedProvince ? selectedProvince.name : 'Chọn Tỉnh / Thành Phố'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addressInput}
              onPress={() => selectedProvince ? openModal('district') : Alert.alert('Error', 'Please select province first')}
              disabled={!selectedProvince || loadingAddress}
            >
              <Text style={styles.addressInputText}>
                {selectedDistrict ? selectedDistrict.name : 'Chọn Quận'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addressInput}
              onPress={() => selectedDistrict ? openModal('ward') : Alert.alert('Error', 'Please select district first')}
              disabled={!selectedDistrict || loadingAddress}
            >
              <Text style={styles.addressInputText}>
                {selectedWard ? selectedWard.name : 'Chọn Phường'}
              </Text>
            </TouchableOpacity>
            <AppTextInput placeholder="Số nhà, tên đường, phường..." value={address} onChangeText={setAddress} />

            {loadingAddress && (
              <ActivityIndicator size="small" color={Colors.orange600} style={{ marginVertical: Spacing }} />
            )}
          </View>

          <TouchableOpacity style={styles.signUpButton} onPress={registerUser} disabled={loading}>
            <Text style={styles.signUpButtonText}>{loading ? 'Signing up...' : 'Sign up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")} style={{ padding: Spacing }}>
            <Text style={styles.loginText}>Already have an account</Text>
          </TouchableOpacity>

          <View style={{ marginVertical: Spacing * 3 }}>
            <Text style={styles.orContinueText}>Or continue with</Text>
            <View style={styles.socialIconsContainer}>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-google" color={Colors.text} size={Spacing * 2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-apple" color={Colors.text} size={Spacing * 2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon}>
                <Ionicons name="logo-facebook" color={Colors.text} size={Spacing * 2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <SelectionModal />
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: FontSize.xLarge,
    color: Colors.orange600,
    fontFamily: Font["poppins-bold"],
    marginTop: 32,
  },
  subHeader: {
    fontFamily: Font["poppins-regular"],
    fontSize: FontSize.small,
    maxWidth: "80%",
    textAlign: "center",
  },
  signUpButton: {
    padding: Spacing * 2,
    backgroundColor: Colors.orange600,
    marginVertical: Spacing * 3,
    borderRadius: Spacing,
    shadowColor: Colors.orange600,
    shadowOffset: { width: 0, height: Spacing },
    shadowOpacity: 0.3,
    shadowRadius: Spacing,
  },
  signUpButtonText: {
    fontFamily: Font["poppins-bold"],
    color: Colors.onPrimary,
    textAlign: "center",
    fontSize: FontSize.large,
  },
  loginText: {
    fontFamily: Font["poppins-semiBold"],
    color: Colors.text,
    textAlign: "center",
    fontSize: FontSize.small,
  },
  orContinueText: {
    fontFamily: Font["poppins-semiBold"],
    color: Colors.orange600,
    textAlign: "center",
    fontSize: FontSize.small,
  },
  socialIconsContainer: {
    marginTop: Spacing,
    flexDirection: "row",
    justifyContent: "center",
  },
  socialIcon: {
    padding: Spacing,
    backgroundColor: Colors.gray,
    borderRadius: Spacing / 2,
    marginHorizontal: Spacing,
  },
  // New styles for address selection
  addressInput: {
    backgroundColor: Colors.lightPrimary,
    padding: Spacing * 2,
    borderRadius: Spacing,
    marginVertical: Spacing,
    borderWidth: 1,
    borderColor: Colors.orange200,
  },
  addressInputText: {
    fontFamily: Font["poppins-regular"],
    fontSize: FontSize.small,
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: Spacing * 2,
    borderTopRightRadius: Spacing * 2,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing * 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray,
  },
  modalTitle: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.large,
    color: Colors.text,
  },
  modalItem: {
    padding: Spacing * 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightPrimary,
  },
  modalItemText: {
    fontFamily: Font["poppins-regular"],
    fontSize: FontSize.small,
    color: Colors.text,
  },
});

export default RegisterScreen;