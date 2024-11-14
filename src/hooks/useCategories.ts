import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Category } from "@/shared/type";

// Custom hook for fetching and managing categories
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get("/category");
      setCategories(response.data.data);
    } catch (err) {
      setError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // Force refresh categories
  const refreshCategories = () => {
    getCategories();
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories,
  };
};

export default useCategories;
