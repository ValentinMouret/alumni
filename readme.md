# Alumni

The frontend is either plain HTML files or some light reagent app.
The backend is done using Cloudflare workers and the database is Cloudflare D1.
Essentially, sqlite on the edge.

## Frontend
`/public`

The frontend is plain old HTML files, and one react app.
It is automatically deployed with master.

## Backend
`/alumni`

The backend is all Cloudflare. The database is D1, a sqlite on the edge, and the «server» is made with Cloudflare Workers.

To interact with the database:
```
npx wrangler d1 alumni [--local] --command="select * from tickets;"

npx wrangler d1 alumni [--local] --file=./schema.sql
```

Locally, it’s just a SQLite file you can intract with (`.wrangler/...`).

To work with the workers:
```
# Runs the workers locally
npx wrangler dev

# Deploys the workers on prod
npx wrangler deploy
```
