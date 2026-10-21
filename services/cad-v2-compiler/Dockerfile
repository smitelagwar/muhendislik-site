FROM node:24.15.0-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ ./dist/
USER node
ENV CAD_V2_DURABLE_WORKER=true \
    CAD_V2_STORAGE_DIR=/tmp/cad-v2-scenes
CMD ["node", "dist/index.js"]
