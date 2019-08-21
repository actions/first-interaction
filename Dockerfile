FROM node:12-alpine

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
