# Workout Tracker

A simple web app for an athlete and trainer to track workouts and training plans. The athlete uploads Garmin CSV exports, and the trainer can view, filter, and analyze the data.

## Features

**Athlete View (`/athlete`)**
- Upload Garmin CSV exports (single or bulk)
- View completed workouts
- See assigned training plans

**Trainer View (`/trainer`)**
- View all athlete workouts with filters:
  - Activity type (Running, Cycling, etc.)
  - Distance range (e.g., 9.5-10.5 km for ~10km runs)
  - Number of recent workouts
- Choose which columns to display (pace, power, HR, etc.)
- Create and manage training plans

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase-setup.sql`
4. Go to **Settings > API** and copy your:
   - Project URL
   - `anon` public key

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variables in Vercel project settings
4. Deploy!

Both athlete and trainer will access the same deployed URL, just different paths:
- `https://your-app.vercel.app/athlete`
- `https://your-app.vercel.app/trainer`

## Garmin CSV Export

To export workouts from Garmin Connect:

1. Log into [connect.garmin.com](https://connect.garmin.com)
2. Go to **Activities > All Activities**
3. Click **Export CSV** (top right)
4. Select date range and activities to export
5. Upload the downloaded CSV in the athlete view

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **CSV Parsing**: Papa Parse
- **Hosting**: Vercel (recommended)

## Example: Last 5 10km Runs

The trainer's use case - viewing specific metrics for recent ~10km runs:

1. Go to `/trainer`
2. Set filters:
   - Activity Type: Running
   - Min Distance: 9.5
   - Max Distance: 10.5
   - Show last: 5 workouts
3. Select columns: Date, Type, Pace, Avg HR, Avg Power
4. Click Apply

This gives a clean view of the metrics the trainer wants to discuss.

## Future Improvements

- [ ] Add authentication for proper security
- [ ] Garmin API integration for automatic sync
- [ ] Charts and visualizations
- [ ] Workout notes and comments
- [ ] Plan completion tracking
