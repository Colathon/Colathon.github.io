---
title: "GimmBO: Interactive Generative Image Model Merging via Bayesian Optimization"
date: "2026-05-24"
tags: ["Machine Learning", "Bayesian Optimization", "Diffusion Models", "Human-in-the-loop"]
excerpt: "A framework for high-dimensional adapter merging using preferential Bayesian optimization and sparse axis-aligned subspaces."
---

GimmBO is a framework for human-in-the-loop preference-based [Bayesian Optimization](/wiki/bayesian-optimization) (PBO) designed for merging high-dimensional image adapters (e.g., LoRAs) in diffusion models. It addresses the challenge of navigating the continuous design space of adapter coefficients $\bm{\alpha}$, which typically scales poorly with manual tuning.

## 4.1 偏好代理模型 (Preferential Surrogate)

**核心目标：** 将用户提供的离散、成对的偏好比较转化为关于模型合并系数的连续 [高斯过程](/wiki/gaussian-process) 目标函数。

### 1. 变量定义
*   **输入空间：** $\bm{\alpha} \in \mathcal{A} \subset [0, 1]^n$，其中 $n$ 为候选适配器的数量（通常 $n=20 \sim 30$）。
*   **潜函数：** $\hat{f}(\bm{\alpha})$ 表示系数为 $\bm{\alpha}$ 时的客观潜在效用 (Latent Utility)。

### 2. 观测模型 (Probit Likelihood)
收集用户的偏好比较数据集 $\mathcal{D} = \{(\bm{\alpha}_i, \bm{\alpha}_j) \mid \bm{\alpha}_i \succ \bm{\alpha}_j\}$。假设用户评估时存在高斯认知噪声，产生标准正态累积分布函数 (CDF) 形式的似然：
$$P(\bm{\alpha}_i \succ \bm{\alpha}_j \mid \hat{f}) = \Phi \left( \frac{\hat{f}(\bm{\alpha}_i) - \hat{f}(\bm{\alpha}_j)}{\sqrt{2}\sigma} \right)$$
整个数据集的联合似然为：$p(\mathcal{D} \mid \hat{\bm{f}}) = \prod_{k \in \mathcal{D}} \Phi(z_k)$，其中 $z_k = \frac{\hat{f}(\bm{\alpha}_{i_k}) - \hat{f}(\bm{\alpha}_{j_k})}{\sqrt{2}\sigma}$。

