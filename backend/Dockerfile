# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖（包括 devDependencies，因为需要构建工具）
# 使用 --ignore-scripts 跳过 canvas 的原生编译
RUN npm ci --ignore-scripts

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 只安装生产依赖（使用 --ignore-scripts 跳过 canvas 的原生编译）
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# 从构建阶段复制构建产物和 Prisma Client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 创建数据目录用于 SQLite 数据库
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
# 默认 DATABASE_URL（可以在运行时通过环境变量覆盖）
ENV DATABASE_URL="file:/app/data/production.db"

# 暴露端口 8080（GCP 要求）
EXPOSE 8080

# 启动应用
CMD ["node", "dist/src/main.js"]

