##DB

1. npx prisma migrate reset --force --skip-seed
2. npx prisma db pull
3. npx prisma migrate dev --name update_schema

#Build

1. npm run build
2. npm run start

#Worker Star

1. tsc ai-evaluation-worker.ts # now removed
2. node ai-evaluation-worker.js
