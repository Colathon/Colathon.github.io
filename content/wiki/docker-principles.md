---
title: "Docker 原理与使用"
date: "2026-06-16"
tags: ["Docker", "Containerization", "Tools", "Workflow", "DevOps"]
---

# Docker 原理与使用

> 个人 wiki · 只含原理 + 日常使用，不含一次性安装步骤

---

## 一、是什么

把应用和它的全套环境（代码、Python 版本、依赖库、系统配置）打包成**容器**，在任何机器上跑出一致结果，根治"在我电脑上能跑"的问题。

不是虚拟机：容器共用宿主机内核，不模拟整套硬件，所以比虚拟机轻得多（几百 MB ~ 几 GB，秒级启动）。

---

## 二、三个核心概念

| 概念 | 类比 | 说明 |
|------|------|------|
| **Dockerfile** | 菜谱 | 描述如何一步步搭出环境的指令 |
| **Image（镜像）** | 成品蛋糕 | 按菜谱构建出的只读环境快照 |
| **Container（容器）** | 正在吃的那块 | 镜像运行起来就是容器，用完即弃 |

```
Dockerfile --(build)--> Image --(run)--> Container
```

- 一个镜像 = 一个**具体的、装好东西的**环境（`python:3.11` 里就只有 3.11），不是"工具箱让你挑版本"。换版本就换起点镜像。
- 容器是临时的，删掉不影响镜像。

---

## 三、分层机制（核心原理）

### 镜像是一层层叠起来的

从下往上，一个深度学习镜像大致是：

```
你的代码          ← 几 MB
你装的小库         ← 几十 MB（numpy/matplotlib…）
torch+torchvision ← 几 GB
CUDA+cuDNN        ← 几 GB
Python / Ubuntu   ← 底层系统
```

### 相同的层只存一份

两个镜像若用了相同底层，硬盘上**只存一份**。所以项目 A、B 都基于同一 PyTorch 底层时：

- 底层十几 GB 的 torch+[CUDA](/wiki/cuda)：**共用，只存一次**
- 各自顶上的小库和代码：**各存各的，但很小**

> ⚠️ `docker images` 的体积会**重复计算**共享层，看着吓人。看真实占用用 `docker system df`。

### 一个库共不共享，看它在哪层

- **torch / [CUDA](/wiki/cuda)**：来自 `FROM` 底层镜像，自动共享。
- **numpy / matplotlib**：你自己 `pip install` 的，在私有层，每个项目各有各的。

### 分层缓存决定构建速度

某层变了，从那层往下全部重跑，往上走缓存。所以 Dockerfile 顺序很重要：

```dockerfile
COPY requirements.txt .
RUN pip install -r requirements.txt   # 依赖没变就永远走缓存
COPY . .                              # 代码改了只重跑这层
```

（反过来把 `COPY . .` 放前面，代码一改就重装所有包。）

---

## 四、核心工作流

**心智模型：代码住在你硬盘上，容器只是临时运行环境。** 不是"钻进容器里写代码"。

### 三步

```powershell
# 1. 构建（在含 Dockerfile 的项目目录下）
docker build -t myproject .

# 2. 挂载代码运行
docker run --rm --gpus all -v ${PWD}:/workspace myproject python /workspace/train.py
```

| 参数 | 作用 |
|------|------|
| `--rm` | 跑完自动删容器，不留垃圾 |
| `--gpus all` | 透传显卡 |
| `-v ${PWD}:/workspace` | 把当前文件夹挂载到容器内 `/workspace`（Linux 下用 `$(pwd)`） |
| `-t myproject` | 给镜像起名；末尾 `.` 表示用当前目录 Dockerfile |

### 挂载 = 两个入口看同一份文件

`/workspace` **就是**你本机那个文件夹。所以：

- 改代码保存后容器立刻是新的，**不用重新 build**。
- **结果文件要存到 `/workspace`**，才会落到本机文件夹；存到容器内别处（如 `/tmp`）随容器删除而消失。

```python
torch.save(model, "/workspace/model.pt")   # ✅ 落到本机
torch.save(model, "/tmp/model.pt")          # ❌ 容器删了就没
```

### 两种姿势

```powershell
# 跑完就退（训练 / 脚本）
docker run --rm --gpus all -v ${PWD}:/workspace myproject python /workspace/train.py

# 进去交互调试（像一台 Linux 机器）
docker run -it --rm --gpus all -v ${PWD}:/workspace myproject bash
```

---

## 五、常用命令

