# Stage 1: Build TypeScript sang JavaScript
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Chạy bản production nhẹ
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Tạo sẵn thư mục lưu file thuyết minh .mp3 (được gắn volume ở docker-compose.yml)
RUN mkdir -p /app/uploads/audio

EXPOSE 5000

CMD ["npm", "start"]

