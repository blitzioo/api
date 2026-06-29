FROM node:24.16.0-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:24.16.0-alpine

WORKDIR /app

COPY package*.json ./

# install only production deps
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV TZ=Europe/Paris

CMD ["node", "dist/index.js"]