```powershell
# 镜像
docker images                 # 列出镜像
docker build -t 名字 .         # 构建
docker pull 镜像名             # 拉取
docker image rm 名字           # 删除

# 容器
docker ps                     # 运行中的容器
docker ps -a                  # 所有容器
docker stop / rm 容器名        # 停止 / 删除
docker logs 容器名             # 查看输出

# 空间
docker system df              # 真实占用（看 RECLAIMABLE 可回收列）
docker system prune           # 清理垃圾层（安全）
docker image rm 不用的镜像
```

`docker run` 常用选项：

```
--rm              跑完删容器
-it               交互 + 终端
--gpus all        透传 GPU
-v 本机:容器        挂载目录
-p 本机端口:容器端口  端口映射（jupyter / web 服务）
--name 名字        命名容器
-e 变量=值          环境变量
```

---

## 六、多项目 / 多版本

每个项目一个 Dockerfile，各自指定起点，互不干扰：

```dockerfile
FROM pytorch/pytorch:2.11.0-cuda12.8-cudnn9-runtime   # 项目A
FROM python:3.10                                       # 项目B
```

```powershell
docker build -t projA .     # 各自 build 成不同名字
docker build -t projB .
```

**版本冲突不存在**：传统"一个环境装不下 numpy 1.26 和 2.0"的问题自动消失。各项目在各自的盒子里，只需在各自 `requirements.txt` 写各自版本，永远不会打架。多个项目若基于同一 base，底层只存一份，不占 N 倍空间。

---

## 七、部署到远程服务器

本地搭好搬到服务器，结果一字节不差。

**先确认服务器能否用 Docker：**

```bash
sudo whoami      # 出 root = 有权限可用 Docker；报错 = 多半要用 Apptainer
```

**搬运（经 Docker Hub）：**

```bash
# 本机推
docker tag myproject:tag 用户名/myproject:tag
docker push 用户名/myproject:tag
# 服务器拉了跑
docker run --gpus all -v /home/你/项目:/workspace 用户名/myproject:tag python /workspace/train.py
```

**没 Docker 权限时用 Apptainer**（能直接跑 Docker 镜像，`--nv` 开 GPU，`-B` 绑定目录）：

```bash
apptainer exec --nv -B /home/你/项目:/workspace docker://用户名/myproject:tag python /workspace/train.py
```

**多种 GPU 通吃**：一个 `cuda12.8` 镜像同时支持 A100（sm_80，向下兼容）和 Blackwell / RTX 50 系（sm_120，原生支持），不用为每种卡配一套。

---

## 八、GPU 镜像模板（torch + A100/Blackwell）

```dockerfile
# devel 带 nvcc，可编译 CUDA 扩展；只跑训练可换 runtime（更小）
FROM pytorch/pytorch:2.11.0-cuda12.8-cudnn9-devel

# 8.0=A100，12.0=Blackwell；编一次两种卡都能用
ENV TORCH_CUDA_ARCH_LIST="8.0;12.0"
ENV FORCE_CUDA=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir [uv](/wiki/uv-python)
WORKDIR /workspace

# requirements.txt 里【不要】写 torch（镜像已自带）
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

CMD ["python", "train.py"]
```

注意点：torch 需 ≥2.7.0 的 cu128 构建才支持 sm_120（Blackwell）；用 devel 镜像，自带 [CUDA](/wiki/cuda) Toolkit 就是 12.8、与 torch 主版本一致，避免编译扩展时的版本不匹配报错。

---

## 九、常见坑

| 现象 | 解决 |
|------|------|
| `docker images` 体积吓人 | 共享层被重复算，用 `docker system df` 看真实占用 |
| 结果文件消失 | 没存到 `/workspace`（挂载目录） |
| 改了代码容器跑旧的 | 没挂载，开发期要用 `-v` |
| 每次 build 都重装包 | `COPY . .` 放到了 `pip install` 前面，破坏缓存 |
| `could not select device driver [[gpu]]` | GPU 透传问题，检查 `--gpus all` / Container Toolkit |
| torch 报 sm_120 not compatible | torch 太老，需 ≥2.7.0 cu128 |
| 装包和自带 torch 冲突 | requirements.txt 别写 torch / torchvision |
| 服务器装不了 Docker | 没 root，个人建议改用 `apptainer exec --nv docker://镜像名` |

---

**一句话**：代码住本机硬盘，环境住 Docker，`-v` 挂载把两边连起来；本地 build 通过 → 推服务器 → 环境零差异。

---

## 相关链接
- [[uv]：极速 Python 包与项目管理器](/wiki/uv-python)
- [CUDA 并行计算笔记](/wiki/cuda)
- [OpenMP 并行计算笔记](/wiki/openmp)
