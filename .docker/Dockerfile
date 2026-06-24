FROM node:24.16.0-alpine AS build

WORKDIR /app

COPY .npmrc .npmrc
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN rm -f .npmrc

FROM node:24.16.0-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY package*.json ./

ENV NODE_ENV production
ENV TZ Europe/Paris

CMD ["node", "dist/index.js"]