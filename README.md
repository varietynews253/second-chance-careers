# second-chance-careers
Enterprise application using Google Gemini AI to help people with criminal records find second-chance employers and build professional resumes

## Database setup

1. Copy `.env.example` to `.env` and configure `DATABASE_URL`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Apply pending Prisma migrations with `npm run db:migrate`.
4. Generate the Prisma client with `npm run db:generate`.

## Deploy a free demo on Render

1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), choose **New > Blueprint** and select this repository. Render will read `render.yaml` to create the web app, API, and PostgreSQL database.
3. Wait for both services to deploy. The API applies pending Prisma migrations at startup.
4. Optionally add `GEMINI_API_KEY` to the web service environment to enable Gemini-powered features.

The free Render plan is intended for demos: web services can spin down when idle, and free PostgreSQL databases have limited lifetimes and storage. Back up any data you need to keep.
