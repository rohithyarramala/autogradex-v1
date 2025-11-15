##DB

1. npx prisma migrate reset --force --skip-seed
2. npx prisma db pull
3. npx prisma migrate dev --name update_schema
4. git merge upstream/main

#Build

1. npm run build
2. npm run start

#Worker Star

1. tsc ai-evaluation-worker.ts # now removed
2. node ai-evaluation-worker.js

pm2 start ai-evaluation-worker.js --name "ai-evaluation-worker" --watch

pm2 logs ai-evaluation-worker


### iteration #  3 Completion 

>  fixes

1. index page updated with minimal details and style corrections
2. 

> Modules

1. payment integrations
