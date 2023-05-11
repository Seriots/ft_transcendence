FROM node:alpine

WORKDIR "/app"

#npm run build && npm run start:prod
ENTRYPOINT [ "/bin/sh", "-c", "sleep 10 && npm install --platform=linuxmusl && npx prisma migrate dev --name init && npm run build && npm run start:dev" ]
