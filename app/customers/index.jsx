import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Layout from '../layout/layout';

const CustomersIndex = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch customers from API
  const fetchCustomers = async () => {
  try {
    setLoading(true);
    const response = await fetch('http:// 192.168.0.102:5000/api/mobile/customers');

    const text = await response.text(); // read raw text first
    console.log("Raw response:", text);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    try {
      data = JSON.parse(text); // manually parse
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      throw new Error("Invalid JSON response");
    }

    const transformedCustomers = data.map(customer => ({
      id: customer.id.toString(),
      name: customer.full_name,
      email: customer.email || 'No email',
      phone: customer.primary_phone,
      meterId: customer.meters?.[0]?.meter_number || 'No meter',
      status: customer.status || 'Active',
      balance: `KSh ${customer.balance || 0}`,
    }));

    setCustomers(transformedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    Alert.alert('Error', 'Failed to load customers. Please try again.', [{ text: 'OK' }]);
  } finally {
    setLoading(false);
  }
};

// Load customers on component mount
useEffect(() => {
  fetchCustomers();
}, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleAddCustomer = () => {
    router.push('/customers/add');
  };

  const handleCustomerPress = (customer) => {
    console.log('Customer selected:', customer.name);
    router.push(`/customers/${customer.id}`);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.meterId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerItem} 
      onPress={() => handleCustomerPress(item)}
    >
      <View style={styles.customerInfo}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'Active' ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.customerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="speedometer-outline" size={14} color="#666" />
            <Text style={styles.detailText}>Meter: {item.meterId}</Text>
          </View>
        </View>
        
        <View style={styles.customerFooter}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={[
            styles.balanceAmount,
            item.balance === 'KSh 0' ? styles.balancePaid : styles.balanceOwed
          ]}>
            {item.balance}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <Layout
      title="Customers"
      subtitle="Manage Customer Accounts"
      showBackButton={true}
      onBackPress={handleBackPress}
    >
      <View style={styles.container}>
        {/* Header with Add Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>All Customers</Text>
            <Text style={styles.headerSubtitle}>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddCustomer}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        )}

        {/* Customers List */}
        {!loading && (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No customers found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search' : 'Add your first customer to get started'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  customerItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E8',
  },
  statusInactive: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#4CAF50',
  },
  statusInactiveText: {
    color: '#FF9800',
  },
  customerDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  customerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  balancePaid: {
    color: '#4CAF50',
  },
  balanceOwed: {
    color: '#F44336',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default CustomersIndex;