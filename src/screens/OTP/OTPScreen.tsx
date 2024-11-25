import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/src/constants/Colors";
import FontSize from "@/src/constants/FontSize";
import Font from "@/src/constants/Font";
import Spacing from "@/src/constants/Spacing";
import { useNavigation } from "@/src/hooks/useNavigation";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/layouts/types/navigationTypes';
import axiosInstance from "@/src/api/axiosInstance";
import { User } from "@/src/shared/type";
import { useAuthStore } from '@/src/stores/authStore';

type OTPScreenProps = NativeStackScreenProps<RootStackParamList, 'OTPScreen'>;

const OTPScreen: React.FC<OTPScreenProps> = ({ route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigation = useNavigation();
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    try {
      // Add your resend OTP API call here
      // await axiosInstance.post('/authentication/resend-otp', { phone: phoneNumber });
      setTimer(60);
      Alert.alert('Success', 'OTP has been resent');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    try {
      if (otpString === '111111') {
        const response = await axiosInstance.post('/authentication/login', {
          phone: phoneNumber
        });
      
        const { token, refreshToken, userId, username, email, role, profileURL } = response.data.data;
      
        const user: User = {
          id: userId,
          username,
          role,
          phone: phoneNumber,
          fullname: "",
          email: email,
          profilePicture: profileURL || "",
          address: {
            addressId: "",
            address: "",
            addressCoordinates: {
              latitude: "",
              longitude: ""
            },
            isDefault: false
          },
          dob: null,
          gender: null
        };
  
        const login = useAuthStore.getState().login;
        await login({
          accessToken: token,
          refreshToken: refreshToken,
          email: email || "",
          userId: userId,
          userRole: role,
          user: user
        });
      
        navigation.navigate("Main", {
          screen: "Home"
        });
      } else {
        Alert.alert('Error', 'Invalid OTP');
      }
    } catch (error: any) {
      console.log("Error: ", error);
      
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Xác thực OTP</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mã OTP đã được gửi đến số điện thoại {phoneNumber}
        </Text>
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={verifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Xác nhận</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.resendButton, timer > 0 && styles.disabledResendButton]}
          onPress={handleResendOTP}
          disabled={timer > 0}
        >
          <Text style={styles.resendText}>
            {timer > 0 ? `Gửi lại mã (${timer}s)` : 'Gửi lại mã'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xLarge,
    color: Colors.orange600,
    fontFamily: Font["poppins-bold"],
    marginVertical: Spacing * 3,
  },
  subtitle: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.small,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing * 3,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing * 2,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: Colors.orange600,
    borderRadius: Spacing,
    margin: Spacing / 2,
    textAlign: 'center',
    fontSize: FontSize.large,
    fontFamily: Font["poppins-semiBold"],
    color: Colors.text,
  },
  verifyButton: {
    width: '100%',
    padding: Spacing * 2,
    backgroundColor: Colors.orange600,
    borderRadius: Spacing,
    marginVertical: Spacing * 2,
  },
  verifyButtonText: {
    color: Colors.onPrimary,
    textAlign: 'center',
    fontSize: FontSize.large,
    fontFamily: Font["poppins-bold"],
  },
  disabledButton: {
    opacity: 0.7,
  },
  resendButton: {
    padding: Spacing,
  },
  disabledResendButton: {
    opacity: 0.7,
  },
  resendText: {
    color: Colors.orange600,
    fontSize: FontSize.small,
    fontFamily: Font["poppins-semiBold"],
  },
});

export default OTPScreen;