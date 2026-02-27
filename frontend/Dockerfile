# 多阶段构建：构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 接收构建参数（NEXT_PUBLIC_* 环境变量需要在构建时存在）
ARG NEXT_PUBLIC_API
ARG NEXT_PUBLIC_LINE_LIFF_ID

# 将构建参数转换为环境变量（Next.js 构建时需要）
ENV NEXT_PUBLIC_API=${NEXT_PUBLIC_API}
ENV NEXT_PUBLIC_LINE_LIFF_ID=${NEXT_PUBLIC_LINE_LIFF_ID}

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括 devDependencies，因为需要构建工具）
RUN npm ci

# 复制前端源码
COPY . .

# 构建应用（standalone 模式会生成优化的输出）
# NEXT_PUBLIC_* 环境变量会在此阶段被嵌入到客户端代码中
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# 从构建阶段复制 standalone 输出
# Next.js standalone 模式会生成 .next/standalone 目录，包含运行所需的所有文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 暴露端口 8080（GCP 要求）
EXPOSE 8080

# 启动应用
CMD ["node", "server.js"]
