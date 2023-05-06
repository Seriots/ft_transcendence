FROM node:alpine

WORKDIR "/app"
#npm run build && npm run start:prod
ENTRYPOINT [ "/bin/sh", "-c", "sleep 10 && npm install && npx prisma migrate dev --name init && npm run build && npm run start:prod" ]
