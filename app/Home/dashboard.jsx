import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Layout from '../layout/layout';

const Dashboard = () => {
  const handleNavigation = (screen) => {
    switch(screen) {
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

  const handleNotificationPress = () => {
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
  };

  return (
    <Layout
      title="SolarAqua"
      subtitle="Smart Meter Billing Dashboard"
      onNotificationPress={handleNotificationPress}
      onProfilePress={handleProfilePress}
      onNavigate={handleNavigation}
    >
      <ScrollView style={styles.container}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>
            
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="people-outline"
            title="Total Customers"
            value="1,247"
            subtitle="+12 this month"
            color="#4CAF50"
          />
          <StatCard
            icon="flash-outline"
            title="Active Meters"
            value="50"
            subtitle="95% online"
            color="#2196F3"
          />
          <StatCard
            icon="receipt-outline"
            title="Pending Bills"
            value="89"
            subtitle="Due this week"
            color="#FF9800"
          />
          <StatCard
            icon="card-outline"
            title="Revenue"
            value="KSh 234K"
            subtitle="This month"
            color="#9C27B0"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon="people-outline"
              title="Manage Customers"
              subtitle="Add, edit, view customers"
              onPress={() => handleNavigation('customers')}
            />
            <QuickActionCard
              icon="speedometer-outline"
              title="Meter Reading"
              subtitle="Record new readings"
              onPress={() => handleNavigation('meter-reading')}
            />
            <QuickActionCard
              icon="receipt-outline"
              title="Generate Bills"
              subtitle="Create monthly bills"
              onPress={() => handleNavigation('billing')}
            />
            <QuickActionCard
              icon="bar-chart-outline"
              title="View Reports"
              subtitle="Analytics & insights"
              onPress={() => handleNavigation('reports')}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <ActivityItem
              icon="person-add-outline"
              title="New customer registered"
              subtitle="Mercy Ndiritu - Customer #1248"
              time="2 hours ago"
            />
            <ActivityItem
              icon="flash-outline"
              title="Meter reading updated"
              subtitle="Meter #M001 - 1,234 kWh"
              time="4 hours ago"
            />
            <ActivityItem
              icon="card-outline"
              title="Payment received"
              subtitle="KSh 2,500 from Simon Kuria"
              time="6 hours ago"
            />
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statSubtitle}>{subtitle}</Text>
  </View>
);

const QuickActionCard = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <Ionicons name={icon} size={32} color="#2196F3" style={styles.quickActionIcon} />
    <Text style={styles.quickActionTitle}>{title}</Text>
    <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const ActivityItem = ({ icon, title, subtitle, time }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Ionicons name={icon} size={20} color="#666" />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    backgroundColor: 'white',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    width: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentActivitySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
});

export default Dashboard;