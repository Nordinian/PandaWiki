# 阶段 1: 依赖安装 (Dependency Installation)
# 使用 'deps' 别名，安装所有依赖，包括 devDependencies，因为构建过程可能需要它们
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm i -g pnpm && pnpm i --frozen-lockfile

# ----------------------------------------------------------------

# 阶段 2: 构建 (Build)
# 使用 'builder' 别名，从 'deps' 阶段获取依赖，并执行构建命令
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm i -g pnpm && pnpm build

# ----------------------------------------------------------------

# 阶段 3: 生产镜像 (Production Runner)
# 使用一个干净的 Node.js 18 alpine 镜像作为基础
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Cloud Run 会自动注入 PORT 环境变量，我们在此处设置一个默认值
ENV PORT 3000

# 创建一个专用的、非 root 的用户和组来运行应用，以增强安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 从 'builder' 阶段拷贝 'standalone' 输出
# 这是关键一步：它将优化的服务器和必要的生产依赖拷贝到当前目录 (./)
COPY --from=builder --chown=nextjs:nodejs /app/dist/standalone ./

# 从 'builder' 阶段拷贝 'public' 和 '.next/static' 目录
# standalone 服务器需要这些目录来提供图片、字体和 CSS 等静态资源
# 注意：在 'standalone' 模式下，静态文件位于 dist/static 而不是 .next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/static ./dist/static

# 切换到我们创建的非 root 用户
USER nextjs

# 暴露容器的 3000 端口
EXPOSE 3000

# 最终启动应用的命令
# 由于我们已经将 standalone 目录的内容拷贝到了 /app，入口文件就是 server.js
CMD ["node", "server.js"]