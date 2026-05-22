---
title: "多元正态分布 (Multivariate Normal Distribution) 核心性质"
date: "2026-05-22"
tags: ["Mathematics", "Statistics", "Machine Learning"]
excerpt: "高斯过程的有限维基础：深入解析多元正态分布的概率密度函数、几何意义以及关键的边缘化与条件化性质。"
---

# 多元正态分布 (Multivariate Normal Distribution) 核心性质

多元正态分布（MVN）是概率论与统计学中最重要、最优雅的连续概率分布。它是单变量正态分布向高维空间的自然推广，也是[高斯过程 (Gaussian Processes)](/wiki/gaussian-process)在任意有限采样点的理论支柱。

## 1. 定义与概率密度函数 (PDF)

若 $d$ 维随机向量 $\mathbf{X} = [X_1, X_2, \dots, X_d]^T$ 服从多元正态分布，记作 $\mathbf{X} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{\Sigma})$。

其概率密度函数为：
$$p(\mathbf{x}; \boldsymbol{\mu}, \mathbf{\Sigma}) = \frac{1}{(2\pi)^{d/2} |\mathbf{\Sigma}|^{1/2}} \exp \left( -\frac{1}{2} (\mathbf{x} - \boldsymbol{\mu})^T \mathbf{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu}) \right)$$

### 核心参数：
1. **均值向量 (Mean Vector)** $\boldsymbol{\mu} \in \mathbb{R}^d$：
   $$\boldsymbol{\mu} = \mathbb{E}[\mathbf{X}] = [\mathbb{E}[X_1], \dots, \mathbb{E}[X_d]]^T$$
2. **协方差矩阵 (Covariance Matrix)** $\mathbf{\Sigma} \in \mathbb{R}^{d \times d}$：
   $$\mathbf{\Sigma}_{ij} = \text{Cov}(X_i, X_j) = \mathbb{E}[(X_i - \mu_i)(X_j - \mu_j)]$$
   *   **性质**：$\mathbf{\Sigma}$ 必须是**对称半正定 (Symmetric Semi-definite)** 的。如果 $\mathbf{\Sigma}$ 是正定的，则分布存在密度函数。

---

## 2. 几何意义与马氏距离

PDF 中的指数项 $\Delta^2 = (\mathbf{x} - \boldsymbol{\mu})^T \mathbf{\Sigma}^{-1} (\mathbf{x} - \boldsymbol{\mu})$ 称为**马氏距离 (Mahalanobis Distance)** 的平方。

*   **等值线 (Contours)**：在空间中，密度函数相等的点构成一个**超椭球面**。
*   **特征值分解**：协方差矩阵的特征向量决定了椭圆轴的方向，特征值 $\lambda_i$ 决定了轴的长度（对应方差）。

---

## 3. 核心性质：为什么它在 GP 中不可或缺？

多元正态分布有两个“近乎魔法”的封闭性质，直接推导出了高斯过程回归的预测公式。

假设我们将 $\mathbf{X}$ 划分为两个子集 $\mathbf{x}_1$ 和 $\mathbf{x}_2$：
$$\mathbf{x} = \begin{bmatrix} \mathbf{x}_1 \\ \mathbf{x}_2 \end{bmatrix}, \quad \boldsymbol{\mu} = \begin{bmatrix} \boldsymbol{\mu}_1 \\ \boldsymbol{\mu}_2 \end{bmatrix}, \quad \mathbf{\Sigma} = \begin{bmatrix} \mathbf{\Sigma}_{11} & \mathbf{\Sigma}_{12} \\ \mathbf{\Sigma}_{21} & \mathbf{\Sigma}_{22} \end{bmatrix}$$

### A. 边缘一致性 (Marginalization)
如果我们只关注其中一部分变量 $\mathbf{x}_1$，而不管 $\mathbf{x}_2$ 发生了什么，其边缘分布依然是正态分布，且参数直接取自对应的子块：
$$p(\mathbf{x}_1) = \int p(\mathbf{x}_1, \mathbf{x}_2) d\mathbf{x}_2 = \mathcal{N}(\mathbf{x}_1; \boldsymbol{\mu}_1, \mathbf{\Sigma}_{11})$$
*   **GP 意义**：这保证了当我们增加或减少观测点时，已有观测点的联合分布保持不变。

### B. 条件分布 (Conditioning) —— GP 预测的核心
如果已知 $\mathbf{x}_2$ 的观测值为 $\mathbf{a}$，那么 $\mathbf{x}_1$ 的条件分布依然是正态分布：
$$\mathbf{x}_1 \mid \mathbf{x}_2 = \mathbf{a} \sim \mathcal{N}(\bar{\boldsymbol{\mu}}, \bar{\mathbf{\Sigma}})$$
其中：
$$\bar{\boldsymbol{\mu}} = \boldsymbol{\mu}_1 + \mathbf{\Sigma}_{12} \mathbf{\Sigma}_{22}^{-1} (\mathbf{a} - \boldsymbol{\mu}_2)$$
$$\bar{\mathbf{\Sigma}} = \mathbf{\Sigma}_{11} - \mathbf{\Sigma}_{12} \mathbf{\Sigma}_{22}^{-1} \mathbf{\Sigma}_{21}$$

*   **直观理解**：
    1.  **均值修正**：新的均值是原始均值加上一个由相关性 $\mathbf{\Sigma}_{12}$ 权衡的残差项。
    2.  **方差减小**：新的方差总是小于或等于原始方差 $\mathbf{\Sigma}_{11}$。因为观测到了 $\mathbf{x}_2$，我们对 $\mathbf{x}_1$ 的确定性增加了（熵减）。

---

## 4. 线性变换性质

若 $\mathbf{X} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{\Sigma})$，对于任何线性变换 $\mathbf{Y} = \mathbf{A}\mathbf{X} + \mathbf{b}$，$\mathbf{Y}$ 依然服从正态分布：
$$\mathbf{Y} \sim \mathcal{N}(\mathbf{A}\boldsymbol{\mu} + \mathbf{b}, \mathbf{A}\mathbf{\Sigma}\mathbf{A}^T)$$

这也是 [DDPM 扩散模型](/wiki/ddpm)中 Reparameterization Trick 的数学依据：
$$x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1 - \bar{\alpha}_t}\epsilon \implies x_t \sim \mathcal{N}(\sqrt{\bar{\alpha}_t}x_0, (1 - \bar{\alpha}_t)\mathbf{I})$$

---

## 相关链接
- [高斯过程 (Gaussian Processes)](/wiki/gaussian-process) - MVN 在无限维空间的推广。
- [DDPM：去噪扩散概率模型](/wiki/ddpm) - 基于高斯分布的马尔可夫链。
- [Mathematics](/wiki?tag=Mathematics)
