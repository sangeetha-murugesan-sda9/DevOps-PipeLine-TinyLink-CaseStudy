# TinyLink

TinyLink is a small URL shortener. It lets you create shorter links that redirect to the original URL. The API and React app run in separate development processes, while the database runs in Docker. All links are stored in PostgreSQL.

The project report is in [report.md](report.md).

## Setup

Before getting started, make sure Docker is running. Open a terminal in the project folder and start the database:

```bash
docker run -d --name tinylink-db \
  -e POSTGRES_USER=tinylink \
  -e POSTGRES_PASSWORD=tinylink \
  -e POSTGRES_DB=tinylink \
  -p 5432:5432 postgres:16
```

To check that the database is ready, run:

```bash
docker exec tinylink-db pg_isready -U tinylink
```

You should see `accepting connections`. If the database isn't ready yet, wait a second and run the command again.

Next, set up the server and install the dependencies:

```bash
cp server/.env.example server/.env
npm ci
npm run dev --workspace server
```

Keep this terminal open while the server is running. You should see a message saying that the TinyLink server is listening on port `3000`.

Open a second terminal in the project folder and start the React app:

```bash
npm run dev --workspace client
```

Once both processes are running, open [http://localhost:5173/](http://localhost:5173/) in your browser to use TinyLink.

## Tests

Make sure the database is running before running the tests. From the project folder, run:

```bash
DATABASE_URL=postgresql://tinylink:tinylink@localhost:5432/tinylink PGSSL=false npm test
```

This runs the test suite using the local PostgreSQL database.

## Deployment

When a change is merged into `main`, the GitHub Actions workflow in `.github/workflows/cd.yml` runs the deployment pipeline.

The workflow requires the following GitHub Actions secrets to be configured in the repository:

- `SONAR_TOKEN`
- `TF_API_TOKEN`
- `RENDER_API_KEY`
- `NEON_API_KEY`
- `RENDER_OWNER_ID`

Make sure these secrets are set up before merging changes that should trigger a deployment.
