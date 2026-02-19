# Vercel Deployment Setup Guide

## Step 1: Add Database URL Environment Variable

### Option A: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project: `msfs-stand-finder`
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar
5. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string (see options below)
   - **Environments**: Check all (Production, Preview, Development)
6. Click **Save**

### Option B: Using Vercel CLI

```bash
vercel env add DATABASE_URL
# When prompted, paste your database URL
# Select all environments (production, preview, development)
```

## Step 2: Choose a Database Provider

You need a PostgreSQL database. Here are free/cheap options:

### Option 1: Vercel Postgres (Easiest)
```bash
# In your project directory
vercel link
vercel postgres create aviation-stands-db
```
This automatically adds the `DATABASE_URL` to your environment variables.

### Option 2: Neon (Free tier)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)
4. Add it as `DATABASE_URL` in Vercel

### Option 3: Supabase (Free tier)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (URI format)
5. Add it as `DATABASE_URL` in Vercel

### Option 4: PlanetScale (Free tier)
1. Sign up at https://planetscale.com
2. Create a new database
3. Get the connection string
4. Add it as `DATABASE_URL` in Vercel

## Step 3: Deploy Database Schema

After adding the database URL, your Vercel build will automatically run migrations. But you also need to seed data:

### Using Vercel CLI (after first deployment)
```bash
# Set environment variables locally
vercel env pull .env.production

# Run migration
npx prisma migrate deploy

# Seed the database
npm run db:seed
npm run import:airports
npm run import:stands
```

### Or via Vercel Dashboard
1. Go to your deployed project URL
2. Open the Functions logs
3. The first deployment will run migrations automatically
4. For seeding, you may need to create a one-time serverless function or use Vercel CLI

## Step 4: Optional API Keys (for better data)

Add these environment variables in Vercel for enhanced features:

- `OPENSKY_USERNAME` - OpenSky Network username (optional, for higher rate limits)
- `OPENSKY_PASSWORD` - OpenSky Network password
- `ADSBEXCHANGE_API_KEY` - ADS-B Exchange RapidAPI key (optional)
- `AVIATIONSTACK_API_KEY` - AviationStack API key (optional)

## Step 5: Redeploy

After adding environment variables:

```bash
git add -A
git commit -m "Configure Vercel deployment settings"
git push
```

Or manually trigger redeploy in Vercel Dashboard:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment

## Troubleshooting

### Build fails with "tsc: command not found"
✅ Fixed - `typescript` moved to dependencies

### "No DATABASE_URL" error
Add the environment variable as described in Step 1

### Functions timeout
- Increase function timeout in vercel.json:
  ```json
  {
    "functions": {
      "api/**/*.ts": {
        "maxDuration": 10
      }
    }
  }
  ```

### Database not seeded
Run seed commands manually using Vercel CLI or create an admin API endpoint for one-time seeding

## Verification

After deployment, test these endpoints:

- **Homepage**: https://your-project.vercel.app/
- **Health Check**: https://your-project.vercel.app/api/health
- **Stand Resolution**: https://your-project.vercel.app/api/stand?flight=BA1489
- **Airports List**: https://your-project.vercel.app/api/airports?search=london

## Database Seeding Note

The database will be empty after first deployment. You need to seed it with airport/stand data. Create a temporary admin endpoint or use Vercel CLI to run the seed scripts.
