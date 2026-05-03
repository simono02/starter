import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Layout from '../layout/layout';

const VendingPointsScreen = () => {
  const [vendingPoints, setVendingPoints] = useState([]);
  const [filteredVendingPoints, setFilteredVendingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data l
  //const mockVendingPoints = [
   // ];

  useEffect(() => {
    fetchVendingPoints();
  }, []);

  useEffect(() => {
    filterVendingPoints();
  }, [searchQuery, vendingPoints]);

  const fetchVendingPoints = async () => {
  try {
    setLoading(true);
    const response = await fetch('http:// 192.168.0.102:5000/api/mobile/vending-points'); 
    const data = await response.json();

    const formattedData = data.map(vp => ({
      ...vp,
      status: vp.is_active ? 'ACTIVE' : 'INACTIVE',
    }));
    
    setVendingPoints(formattedData); 

    setLoading(false);
  } catch (error) {
    console.error('Error fetching vending points:', error);
    Alert.alert('Error', 'Failed to fetch vending points');
    setLoading(false);
  }
};


  const filterVendingPoints = () => {
    if (searchQuery.trim() === '') {
      setFilteredVendingPoints(vendingPoints);
    } else {
      const filtered = vendingPoints.filter(vp =>
        vp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vp.vending_point_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vp.vending_manager_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendingPoints(filtered);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVendingPoints();
    setRefreshing(false);
  };

  const handleAddVendingPoint = () => {
    router.push('/vending-point/add-vending-point');
  };

  const handleEditVendingPoint = (vendingPoint) => {
    router.push({
      pathname: '/vending-point/edit-vending-point',
      params: { id: vendingPoint.id }
    });
  };

  const handleViewDetails = (vendingPoint) => {
    Alert.alert(
      'Vending Point Details',
      `Name: ${vendingPoint.name}\nCode: ${vendingPoint.vending_point_code}\nLocation: ${vendingPoint.location}\nManager: ${vendingPoint.vending_manager_name}\nPhone: ${vendingPoint.vending_manager_phone}\nStatus: ${vendingPoint.status}\nAddress: ${vendingPoint.address}`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteVendingPoint = (vendingPoint) => {
    Alert.alert(
      'Delete Vending Point',
      `Are you sure you want to delete "${vendingPoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVendingPoints(prev => 
              prev.filter(vp => vp.id !== vendingPoint.id)
            );
            Alert.alert('Success', 'Vending point deleted successfully');
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'INACTIVE':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'checkmark-circle';
      case 'INACTIVE':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderVendingPoint = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCode}>{item.vending_point_code}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.vending_manager_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.vending_manager_phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            Est: {new Date(item.establishment_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={() => handleViewDetails(item)}
        >
          <Ionicons name="eye-outline" size={16} color="#2196F3" />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEditVendingPoint(item)}
        >
          <Ionicons name="create-outline" size={16} color="#FF9800" />
          <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteVendingPoint(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#f44336" />
          <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="location-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Vending Points Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first vending point'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAddVendingPoint}>
          <Text style={styles.emptyButtonText}>Add Vending Point</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Layout 
      title="Vending Points" 
      currentRoute="vending-points"
    >
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Vending Points</Text>
              <Text style={styles.headerSubtitle}>
                {filteredVendingPoints.length} location{filteredVendingPoints.length !== 1 ? 's' : ''}
                {searchQuery && ` • Filtered`}
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddVendingPoint}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vending points..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {vendingPoints.filter(vp => vp.status === 'ACTIVE').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {vendingPoints.filter(vp => vp.status === 'INACTIVE').length}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{vendingPoints.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Vending Points List */}
        <FlatList
          data={filteredVendingPoints}
          renderItem={renderVendingPoint}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            filteredVendingPoints.length === 0 && { flex: 1 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  cardCode: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VendingPointsScreen;