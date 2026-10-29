import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { MapPin, Layers, Filter, Search, Navigation, ZoomIn, ZoomOut, Locate, X } from 'lucide-react-native';
import * as Location from 'expo-location';

interface WaterStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterLevel: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdate: string;
  description?: string;
  address?: string;
}

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [selectedLayer, setSelectedLayer] = useState('waterLevels');
  const [selectedStation, setSelectedStation] = useState<WaterStation | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const waterStations: WaterStation[] = [
    {
      id: '1',
      name: 'DWLR-North-01',
      latitude: 28.6139,
      longitude: 77.2090,
      waterLevel: 8.2,
      status: 'critical',
      lastUpdate: '2 hours ago',
      description: 'North Delhi Water Level Station',
      address: 'Near Red Fort, Old Delhi',
    },
    {
      id: '2',
      name: 'DWLR-Central-05',
      latitude: 28.5355,
      longitude: 77.3910,
      waterLevel: 12.5,
      status: 'good',
      lastUpdate: '1 hour ago',
      description: 'Central Delhi Water Level Station',
      address: 'Connaught Place Area',
    },
    {
      id: '3',
      name: 'DWLR-South-03',
      latitude: 28.4595,
      longitude: 77.0266,
      waterLevel: 9.8,
      status: 'warning',
      lastUpdate: '30 min ago',
      description: 'South Delhi Water Level Station',
      address: 'Near India Gate',
    },
    {
      id: '4',
      name: 'DWLR-East-02',
      latitude: 28.6692,
      longitude: 77.4538,
      waterLevel: 15.2,
      status: 'good',
      lastUpdate: '45 min ago',
      description: 'East Delhi Water Level Station',
      address: 'Near Akshardham Temple',
    },
    {
      id: '5',
      name: 'DWLR-West-04',
      latitude: 28.7041,
      longitude: 77.1025,
      waterLevel: 6.8,
      status: 'critical',
      lastUpdate: '1 hour ago',
      description: 'West Delhi Water Level Station',
      address: 'Near Delhi University',
    },
  ];

  // Request location permission and get user location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your current location on the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      // Center map on user location
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getMarkerIcon = (status: string) => {
    const colors = {
      good: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const animateToLocation = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const toggleLayerPanel = () => {
    const toValue = showLayerPanel ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowLayerPanel(!showLayerPanel);
  };

  // Create HTML for Google Maps with API key
  const createMapHTML = () => {
    const markers = waterStations.map(station => 
      `{
        position: { lat: ${station.latitude}, lng: ${station.longitude} },
        title: "${station.name}",
        waterLevel: ${station.waterLevel},
        status: "${station.status}",
        color: "${getStatusColor(station.status)}",
        id: "${station.id}"
      }`
    ).join(',');

    const userLocationScript = userLocation ? 
      `const userLocation = { lat: ${userLocation.latitude}, lng: ${userLocation.longitude} };` : 
      'const userLocation = null;';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          #map { height: 100vh; width: 100%; }
          .info-window { padding: 10px; }
          .info-title { font-size: 16px; font-weight: bold; margin: 0 0 5px 0; color: #374151; }
          .info-subtitle { font-size: 14px; margin: 0 0 5px 0; color: #6B7280; }
          .info-status { font-size: 12px; font-weight: bold; margin: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          ${userLocationScript}
          const stations = [${markers}];
          
          function initMap() {
            const delhi = { lat: 28.6139, lng: 77.2090 };
            const map = new google.maps.Map(document.getElementById("map"), {
              zoom: 11,
              center: delhi,
              mapTypeId: 'roadmap',
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            });

            // Add water station markers
            stations.forEach(station => {
              const marker = new google.maps.Marker({
                position: station.position,
                map: map,
                title: station.title,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: station.color,
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                  scale: 12
                },
                animation: google.maps.Animation.DROP
              });

              const infoWindow = new google.maps.InfoWindow({
                content: \`
                  <div class="info-window">
                    <div class="info-title">\${station.title}</div>
                    <div class="info-subtitle">Water Level: <strong>\${station.waterLevel}m</strong></div>
                    <div class="info-status" style="color: \${station.color};">\${station.status.toUpperCase()}</div>
                  </div>
                \`
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
                // Send message to React Native
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerClick',
                    stationId: station.id
                  }));
                }
              });
            });

            // Add user location marker
            if (userLocation) {
              const userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                title: 'Your Location',
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#0EA5E9',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3,
                  scale: 10
                }
              });
            }

            // Add circles around critical stations
            stations
              .filter(station => station.status === 'critical')
              .forEach(station => {
                new google.maps.Circle({
                  strokeColor: '#EF4444',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: '#EF4444',
                  fillOpacity: 0.1,
                  map: map,
                  center: station.position,
                  radius: 500
                });
              });
          }
        </script>
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDcETCefipXHHJ5o9lXIEEozKFpcNRj0tM&callback=initMap"></script>
      </body>
      </html>
    `;
  };


  const layers = [
    { id: 'waterLevels', name: 'Water Levels', active: true },
    { id: 'rainfall', name: 'Rainfall Data', active: false },
    { id: 'soilMoisture', name: 'Soil Moisture', active: false },
    { id: 'landUse', name: 'Land Use', active: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Geospatial Map</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          style={styles.map}
          source={{ html: createMapHTML() }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'markerClick') {
                const station = waterStations.find(s => s.id === data.stationId);
                if (station) {
                  setSelectedStation(station);
                }
              }
            } catch (error) {
              console.log('Error parsing WebView message:', error);
            }
          }}
        />

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={getCurrentLocation}
          >
            <Locate size={20} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => mapRef.current?.animateToRegion({
              ...mapRegion,
              latitudeDelta: mapRegion.latitudeDelta * 0.5,
              longitudeDelta: mapRegion.longitudeDelta * 0.5,
            }, 500)}
          >
            <ZoomIn size={20} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => mapRef.current?.animateToRegion({
              ...mapRegion,
              latitudeDelta: mapRegion.latitudeDelta * 2,
              longitudeDelta: mapRegion.longitudeDelta * 2,
            }, 500)}
          >
            <ZoomOut size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Layer controls */}
        <Animated.View 
          style={[
            styles.layerControls,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.layerHeader}>
            <Layers size={16} color="#374151" />
            <Text style={styles.layerTitle}>Map Layers</Text>
            <TouchableOpacity onPress={toggleLayerPanel} style={styles.closeLayerButton}>
              <X size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {layers.map((layer) => (
            <TouchableOpacity
              key={layer.id}
              style={[
                styles.layerItem,
                selectedLayer === layer.id && styles.activeLayer
              ]}
              onPress={() => setSelectedLayer(layer.id)}
            >
              <View style={[
                styles.layerIndicator,
                { backgroundColor: selectedLayer === layer.id ? '#0EA5E9' : '#E5E7EB' }
              ]} />
              <Text style={[
                styles.layerName,
                selectedLayer === layer.id && styles.activeLayerText
              ]}>
                {layer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Layer toggle button */}
        <TouchableOpacity
          style={styles.layerToggleButton}
          onPress={toggleLayerPanel}
        >
          <Layers size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" />
          <Text style={styles.searchInput}>Search stations...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Station info panel */}
      {selectedStation && (
        <Animated.View style={styles.stationInfo}>
          <View style={styles.stationHeader}>
            <View style={styles.stationTitleRow}>
              <Text style={styles.stationName}>{selectedStation.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(selectedStation.status) }
              ]}>
                <Text style={styles.statusText}>
                  {selectedStation.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedStation(null)}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.stationDescription}>
            <Text style={styles.stationDescText}>{selectedStation.description}</Text>
            <Text style={styles.stationAddress}>{selectedStation.address}</Text>
          </View>
          
          <View style={styles.stationDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Water Level:</Text>
              <View style={styles.detailValueContainer}>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedStation.status) }]}>
                  {selectedStation.waterLevel}m
                </Text>
                <View style={[styles.waterLevelBar, { backgroundColor: getStatusColor(selectedStation.status) }]} />
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coordinates:</Text>
              <Text style={styles.detailValue}>
                {selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Update:</Text>
              <Text style={styles.detailValue}>{selectedStation.lastUpdate}</Text>
            </View>
          </View>

          <View style={styles.stationActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => animateToLocation(selectedStation.latitude, selectedStation.longitude)}
            >
              <Navigation size={16} color="#0EA5E9" />
              <Text style={styles.actionButtonText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>View Full Details</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Station list */}
      <ScrollView style={styles.stationList} horizontal showsHorizontalScrollIndicator={false}>
        {waterStations.map((station) => (
          <TouchableOpacity
            key={station.id}
            style={[
              styles.stationCard,
              selectedStation?.id === station.id && styles.selectedStationCard
            ]}
            onPress={() => {
              setSelectedStation(station);
              animateToLocation(station.latitude, station.longitude);
            }}
          >
            <View style={styles.stationCardHeader}>
              <View style={[
                styles.stationStatus,
                { backgroundColor: getStatusColor(station.status) }
              ]} />
              <Text style={styles.stationCardName}>{station.name}</Text>
            </View>
            <Text style={styles.stationCardLevel}>{station.waterLevel}m</Text>
            <Text style={styles.stationCardUpdate}>{station.lastUpdate}</Text>
            <View style={styles.stationCardFooter}>
              <Text style={styles.stationCardStatus}>{station.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#10B981',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
    minHeight: 400,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  callout: {
    width: 200,
    padding: 0,
  },
  calloutContent: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  userLocationMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
    top: -10,
    left: -10,
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  layerControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minWidth: 180,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  layerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  closeLayerButton: {
    padding: 4,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeLayer: {
    backgroundColor: '#F0F9FF',
  },
  layerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  layerName: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  activeLayerText: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  layerToggleButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationInfo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stationTitleRow: {
    flex: 1,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationDescription: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stationDescText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  stationDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  waterLevelBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  stationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 12,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  stationList: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    minWidth: 140,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedStationCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#0EA5E9',
  },
  stationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stationStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  stationCardLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  stationCardUpdate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  stationCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationCardStatus: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#0EA5E9',
    borderStyle: 'dashed',
    margin: 10,
    borderRadius: 12,
  },
  fallbackMapContent: {
    alignItems: 'center',
    padding: 20,
  },
  fallbackMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackMapSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackMapNote: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  fallbackMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  debugIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  interactiveMap: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    position: 'relative',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  interactiveMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(14, 165, 233, 0.3)',
    top: -10,
    left: -10,
    opacity: 0.6,
  },
  mapLegend: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});