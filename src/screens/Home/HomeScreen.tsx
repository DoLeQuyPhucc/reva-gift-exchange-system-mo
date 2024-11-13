import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from '@/src/api/axiosInstance';
import Colors from '@/src/constants/Colors';
// import { Product } from '../types/types';
// import { useUser } from '../hooks/useUser';
// import { useSearchStore } from '../store/SearchStore';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  owner_id: string;
  email: string;
  profilePicture: string;
  images: string[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
  itemAttributeValues: ProductAttribute[];
  quantity: number;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeId: string;
  value: string;
}



const { width } = Dimensions.get('window');

export default function ProductsList() {

  const navigation = useNavigation();
  // const userId = useUser().userId;
  const userId = "1";
  // const searchQuery = useSearchStore((state) => state.searchQuery);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'condition'>('name');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/items');
        const productsData = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          condition: item.condition,
          owner_id: item.owner_id,
          images: item.images,
          available: item.available,
          createdAt: item.createdAt,
        }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userId]);

  const categories = [...new Set(products.map((product) => product.category))];

  const filteredProducts = products
    .filter((product) => product.owner_id !== userId)
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) => (selectedCategory ? product.category === selectedCategory : true))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.condition.localeCompare(b.condition);
    });

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      // onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images?.[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        {!product.available && (
          <View style={styles.unavailableOverlay}>
            <View style={styles.badgeDestructive}>
              <Text style={styles.badgeText}>Hết hàng</Text>
            </View>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {product.description}
        </Text>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.condition}</Text>
          </View>
          <View style={[styles.badge, styles.outlineBadge]}>
            <Text style={styles.outlineBadgeText}>{product.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleContainer}>
        <Icon
                name="filter-alt"
                size={20}
              />
          <Text style={styles.filterTitle}>Bộ lọc</Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortBy(sortBy === 'name' ? 'condition' : 'name')}
        >
          <Text>
            Sắp xếp theo: {sortBy === 'name' ? 'Tên' : 'Tình trạng'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === '' && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory('')}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === '' && styles.selectedCategoryButtonText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>
        Hiển thị {filteredProducts.length} sản phẩm
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <FlatList
      data={filteredProducts}
      renderItem={renderProductCard}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  searchBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 12,
    fontSize: 18,
    marginVertical: 16,
    backgroundColor: '#F8F8F8',
  },
  container: {
    padding: 16,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  categoryButtonText: {
    color: '#000',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  resultCount: {
    color: '#666',
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.orange600
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.orange50,
  },
  badgeDestructive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  outlineBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  badgeText: {
    fontSize: 12,
    color: '#000',
  },
  outlineBadgeText: {
    fontSize: 12,
    color: '#666',
  },
});