### 3. 先验设定 (GP + SAAS)
*   **GP Prior**: $\hat{f}(\bm{\alpha}) \sim \mathcal{GP}(\mu(\bm{\alpha}), k(\bm{\alpha}, \bm{\alpha}'))$。
*   **SAAS Prior**: 为了应对高维空间的稀疏性，在核函数 $k$ 的长度尺度权重 $\bm{w}$ 上施加 **稀疏轴对齐子空间 (Sparse Axis-Aligned Subspace)** 先验 $p_{\text{SAAS}}(\bm{w})$，强迫无关维度的权重趋近于 $0$。

### 4. 后验推断 (Laplace Approximation)
由于似然是非高斯的，通过拉普拉斯近似寻找高斯替代分布。定义联合对数后验目标函数：
$$\mathcal{L}(\hat{\bm{f}}, \bm{w}) = \sum_{k \in \mathcal{D}} \log \Phi(z_k) - \frac{1}{2}\hat{\bm{f}}^T K_{\bm{w}}^{-1} \hat{\bm{f}} - \frac{1}{2}\log|K_{\bm{w}}| + \sum_{d=1}^n \log p_{\text{SAAS}}(w_d)$$
*   **MAP Estimation**: 求解 $\hat{\bm{f}}_{\text{MAP}} = \arg\max_{\hat{\bm{f}}} \mathcal{L}(\hat{\bm{f}}, \bm{w})$。
*   **Hessian Calculation**: 在 $\hat{\bm{f}}_{\text{MAP}}$ 处计算海森矩阵 $H = \nabla^2_{\hat{\bm{f}}} \mathcal{L}$，并取 $\Sigma = -H^{-1}$ 作为近似协方差。

---

## 4.2 搜索空间降维 (Search Space)

**核心目标：** 引入物理硬约束截断搜索空间，避免在无效区域浪费算力。

*   **B-有界单纯形 (B-capped simplex):**
    $$\mathcal{A} = \Delta_B = \left\{ \bm{\alpha} \in [0, 1]^n \;\middle|\; \sum_{i=1}^n \alpha_i \le B \right\}$$
*   **降维效果：** 可行域占原超立方体 $[0, 1]^n$ 的体积比例随维度 $n$ 呈阶乘级衰减：
    $$\text{Vol}(n; \Delta_B) = \frac{1}{n!} \sum_{k=0}^{\lfloor B \rfloor} (-1)^k \binom{n}{k} (B-k)^n$$
    在 $n=30, B=2$ 时，体积比例不到 $10^{-21}$，极大地浓缩了搜索范围。

---

## 4.3 初始化与采样算法 (Initialization)

**核心目标：** 在 $\Delta_B$ 空间内进行高效的无拒绝均匀采样。

### 折棍子算法 (Stick-breaking process)
给定随机数序列 $\mathbf{x} \in [0, 1]^n$ ($x_i \sim \text{Beta}(1, 1)$)。定义初始预算 $R_0 = B$，通过递推映射：
$$\alpha_i = \min(x_i R_{i-1}, 1), \quad R_i = R_{i-1} - \alpha_i$$

### 工程修正
1.  **坐标顺序去偏：** 映射前随机排列维度索引。
2.  **强制稀疏化 (Sparsify)：** 引入阈值 $\tau$，若 $\alpha_i < \tau$ 则令 $\alpha_i = 0$。

---

## 4.4 采集函数与批次寻优 (Acquisition)

**核心目标：** 寻找下一批 $q$ 个最具价值的评估点。

1.  **UCB Utility**: $\phi(\bm{\alpha} \mid \hat{f}) = \mu(\bm{\alpha}) + \lambda \sqrt{k(\bm{\alpha}, \bm{\alpha})}$。
2.  **Batch Acquisition**: 为了保证多样性，优化批次最大值的联合数学期望：
    $$\max_{\{\bm{\alpha}_1, \dots, \bm{\alpha}_q\}} \mathbb{E}_{\hat{f} \sim \mathcal{GP}} \left[ \max_{j=1, \dots, q} \phi(\bm{\alpha}_j \mid \hat{f}) \right]$$
3.  **Reparameterization Trick**: 将折棍子递推式视为可微映射 $\bm{\alpha} = h(\mathbf{x})$，在无约束空间 $\mathbf{x} \in [0, 1]^{n \times q}$ 中使用 L-BFGS-B 寻优。
4.  **Anchor Mechanism**: 始终将当前历史排名第一的样本作为锚点混入批次，确保偏好图的连通性。

---

## 4.5 两阶段优化策略 (Two-stage Optimization)

**核心目标：** 平衡“稀疏特征选择”与“局部极值精调”。

*   **阶段一 (Exploration, $T_1$ 步):** 在完整的 $n$ 维空间中搜索，执行 $\Delta_B$ 约束和 SAAS 先验，识别活跃维度 $z < n$。
*   **阶段二 (Polishing, $T_2$ 步):** 固定未激活维度为 $0$，解除 $B$ 约束，在放宽至 $[0, 1]^z$ 的低维空间内进行精细微调。

---

## 相关链接
- [贝叶斯优化 (Bayesian Optimization)](/wiki/bayesian-optimization)
- [高斯过程 (Gaussian Processes)](/wiki/gaussian-process)
- [扩散模型 (DDPM)](/wiki/ddpm)
