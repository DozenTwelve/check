# Build the client bundle
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Serve the client bundle (optional target)
FROM nginx:alpine AS client
COPY --from=client-build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Build and run the API server (default target)
FROM node:20-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
EXPOSE 3001
CMD ["node", "src/startup.js"]
