import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

// Get status bar height
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return 44; // Default for iOS
  }
  return StatusBar.currentHeight || 24; // Android
};

const Layout = ({ 
  title = "SolarAqua", 
  subtitle = "",
  showBackButton = false,
  onBackPress,
  onNotificationPress,
  onProfilePress,
  onNavigate,
  currentRoute = 'home',
  children 
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleNavigation = (screen) => {
    switch(screen) {
      case 'home':
        router.push('/');
        break;
      case 'vending-point':
        router.push('/vending-point');
        break;
      case 'customers':
        router.push('/customers');
        break;
      case 'meter-reading':
        router.push('/meter-reading');
        break;
      case 'billing':
        router.push('/billing');
        break;
      case 'payments':
        router.push('/payments');
        break;
      case 'reports':
        router.push('/reports');
        break;
      default:
        console.log(`Navigate to ${screen}`);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" translucent={true} />
      <View style={styles.safeContainer}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: getStatusBarHeight() }]}>
        <View style={styles.headerLeft}>
          {showBackButton ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <View style={styles.titleRow}>
              <Ionicons name="flash" size={24} color="white" style={styles.titleIcon} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            {/*<Text style={styles.headerSubtitle}>{subtitle}</Text>*/}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onProfilePress} style={styles.headerButton}>
            <Ionicons name="person-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Side Navigation Overlay */}
      <Modal
        animationType="none"
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={toggleSidebar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarTitleContainer}>
                <View style={styles.sidebarTitleRow}>
                  <Ionicons name="flash" size={28} color="#2196F3" style={styles.sidebarTitleIcon} />
                  <Text style={styles.sidebarTitle}>SolarAqua</Text>
                </View>
                {/*<Text style={styles.sidebarSubtitle}>Smart Meter Billing System</Text>*/}
              </View>
              <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Navigation Items */}
            <View style={styles.sidebarContent}>
              <SideNavItem 
                icon="home-outline" 
                label="Home" 
                onPress={() => {
                  handleNavigation('home');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'home'}
              />
              <SideNavItem 
                icon="location-sharp" 
                label="Vending Points" 
                onPress={() => {
                  handleNavigation('vending-point');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'vending-point'}
              />
              <SideNavItem 
                icon="people-outline" 
                label="Customers" 
                onPress={() => {
                  handleNavigation('customers');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'customers'}
              />
              <SideNavItem 
                icon="speedometer-outline" 
                label="Meter Reading" 
                onPress={() => {
                  handleNavigation('meter-reading');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'meter-reading'}
              />
              <SideNavItem 
                icon="receipt-outline" 
                label="Billing" 
                onPress={() => {
                  handleNavigation('billing');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'billing'}
              />
              <SideNavItem 
                icon="card-outline" 
                label="Payments" 
                onPress={() => {
                  handleNavigation('payments');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'payments'}
              />
              <SideNavItem 
                icon="bar-chart-outline" 
                label="Reports" 
                onPress={() => {
                  handleNavigation('reports');
                  setSidebarVisible(false);
                }}
                isActive={currentRoute === 'reports'}
              />
              
              {/* Divider */}
              <View style={styles.divider} />
              
              <SideNavItem 
                icon="settings-outline" 
                label="Settings" 
                onPress={() => {
                  // Handle navigation
                  setSidebarVisible(false);
                }}
              />
              <SideNavItem 
                icon="help-circle-outline" 
                label="Help & Support" 
                onPress={() => {
                  // Handle navigation
                  setSidebarVisible(false);
                }}
              />
              <SideNavItem 
                icon="log-out-outline" 
                label="Logout" 
                onPress={() => {
                  // Handle logout
                  setSidebarVisible(false);
                }}
                isDestructive={true}
              />
            </View>
          </View>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={toggleSidebar}
            activeOpacity={1}
          />
        </View>
      </Modal>
      </View>
    </View>
  );
};

const SideNavItem = ({ icon, label, onPress, isActive = false, isDestructive = false }) => (
  <TouchableOpacity 
    style={[
      styles.sideNavItem, 
      isActive && styles.sideNavItemActive
    ]} 
    onPress={onPress}
  >
    <Ionicons 
      name={icon} 
      size={24} 
      color={
        isDestructive ? "#f44336" :
        isActive ? "#2196F3" : "#666"
      } 
      style={styles.sideNavIcon}
    />
    <Text style={[
      styles.sideNavLabel, 
      isActive && styles.sideNavLabelActive,
      isDestructive && styles.sideNavLabelDestructive
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  menuButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    marginLeft: 32,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Modal and Sidebar styles - FIXED
  modalOverlay: {
    flex: 1,
    flexDirection: 'row', // Keep this to position sidebar and background
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  modalBackground: {
    flex: 1, // Takes remaining space (right side)
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'white',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  sidebarTitleContainer: {
    flex: 1,
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarTitleIcon: {
    marginRight: 12,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginLeft: 40,
  },
  closeButton: {
    padding: 8,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 16,
  },
  sideNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  sideNavItemActive: {
    backgroundColor: '#e3f2fd',
  },
  sideNavIcon: {
    marginRight: 16,
    width: 24,
  },
  sideNavLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sideNavLabelActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  sideNavLabelDestructive: {
    color: '#f44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
    marginHorizontal: 20,
  },
});

export default Layout;