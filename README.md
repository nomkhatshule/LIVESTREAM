# LIVENET

A live-streaming social app: go live from your camera, watch streams in a swipe
feed, chat and react in real time, post highlights, follow people and send
direct messages.

**Built with:** Next.js 14 · Firebase (Auth, Firestore, Storage, App Hosting) ·
Stream (live video + chat) · Algolia (user search) · Giphy.

## Run it locally

1. Copy `.env.example` to `.env.local` and fill in your keys.
   `.env.local` is git-ignored, so **never put keys in any committed file.**
2. For server features (Stream tokens, webhook, sitemap), sign in to Google Cloud
   once so the Firebase Admin SDK can reach your project:
   `gcloud auth application-default login`
3. Install and start:
   ```bash
   npm install
   npm run dev
   ```

## Deploy (Firebase App Hosting)

- Public settings live in `apphosting.yaml`.
- The Stream secret is kept in Google Secret Manager:
  `firebase apphosting:secrets:set STREAM_API_SECRET`
- Deploy the security rules:
  `firebase deploy --only firestore:rules,storage`
- In the Stream dashboard, set the webhook URL to
  `https://<your-domain>/api/stream/webhook` so streams are marked as ended
  automatically.

## How the pieces fit

| Folder | What's in it |
| --- | --- |
| `src/app/feed` | Swipe feed of live streams |
| `src/app/livenet` | Host studio (camera, mic, screen-share, chat) |
| `src/app/broadcast` | Create a stream, watch a stream, RTMP (OBS) setup |
| `src/app/profile`, `src/app/inbox-page` | Profiles, followers, direct messages |
| `src/app/api/stream/token` | Issues Stream tokens, only after verifying the Firebase login |
| `src/app/api/stream/webhook` | Marks streams as ended when Stream reports it |
| `firestore.rules`, `storage.rules` | Who may read/write what (tested in `tests/`) |
