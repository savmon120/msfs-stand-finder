# Data Flow Architecture

## 🔄 How Data Flows in Aviation Stand Finder

### **Two Types of Data:**

#### 1️⃣ Static Reference Data (Stored in Database) ✅
**What:** Airport infrastructure that rarely changes
**Source:** Database (SQLite locally, PostgreSQL on Vercel)
**Updated:** Manually via import scripts or admin interface

```
Database Contains:
├── Airports (EGLL, EGKK, etc.)
│   ├── Name, location, ICAO/IATA codes
│   
├── Stands (A10, B32, etc.)
│   ├── Terminal, coordinates, capacity
│   
├── Airline Terminal Assignments
│   ├── BA → T5, EZY → T1, etc.
│   
└── Aircraft Types
    └── A320, B777 wingspans, sizes
```

**Why in database?** This is infrastructure data - doesn't change often, needs to be fast.

#### 2️⃣ Real-Time Flight Data (From APIs) ✅
**What:** Live flight information
**Source:** External APIs (OpenSky, ADS-B Exchange, AviationStack)
**Updated:** Fetched in real-time when user searches

```
API Data Flow:
User searches "BA1489"
    ↓
1. System calls OpenSky Network API
   → Get current position of BA1489
   → Returns: lat/lon, altitude, speed
    ↓
2. If no recent position, try ADS-B Exchange
   → Get historical track data
    ↓
3. Match position to stands in DATABASE
   → Calculate distance to each stand
   → Find nearest stand
    ↓
4. Return result with confidence score
```

### **Complete Resolution Flow:**

```
┌─────────────────────────────────────────────┐
│  User Searches: "BA1489"                    │
└──────────────────┬──────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │  Stand Resolution    │
        │       Engine         │
        └──────────┬───────────┘
                   ↓
   ┌───────────────────────────────────┐
   │  Stage 1: Real-Time APIs          │
   │  ✅ OpenSky Network (free)         │
   │  ✅ ADS-B Exchange (optional)      │
   │  ✅ AviationStack (optional)       │
   │                                   │
   │  Fetches: Current position,       │
   │  aircraft type, schedule          │
   └──────────┬────────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │  Match to Database Stands        │
   │  📍 Calculate distances           │
   │  📐 Check aircraft fits           │
   │  🏢 Check terminal assignment     │
   └──────────┬───────────────────────┘
              ↓
   ┌──────────────────────────────────┐
   │  Return Result                   │
   │  Stand: A10                      │
   │  Confidence: 92%                 │
   │  Source: OpenSky + Database      │
   └──────────────────────────────────┘
```

## 🚀 For Vercel Deployment

### **What Gets Deployed:**

```javascript
// These use REAL APIs (no fake data):
✅ OpenSky Network API - Free, no auth required
✅ ADS-B Exchange API - Optional, adds more accuracy
✅ AviationStack API - Optional, adds flight schedules

// Database contains:
✅ Airport reference data (from OurAirports.com)
✅ Stand infrastructure data (crowdsourced + verified)
✅ Airline assignments (public information)
```

### **Vercel Setup:**

1. **Database:** Use Vercel Postgres or Neon
2. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://...
   ADSBEXCHANGE_API_KEY=optional
   AVIATIONSTACK_API_KEY=optional
   ```
3. **Zero fake data** - all flight info from APIs
4. **Static data** - just airport/stand infrastructure

## 📝 Current Data Sources

### ✅ **Working (Free):**
- **OpenSky Network** - Real ADS-B tracking data (https://opensky-network.org)
  - No API key needed for basic use
  - Returns live aircraft positions
  - Historical data available

### ⚠️ **Optional (Improves Accuracy):**
- **ADS-B Exchange** - Enhanced tracking
  - Requires API key
  - More aircraft coverage
  
- **AviationStack** - Flight schedules
  - Requires API key (free tier available)
  - Gets departure/arrival airports

## 🔍 What Happens When You Search

### Example: User searches "BA1489"

1. **System checks cache** (1 hour TTL)
   - If found → return cached result
   
2. **Normalize input:**
   ```
   BA1489 → airline: BA, number: 1489
   ```

3. **Query OpenSky API:**
   ```javascript
   GET https://opensky-network.org/api/states/all?icao24=...
   Response: {
     latitude: 51.4720,
     longitude: -0.4600,
     on_ground: true,
     timestamp: "2026-02-19T16:30:00Z"
   }
   ```

4. **Query database for stands:**
   ```sql
   SELECT * FROM stands 
   WHERE airport_id = 'EGLL'
   AND latitude IS NOT NULL
   ```

5. **Calculate distances:**
   ```javascript
   distances = stands.map(stand => 
     haversine(position.lat, position.lon, stand.lat, stand.lon)
   )
   ```

6. **Find closest stand:**
   ```javascript
   nearest = distances.min() // 45 meters from A10
   confidence = 0.92 // Within 50m = high confidence
   ```

7. **Return result:**
   ```json
   {
     "stand": "A10",
     "confidence": 0.92,
     "source": "OpenSky Network API + Database",
     "fallbackStage": 1,
     "terminal": "T2"
   }
   ```

## 🎯 Summary

**Database has:** Static airport/stand infrastructure ✅  
**APIs provide:** Real-time flight positions ✅  
**No fake data:** Everything comes from real sources ✅  
**Vercel ready:** Works with Postgres + API calls ✅

The system is designed for **production use with real data** - the database just provides the "map" of airports, while APIs provide the "live tracking" of flights!
