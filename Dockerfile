FROM node:18.18.2-buster-slim

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
