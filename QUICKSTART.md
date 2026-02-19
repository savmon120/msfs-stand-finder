# Quick Start Guide

## 🚀 Your Aviation Stand Finder is Running!

**Server:** http://localhost:3000

## 📋 Quick Commands

```bash
# Start server (already running)
npm run dev

# Stop server
# Press Ctrl+C in terminal

# Database management
npm run prisma:studio    # Open visual database editor
npm run db:seed          # Reset sample data

# Testing
npm test                 # Run tests
curl http://localhost:3000/api/health  # Check API
```

## 🎯 Try These Examples

### Web UI (http://localhost:3000)
Search for these flights:
- `BA1489` - British Airways
- `BAW1489` - Same flight, ICAO format
- `U2123` - easyJet
- `FR1234` - Ryanair

### API Examples

```bash
# Get stand for BA1489
curl "http://localhost:3000/api/stand?flight=BA1489&airport=EGLL"

# View all Heathrow stands
curl "http://localhost:3000/api/airport/EGLL/stands"

# Search London airports
curl "http://localhost:3000/api/airports?search=London"
```

## 🗂️ Key Files to Edit

- `.env` - API keys and configuration
- `src/routes/stand.routes.ts` - Add new endpoints
- `src/adapters/sources/` - Add data sources
- `config/stand-mappings/` - Add stand mappings
- `public/index.html` - Customize UI

## 🔧 Common Tasks

### Add a New Airport with Stands
```bash
# Edit src/scripts/import-stands.ts
# Add your airport data
npm run import:stands
```

### Change Server Port
```bash
# Edit .env
PORT=4000

# Restart server
```

### View Database
```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Deploy to Production
```bash
# Docker
docker-compose up -d

# Fly.io
fly launch

# Vercel
vercel
```

## 📝 Notes

- **Default Database:** SQLite (dev.db)
- **Cache:** In-memory (no Redis setup needed)
- **Data Sources:** OpenSky Network (no API key)
- **Test Data:** 3 UK airports, 15 stands

## 🔗 Important URLs

- Web UI: http://localhost:3000
- API Docs: http://localhost:3000/api/health
- Database Studio: Run `npm run prisma:studio`

## ⚡ Performance Tips

1. Add API keys to `.env` for more data sources
2. Enable Redis for multi-instance caching
3. Use PostgreSQL for production
4. Deploy to edge network (Cloudflare/Vercel)

## 🐛 Having Issues?

Check [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) for troubleshooting.

---

**Happy Flying! ✈️**
