# PandaWiki GCP 香港加速节点部署指南 (最终版)

本文档记录了为 `docs.aiapi.services` 部署 Google Cloud Platform (GCP) 香港加速节点的最终成功命令。

**架构最终方案**:

- **核心服务 (美国)**: Cloud Run (`us-west1`)
- **香港加速层**:
  - Compute Engine 实例组 (`asia-east2`) 运行 Nginx 反向代理。
  - **全球**外部应用负载均衡器，其后端指向香港实例组，为 `docs.aiapi.services` 提供唯一的全球入口 IP。

---

## 1. 准备工作

### 设置项目和区域

```bash
# 设置你的项目ID
export PROJECT_ID="aiapi-services"

# 设置香港区域
export REGION_HK="asia-east2"

# 配置gcloud CLI默认项目和区域
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION_HK
```

---

## 2. 创建香港 Nginx 代理层

### 步骤 1: 创建 Compute Engine 实例模板

此模板定义了用于反向代理的虚拟机配置，并使用 `pandawiki-hk-startup.sh` 脚本进行初始化。

```bash
gcloud compute instance-templates create pandawiki-hk-template \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --metadata-from-file=startup-script=pandawiki-hk-startup.sh \
    --tags=http-server,https-server \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=10GB \
    --boot-disk-type=pd-standard
```

### 步骤 2: 创建健康检查

此健康检查用于确定实例组中的虚拟机是否正常运行。

```bash
gcloud compute health-checks create http pandawiki-hk-health-check \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --port=80 \
    --request-path=/healthz
```

### 步骤 3: 创建托管实例组 (MIG)

MIG 根据实例模板创建并管理一组同构的虚拟机实例。

```bash
gcloud compute instance-groups managed create pandawiki-hk-mig \
    --project=$PROJECT_ID \
    --base-instance-name=pandawiki-hk-gateway \
    --size=1 \
    --template=pandawiki-hk-template \
    --region=$REGION_HK \
    --health-check=pandawiki-hk-health-check \
    --initial-delay=180
```

### 步骤 4: 配置自动伸缩

为实例组配置自动伸缩，以应对流量变化。

```bash
gcloud compute instance-groups managed set-autoscaling pandawiki-hk-mig \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --max-num-replicas=5 \
    --min-num-replicas=1 \
    --target-cpu-utilization=0.6 \
    --cool-down-period=300
```

---

## 3. 部署全球负载均衡器

### 步骤 1: 清理旧的区域负载均衡器资源 (如果存在)

在创建全球负载均衡器之前，必须删除之前尝试创建的、冲突的**区域**资源。

```bash
# 删除区域 URL 映射
gcloud compute url-maps delete pandawiki-hk-url-map \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --quiet

# 删除区域后端服务
gcloud compute backend-services delete pandawiki-hk-backend-service \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --quiet

# 删除区域 IP 地址
gcloud compute addresses delete pandawiki-hk-lb-ip \
    --project=$PROJECT_ID \
    --region=$REGION_HK \
    --quiet
```

### 步骤 2: 创建全球后端服务

创建一个**全球**后端服务，并启用 Cloud CDN。

```bash
gcloud compute backend-services create pandawiki-hk-global-backend \
    --project=$PROJECT_ID \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTP \
    --port-name=http \
    --health-checks=pandawiki-hk-health-check \
    --health-checks-region=$REGION_HK \
    --enable-cdn \
    --cache-mode=USE_ORIGIN_HEADERS
```

### 步骤 3: 将香港实例组添加到全球后端服务

将香港的 MIG 作为后端附加到新创建的全球后端服务。

```bash
gcloud compute backend-services add-backend pandawiki-hk-global-backend \
    --project=$PROJECT_ID \
    --global \
    --instance-group=pandawiki-hk-mig \
    --instance-group-region=$REGION_HK
```

### 步骤 4: 创建全球 URL 映射

URL 映射将传入的请求路由到指定的后端服务。

```bash
gcloud compute url-maps create pandawiki-hk-global-url-map \
    --project=$PROJECT_ID \
    --global \
    --default-service=pandawiki-hk-global-backend
```

### 步骤 5: 创建全球 SSL 证书

为 `docs.aiapi.services` 创建一个 Google 管理的**全球** SSL 证书。

```bash
gcloud compute ssl-certificates create pandawiki-ssl-cert-final \
    --project=$PROJECT_ID \
    --domains=docs.aiapi.services \
    --global
```

### 步骤 6: 创建 HTTPS 目标代理

代理使用 SSL 证书对客户端的 HTTPS 连接进行解密。

```bash
gcloud compute target-https-proxies create pandawiki-hk-global-https-proxy \
    --project=$PROJECT_ID \
    --global \
    --url-map=pandawiki-hk-global-url-map \
    --ssl-certificates=pandawiki-ssl-cert-final
```

### 步骤 7: 预留全球静态 IP 地址

为负载均衡器分配一个静态的、全球可路由的 IP 地址。

```bash
gcloud compute addresses create pandawiki-hk-global-lb-ip \
    --project=$PROJECT_ID \
    --global \
    --network-tier=PREMIUM
```

### 步骤 8: 创建全球转发规则

转发规则将来自外部 IP 和端口的流量定向到 HTTPS 目标代理。

```bash
gcloud compute forwarding-rules create pandawiki-hk-global-forwarding-rule \
    --project=$PROJECT_ID \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --address=pandawiki-hk-global-lb-ip \
    --target-https-proxy=pandawiki-hk-global-https-proxy \
    --ports=443
```

---

## 4. 获取负载均衡器 IP 并更新 DNS

### 步骤 1: 获取新创建的全球负载均衡器的 IP 地址

```bash
gcloud compute addresses describe pandawiki-hk-global-lb-ip \
    --project=$PROJECT_ID \
    --global
```

### 步骤 2: 更新 DNS

从上述命令的输出中复制 `address` 字段的值 (例如: `34.102.229.194`)。

登录到您的 DNS 提供商 (如 Cloudflare)，并为 `docs.aiapi.services` 创建或更新 `A` 记录，将其指向此新 IP 地址。

**重要**: 在 SSL 证书状态变为 `ACTIVE` 之前，请确保 Cloudflare 代理状态为 "仅 DNS" (灰色云朵)。
