FROM node:20.10-buster-slim@sha256:d0acb10d0062944abd19d56d79f4953de6bba167b04c961c6eba6054fbc4990c

COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]