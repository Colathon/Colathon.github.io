---
title: "高斯过程 (Gaussian Processes) 基础理论与核心推导"
date: "2026-05-22"
tags: ["Mathematics", "AI Research", "Machine Learning"]
excerpt: "从有限维向量到无穷维函数的跃迁，解析高斯过程回归 (GPR) 的数学本质与不确定性度量。"
---

# 高斯过程 (Gaussian Processes) 基础理论与核心推导

## 1. 核心思想：从有限维向量到无穷维函数

高斯过程（GP）本质上是[多元正态分布 (Multivariate Normal Distribution)](/wiki/multivariate-normal)在无限维空间上的推广。它将我们探讨的对象从“随机变量”跃升为了“随机函数”。

在探讨连续时间或空间（不可数连续区间）时，我们不需要真正去处理不可数无穷维的测度论细节。根据**柯尔莫哥洛夫扩展定理（Kolmogorov Extension Theorem）**，只要我们能够保证在连续区间上**任意挑出有限个点**，这有限个点对应的随机变量都服从多元正态分布，并且满足排列对称性和边缘一致性，那么这个连续的随机过程在数学上就是合法存在的。

因此，高斯过程允许我们“随用随算”：只关注我们当前需要观测或预测的有限个点即可。这种思想与[神经网络的离散采样逼近](/wiki/neural-networks-foundation)有异曲同工之妙。

---

## 2. 高斯过程的数学定义

> **定义**：对于一个随机过程 $X(t)$，如果对于任意有限个输入点集 $\mathbf{t} = [t_1, t_2, \dots, t_n]^T$，其对应的随机变量集合 $[X(t_1), X(t_2), \dots, X(t_n)]^T$ 联合服从多元正态分布，则称 $X(t)$ 为高斯过程。

