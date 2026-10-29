import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator as CalcIcon, Droplets, Leaf, TrendingDown, Info } from 'lucide-react-native';

interface BudgetCalculation {
  totalDemand: number;
  totalSupply: number;
  balance: number;
  sustainability: 'sustainable' | 'stressed' | 'critical';
}

export default function CalculatorScreen() {
  const [activeTab, setActiveTab] = useState('basic');
  const [inputs, setInputs] = useState({
    population: '50000',
    agriculture: '2000',
    industry: '500',
    groundwaterRecharge: '15000',
    surfaceWater: '8000',
    recycledWater: '2000',
  });

  const [results, setResults] = useState<BudgetCalculation | null>(null);

  const calculateBudget = () => {
    const domesticDemand = parseInt(inputs.population) * 150 / 1000; // 150L per person per day -> m³/day
    const agricultureDemand = parseInt(inputs.agriculture) * 2000 / 1000; // hectares * 2000L/hectare/day
    const industryDemand = parseInt(inputs.industry) * 5000 / 1000; // industries * 5000L/industry/day
    
    const totalDemand = domesticDemand + agricultureDemand + industryDemand;
    
    const groundwaterSupply = parseInt(inputs.groundwaterRecharge);
    const surfaceWaterSupply = parseInt(inputs.surfaceWater);
    const recycledWaterSupply = parseInt(inputs.recycledWater);
    
    const totalSupply = groundwaterSupply + surfaceWaterSupply + recycledWaterSupply;
    const balance = totalSupply - totalDemand;
    
    let sustainability: 'sustainable' | 'stressed' | 'critical';
    if (balance > totalDemand * 0.2) {
      sustainability = 'sustainable';
    } else if (balance > 0) {
      sustainability = 'stressed';
    } else {
      sustainability = 'critical';
    }

    setResults({
      totalDemand,
      totalSupply,
      balance,
      sustainability,
    });
  };

  const getSustainabilityColor = (level: string) => {
    switch (level) {
      case 'sustainable': return '#10B981';
      case 'stressed': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const tabs = [
    { id: 'basic', name: 'Basic Calculator', icon: CalcIcon },
    { id: 'advanced', name: 'Advanced Model', icon: TrendingDown },
    { id: 'scenarios', name: 'Scenarios', icon: Leaf },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Budget Calculator</Text>
        <Text style={styles.subtitle}>Regional Water Balance Analysis</Text>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} color={activeTab === tab.id ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {activeTab === 'basic' && (
          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Droplets size={20} color="#EF4444" />
                <Text style={styles.sectionTitle}>Water Demand</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Population</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.population}
                  onChangeText={(text) => setInputs({...inputs, population: text})}
                  placeholder="50000"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Number of people in the region</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Agricultural Land (hectares)</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.agriculture}
                  onChangeText={(text) => setInputs({...inputs, agriculture: text})}
                  placeholder="2000"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Irrigated agricultural area</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Industrial Units</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.industry}
                  onChangeText={(text) => setInputs({...inputs, industry: text})}
                  placeholder="500"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Number of industrial establishments</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Droplets size={20} color="#10B981" />
                <Text style={styles.sectionTitle}>Water Supply</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Groundwater Recharge (m³/day)</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.groundwaterRecharge}
                  onChangeText={(text) => setInputs({...inputs, groundwaterRecharge: text})}
                  placeholder="15000"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Average daily groundwater recharge</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surface Water (m³/day)</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.surfaceWater}
                  onChangeText={(text) => setInputs({...inputs, surfaceWater: text})}
                  placeholder="8000"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Rivers, lakes, and reservoirs</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recycled Water (m³/day)</Text>
                <TextInput
                  style={styles.input}
                  value={inputs.recycledWater}
                  onChangeText={(text) => setInputs({...inputs, recycledWater: text})}
                  placeholder="2000"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Treated wastewater and recycled water</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={calculateBudget}>
              <CalcIcon size={20} color="#FFFFFF" />
              <Text style={styles.calculateText}>Calculate Water Budget</Text>
            </TouchableOpacity>

            {results && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Water Balance Analysis</Text>
                
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultLabel}>Total Water Demand</Text>
                    <Text style={styles.demandValue}>{formatNumber(results.totalDemand)} m³/day</Text>
                  </View>
                  <View style={styles.demandBreakdown}>
                    <Text style={styles.breakdownText}>
                      Domestic + Agricultural + Industrial
                    </Text>
                  </View>
                </View>

                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultLabel}>Total Water Supply</Text>
                    <Text style={styles.supplyValue}>{formatNumber(results.totalSupply)} m³/day</Text>
                  </View>
                  <View style={styles.supplyBreakdown}>
                    <Text style={styles.breakdownText}>
                      Groundwater + Surface + Recycled
                    </Text>
                  </View>
                </View>

                <View style={[styles.resultCard, styles.balanceCard]}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultLabel}>Water Balance</Text>
                    <Text style={[
                      styles.balanceValue,
                      { color: results.balance >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {results.balance >= 0 ? '+' : ''}{formatNumber(results.balance)} m³/day
                    </Text>
                  </View>
                  <View style={[
                    styles.sustainabilityBadge,
                    { backgroundColor: getSustainabilityColor(results.sustainability) }
                  ]}>
                    <Text style={styles.sustainabilityText}>
                      {results.sustainability.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.recommendationsCard}>
                  <View style={styles.recommendationsHeader}>
                    <Info size={16} color="#0EA5E9" />
                    <Text style={styles.recommendationsTitle}>Recommendations</Text>
                  </View>
                  {results.sustainability === 'critical' && (
                    <Text style={styles.recommendationText}>
                      • Immediate water conservation measures required{'\n'}
                      • Increase groundwater recharge through rainwater harvesting{'\n'}
                      • Implement strict water usage regulations{'\n'}
                      • Explore alternative water sources
                    </Text>
                  )}
                  {results.sustainability === 'stressed' && (
                    <Text style={styles.recommendationText}>
                      • Monitor water usage closely{'\n'}
                      • Promote water-efficient irrigation techniques{'\n'}
                      • Increase recycled water utilization{'\n'}
                      • Plan for drought contingencies
                    </Text>
                  )}
                  {results.sustainability === 'sustainable' && (
                    <Text style={styles.recommendationText}>
                      • Maintain current conservation practices{'\n'}
                      • Continue monitoring groundwater levels{'\n'}
                      • Plan for future growth and climate change{'\n'}
                      • Share best practices with neighboring regions
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'advanced' && (
          <View style={styles.content}>
            <Text style={styles.comingSoon}>Advanced Modeling Tools</Text>
            <Text style={styles.comingSoonText}>
              Climate projections, seasonal variations, and multi-year planning tools coming soon.
            </Text>
          </View>
        )}

        {activeTab === 'scenarios' && (
          <View style={styles.content}>
            <Text style={styles.comingSoon}>Scenario Planning</Text>
            <Text style={styles.comingSoonText}>
              Drought scenarios, population growth models, and climate change impacts.
            </Text>
          </View>
        )}
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
    backgroundColor: '#F97316',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FED7AA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  calculateButton: {
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  calculateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  resultCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  demandValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  supplyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  breakdownText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  balanceCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sustainabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  sustainabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  recommendationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginTop: 60,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  demandBreakdown: {
    marginTop: 4,
  },
  supplyBreakdown: {
    marginTop: 4,
  },
});