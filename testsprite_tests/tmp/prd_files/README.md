# Productive Me

A personal productivity dashboard to track activities, screen time, analytics, news, and help manage time and budgets.

## Features

- 📊 **Dashboard** - Weather, activity graphs, sticky notes, news, stocks, and screen time tracking
- ✅ **Task Manager** - Kanban board with drag-and-drop, priorities, and due dates
- 📅 **Calendar** - Manage events and reminders
- 💰 **Finance Tracker** - Track income, expenses, and budget
- 🔔 **Notifications** - Real-time alerts for tasks and events
- 🌓 **Dark Mode** - Beautiful light/dark theme toggle

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Icons
- Recharts
- React Query

### Backend

- Next.js API routes / server actions
- Supabase (PostgreSQL + Auth + Storage)

### External APIs

- Open-Meteo (weather)
- GNews API (news)
- Alpha Vantage (stocks)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account
- API keys for GNews and Alpha Vantage

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/productive-me.git
cd productive-me
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
GNEWS_API_KEY=your_gnews_api_key
ALPHAVANTAGE_API_KEY=your_alphavantage_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up the database

Go to your Supabase project and run the SQL schema from `lib/supabase/schema.sql` in the SQL editor.

5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The app uses PostgreSQL with the following main tables:

- `profiles` - User profiles
- `tasks` - Task management
- `events` - Calendar events
- `reminders` - Event reminders
- `budgets` - Financial budgets
- `budget_items` - Budget line items
- `notifications` - User notifications
- `screentime_sessions` - Screen time tracking
- `news_saved` - Saved news articles
- `stocks_watchlist` - Stock watchlist

All tables have Row Level Security (RLS) enabled to ensure data isolation between users.

## Project Structure

```
productive-me/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page and widgets
│   ├── tasks/             # Task manager
│   ├── calendar/          # Calendar view
│   ├── finance/           # Finance tracker
│   ├── settings/          # Settings page
│   ├── help/             # Help/contact page
│   └── api/              # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── dashboard/        # Dashboard widgets
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase configuration
│   └── utils.ts          # Common utilities
└── public/               # Static assets
```

## API Routes

### Public APIs

- `GET /api/weather` - Get weather data
- `GET /api/news` - Get news articles
- `GET /api/stocks` - Get stock quotes
- `POST /api/contact` - Send contact form

### Protected APIs

- `GET /api/screentime` - Get screen time data
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Mark notifications as read

## Auth Flows

- Email/password authentication via Supabase
- Protected routes with middleware
- Automatic session management
- Profile management with avatar upload

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

MIT
