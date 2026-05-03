import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import Layout from '../layout/layout';

const CreateVendingPointScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    vending_point_code: '',
    name: '',
    location: '',
    vending_manager_name: '',
    vending_manager_phone: '',
    vending_manager_email: '',
    address: '',
    establishment_date: new Date(),
    status: 'ACTIVE',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    
  ];

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.vending_point_code.trim()) {
      newErrors.vending_point_code = 'Vending point code is required';
    } else if (formData.vending_point_code.length > 20) {
      newErrors.vending_point_code = 'Code must be 20 characters or less';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length > 255) {
      newErrors.location = 'Location must be 255 characters or less';
    }

    if (!formData.vending_manager_name.trim()) {
      newErrors.vending_manager_name = 'Manager name is required';
    } else if (formData.vending_manager_name.length > 100) {
      newErrors.vending_manager_name = 'Manager name must be 100 characters or less';
    }

    if (!formData.vending_manager_phone.trim()) {
      newErrors.vending_manager_phone = 'Manager phone is required';
    } else if (formData.vending_manager_phone.length > 15) {
      newErrors.vending_manager_phone = 'Phone must be 15 characters or less';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.vending_manager_phone)) {
      newErrors.vending_manager_phone = 'Invalid phone number format';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Email validation (optional field)
    if (formData.vending_manager_email && formData.vending_manager_email.length > 128) {
      newErrors.vending_manager_email = 'Email must be 128 characters or less';
    } else if (formData.vending_manager_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.vending_manager_email)) {
      newErrors.vending_manager_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        establishment_date: selectedDate
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    
    try {
      // Format the data for API submission
      const submitData = {
        ...formData,
        establishment_date: formData.establishment_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };

      // Replace with your API call
      console.log('Submitting vending point data:', submitData);
      
      const response = await fetch("http:// 192.168.0.102:5000/api/mobile/vending-points", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    Alert.alert('Success', 'Vending point created successfully!', [
      { text: 'OK', onPress: () => resetForm() }
    ]);

   
    } catch (error) {
      console.error('Error creating vending point:', error);
      Alert.alert('Error', 'Failed to create vending point. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vending_point_code: '',
      name: '',
      location: '',
      vending_manager_name: '',
      vending_manager_phone: '',
      vending_manager_email: '',
      address: '',
      establishment_date: new Date(),
      status: 'ACTIVE',
    });
    setErrors({});
  };

  const renderInput = (
    label,
    field,
    placeholder,
    multiline = false,
    keyboardType = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {['vending_point_code', 'name', 'location', 'vending_manager_name', 'vending_manager_phone', 'address'].includes(field) && 
          <Text style={styles.required}> *</Text>
        }
      </Text>
      <TextInput
        style={[
          multiline ? styles.textArea : styles.input,
          errors[field] && styles.inputError
        ]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        editable={!loading}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <Layout 
    title="Add Vending Point" 
    showBackButton={true}
    onBackPress={() => router.back()}
    currentRoute="vending-points"
  >
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Vending Point</Text>
          <Text style={styles.subtitle}>Fill in the details to create a new vending point</Text>
        </View>

        <View style={styles.form}>
          {renderInput(
            'Vending Point Code',
            'vending_point_code',
            'Enter unique code (max 20 chars)'
          )}

          {renderInput(
            'Name',
            'name',
            'Enter vending point name'
          )}

          {renderInput(
            'Location',
            'location',
            'Enter location'
          )}

          {renderInput(
            'Manager Name',
            'vending_manager_name',
            'Enter manager name'
          )}

          {renderInput(
            'Manager Phone',
            'vending_manager_phone',
            'Enter phone number',
            false,
            'phone-pad'
          )}

          {renderInput(
            'Manager Email',
            'vending_manager_email',
            'Enter email (optional)',
            false,
            'email-address'
          )}

          {renderInput(
            'Address',
            'address',
            'Enter full address',
            true
          )}

          {/* Establishment Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Establishment Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text style={styles.dateText}>
                {formData.establishment_date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.establishment_date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Status Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusButton,
                    formData.status === option.value && styles.statusButtonActive
                  ]}
                  onPress={() => handleInputChange('status', option.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === option.value && styles.statusButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetForm}
            disabled={loading}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Vending Point'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  form: {
    padding: 20,
    margin:1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  required: {
    color: '#dc3545',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#495057',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#495057',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#495057',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  resetButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});


export default CreateVendingPointScreen;