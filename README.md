# Daymark — Simple Task Manager

A clean task manager built with **Next.js, React and TypeScript**, ready to push to GitHub and deploy on Vercel.

## Features

- Create, edit and delete tasks
- Set start dates, due dates and priority
- Track progress from 0–100%
- Update task status: Not started, In progress, Completed
- Dashboard with total, active, completed and overdue counts
- Search and filter tasks
- Per-task activity/update history
- Due-today browser notifications (when the app is open and notification permission is enabled)
- Responsive layout for desktop and mobile
- Saves tasks in the browser using `localStorage`

## Run locally

1. Install Node.js 20 or later.
2. Unzip this folder and open a terminal in the project directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Deploy with GitHub + Vercel

1. Create a new repository on GitHub.
2. Upload/push the contents of this folder to the repository root.
3. Sign in to Vercel and choose **Add New → Project**.
4. Import your GitHub repository.
5. Keep the framework preset as **Next.js** and click **Deploy**. No environment variables are required.

Every push to the connected GitHub branch will trigger a new Vercel deployment.

## Important: where your data is stored

This starter version stores tasks in the browser's `localStorage`. That means:
- Tasks remain saved in the same browser on the same device.
- Tasks do **not** automatically sync between devices or browsers.
- Clearing browser data can remove saved tasks.
- There is no user login or shared database in this starter.

For a multi-device or production setup, connect a database such as Supabase (Postgres), add authentication, and move task storage to server-side API/database operations. Browser notifications only work while the app is open; reliable background reminders need a scheduled backend job and a push-notification service.

## Project structure

```text
task-manager-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .gitignore
├── next.config.ts
├── next-env.d.ts
├── package.json
└── tsconfig.json
```
