# ---------- build the React client ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci
COPY client ./client
COPY server ./server
RUN npm run build --workspace client

# ---------- runtime ----------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --workspace server
COPY server/src ./server/src
COPY --from=build /app/client/dist ./server/public
EXPOSE 3000
CMD ["node", "server/src/index.js"]