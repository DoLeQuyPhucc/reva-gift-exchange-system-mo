import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Spacing from "@/src/constants/Spacing";
import FontSize from "@/src/constants/FontSize";
import Colors from "@/src/constants/Colors";
import Font from "@/src/constants/Font";
import { Ionicons } from "@expo/vector-icons";
import AppTextInput from "@/src/components/AppTextInput";
import { useNavigation } from "@/src/hooks/useNavigation";
import { useFocusEffect } from "@react-navigation/native";
import axiosInstance from "@/src/api/axiosInstance";
import { User } from "@/src/shared/type";

const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOTP] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please fill in both Phone Number and password");
      return;
    }

    setLoading(true);
    try {
      setShowOTP(true);

      if (otp.match('111111')) {
        const response = await axiosInstance.post('/authentication/login', {
          phone: phoneNumber,
          password,
        });
      
        const { token, refreshToken, userId, username, role, firstName, lastName, profileURL  } = response.data.data;
        console.log(response.data.data);
      
        const user: User = {
          id: userId,
          username,
          role,
          phone: phoneNumber,
          firstName,
          lastName,
          profileURL
        };
  
        console.log('user',user);
        // Store tokens and user ID in AsyncStorage
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('userId', userId);
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      
        // Navigate to the main screen
        navigation.navigate("Main", {
          screen: "Home"
        });
        
        setPhoneNumber('');
        setPassword('');
        setOTP('');
        setShowOTP(false);
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <View style={{ padding: Spacing * 2 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Chào mừng bạn trở lại, hãy nhập thông tin để tiếp tục
          </Text>
        </View>
        <View style={{ marginVertical: Spacing * 3 }}>
          <AppTextInput 
            placeholder="Số điện thoại" 
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            autoCapitalize="none"
          />
          <AppTextInput 
            placeholder="Mật khẩu" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {showOTP && (
            <AppTextInput 
              placeholder="OTP" 
              value={otp}
              onChangeText={setOTP}
              autoCapitalize="none"
            />
          )}
        </View>
        <View>
          <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
        </View>
        <TouchableOpacity
          style={styles.signInButton}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.signInText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")} style={{ padding: Spacing }}>
          <Text style={styles.createAccountText}>Tạo tài khoản mới</Text>
        </TouchableOpacity>
        <View style={{ marginVertical: Spacing * 3 }}>
          <Text style={styles.orContinueText}>Bạn có thể bắt đầu với</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize.xLarge,
    color: Colors.orange600,
    fontFamily: Font["poppins-bold"],
    marginVertical: Spacing * 3,
  },
  subtitle: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.large,
    maxWidth: "60%",
    textAlign: "center",
  },
  forgotPassword: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.small,
    color: Colors.orange600,
    alignSelf: "flex-end",
  },
  signInButton: {
    padding: Spacing * 2,
    backgroundColor: Colors.orange600,
    marginVertical: Spacing * 3,
    borderRadius: Spacing,
    shadowColor: Colors.orange600,
    shadowOffset: { width: 0, height: Spacing },
    shadowOpacity: 0.3,
    shadowRadius: Spacing,
  },
  signInText: {
    fontFamily: Font["poppins-bold"],
    color: Colors.onPrimary,
    textAlign: "center",
    fontSize: FontSize.large,
  },
  createAccountText: {
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
});

export default LoginScreen;
