import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Droplets, ThermometerSun } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

interface WaterLevelData {
  timestamp: string;
  level: number;
  rainfall: number;
  soilMoisture: number;
}

export default function MonitorScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentData, setCurrentData] = useState({
    waterLevel: 12.5,
    trend: 'up',
    rainfall: 5.2,
    soilMoisture: 68,
    lastUpdate: new Date().toLocaleTimeString(),
  });

  const [chartData, setChartData] = useState({
    labels: ['6h', '5h', '4h', '3h', '2h', '1h', 'Now'],
    datasets: [{
      data: [11.2, 11.8, 12.1, 12.3, 12.0, 12.2, 12.5],
      color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
      strokeWidth: 3,
    }],
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setCurrentData(prev => ({
        ...prev,
        waterLevel: prev.waterLevel + (Math.random() - 0.5) * 0.5,
        lastUpdate: new Date().toLocaleTimeString(),
      }));
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Groundwater Monitor</Text>
          <Text style={styles.subtitle}>Real-time DWLR Data</Text>
          <Text style={styles.lastUpdate}>Last updated: {currentData.lastUpdate}</Text>
        </View>

        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.primaryCard]}>
            <View style={styles.metricHeader}>
              <Droplets size={24} color="#FFFFFF" />
              <View style={styles.trendIndicator}>
                {currentData.trend === 'up' ? (
                  <TrendingUp size={16} color="#10B981" />
                ) : (
                  <TrendingDown size={16} color="#EF4444" />
                )}
              </View>
            </View>
            <Text style={styles.primaryValue}>{currentData.waterLevel.toFixed(1)}</Text>
            <Text style={styles.primaryUnit}>meters</Text>
            <Text style={styles.primaryLabel}>Water Level</Text>
          </View>

          <View style={styles.secondaryMetrics}>
            <View style={styles.secondaryCard}>
              <ThermometerSun size={20} color="#0EA5E9" />
              <Text style={styles.secondaryValue}>{currentData.rainfall}</Text>
              <Text style={styles.secondaryUnit}>mm</Text>
              <Text style={styles.secondaryLabel}>24h Rainfall</Text>
            </View>

            <View style={styles.secondaryCard}>
              <View style={[styles.moistureIndicator, { width: `${currentData.soilMoisture}%` }]} />
              <Text style={styles.secondaryValue}>{currentData.soilMoisture}</Text>
              <Text style={styles.secondaryUnit}>%</Text>
              <Text style={styles.secondaryLabel}>Soil Moisture</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Water Level Trend (Last 6 hours)</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#0EA5E9',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, styles.goodStatus]}>
            <Text style={styles.statusTitle}>System Status</Text>
            <Text style={styles.statusValue}>Operational</Text>
            <Text style={styles.statusSubtext}>All sensors active</Text>
          </View>

          <View style={[styles.statusCard, styles.warningStatus]}>
            <Text style={styles.statusTitle}>Water Availability</Text>
            <Text style={styles.statusValue}>Moderate</Text>
            <Text style={styles.statusSubtext}>Within normal range</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Detailed Analytics</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#0EA5E9',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0F2FE',
    marginBottom: 8,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#BAE6FD',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  primaryCard: {
    flex: 2,
    backgroundColor: '#0284C7',
    borderRadius: 16,
    padding: 20,
  },
  metricCard: {
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  trendIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  primaryValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  primaryUnit: {
    fontSize: 14,
    color: '#BAE6FD',
    marginTop: -5,
  },
  primaryLabel: {
    fontSize: 16,
    color: '#E0F2FE',
    marginTop: 8,
  },
  secondaryMetrics: {
    flex: 1,
    gap: 15,
  },
  secondaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moistureIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  secondaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
  },
  secondaryUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  goodStatus: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  warningStatus: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  statusSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#0EA5E9',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});