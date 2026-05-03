import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../layout/layout';

const { width } = Dimensions.get('window');

const BillingScreen = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchQuery, bills]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await fetch('http:// 192.168.0.102:5000/api/mobile/meter-readings?limit=100');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const readings = await response.json();
      const billsData = [];
      
      if (Array.isArray(readings)) {
        for (const reading of readings) {
          try {
            const billResponse = await fetch(
              `http:// 192.168.0.102:5000/api/mobile/meter-readings/${reading.id}/bill`
            );
            
            if (billResponse.ok) {
              const billData = await billResponse.json();
              
              let bill = {};
              
              // Check if data is nested in bill_details
              if (billData.bill_details) {
                bill = billData.bill_details;
              }
              // Check if it's a direct response
              else if (billData.water_charges !== undefined) {
                bill = billData;
              }
              // Check if it's an array
              else if (Array.isArray(billData) && billData.length > 0) {
                bill = billData[0];
              }

              billsData.push({
                id: `bill-${reading.id}`,
                readingId: reading.id,
                billNumber: bill.bill_number || `BILL-${reading.id}`,
                customerName: reading.customer_name || 'Unknown Customer',
                meterNumber: reading.meter_number || 'Unknown Meter',
                meterAccountId: reading.meter_account_id,
                
                // Reading data
                currentReading: bill.current_reading || reading.current_reading || 0,
                previousReading: bill.previous_reading || reading.previous_reading || 0,
                consumption: bill.consumption || ((reading.current_reading || 0) - (reading.previous_reading || 0)),
                readingDate: reading.reading_date,
                readingMethod: reading.reading_method || 'actual',
                
                // Bill data 
                billDate: bill.bill_date || reading.reading_date,
                billingPeriod: bill.billing_period || 'N/A',
                billType: bill.bill_type || 'standard',
                
                // Amount fields 
                totalAmount: bill.total_amount || 0,
                waterCharges: bill.current_bill || bill.water_charges || 0,
                amountBroughtForward: bill.amount_brought_forward || 0,
                amountPaid: bill.amount_paid || 0,
                outstandingDue: bill.outstanding_due || 0,
                
                // Status
                status: bill.status || 'pending',
                
                dueDate: bill.due_date || calculateDueDate(bill.bill_date),
                paymentDate: bill.payment_date || null,
              });
            }
          } catch (billError) {
            console.error('Error fetching bill for reading:', reading.id, billError);
            // Create bill record from reading data only
            billsData.push({
              id: `bill-${reading.id}`,
              readingId: reading.id,
              billNumber: `BILL-${reading.id}`,
              customerName: reading.customer_name || 'Unknown Customer',
              meterNumber: reading.meter_number || 'Unknown Meter',
              meterAccountId: reading.meter_account_id,
              currentReading: reading.current_reading || 0,
              previousReading: reading.previous_reading || 0,
              consumption: (reading.current_reading || 0) - (reading.previous_reading || 0),
              readingDate: reading.reading_date,
              billDate: reading.reading_date,
              billingPeriod: 'N/A',
              billType: 'pending',
              totalAmount: 0,
              waterCharges: 0,
              amountBroughtForward: 0,
              amountPaid: 0,
              outstandingDue: 0,
              status: 'pending',
              dueDate: calculateDueDate(reading.reading_date),
              paymentDate: null,
              readingMethod: reading.reading_method || 'actual',
            });
          }
        }
        
        billsData.sort((a, b) => new Date(b.billDate) - new Date(a.billDate));
        setBills(billsData);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      Alert.alert('Error', 'Failed to fetch bills. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  };

  const filterBills = () => {
    let filtered = bills;
    if (searchQuery.trim()) {
      filtered = filtered.filter(bill =>
        bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.meterNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredBills(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setModalVisible(true);
  };

  const formatCurrency = (amount) => `KSh ${parseFloat(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-KE', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }) : 'N/A';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusBadge = (status, dueDate) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date();
    const finalStatus = isOverdue && status !== 'paid' ? 'overdue' : status;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(finalStatus) }]}>
        <Text style={styles.statusText}>{finalStatus?.toUpperCase()}</Text>
      </View>
    );
  };

  const renderBillCard = ({ item }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => handleViewBill(item)}
      activeOpacity={0.8}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.billIdentifier}>
          <Text style={styles.billNumber}>{item.billNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        {getStatusBadge(item.status, item.dueDate)}
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Current Bill</Text>
        <Text style={styles.amountValue}>{formatCurrency(item.waterCharges)}</Text>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Meter</Text>
          <Text style={styles.detailValue}>{item.meterNumber}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={16} color="#2196F3" />
          <Text style={styles.detailLabel}>Consumption</Text>
          <Text style={styles.detailValue}>{Math.abs(item.consumption).toFixed(1)} </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>Reading</Text>
          <Text style={styles.detailValue}>{formatDate(item.readingDate)}</Text>
        </View>
        
        {item.dueDate && (
          <View style={styles.detailItem}>
            <Ionicons name="alarm-outline" size={16} color="#FF5722" />
            <Text style={styles.detailLabel}>Due</Text>
            <Text style={[styles.detailValue, { 
              color: new Date(item.dueDate) < new Date() ? '#F44336' : '#666' 
            }]}>
              {formatDate(item.dueDate)}
            </Text>
          </View>
        )}
      </View>

      {/* Arrow indicator */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderBillModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setModalVisible(false)}
    >
      <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>Bill Details</Text>
            <Text style={styles.modalSubtitle}>
              {selectedBill?.billNumber}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {selectedBill && (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Bill Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Current Bill</Text>
                {getStatusBadge(selectedBill.status, selectedBill.dueDate)}
              </View>
              <Text style={styles.summaryAmount}>
                {formatCurrency(selectedBill.waterCharges)}
              </Text>
              <Text style={styles.summaryDue}>
                Due: {formatDate(selectedBill.dueDate)}
              </Text>
            </View>

            {/* Customer Information */}
            <View style={styles.infoCard}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="person-outline" size={20} color="#2196F3" />
                <Text style={styles.cardTitle}>Customer Information</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{selectedBill.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Meter Number:</Text>
                <Text style={styles.infoValue}>{selectedBill.meterNumber}</Text>
              </View>
              <View style={styles.cardTitleRow}>
                <Ionicons name="analytics-outline" size={20} color="#4CAF50" />
                <Text style={styles.cardTitle}>Meter Reading</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Previous</Text>
                <Text style={styles.infoValue}>{selectedBill.previousReading.toFixed(2)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current</Text>
                <Text style={styles.readingValue}>{selectedBill.currentReading.toFixed(2)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Consumption</Text>
                <Text style={[styles.infoValue, styles.consumptionValue]}>
                  {Math.abs(selectedBill.consumption).toFixed(2)} 
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reading Date:</Text>
                <Text style={styles.infoValue}>{formatDate(selectedBill.readingDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reading Method:</Text>
                <Text style={styles.infoValue}>{selectedBill.readingMethod}</Text>
              </View>
            </View>

            

            {/* Billing Details */}
            <View style={styles.infoCard}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="receipt-outline" size={20} color="#FF9800" />
                <Text style={styles.cardTitle}>Billing Details</Text>
              </View>
              
              {/* Billing Period */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Billing Period:</Text>
                <Text style={styles.infoValue}>{selectedBill.billingPeriod}</Text>
              </View>
              
              {/* Bill Type */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bill Type:</Text>
                <Text style={styles.infoValue}>{selectedBill.billType}</Text>
              </View>
              
              
              {/* Due Date */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={styles.infoValue}>{formatDate(selectedBill.dueDate)}</Text>
              </View>
              
              {/* Amount Breakdown */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount B/F:</Text>
                <Text style={styles.infoValue}>{formatCurrency(selectedBill.amountBroughtForward)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Charges:</Text>
                <Text style={styles.infoValue}>{formatCurrency(selectedBill.waterCharges)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Amount:</Text>
                <Text style={styles.infoValue}>{formatCurrency(selectedBill.totalAmount || (selectedBill.amountBroughtForward + selectedBill.waterCharges))}</Text>
              </View>
              
              
              
              {/* Payment Date if available */}
              {selectedBill.paymentDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedBill.paymentDate)}</Text>
                </View>
              )}
              
              {/* Outstanding Due - highlighted as total */}
              <View style={[styles.infoRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Outstanding Due:</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedBill.outstandingDue)}</Text>
              </View>
            </View>

            <View style={styles.modalFooter} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={64} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyTitle}>No Bills Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try searching with different terms' : 'Bills will appear here after meter readings are processed'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleRefresh}>
          <Text style={styles.emptyButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Layout title="Billing" currentRoute="billing">
      <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Bills</Text>
          <Text style={styles.headerSubtitle}>
            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'} found
          </Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bills, customers, meters..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')} 
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bills List */}
        <FlatList
          data={filteredBills}
          renderItem={renderBillCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer, 
            filteredBills.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {renderBillModal()}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header Styles
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 12,
  },

  // Bill Card Styles
  billCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  billIdentifier: {
    flex: 1,
  },
  billNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  
  amountSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },

  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },

  arrowContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalFooter: {
    height: 20,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  summaryDue: {
    fontSize: 14,
    color: '#666',
  },

  // Info Cards
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    flex: 2,
    textAlign: 'right',
  },

  // Reading Grid
  readingGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  readingItem: {
    flex: 1,
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  consumptionValue: {
    color: '#4CAF50',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillingScreen;