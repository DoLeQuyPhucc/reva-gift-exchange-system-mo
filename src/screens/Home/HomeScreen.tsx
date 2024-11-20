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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from '@/src/api/axiosInstance';
import Colors from '@/src/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@/src/hooks/useNavigation';
import { Product } from '@/src/shared/type';
import { useRefreshControl } from '@/src/hooks/useRefreshControl';

interface SortOption {
  value: 'createdAt' | 'name' | 'condition';
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'createdAt', label: 'Mới nhất' },
  { value: 'name', label: 'Tên' },
  { value: 'condition', label: 'Tình trạng' },
];

const { width } = Dimensions.get('window');


const HomeScreen: React.FC = () => {

  const navigation = useNavigation();
  const [userId, setUserId] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'condition' | 'createdAt'>('createdAt');
  const [showSortModal, setShowSortModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setUserId(userId || '');
      const response = await axiosInstance.get('/items');
      const productsData = response.data.data;
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [userId]);

  const { refreshing, refreshControl } = useRefreshControl(fetchProducts);

  const categories = [...new Set(products.map((product) => product.category))];

  const filteredProducts = products
    .filter((product) => product.owner_id.toLowerCase().trim() !== userId.toLowerCase().trim())
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((product) => (selectedCategory ? product.category === selectedCategory : true))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'condition':
          return a.condition.localeCompare(b.condition);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
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
        {product.isGift && (
            <View>
              <Icon name="card-giftcard" size={24} color={Colors.orange500} />
              
            </View>
          )}
          <View style={[styles.badge, styles.outlineBadge]}>
            <Text style={styles.outlineBadgeText}>{product.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sắp xếp theo</Text>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(option.value);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Icon name="check" size={20} color="#000" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
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
          <Icon name="filter-alt" size={20} />
          <Text style={styles.filterTitle}>Bộ lọc</Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <View style={styles.sortButtonContent}>
            <Icon name="sort" size={20} />
            <Text style={styles.sortButtonText}>
              {sortOptions.find(option => option.value === sortBy)?.label}
            </Text>
            <Icon name="arrow-drop-down" size={20} />
          </View>
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
    <>
    <FlatList
      data={filteredProducts}
      renderItem={renderProductCard}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={fetchProducts}
    />
    {renderSortModal()}
  </>
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
  sortButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    color: '#000',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32, // Thêm padding bottom để tránh safe area
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#000',
  },
  sortOptionTextSelected: {
    fontWeight: '600',
  },
});

export default HomeScreen;