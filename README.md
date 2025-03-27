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

## Modifiable Sections

The frontend is organized in a modular way, making it easy to modify different sections of the website. Here's where to find the main modifiable components:

### Pages (`src/pages/`)
- `About.tsx`: Main about page content and sections
- `Hikes.tsx`: Hikes listing page and filtering
- `HikeDetail.tsx`: Individual hike details and information
- `BookHike.tsx`: Hike booking form and process
- `Login.tsx`: Login page and authentication
- `Register.tsx`: User registration form
- `GuideRegistration.tsx`: Guide application form
- `Donate.tsx`: Donation page content
- `JoinUs.tsx`: Join us/volunteer page content

### Components (`src/components/`)
- `Navbar.tsx`: Main navigation bar and menu
- `Footer.tsx`: Footer content and links
- `Hero.tsx`: Landing page hero section
- `Mission.tsx`: Mission statement section
- `GetInvolved.tsx`: Get involved/volunteer section
- `AddHikeModal.tsx`: Form for adding new hikes
- `NotificationBell.tsx`: Notification system UI
- `ProtectedRoute.tsx`: Route protection logic

### UI Components (`src/components/ui/`)
Contains reusable UI components that can be customized:
- Buttons
- Forms
- Cards
- Modals
- Navigation elements

### Styling
- `src/index.css`: Global styles
- `src/App.css`: App-specific styles
- `tailwind.config.ts`: Tailwind CSS configuration

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
