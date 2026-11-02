# AttendTrack Pro

React + Vite + Tailwind + Firebase attendance tracker.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Firebase values.
3. In Firebase Console: enable **Authentication > Anonymous** and create a **Firestore** database. Paste `firestore.rules` into the Rules tab.
4. `npm run dev` to test locally.

## Deploy
- `npm run build` creates the `dist/` folder.
- **Vercel / Netlify:** import the project, build command `npm run build`, output `dist`, and add the `.env` values as environment variables.
- **Firebase Hosting:** `firebase init hosting` (public dir `dist`, SPA yes), then `firebase deploy`.

## Security note
VITE_ADMIN_* values are bundled into the client JavaScript, so they are not truly secret. For real protection, use Firebase Auth with a custom admin claim and matching Firestore rules.
