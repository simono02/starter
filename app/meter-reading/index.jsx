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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Layout from '../layout/layout';

const MeterReadingScreen = () => {
  const [meters, setMeters] = useState([]);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedMeter, setExpandedMeter] = useState(null);
  
  // Reading form states
  const [currentReading, setCurrentReading] = useState('');
  const [readingMethod, setReadingMethod] = useState('actual');
  const [customAmount, setCustomAmount] = useState('');
  const [meterPhoto, setMeterPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    filterMeters();
  }, [searchQuery, meters]);

  const fetchMeters = async () => {
    try {
      const response = await fetch('http:// 192.168.0.102:5000/api/mobile/customers');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const customers = await response.json();
      console.log('Fetched customers:', customers);

      const allMeters = [];

      customers.forEach(customer => {
        if (customer.meters && customer.meters.length > 0) {
          customer.meters.forEach(meter => {
            allMeters.push({
              id: meter.id,
              meterNumber: meter.meter_number,
              customerName: customer.full_name,
              customerId: customer.id,
              status: meter.status.toUpperCase(),
              meter_type: 'Standard', // Or extract if available
              installation_date: meter.installation_date,
              last_reading: meter.current_reading,
              last_reading_date: meter.billing_start_date,
              //average_monthly_amount: parseFloat(meter.rate) || null,
            });
          });
        }
      });

    setMeters(allMeters);
  } catch (error) {
    console.error('Error fetching meters:', error);
    Alert.alert('Error', 'Failed to fetch meters. Check your API.');
  }
};


  const filterMeters = () => {
    if (searchQuery.trim() === '') {
      setFilteredMeters(meters);
    } else {
      const filtered = meters.filter(m =>
        m.meterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMeters(filtered);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMeters();
    setRefreshing(false);
  };

  const handleExpandMeter = (meter) => {
    if (expandedMeter?.id === meter.id) {
      // Close if already expanded
      setExpandedMeter(null);
      resetReadingForm();
    } else {
      // Expand this meter
      setExpandedMeter(meter);
      resetReadingForm();
      // Pre-fill custom amount if available
      if (meter.average_monthly_amount) {
        setCustomAmount(meter.average_monthly_amount.toString());
      }
    }
  };

  const resetReadingForm = () => {
    setCurrentReading('');
    setReadingMethod('actual');
    setCustomAmount('');
    setMeterPhoto(null);
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setMeterPhoto(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSaveReading = async (meter) => {
    // Validate required fields based on reading method
    if ((readingMethod === 'actual' || readingMethod === 'estimated') && !currentReading.trim()) {
      Alert.alert('Error', 'Please enter a reading value');
      return;
    }

    if (readingMethod === 'amount' && !customAmount.trim()) {
      Alert.alert('Error', 'Please enter a custom amount for non-working meter');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        meter_account_id: meter.id,
        reading_method: readingMethod,
        reading_date: new Date().toISOString().split('T')[0],
      };

      // Add current_reading for actual and estimated methods
      if ((readingMethod === 'actual' || readingMethod === 'estimated') && currentReading.trim()) {
        payload.current_reading = parseFloat(currentReading);
      }

      // Add custom amount for amount meter
      if (readingMethod === 'amount' && customAmount.trim()) {
        payload. manual_amount = parseFloat(customAmount);
      }

      // Add photo evidence if available
      if (meterPhoto && meterPhoto.base64) {
        payload.photo_evidence = `data:image/jpeg;base64,${meterPhoto.base64}`;
      }

      console.log('Sending payload:', payload);

      const response = await fetch('http:// 192.168.0.102:5000/api/mobile/meter-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        let successMessage = 'Reading saved successfully!';
        
        if (readingMethod === 'amount') {
          successMessage += `\n\nCustom Amount: $${result. manual_amount || customAmount}`;
        } else {
          successMessage += `\n\nMeter Reading: ${result.meter_reading?.current_reading || 'N/A'}\nBill Amount: $${result.bill_details?.total_amount || 'N/A'}`;
        }

        Alert.alert(
          'Success', 
          successMessage,
          [
            {
              text: 'View Details',
              onPress: () => {
                console.log('Full Result:', result);
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );
        setExpandedMeter(null);
        resetReadingForm();
        fetchMeters(); // Refresh the list
      } else {
        Alert.alert('Error', result.error || result.message || 'Failed to save reading');
      }
    } catch (error) {
      console.error('Error saving reading:', error);
      Alert.alert('Error', 'Failed to save reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (meter) => {
    try {
      // Fetch detailed meter readings for this meter
      const response = await fetch(
        `http://192.168.0.190:5000/api/mobile/meter-readings?meter_account_id=${meter.id}&limit=5`
      );
      
      if (response.ok) {
        const readings = await response.json();
        const recentReadings = readings.length > 0 
          ? readings.slice(0, 3).map(r => `${r.current_reading || r. manual_amount || 'N/A'} (${r.reading_date})`).join('\n')
          : 'No recent readings';
        
        Alert.alert(
          'Meter Details',
          `Customer: ${meter.customerName}\nMeter Number: ${meter.meterNumber}\nStatus: ${meter.status}\nType: ${meter.meter_type || 'N/A'}\nLast Reading: ${meter.last_reading || 'No readings yet'}\nAverage Monthly: ${meter.average_monthly_amount ? `$${meter.average_monthly_amount}` : 'N/A'}\n\nRecent Readings:\n${recentReadings}`,
          [{ text: 'OK' }]
        );
      } else {
        // Fallback to basic info if API fails
        Alert.alert(
          'Meter Details',
          `Customer: ${meter.customerName}\nMeter Number: ${meter.meterNumber}\nStatus: ${meter.status}\nLast Reading: ${meter.last_reading || 'No readings yet'}\nAverage Monthly: ${meter.average_monthly_amount ? `$${meter.average_monthly_amount}` : 'N/A'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching meter details:', error);
      // Show basic info on error
      Alert.alert(
        'Meter Details',
        `Customer: ${meter.customerName}\nMeter Number: ${meter.meterNumber}\nStatus: ${meter.status}\nLast Reading: ${meter.last_reading || 'No readings yet'}\nAverage Monthly: ${meter.average_monthly_amount ? `$${meter.average_monthly_amount}` : 'N/A'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderReadingForm = (meter) => (
    <View style={styles.readingForm}>
      <View style={styles.readingFormHeader}>
        <Text style={styles.readingFormTitle}>Enter Reading</Text>
        <Text style={styles.meterInfo}>{meter.meterNumber}</Text>
        {meter.average_monthly_amount && (
          <Text style={styles.averageInfo}>Avg. Monthly: ${meter.average_monthly_amount}</Text>
        )}
      </View>

      {/* Reading Method Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Reading Method</Text>
        <View style={styles.methodButtons}>
          {[
            { key: 'actual', label: 'Actual', icon: 'checkmark-circle-outline' },
            { key: 'estimated', label: 'Estimated', icon: 'calculator-outline' },
            { key: 'amount', label: 'Amount', icon: 'cash-outline' },
          ].map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[
                styles.methodButton,
                readingMethod === method.key && styles.methodButtonActive
              ]}
              onPress={() => setReadingMethod(method.key)}
            >
              <Ionicons 
                name={method.icon} 
                size={16} 
                color={readingMethod === method.key ? 'white' : '#666'} 
                style={{ marginBottom: 4 }}
              />
              <Text style={[
                styles.methodButtonText,
                readingMethod === method.key && styles.methodButtonTextActive
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Reading Input - Show for actual and estimated methods */}
      {(readingMethod === 'actual' || readingMethod === 'estimated') && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            Current Reading {readingMethod === 'actual' ? '*' : '(Estimated)'}
          </Text>
          <TextInput
            style={styles.readingInput}
            value={currentReading}
            onChangeText={setCurrentReading}
            placeholder="0.0"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          {meter.last_reading && (
            <Text style={styles.lastReadingHint}>
              Last reading date: {meter.last_reading_date || 'Unknown date'}
            </Text>
          )}
        </View>
      )}

      {/* Custom Amount Input - Show for amount method */}
      {readingMethod === 'amount' && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Custom Amount *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={customAmount}
              onChangeText={setCustomAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
          <Text style={styles.customAmountHint}>
            {meter.average_monthly_amount 
              ? `Customer's average monthly payment is $${meter.average_monthly_amount}`
              : 'Enter the amount based on customer\'s average monthly usage'
            }
          </Text>
        </View>
      )}

      {/* Photo Section */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          Meter Photo {readingMethod === 'amount' ? '(Recommended)' : '(Optional)'}
        </Text>
        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          {meterPhoto ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: meterPhoto.uri }} style={styles.previewImage} />
              <View style={styles.photoOverlay}>
                <Ionicons name="camera-outline" size={20} color="white" />
                <Text style={styles.photoOverlayText}>Retake Photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#999" />
              <Text style={styles.photoPlaceholderText}>
                {readingMethod === 'amount' 
                  ? 'Take Photo ' 
                  : 'Take Photo'
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={() => handleSaveReading(meter)}
        disabled={isSubmitting}
      >
        <Ionicons name="save-outline" size={16} color="white" />
        {isSubmitting ? (
          <ActivityIndicator size="small" color="white" style={{ marginLeft: 8 }} />
        ) : (
          <Text style={styles.saveButtonText}>Save Reading</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderMeter = ({ item }) => (
    <View style={styles.card}>
      {/* Meter Header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => handleExpandMeter(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{item.customerName}</Text>
          <Text style={styles.cardCode}>{item.meterNumber}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusContainer}>
            <Ionicons
              name={item.status === 'ACTIVE' ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={item.status === 'ACTIVE' ? '#4CAF50' : '#f44336'}
            />
            <Text style={[
              styles.statusText,
              { color: item.status === 'ACTIVE' ? '#4CAF50' : '#f44336' }
            ]}>
              {item.status}
            </Text>
          </View>
          <Ionicons
            name={expandedMeter?.id === item.id ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </View>
      </TouchableOpacity>

      {/* Meter Info */}
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{item.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="barcode-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{item.meterNumber}</Text>
        </View>
        {item.last_reading_date && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.infoText}>Last Reading Date: {item.last_reading_date}</Text>
          </View>
        )}
        {item.average_monthly_amount && (
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={14} color="#666" />
            <Text style={styles.infoText}>Avg. Monthly: ${item.average_monthly_amount}</Text>
          </View>
        )}
      </View>

      {/* Expanded Reading Form */}
      {expandedMeter?.id === item.id && renderReadingForm(item)}

      {/* Quick Actions (only show when not expanded) */}
      {expandedMeter?.id !== item.id && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewDetails(item)}
          >
            <Ionicons name="eye-outline" size={14} color="#2196F3" />
            <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.readButton]}
            onPress={() => handleExpandMeter(item)}
            disabled={item.status !== 'ACTIVE'}
          >
            <Ionicons name="create-outline" size={14} color={item.status === 'ACTIVE' ? '#4CAF50' : '#ccc'} />
            <Text style={[styles.actionButtonText, { color: item.status === 'ACTIVE' ? '#4CAF50' : '#ccc' }]}>
              Read Meter
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="water-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Meters Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search' : 'No registered meters yet'}
      </Text>
    </View>
  );

  return (
    <Layout title="Meter Reading" currentRoute="meter-reading">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Meters</Text>
              <Text style={styles.headerSubtitle}>
                {filteredMeters.length} meter{filteredMeters.length !== 1 ? 's' : ''}
                {searchQuery && ` • Filtered`}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search meters..."
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

        {/* List */}
        <FlatList
          data={filteredMeters}
          renderItem={renderMeter}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            filteredMeters.length === 0 && { flex: 1 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2196F3']} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  clearButton: { marginLeft: 8 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#4285F4' },
  cardTitleContainer: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 2 },
  cardCode: { fontSize: 14, color: '#E3F2FD', fontFamily: 'monospace' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600', marginLeft: 4, color: 'white' },
  cardContent: { padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#666', marginLeft: 8, flex: 1 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  actionButtonText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  readButton: { backgroundColor: '#f8f9fa' },
  viewButton: { backgroundColor: '#f8f9fa' },

  // Reading Form Styles
  readingForm: { backgroundColor: '#f8f9fa', padding: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  readingFormHeader: { marginBottom: 16 },
  readingFormTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  meterInfo: { fontSize: 14, color: '#666', fontFamily: 'monospace' },
  averageInfo: { fontSize: 12, color: '#2196F3', fontWeight: '600', marginTop: 2 },
  inputSection: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  readingInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: 'white' },
  lastReadingHint: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
  methodButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  methodButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginHorizontal: 2, alignItems: 'center', backgroundColor: 'white' },
  methodButtonActive: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
  methodButtonText: { fontSize: 11, color: '#666', fontWeight: '500' },
  methodButtonTextActive: { color: 'white' },
  
  // Custom Amount Input Styles
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: 'white' },
  currencySymbol: { fontSize: 16, fontWeight: 'bold', color: '#333', paddingLeft: 12 },
  amountInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 12, fontSize: 16 },
  customAmountHint: { fontSize: 12, color: '#2196F3', marginTop: 4, fontStyle: 'italic' },
  
  photoButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: 'white', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fafafa' },
  photoPlaceholderText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', paddingHorizontal: 16 },
  photoPreview: { position: 'relative' },
  previewImage: { width: '100%', height: 120, resizeMode: 'cover' },
  photoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  photoOverlayText: { color: 'white', fontSize: 12, marginLeft: 4 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  saveButtonDisabled: { backgroundColor: '#ccc' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },
});

export default MeterReadingScreen;