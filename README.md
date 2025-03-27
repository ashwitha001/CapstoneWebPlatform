# Nature Hikes Web Platform

A modern web application for managing guided hiking experiences. Built with React, TypeScript, and Firebase.

## Features

- User authentication and role-based access control
- Hike booking and management system
- Guide assignment and scheduling
- Real-time notifications
- Responsive design with modern UI
- Secure payment processing
- Waiver signing system

## Tech Stack

- React 18
- TypeScript
- Vite
- Firebase (Authentication, Firestore, Storage)
- TailwindCSS
- Shadcn/ui Components
- React Query
- React Router
- React Hook Form
- Zod for validation

## Development

1. Clone the repository:
```bash
git clone https://github.com/ashwi/CapstoneWebPlatform.git
cd CapstoneWebPlatform
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment

The application is deployed using GitHub Pages. To deploy:

```bash
npm run deploy
```

This will build the application and deploy it to GitHub Pages.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## License

MIT
