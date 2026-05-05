---
title: "DDPM：去噪扩散概率模型核心原理"
date: "2026-05-05"
excerpt: "深入解析 DDPM 的前向加噪、逆向去噪过程及其数学推导，探讨 Reparameterization Trick、损失函数与时间编码机制。"
tags: ["AIGC", "Diffusion Model", "Generative AI", "AI Research"]
---

# DDPM 核心原理与数学推演

去噪扩散概率模型（DDPM, Denoising Diffusion Probabilistic Models）是一个基于马尔可夫链的参数化生成模型。其核心思想分为两步：首先通过前向过程向图像中逐步注入高斯噪声，直至变为纯噪声；随后训练神经网络（通常为 U-Net）来学习逆向过程，实现从纯随机分布中“雕刻”出图像。

## 1. 前向过程 (Forward Process)

前向过程是一个没有可学习参数的纯数学马尔可夫链，在 $T$ 个时间步内逐步向真实图像 $x_0$ 添加高斯噪声。

- **单步递推公式**：
  $$q(x_t | x_{t-1}) = \mathcal{N}(x_t; \sqrt{1 - \beta_t}x_{t-1}, \beta_t\mathbf{I})$$
  其中 $\beta_t$ 是预设的噪声方差调度（通常在 0.0001 到 0.02 之间）。

- **重参数化技巧 (Reparameterization Trick)**：
  利用高斯分布的线性可加性，可以直接得到从 $x_0$ 到 $x_t$ 的闭式解：
  $$x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon, \quad \epsilon \sim \mathcal{N}(0, \mathbf{I})$$
  其中 $\alpha_t = 1 - \beta_t$，$\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$。

## 2. 模型训练 (Training)

训练的目标是让神经网络 $\epsilon_\theta$ 预测在第 $t$ 步时加入的噪声 $\epsilon$。

- **损失函数 (Simplified Loss)**：
  $$L_{\text{simple}}(\theta) = \mathbb{E}_{t, x_0, \epsilon} \left[ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right]$$
- **时间编码 (Time Embedding)**：
  整个 $T$ 步去噪过程共享同一个 U-Net 权重。为区分不同的破坏程度，时间步 $t$ 会转化为类似 Transformer 的正弦位置编码注入网络每一层。

## 3. 逆向过程 (Reverse Process)

在推理阶段，从纯高斯噪声 $x_T \sim \mathcal{N}(0, \mathbf{I})$ 开始，执行 $T$ 次循环逆推：
$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{1 - \alpha_t}{\sqrt{1 - \bar{\alpha}_t}} \epsilon_\theta(x_t, t) \right) + \sigma_t \mathbf{z}$$
- **代数剔除**：利用 AI 预测的噪声还原画面。
- **朗之万动力学注入**：在 $t > 1$ 时重新注入微小噪声 $\mathbf{z}$，防止生成图像过度平滑，确保纹理细节。

---
## 工业级演进
由于像素级计算极其缓慢，**Stable Diffusion** 等架构引入了 **VAE 变分自编码器**，将扩散过程压缩至 **潜空间 (Latent Space)** 运行，实现了算力与速度的断崖式飞跃。

---
## 相关链接
- [RenderFormer：基于 Transformer 的神经渲染架构](/wiki/renderformer)
- [AI Research](/wiki?tag=AI+Research)
