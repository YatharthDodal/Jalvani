from flask import Flask, render_template_string, jsonify, request
import pandas as pd
import requests
import time
import json
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import threading
import schedule

app = Flask(__name__)

# Load environment variables
load_dotenv('supabase_config.env')

class GroundwaterPipeline:
    def __init__(self):
        """Initialize the groundwater data pipeline"""
        print("🚀 Initializing Groundwater Pipeline...")
        
        # Load configuration from environment
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        self.supabase_table = os.getenv('SUPABASE_TABLE_NAME', 'maharashtra_groundwater_data')
        
        self.api_base_url = os.getenv('API_BASE_URL', 'https://indiawris.gov.in/Dataset/Ground Water Level')
        self.api_state_name = os.getenv('API_STATE_NAME', 'maharashtra')
        self.api_agency_name = os.getenv('API_AGENCY_NAME', 'CGWB')
        
        # Validate configuration
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("❌ Supabase URL and Key must be set in supabase_config.env")
        
        # Initialize Supabase client
        try:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            print("✅ Supabase client initialized successfully")
        except Exception as e:
            raise Exception(f"❌ Failed to initialize Supabase client: {str(e)}")
        
        # API headers
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://indiawris.gov.in/'
        }
        
        # Load districts
        self.districts = self.load_maharashtra_districts()
        print(f"✅ Loaded {len(self.districts)} districts")
        
        print("✅ Pipeline initialized successfully")
    
    def load_maharashtra_districts(self):
        """Load unique Maharashtra districts from Excel file"""
        try:
            df_unique = pd.read_excel("Unique_States_Districts.xlsx")
            maharashtra_data = df_unique[df_unique['State'].str.contains('Maharashtra', case=False, na=False)]
            return maharashtra_data['District'].unique()
        except Exception as e:
            print(f"❌ Failed to load districts: {str(e)}")
            return ['Amravati', 'Mumbai', 'Pune', 'Nagpur']  # Fallback districts
    
    def fetch_district_data(self, district):
        """Fetch groundwater data for a specific district"""
        # Get current date
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now().replace(day=datetime.now().day-1) if datetime.now().day > 1 
                    else datetime.now().replace(month=datetime.now().month-1, day=28)).strftime('%Y-%m-%d')
        
        params = {
            'stateName': self.api_state_name,
            'districtName': district,
            'agencyName': self.api_agency_name,
            'startdate': yesterday,
            'enddate': today,
            'download': 'false',
            'page': 0,
            'size': 1000
        }
        
        try:
            response = requests.post(self.api_base_url, params=params, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('statusCode') == 200 and data.get('data'):
                    return data['data']
            return []
        except Exception as e:
            print(f"   ❌ Request failed for {district}: {str(e)}")
            return []
    
    def map_api_to_database_schema(self, station_data, district):
        """Map API response to database schema"""
        return {
            'state': 'Maharashtra',
            'district': district,
            'station_code': station_data.get('stationCode', ''),
            'station_name': station_data.get('stationName', ''),
            'latitude': float(station_data.get('latitude', 0)) if station_data.get('latitude') else None,
            'longitude': float(station_data.get('longitude', 0)) if station_data.get('longitude') else None,
            'well_depth': float(station_data.get('wellDepth', 0)) if station_data.get('wellDepth') else None,
            'data_value': float(station_data.get('dataValue', 0)) if station_data.get('dataValue') else None,
            'data_time': station_data.get('dataTime', ''),
            'unit': station_data.get('unit', ''),
            'well_type': station_data.get('wellType', ''),
            'aquifer_type': station_data.get('wellAquiferType', ''),
            'station_status': station_data.get('stationStatus', '')
        }
    
    def update_supabase_data(self):
        """Fetch fresh data from API and update Supabase"""
        print("🔄 Starting data update...")
        
        all_data = []
        districts_processed = 0
        total_stations = 0
        
        # Process first 20 districts for demo (you can change this)
        demo_districts = self.districts[:20]
        
        for district in demo_districts:
            print(f"🔄 Processing {district}...")
            stations = self.fetch_district_data(district)
            
            if stations:
                districts_processed += 1
                total_stations += len(stations)
                
                for station in stations:
                    mapped_data = self.map_api_to_database_schema(station, district)
                    all_data.append(mapped_data)
            
            time.sleep(0.5)  # Rate limiting
        
        # Clear existing data and insert new data
        if all_data:
            try:
                # Clear existing data
                self.supabase.table(self.supabase_table).delete().neq('id', 0).execute()
                
                # Insert new data in batches
                batch_size = 100
                for i in range(0, len(all_data), batch_size):
                    batch = all_data[i:i + batch_size]
                    self.supabase.table(self.supabase_table).insert(batch).execute()
                
                print(f"✅ Updated Supabase with {len(all_data)} records from {districts_processed} districts")
                return True
            except Exception as e:
                print(f"❌ Supabase update failed: {str(e)}")
                return False
        
        return False
    
    def get_live_data(self):
        """Get current data from Supabase for the heatmap"""
        try:
            result = self.supabase.table(self.supabase_table).select("*").execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"❌ Failed to fetch live data: {str(e)}")
            return []

