FROM node:24.15.0-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY dist/ ./dist/
USER node
CMD ["node", "dist/index.js"]
