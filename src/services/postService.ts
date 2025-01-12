import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

interface PostData {
  name: string;
  description: string;
  categoryId: string;
  isGift: boolean;
  quantity: number;
  condition: string;
  images: string[];
  video: string | null;
  availableTime: string;
  addressId: string;
  desiredCategoryId: string | null;
}

export const postService = {
  uploadImageToCloudinary: async (uri: string): Promise<string> => {
    try {
      // Create file object
      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      const formData = new FormData();

      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/image/upload";

      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      return responseData.secure_url;
    } catch (error: any) {
      console.error("Detailed upload error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  requestCameraPermissions: async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Camera permission not granted");
    }
  },

  captureImage: async (): Promise<string | null> => {
    try {
      await postService.requestCameraPermissions();

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Camera capture error:", error);
      throw error;
    }
  },

  uploadVideoToCloudinary: async (uri: string): Promise<string> => {
    try {
      const filename = uri.split("/").pop() || "video.mp4";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : "video/mp4";

      const formData = new FormData();

      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/video/upload";

      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `Video upload failed: ${response.status} - ${JSON.stringify(
            responseData
          )}`
        );
      }

      return responseData.secure_url;
    } catch (error: any) {
      console.error("Detailed video upload error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  pickImage: async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Image picking error:", error);
      throw error;
    }
  },

  pickVideo: async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error("Video picking error:", error);
      throw error;
    }
  },

  submitPost: async (postData: PostData): Promise<any> => {
    try {
      // Implement your API call here
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      return await response.json();
    } catch (error) {
      console.error("Submit post error:", error);
      throw error;
    }
  },
};
