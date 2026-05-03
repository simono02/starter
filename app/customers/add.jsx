import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../layout/layout';
import { useRouter } from 'expo-router';

const AddCustomer = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    primaryMobile: '',
    email: '',
    housePlotNumber: '',
    alternativeContactName: '',
    alternativeContactPhone: '',
    relationship: '',
    vendingPointId: '', // This should be included
    meters: [
      {
        meterNumber: '',
        meterSerialNumber: '',
        rate: '',
        currentReading: '',
        meterInstallationDate: '',
        billingStartDate: '',
        dueDate: '',
      },
    ],
  });

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState({ index: 0, field: '' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Vending points state with loading
  const [vendingPoints, setVendingPoints] = useState([]);
  const [loadingVendingPoints, setLoadingVendingPoints] = useState(true);

  useEffect(() => {
    const fetchVendingPoints = async () => {
      try {
        setLoadingVendingPoints(true);
        const response = await fetch("http:// 192.168.0.102:5000/api/mobile/vending-points");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Vending points data:", data); // Debug log
        
        // Ensure data is an array and has expected structure
        if (Array.isArray(data)) {
          setVendingPoints(data);
        } else if (data.vendingPoints && Array.isArray(data.vendingPoints)) {
          setVendingPoints(data.vendingPoints);
        } else {
          console.warn("Unexpected vending points data structure:", data);
          setVendingPoints([]);
        }
      } catch (error) {
        console.error("Error fetching vending points:", error);
        Alert.alert('Error', 'Failed to load vending points. Please try again.');
        setVendingPoints([]);
      } finally {
        setLoadingVendingPoints(false);
      }
    };
    
    fetchVendingPoints();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMeterField = (index, field, value) => {
    const newMeters = [...formData.meters];
    newMeters[index][field] = value;
    setFormData(prev => ({ ...prev, meters: newMeters }));
  };

  const addMeter = () => {
    setFormData(prev => ({
      ...prev,
      meters: [
        ...prev.meters,
        {
          meterNumber: '',
          meterSerialNumber: '',
          rate: '',
          currentReading: '',
          meterInstallationDate: '',
          billingStartDate: '',
          dueDate: '',
        },
      ],
    }));
  };

  // Date picker handler
  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      updateMeterField(currentDateField.index, currentDateField.field, formattedDate);
    }
  };


  const resetForm = () => {
    setFormData({
      fullName: '',
      primaryMobile: '',
      email: '',
      address: '',
      housePlotNumber: '',
      alternativeContactName: '',
      alternativeContactPhone: '',
      relationship: '',
      vendingPointId: '', 
      meters: [
        {
          meterNumber: '',
          meterSerialNumber: '',
          rate: '',
          currentReading: '',
          meterInstallationDate: '',
          billingStartDate: '',
          dueDate: '',
        },
      ],
    });
  };

// Enhanced form validation and submission handler
// Enhanced form validation and submission handler
// Enhanced form validation and submission handler
const validateForm = () => {
  // Basic validation for customer info
  if (!formData.fullName.trim()) {
    Alert.alert('Validation Error', 'Full Name is required');
    return false;
  }
  
  // Validate phone number format
  const phoneRegex = /^0[7-9]\d{8}$/; // Kenyan phone number format
  if (!formData.primaryMobile.trim()) {
    Alert.alert('Validation Error', 'Primary Mobile is required');
    return false;
  }
  if (!phoneRegex.test(formData.primaryMobile.trim())) {
    Alert.alert('Validation Error', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
    return false;
  }
  
  // Validate email format if provided
  if (formData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
  }
  
    if (!formData.address.trim()) {
    Alert.alert('Validation Error', 'Address is required');
    return false;
  }

  if (!formData.housePlotNumber.trim()) {
    Alert.alert('Validation Error', 'House/Plot Number is required');
    return false;
  }

  
  if (!formData.vendingPointId || formData.vendingPointId === '') {
    Alert.alert('Validation Error', 'Please select a vending point');
    return false;
  }

  // Validate alternative contact phone if name is provided
  if (formData.alternativeContactName.trim() && !formData.alternativeContactPhone.trim()) {
    Alert.alert('Validation Error', 'Alternative contact phone is required when alternative contact name is provided');
    return false;
  }

  // Validate alternative contact phone format if provided
  if (formData.alternativeContactPhone.trim() && !phoneRegex.test(formData.alternativeContactPhone.trim())) {
    Alert.alert('Validation Error', 'Please enter a valid alternative contact phone number');
    return false;
  }

  // Validate meters
  if (formData.meters.length === 0) {
    Alert.alert('Validation Error', 'At least one meter is required');
    return false;
  }

  for (let i = 0; i < formData.meters.length; i++) {
    const meter = formData.meters[i];
    if (!meter.meterNumber.trim()) {
      Alert.alert('Validation Error', `Meter ${i + 1} number is required`);
      return false;
    }
    if (!meter.billingStartDate) {
      Alert.alert('Validation Error', `Meter ${i + 1} billing start date is required`);
      return false;
    }
    
    // Validate numeric fields
    if (meter.rate && (isNaN(parseFloat(meter.rate)) || parseFloat(meter.rate) < 0)) {
      Alert.alert('Validation Error', `Meter ${i + 1} rate must be a valid positive number`);
      return false;
    }
    
    if (meter.currentReading && (isNaN(parseFloat(meter.currentReading)) || parseFloat(meter.currentReading) < 0)) {
      Alert.alert('Validation Error', `Meter ${i + 1} current reading must be a valid positive number`);
      return false;
    }
  }

  return true;
};

// Enhanced submission handler with better error handling
const handleSave = async () => {
  if (!validateForm()) return;

  setLoading(true);

  // Helper to format dates safely without timezone issues
  const formatDate = (date) => {
    if (!date) return null;
    
    try {
      if (typeof date === 'string') {
        // Handle yyyy/mm/dd format directly without creating Date object
        if (date.includes('/')) {
          const [year, month, day] = date.split('/');
          const formattedYear = year.padStart(4, '0');
          const formattedMonth = month.padStart(2, '0');
          const formattedDay = day.padStart(2, '0');
          
          // Validate the date components
          const yearNum = parseInt(formattedYear);
          const monthNum = parseInt(formattedMonth);
          const dayNum = parseInt(formattedDay);
          
          if (yearNum < 1900 || yearNum > 2100 || 
              monthNum < 1 || monthNum > 12 || 
              dayNum < 1 || dayNum > 31) {
            console.warn('Invalid date components:', { year: yearNum, month: monthNum, day: dayNum });
            return null;
          }
          
          return `${formattedYear}-${formattedMonth}-${formattedDay}`;
        } else if (date.includes('-')) {
          // Already in YYYY-MM-DD format
          return date;
        }
      } else if (date instanceof Date) {
        // For Date objects, use local date to avoid timezone issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return null;
    } catch (error) {
      console.error('Date formatting error:', error, 'for date:', date);
      return null;
    }
  };

  try {
    
    // Use string UUID directly for backend
      const vendingPointId = formData.vendingPointId;
      if (!vendingPointId || vendingPointId.trim() === '') {
        throw new Error('Invalid vending point selection');
      }


    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    

    // Map frontend keys to backend keys with enhanced validation
    const cleanedData = {
      full_name: formData.fullName.trim(),
      primary_phone: formData.primaryMobile.trim(),
      email: formData.email.trim() || null,
      address: formData.address?.trim() || formData.housePlotNumber.trim(),
      house_plot_number: formData.housePlotNumber.trim(),
      alternate_contact_name: formData.alternativeContactName.trim() || null,
      alternate_contact_phone: formData.alternativeContactPhone.trim() || null,
      alternate_contact_relation: formData.relationship.trim() || null,
      vending_point_id: vendingPointId,
      billing_start_date: formattedToday,

      meters: formData.meters.map((meter, index) => {
        return {
          meter_number: meter.meterNumber.trim(),
          meter_serial_number: meter.meterSerialNumber.trim() || null,
          rate: meter.rate ? parseFloat(meter.rate) : 0.0,
          current_reading: meter.currentReading ? parseFloat(meter.currentReading) : 0.0,
          billing_start_date: formatDate(meter.billingStartDate) || formatDate(new Date()),
          meter_installation_date: formatDate(meter.meterInstallationDate) || formatDate(new Date()),
        };
      }),
    };

    // ✅ ALWAYS add due_date - use form value or default
    const formattedDueDate = formatDate(formData.dueDate);
    if (formattedDueDate) {
      cleanedData.due_date = formattedDueDate;
    } else {
      // Calculate default: 30 days from billing start date
      const dueDate = new Date(formattedToday);
      dueDate.setDate(dueDate.getDate() + 30);
      cleanedData.due_date = formatDate(dueDate);
    }


    console.log("Submitting cleaned data:", JSON.stringify(cleanedData, null, 2));

    const response = await fetch("http:// 192.168.0.102:5000/api/mobile/customers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(cleanedData),
    });

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse response JSON:', jsonError);
      throw new Error('Server returned invalid response');
    }

    console.log('Server response:', responseData);

    if (!response.ok) {
      // Enhanced error handling with more specific messages
      let errorMessage = 'Unknown error occurred';
      
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        errorMessage = responseData.error;
      } else if (responseData.errors) {
        // Handle validation errors array
        if (Array.isArray(responseData.errors)) {
          errorMessage = responseData.errors.join(', ');
        } else {
          errorMessage = JSON.stringify(responseData.errors);
        }
      }
      
      throw new Error(`${response.status}: ${errorMessage}`);
    }

    Alert.alert('Success', 'Customer created successfully!', [
      { 
        text: 'OK', 
        onPress: () => {
          resetForm();
          router.back(); // Navigate back to customer list
        }
      }
    ]);

  } catch (error) {
    console.error('Error creating customer:', error);
    
    let userMessage = 'Failed to create customer. ';
    if (error.message.includes('400')) {
      userMessage += 'Please check all fields are filled correctly.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage += 'Please check your internet connection.';
    } else {
      userMessage += error.message;
    }
    
    Alert.alert('Error', userMessage);
  } finally {
    setLoading(false);
  }
};




  const handleCancel = () => router.back();
  const handleBackPress = () => router.back();

  return (
    <Layout title="Add New Customer" subtitle="Back to List" showBackButton onBackPress={handleBackPress}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Client Information (KYC)</Text>

            {/* Customer info fields */}
            {['fullName', 'primaryMobile', 'email', 'address', 'housePlotNumber', 'alternativeContactName', 'alternativeContactPhone', 'relationship'].map((field, idx) => (
              <View key={idx} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {field.replace(/([A-Z])/g, ' $1')}
                  {(field === 'fullName' || field === 'primaryMobile' || field === 'address') && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData[field]}
                  onChangeText={(text) => updateField(field, text)}
                  keyboardType={field === 'primaryMobile' || field === 'alternativeContactPhone' ? 'phone-pad' : 
                               field === 'email' ? 'email-address' : 'default'}
                />
              </View>
            ))}

            {/* Vending Point Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Vending Point<Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.pickerContainer}>
                {loadingVendingPoints ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.loadingText}>Loading vending points...</Text>
                  </View>
                ) : (
                  <Picker
                    selectedValue={formData.vendingPointId}
                    onValueChange={(value) => updateField("vendingPointId", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Vending Point" value="" />
                    {vendingPoints.map((vp) => (
                      <Picker.Item 
                        key={vp.id} 
                        label={vp.name}  // still show name to user
                        value={vp.id}     // store id in form
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            {/* Meters dynamic section */}
            <Text style={styles.sectionTitle}>Meters</Text>
            {formData.meters.map((meter, index) => (
              <View key={index} style={styles.meterContainer}>
                <Text style={styles.meterLabel}>Meter {index + 1}</Text>
                {['meterNumber', 'meterSerialNumber', 'rate', 'currentReading', 'meterInstallationDate', 'billingStartDate', 'dueDate'].map((field, idx) => (
                  <View key={idx} style={styles.inputGroup}>
                    <Text style={styles.label}>{field.replace(/([A-Z])/g, ' $1')}</Text>
                    {field.includes('Date') ? (
                      <TouchableOpacity
                        style={[styles.input, styles.dateInput]}
                        onPress={() => {
                          setShowDatePicker(true);
                          setCurrentDateField({ index, field });
                          const dateToUse = meter[field] && meter[field] !== '' ? 
                            new Date(meter[field].replace(/\//g, '-')) :
                            new Date();
                          setSelectedDate(dateToUse);
                        }}
                        disabled={loading}
                      >
                        <Text style={[styles.dateText, !meter[field] && styles.placeholderText]}>
                          {meter[field] || 'yyyy-mm-dd'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        style={styles.input}
                        value={meter[field]}
                        onChangeText={(text) => updateMeterField(index, field, text)}
                        keyboardType={field === 'rate' || field === 'currentReading' ? 'numeric' : 'default'}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity style={styles.addMeterButton} onPress={addMeter}>
              <Text style={styles.addMeterButtonText}>+ Add Meter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  formContainer: { backgroundColor: 'white', margin: 16, borderRadius: 8, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, color: '#333', marginBottom: 4 },
  required: { color: '#e74c3c', fontWeight: 'bold' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 6, 
    padding: 10, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9' 
  },
  dateInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  dateText: { 
    fontSize: 16, 
    color: '#333',
    flex: 1,
  },
  placeholderText: { 
    color: '#999' 
  },
  dateIcon: { 
    marginLeft: 8 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  meterContainer: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 6, 
    padding: 12, 
    marginBottom: 12 
  },
  meterLabel: { fontWeight: '600', marginBottom: 8 },
  addMeterButton: { 
    padding: 12, 
    backgroundColor: '#4caf50', 
    borderRadius: 6, 
    alignItems: 'center', 
    marginBottom: 16 
  },
  addMeterButtonText: { color: 'white', fontWeight: '600' },
  buttonContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#e0e0e0', 
    gap: 12 
  },
  saveButton: { 
    flex: 1, 
    backgroundColor: '#2196F3', 
    padding: 14, 
    borderRadius: 6, 
    alignItems: 'center' 
  },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    padding: 14, 
    borderRadius: 6, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AddCustomer;