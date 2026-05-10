---
title: "DDPM：去噪扩散概率模型核心原理"
date: "2026-05-05"
excerpt: "深入解析 DDPM 的前向加噪、逆向去噪过程及其数学推导，探讨 Reparameterization Trick、损失函数与时间编码机制。"
tags: ["AIGC", "Diffusion Model", "Neural Networks", "Computer Graphics"]
---

# DDPM 核心原理与数学推演

**AIGC 底层算法逻辑留档**
**2026 年 5 月 5 日**

## Executive Summary | 核心摘要
去噪扩散概率模型（DDPM, Denoising Diffusion Probabilistic Models）的本质是一个基于马尔可夫链的参数化生成模型。其核心思想分为两步：首先通过前向过程向图像中逐步注入高斯噪声，直至变为纯噪声；随后训练一个搭载了时间编码的神经网络（通常为 U-Net）来学习逆向过程，通过逐步预测并剔除噪声，实现从纯粹的随机分布中“雕刻”出高清图像。

---

## 1 前向过程 (Forward Process)：制造“训练数据”

前向过程是一个没有可学习参数的纯数学马尔可夫链。我们在 $T$ 个时间步内，逐步向真实图像 $x_0$ 中添加方差调度的标准高斯噪声。

### 1.1 1. 单步递推公式
在任意时间步 $t$，图像 $x_t$ 由上一步 $x_{t-1}$ 添加微小噪声得到：
$$q(x_t | x_{t-1}) = \mathcal{N}(x_t; \sqrt{1 - \beta_t}x_{t-1}, \beta_t\mathbf{I})$$
其中，$\beta_t$ 是预设的噪声方差（通常随 $t$ 逐渐增大，范围在 0.0001 ~ 0.02 之间）。

### 1.2 2. 一步到位公式 (Reparameterization Trick)
由于高斯分布具有极其优美的线性可加性，我们可以直接跳过繁琐的 $t$ 次循环，利用代数推导得出从原图 $x_0$ 直接生成任意 $t$ 时刻脏图 $x_t$ 的闭式解：
定义 $\alpha_t = 1 - \beta_t$，并令 $\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$，则有：
$$q(x_t | x_0) = \mathcal{N}(x_t; \sqrt{\bar{\alpha}_t}x_0, (1 - \bar{\alpha}_t)\mathbf{I})$$

写成最直观的张量加法形式即为：
$$x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon$$
（其中 $\epsilon \sim \mathcal{N}(0, \mathbf{I})$ 为计算机掷骰子产生的标准高斯噪声。此公式彻底打通了工程训练的算力瓶颈。）

---

## 2 模型训练 (Training)：闭卷考试与误差反向传播

训练的目标不是让神经网络预测原图 $x_0$，而是让神经网络 $\epsilon_\theta$ 预测出“在第 $t$ 步时，到底往里加了什么噪声”。

### 2.1 1. 损失函数 (Loss Function)
得益于 DDPM 作者推导出的极简损失函数（Simplified Loss），模型只需要计算“真实加入的噪声 $\epsilon$”与“AI 预测的噪声 $\epsilon_\theta$”之间的均方误差（MSE）：
$$L_{\text{simple}}(\theta) = \mathbb{E}_{t, x_0, \epsilon} \left[ \| \epsilon - \epsilon_\theta(\underbrace{\sqrt{\bar{\alpha}_t}x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon}_{x_t}, t) \|^2 \right]$$

### 2.2 2. 核心机制：时间编码 (Time Embedding) 与权重共享
整个 1000 步的去噪过程共用同一个 U-Net 黑盒（权重共享）。为区分不同的破坏程度，时间步 $t$ 会转化为正弦位置编码（类似 Transformer），作为条件注入到神经网络的每一层中，引导模型调整当下的“嗅探灵敏度”。

---

## 3 逆向过程 (Reverse Process)：从虚无中雕刻

当模型训练收敛且参数冻结（Frozen）后，进入纯推理阶段。我们从纯高斯噪声 $x_T \sim \mathcal{N}(0, \mathbf{I})$ 开始，执行 $T$ 次循环逆推。
基于贝叶斯定理与网络预测的噪声 $\epsilon_\theta(x_t, t)$，单步去噪的数学期望推导如下：
$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{1 - \alpha_t}{\sqrt{1 - \bar{\alpha}_t}}\epsilon_\theta(x_t, t) \right) + \sigma_t \mathbf{z}$$

*   **代数剔除**：等式前半部分利用 AI 预测的噪声 $\epsilon_\theta$ 将画面还原。
*   **朗之万动力学注入 (+$\sigma_t \mathbf{z}$)**：其中 $\mathbf{z} \sim \mathcal{N}(0, \mathbf{I})$。在 $t > 1$ 时，故意向画面中重新注入微小的新噪声。这是防止生成图像过度平滑（磨皮感）、逼迫网络在下一步继续生成丰富高频纹理细节的核心魔法。

---

**工业级演进备注**：上述计算在像素级矩阵（如 $1024 \times 1024$）上极其缓慢。Stable Diffusion 等架构引入了 **VAE 变分自编码器**，将整个加噪/去噪过程降维压缩至**潜空间 (Latent Space)**（如 $64 \times 64$）中进行，实现了算力与速度的断崖式飞跃。

---
## 相关链接
- [神经网络的数学架构：仿射变换与流形逼近](/wiki/neural-networks-foundation)
- [RenderFormer：基于 Transformer 的神经渲染架构](/wiki/renderformer)
- [AI Research](/wiki?tag=AI+Research)
