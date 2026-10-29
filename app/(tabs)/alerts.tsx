import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Settings, Bell } from 'lucide-react-native';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  location: string;
  acknowledged: boolean;
}

export default function AlertsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Critical Water Level Drop',
      message: 'DWLR-North-01 shows water level below minimum threshold (8.5m)',
      timestamp: '2 hours ago',
      location: 'North Region - Station 01',
      acknowledged: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Declining Trend Detected',
      message: 'Water levels have been declining for 48 hours in Central Region',
      timestamp: '5 hours ago',
      location: 'Central Region - Multiple Stations',
      acknowledged: false,
    },
    {
      id: '3',
      type: 'info',
      title: 'Sensor Maintenance Scheduled',
      message: 'Routine maintenance scheduled for DWLR-South-03 tomorrow at 10:00 AM',
      timestamp: '1 day ago',
      location: 'South Region - Station 03',
      acknowledged: true,
    },
    {
      id: '4',
      type: 'warning',
      title: 'Low Rainfall Alert',
      message: 'No significant rainfall recorded in the past 7 days',
      timestamp: '2 days ago',
      location: 'Regional Weather Station',
      acknowledged: true,
    },
  ]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={20} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      case 'info':
        return <CheckCircle size={20} color="#0EA5E9" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return styles.criticalAlert;
      case 'warning':
        return styles.warningAlert;
      case 'info':
        return styles.infoAlert;
      default:
        return styles.defaultAlert;
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Alert Center</Text>
          <Text style={styles.subtitle}>
            {activeAlerts.length} active alerts
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.notificationToggle}>
        <View style={styles.toggleContent}>
          <Bell size={20} color="#374151" />
          <Text style={styles.toggleText}>Push Notifications</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E5E7EB', true: '#0EA5E9' }}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            {activeAlerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, getAlertStyle(alert.type)]}>
                <View style={styles.alertHeader}>
                  {getAlertIcon(alert.type)}
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <View style={styles.alertFooter}>
                  <View style={styles.alertMeta}>
                    <Text style={styles.alertLocation}>{alert.location}</Text>
                    <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acknowledgeButton}
                    onPress={() => acknowledgeAlert(alert.id)}
                  >
                    <Text style={styles.acknowledgeText}>Acknowledge</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {acknowledgedAlerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, styles.acknowledgedAlert]}>
              <View style={styles.alertHeader}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.alertTitle, styles.acknowledgedTitle]}>
                  {alert.title}
                </Text>
              </View>
              <Text style={[styles.alertMessage, styles.acknowledgedMessage]}>
                {alert.message}
              </Text>
              <View style={styles.alertFooter}>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertLocation}>{alert.location}</Text>
                  <Text style={styles.alertTimestamp}>{alert.timestamp}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.thresholdSettings}>
          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
          <View style={styles.thresholdCard}>
            <Text style={styles.thresholdLabel}>Critical Water Level</Text>
            <Text style={styles.thresholdValue}>{"< 8.5 meters"}</Text>
          </View>
          <View style={styles.thresholdCard}>
            <Text style={styles.thresholdLabel}>Warning Level</Text>
            <Text style={styles.thresholdValue}>{"< 10.0 meters"}</Text>
          </View>
          <View style={styles.thresholdCard}>
            <Text style={styles.thresholdLabel}>Rainfall Threshold</Text>
            <Text style={styles.thresholdValue}>{"< 2mm/week"}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#EF4444',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FEE2E2',
  },
  settingsButton: {
    padding: 8,
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  criticalAlert: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  warningAlert: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  infoAlert: {
    borderLeftColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  defaultAlert: {
    borderLeftColor: '#6B7280',
  },
  acknowledgedAlert: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
    opacity: 0.8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  acknowledgedTitle: {
    color: '#6B7280',
  },
  alertMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  acknowledgedMessage: {
    color: '#9CA3AF',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertMeta: {
    flex: 1,
  },
  alertLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 2,
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  acknowledgeButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acknowledgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thresholdSettings: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 10,
  },
  thresholdCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  thresholdValue: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },
});