FROM node:24.16.0-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm@11.5.2

COPY package*.json .

RUN NODE_ENV=development pnpm import && pnpm install --frozen-lockfile

COPY . .

CMD ["npm", "run", "start:dev"]