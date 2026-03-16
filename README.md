# Habit Tracker with AI Coach

A modern, full-stack habit tracking application featuring a sleek month-based calendar view, progress analytics, and a personalized AI Habit Coach.

## Features

- **Month-Based Calendar**: Easily track and view habit completion across months with simple navigation.
- **Customizable Habits**: Add habits with different emojis, colors, and target goals (e.g., "Drink 2L Water").
- **AI Habit Coach**: Chat with an AI agent powered by Google Gemini to get personalized advice on building and maintaining habits.
- **Progress Analytics**: (Coming soon) View your consistency and trends over time.
- **Secure Authentication**: Private user accounts powered by Firebase Authentication.
- **Real-time Sync**: Your habits and journals are synced across devices using Firebase Firestore.

## Technology Stack

- **Frontend**: React, Vite, Phosphor Icons
- **Backend/Auth**: Firebase (Auth, Firestore, Cloud Functions, Hosting)
- **AI**: Google Gemini API via Firebase Cloud Functions
- **Styling**: Vanilla CSS with modern CSS variables for themes

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd "Habit tracker"
   ```

2. Install dependencies for the app:
   ```bash
   cd app
   npm install
   ```

3. (Optional) Install dependencies for cloud functions:
   ```bash
   cd functions
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment

The project is configured for deployment with Firebase Hosting and Cloud Functions.
```bash
npm run build
npx firebase deploy
```

## License

MIT
