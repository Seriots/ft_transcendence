
FROM node:alpine

WORKDIR "/app"
#npm run build && npm install serve -g && serve -s build -l 3001
ENTRYPOINT [ "/bin/sh", "-c", "npm install && npm run build && npm install serve -g && serve -s build -l 3001"  ]
