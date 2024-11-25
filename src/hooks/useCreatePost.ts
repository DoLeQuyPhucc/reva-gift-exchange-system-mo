import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { AddressData, AddressResponse, CreatePostData } from "@/shared/type";

const useCreatePost = () => {
  const [addressData, setAddressData] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddress = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get<AddressResponse>(
        "/user/my-address"
      );

      if (response.data.isSuccess) {
        setAddressData(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch address");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  const submitPost = async (postData: CreatePostData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.post("/items", postData);

      if (response.data.isSuccess) {
        return response.data.isSuccess;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addressData,
    loading,
    error,
    refetchAddress: fetchAddress,
    submitPost,
  };
};

export default useCreatePost;