# Initialize pipeline
pipeline = GroundwaterPipeline()

# HTML template for the heatmap
HEATMAP_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Live Maharashtra Groundwater Heatmap</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #map { height: 100vh; width: 100%; }
        .control-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        .status {
            margin: 5px 0;
            padding: 5px;
            border-radius: 3px;
        }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .status.info { background: #d1ecf1; color: #0c5460; }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            margin: 2px;
        }
        button:hover { background: #0056b3; }
        .legend {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: white;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <div class="control-panel">
        <h3>Live Groundwater Data</h3>
        <div id="status" class="status info">Loading...</div>
        <div id="stats"></div>
        <button onclick="refreshData()">🔄 Refresh Data</button>
        <button onclick="updateFromAPI()">📡 Update from API</button>
        <div style="margin-top: 10px;">
            <label><input type="checkbox" id="showHeatmap" checked> Show Heatmap</label><br>
            <label><input type="checkbox" id="showMarkers" checked> Show Markers</label>
        </div>
    </div>
    
    <div class="legend">
        <h4>Groundwater Status</h4>
        <div>🟢 Good (0-5m)</div>
        <div>🔵 Moderate (5-15m)</div>
        <div>🟡 Poor (15-30m)</div>
        <div>🔴 Critical (>30m)</div>
    </div>

    <script>
        let map;
        let heatmapLayer;
        let markerLayer;
        let currentData = [];

        // Initialize map
        function initMap() {
            map = L.map('map').setView([20.5937, 78.9629], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            // Initialize layers
            markerLayer = L.layerGroup().addTo(map);
            
            // Load initial data
            refreshData();
        }

        // Refresh data from Supabase
        function refreshData() {
            updateStatus('Loading data...', 'info');
            
            fetch('/api/data')
                .then(response => response.json())
                .then(data => {
                    currentData = data;
                    updateMap();
                    updateStats();
                    updateStatus(`Loaded ${data.length} stations`, 'success');
                })
                .catch(error => {
                    updateStatus('Failed to load data', 'error');
                    console.error('Error:', error);
                });
        }

        // Update from API
        function updateFromAPI() {
            updateStatus('Updating from API...', 'info');
            
            fetch('/api/update', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateStatus('Data updated successfully', 'success');
                        refreshData();
                    } else {
                        updateStatus('Update failed', 'error');
                    }
                })
                .catch(error => {
                    updateStatus('Update failed', 'error');
                    console.error('Error:', error);
                });
        }

        // Update map with current data
        function updateMap() {
            // Clear existing layers
            if (heatmapLayer) map.removeLayer(heatmapLayer);
            markerLayer.clearLayers();

            if (currentData.length === 0) return;

            // Prepare heatmap data
            const heatData = currentData
                .filter(d => d.latitude && d.longitude && d.well_depth)
                .map(d => [d.latitude, d.longitude, 1 - (d.well_depth / 100)]); // Normalize for heatmap

            // Add heatmap if enabled
            if (document.getElementById('showHeatmap').checked && heatData.length > 0) {
                heatmapLayer = L.heatLayer(heatData, {
                    radius: 15,
                    blur: 10,
                    maxZoom: 15,
                    gradient: {
                        0.0: 'blue',
                        0.2: 'cyan',
                        0.4: 'green',
                        0.6: 'yellow',
                        0.8: 'orange',
                        1.0: 'red'
                    }
                }).addTo(map);
            }

            // Add markers if enabled
            if (document.getElementById('showMarkers').checked) {
                currentData.forEach(station => {
                    if (station.latitude && station.longitude) {
                        const color = getMarkerColor(station.well_depth);
                        const marker = L.circleMarker([station.latitude, station.longitude], {
                            radius: 3,
                            fillColor: color,
                            color: 'white',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        });

                        marker.bindPopup(`
                            <b>${station.station_name}</b><br>
                            District: ${station.district}<br>
                            Well Depth: ${station.well_depth}m<br>
                            Status: ${getStatusText(station.well_depth)}
                        `);

                        markerLayer.addLayer(marker);
                    }
                });
            }
        }

        // Get marker color based on well depth
        function getMarkerColor(depth) {
            if (depth <= 5) return 'green';
            if (depth <= 15) return 'blue';
            if (depth <= 30) return 'yellow';
            return 'red';
        }

        // Get status text
        function getStatusText(depth) {
            if (depth <= 5) return 'Good';
            if (depth <= 15) return 'Moderate';
            if (depth <= 30) return 'Poor';
            return 'Critical';
        }

        // Update statistics
        function updateStats() {
            const stats = document.getElementById('stats');
            if (currentData.length === 0) {
                stats.innerHTML = 'No data available';
                return;
            }

            const depths = currentData.map(d => d.well_depth).filter(d => d);
            const avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
            const good = currentData.filter(d => d.well_depth <= 5).length;
            const moderate = currentData.filter(d => d.well_depth > 5 && d.well_depth <= 15).length;
            const poor = currentData.filter(d => d.well_depth > 15 && d.well_depth <= 30).length;
            const critical = currentData.filter(d => d.well_depth > 30).length;

            stats.innerHTML = `
                <small>
                    Avg Depth: ${avgDepth.toFixed(1)}m<br>
                    🟢 Good: ${good} | 🔵 Mod: ${moderate}<br>
                    🟡 Poor: ${poor} | 🔴 Critical: ${critical}
                </small>
            `;
        }

        // Update status
        function updateStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
        }

        // Event listeners
        document.getElementById('showHeatmap').addEventListener('change', updateMap);
        document.getElementById('showMarkers').addEventListener('change', updateMap);

        // Auto-refresh every 5 minutes
        setInterval(refreshData, 300000);

        // Initialize map when page loads
        window.onload = initMap;
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the main heatmap page"""
    return render_template_string(HEATMAP_TEMPLATE)

@app.route('/api/data')
def get_data():
    """API endpoint to get current data from Supabase"""
    try:
        data = pipeline.get_live_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update', methods=['POST'])
def update_data():
    """API endpoint to update data from API"""
    try:
        success = pipeline.update_supabase_data()
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """API endpoint to get statistics"""
    try:
        data = pipeline.get_live_data()
        if not data:
            return jsonify({'total': 0})
        
        depths = [d['well_depth'] for d in data if d.get('well_depth')]
        stats = {
            'total': len(data),
            'avg_depth': sum(depths) / len(depths) if depths else 0,
            'good': len([d for d in data if d.get('well_depth', 0) <= 5]),
            'moderate': len([d for d in data if d.get('well_depth', 0) > 5 and d.get('well_depth', 0) <= 15]),
            'poor': len([d for d in data if d.get('well_depth', 0) > 15 and d.get('well_depth', 0) <= 30]),
            'critical': len([d for d in data if d.get('well_depth', 0) > 30])
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def scheduled_update():
    """Scheduled function to update data periodically"""
    print("🕐 Running scheduled update...")
    pipeline.update_supabase_data()

def run_scheduler():
    """Run the scheduler in a separate thread"""
    schedule.every(30).minutes.do(scheduled_update)
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == '__main__':
    print("🚀 Starting Groundwater Pipeline Flask Server...")
    print("=" * 60)
    print("🌐 Server will be available at: http://localhost:5000")
    print("📡 API endpoints:")
    print("   GET  /api/data    - Get current data")
    print("   POST /api/update  - Update from API")
    print("   GET  /api/stats   - Get statistics")
    print("=" * 60)
    
    # Start scheduler in background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    # Run initial data update
    print("🔄 Running initial data update...")
    pipeline.update_supabase_data()
    
    # Start Flask server
    app.run(debug=True, host='0.0.0.0', port=5000)