一个高斯过程可以由两个函数完全确定，记作 $X(t) \sim \mathcal{GP}(m(t), k(t, t'))$：

1. **均值函数 (Mean Function)**：
   $$m(t) = \mathbb{E}[X(t)]$$
   描述了该过程在空间中任意点 $t$ 处的先验期望。

2. **协方差函数 / 核函数 (Covariance Function / Kernel)**：
   $$k(t, t') = \text{Cov}(X(t), X(t')) = \mathbb{E}[(X(t) - m(t))(X(t') - m(t'))]$$
   描述了空间中任意两点对应的随机变量之间的相关性。

### 核心核函数：平方指数核 (Squared Exponential Kernel)
最常用的核函数（也称高斯核）公式为：
$$k(t, t') = \sigma_f^2 \exp \left( -\frac{(t - t')^2}{2l^2} \right)$$
* $(t - t')^2$：自变量空间上的欧氏距离平方。
* $l$（尺度长度）：控制相关性随距离衰减的快慢，决定了函数曲线的平滑程度。
* $\sigma_f^2$：控制函数在纵坐标上的整体波动幅度。

---

## 3. 高斯过程回归 (GPR) 的条件分布推导

假设我们有已知训练数据（观测点位置） $\mathbf{t} = [t_1, t_2, \dots, t_n]^T$ 以及对应的观测值 $\mathbf{y} = [y_1, y_2, \dots, y_n]^T$。
给定一个新的预测位置 $t_*$，我们需要预测其对应的函数值 $y_*$。

### 观测噪声模型
在实际应用中，观测值通常包含噪声。我们假设真实的潜在函数为 $f(t)$，而观测值 $y$ 为：
$$y = f(t) + \epsilon, \quad \epsilon \sim \mathcal{N}(0, \sigma_n^2)$$
其中 $\sigma_n^2$ 是观测噪声方差。由于各点噪声相互独立，观测向量 $\mathbf{y}$ 的协方差矩阵变为：
$$\text{cov}(\mathbf{y}) = \text{cov}(\mathbf{f}) + \text{cov}(\boldsymbol{\epsilon}) = \mathbf{K}(\mathbf{t}, \mathbf{t}) + \sigma_n^2 \mathbf{I}$$
其中 $\mathbf{I}$ 是单位矩阵。

### 后验分布解析解
为了推导完整性，这里**不假设均值函数为 0**。令均值函数为 $m(t)$。已知数据与未知预测点联合服从多元正态分布：
$$\begin{bmatrix} \mathbf{y} \\ y_* \end{bmatrix} \sim \mathcal{N} \left( \begin{bmatrix} \mathbf{m}(\mathbf{t}) \\ m(t_*) \end{bmatrix}, \begin{bmatrix} \mathbf{K}(\mathbf{t}, \mathbf{t}) + \sigma_n^2 \mathbf{I} & \mathbf{K}(\mathbf{t}, t_*) \\ \mathbf{K}(t_*, \mathbf{t}) & k(t_*, t_*) \end{bmatrix} \right)$$

利用多元正态分布的条件分布定理，$y_*$ 的后验分布为 $y_* \mid \mathbf{y} \sim \mathcal{N}(\mu_*, \sigma_*^2)$：

1. **预测均值 (后验均值)**：
   $$\mu_* = m(t_*) + \mathbf{K}(t_*, \mathbf{t}) \big[ \mathbf{K}(\mathbf{t}, \mathbf{t}) + \sigma_n^2 \mathbf{I} \big]^{-1} \big( \mathbf{y} - \mathbf{m}(\mathbf{t}) \big)$$
2. **预测方差 (后验方差)**：
   $$\sigma_*^2 = k(t_*, t_*) - \mathbf{K}(t_*, \mathbf{t}) \big[ \mathbf{K}(\mathbf{t}, \mathbf{t}) + \sigma_n^2 \mathbf{I} \big]^{-1} \mathbf{K}(\mathbf{t}, t_*)$$

> **注**：若令 $m(\cdot) = 0$ 且 $\sigma_n^2 = 0$，公式将退化为理想无噪声情况下的 GPR 解析解。

---

## 4. 核心释疑 (Q&A)

### Q1：为什么通常可以假设先验均值函数为 0？已知的观测点怎么能是 0？
**解答**：均值函数 $m(t) = \mathbb{E}[X(t)]$ 是“先验期望”，而不是观测值本身。假设 $m(t) = 0$ 并不代表观测点 $\mathbf{y}$ 的取值为 0。这与[DDPM 中的高斯加噪](/wiki/ddpm)逻辑类似，先验定义了某种随机特性的基准。

在工程实践中，通常通过**数据中心化**将观测点 $\mathbf{y}$ 减去其样本均值，使其在 0 附近波动。即使假设先验均值为 0，经过上述预测均值公式，真实的观测值 $\mathbf{y}$ 也会作为乘积项拉动最终的预测结果，使其逼近真实的局部数据水平。

### Q2：计算协方差矩阵时，$\mathbf{K}(t_*, \mathbf{t})$ 中包含未知的预测点，怎么计算？
**解答**：这是一个常见的直觉误区。未知的只是预测点的**函数值** $y_*$，而预测点的**位置** $t_*$ 是完全已知且由我们给定的。核函数 $k(t, t')$ 的输入仅仅是自变量空间上的坐标。

### Q3：研究不可数连续区间上有限点的随机变量，有什么实际意义？
**解答**：高斯过程的输出不仅是一个点估计，而是**带有不确定性（方差）的分布**。这种能力在[贝叶斯优化 (Bayesian Optimization)](/wiki/bayesian-optimization) 等决策理论中是核心基础。

---

## 相关链接
- [神经网络的数学架构](/wiki/neural-networks-foundation) - 探讨了激活函数（如 GeLU）与映射本质。
- [DDPM：去噪扩散概率模型](/wiki/ddpm) - 涉及高斯分布在生成模型中的应用。
- [贝叶斯优化 (Bayesian Optimization)](/wiki/bayesian-optimization) - 基于 GP 的黑盒函数全局主动寻优策略。
- [Mathematics](/wiki?tag=Mathematics)
- [AI Research](/wiki?tag=AI+Research)
