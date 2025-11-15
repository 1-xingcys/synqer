# Frontend Docker 构建说明

## 方式 1: 使用 cloudbuild.yaml（推荐）

在 `frontend` 目录下运行：

```bash
cd frontend

# 使用默认配置（从 cloudbuild.yaml 读取）
gcloud builds submit --config=cloudbuild.yaml

# 或者覆盖环境变量
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_API=https://your-backend-url.com,_NEXT_PUBLIC_API_BASE=https://your-backend-url.com
```

## 方式 2: 直接使用 gcloud builds submit

```bash
cd frontend

gcloud builds submit \
  --tag=asia-east1-docker.pkg.dev/no-invite-478215/no-invite/frontend \
  --substitutions=_NEXT_PUBLIC_API=https://backend-130274261356.asia-east1.run.app,_NEXT_PUBLIC_API_BASE=https://backend-130274261356.asia-east1.run.app
```

但是这种方式需要修改 Dockerfile 来使用 substitutions。更好的方式是使用方式 1。

## 方式 3: 使用 Dockerfile 直接构建（本地测试）

如果你想在本地测试构建：

```bash
cd frontend

docker build \
  --build-arg NEXT_PUBLIC_API=https://backend-130274261356.asia-east1.run.app \
  --build-arg NEXT_PUBLIC_API_BASE=https://backend-130274261356.asia-east1.run.app \
  -t frontend-app:latest \
  .
```

## 注意事项

1. **环境变量必须在构建时提供**：`NEXT_PUBLIC_*` 环境变量会在 `npm run build` 时被嵌入到客户端代码中，所以必须在构建阶段就存在。

2. **更新 cloudbuild.yaml**：如果后端 URL 有变化，记得更新 `cloudbuild.yaml` 中的 `_NEXT_PUBLIC_API` 和 `_NEXT_PUBLIC_API_BASE` 值。

3. **使用 Secret Manager（可选）**：对于敏感信息，可以考虑使用 GCP Secret Manager 来管理环境变量。

