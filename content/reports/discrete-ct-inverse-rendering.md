---
title: "Inverse Rendering for Discrete X-Ray Computed Tomography"
date: "2025-10-15"
tags: ["Computer Graphics", "Inverse Rendering", "Computed Tomography", "Optimization"]
excerpt: "将具有离散参数空间的逆向渲染问题转化为一个可在连续空间内优化的概率模型，结合 GPU 物理管线应用于离散 CT 重建。"
---

本部分的核心贡献是将具有离散参数空间的逆向渲染问题转化为一个可在连续空间内优化的概率模型，并结合 GPU 物理管线应用于离散 X 射线计算机断层扫描（Discrete CT）。

## 3.1 Probabilistic Formulation (概率公式化)

离散参数空间 $\Omega$ 使得标准渲染优化中的损失函数 $\mathcal{L}$ 不可导。假设场景由变量 $X = (X_1, \dots, X_N) \in \Omega$ 表示，论文将确定性的离散材质分配转化为概率分布。

将 $X$ 建模为具有概率质量函数 $p(X | \Theta)$ 的离散随机变量（$\Theta$ 为分布参数）。优化目标从直接最小化离散损失转化为最小化该分布下的**期望损失**：

$$
\Theta^* = \arg\min_{\Theta} \mathbb{E}_{X \sim p(X|\Theta)} [\mathcal{L}(X)] = \arg\min_{\Theta} \sum_{X \in \Omega} p(X|\Theta)\mathcal{L}(X)
$$

由于全空间配置有 $m^N$ 种，直接计算不可行。因此将全局分布限制为**独立分类分布（Categorical distributions）的分解族**：

$$
p(X | \Theta) = \prod_{i=1}^N p(X_i | \theta_i), \quad X_i \sim \text{Cat}(\theta_i)
$$

向量 $\theta_i = (\theta_{i,1}, \dots, \theta_{i,m})$ 位于概率单纯形（Probability Simplex） $\Delta_{m-1}$ 上。这使得梯度下降可以在连续的单纯形域上寻找最优的离散分配。

## 3.2 Ideal Gradient (理想梯度)

利用全期望公式，将期望损失分解，以捕捉特定变量 $X_i$ 被分配为状态 $k$ 时的影响：

$$
\mathbb{E}[\mathcal{L}(X)] = \mathbb{E}[\mathbb{E}[\mathcal{L}(X)|X_i]] = \sum_{k=1}^m \theta_{i,k} \underbrace{\mathbb{E}[\mathcal{L}(X) | X_i = k]}_{=: \bar{\mathcal{L}}_i(k)}
$$

其中，**条件损失函数** $\bar{\mathcal{L}}_i(k)$ 表示当第 $i$ 个变量被强制设定为状态 $k$ 时，整个场景的期望损失。对其求偏导得到**理想梯度**：

$$
\frac{\partial}{\partial \theta_{i,k}} \mathbb{E}[\mathcal{L}(X)] = \bar{\mathcal{L}}_i(k)
$$

这表明沿着负梯度方向更新，会将概率质量成比例地转移到具有更低条件损失的候选状态上。

## 3.3 Surrogate Approximation (替代近似)

计算 $\bar{\mathcal{L}}_i(k)$ 依然依赖于边缘化剩余的 $m^{N-1}$ 种配置。为此引入一个**替代映射 (Surrogate map)** $S: \Delta_{m-1}^N \to \Omega$，将分布坍缩到一个单一配置。

定义 $S^{i \to k}(\Theta)$ 为：强制变量 $i$ 为状态 $k$，然后对剩余变量应用替代映射 $S$。由此得到近似的条件损失：

$$
\tilde{\mathcal{L}}_i(k) := \mathcal{L}(S^{i \to k}(\Theta)) \approx \bar{\mathcal{L}}_i(k)
$$

论文最终选择并采用 **Expectation (期望)** 替代映射：
$$
S(\Theta) = \mathbb{E}_{X \sim p(X|\Theta)}[X]
$$
即在材质属性上取期望（混合材质）。它考虑了全分布信息，没有引入方差，在实践中收敛最为稳定。

## 3.4 Surrogate Gradient (替代梯度)

利用替代映射，每个变量 $i$ 给出一种对期望损失的近似边缘化视角：

$$
\tilde{\mathcal{L}}^{(i)}(\Theta) = \sum_{k=1}^m \theta_{i,k} \tilde{\mathcal{L}}_i(k)
$$

为了对称对待所有变量，定义**替代目标函数**为所有视角的平均值：

$$
\mathcal{J}(\Theta) = \frac{1}{N} \sum_{i=1}^N \tilde{\mathcal{L}}^{(i)}(\Theta) = \frac{1}{N} \sum_{i=1}^N \sum_{k=1}^m \theta_{i,k} \tilde{\mathcal{L}}_i(k)
$$

求偏导得到严谨的**替代梯度**：

$$
\frac{\partial}{\partial \theta_{i,k}} \mathcal{J}(\Theta) = \frac{1}{N} \tilde{\mathcal{L}}_i(k) + \frac{1}{N} \sum_{j \neq i} \sum_{\ell=1}^m \theta_{j,\ell} \frac{\partial \tilde{\mathcal{L}}_j(\ell)}{\partial \theta_{i,k}}
$$

实际工程中直接舍弃复杂的耦合项，采用**截断理想梯度**：

$$
\frac{\partial}{\partial \theta_{i,k}} \mathcal{J}(\Theta) \approx \tilde{\mathcal{L}}_i(k)
$$

## 3.6 Simplex Constraint (单纯形约束)

为确保优化始终在概率单纯形 $\Delta_{m-1}$ 内，同时兼容 Adam 等自适应优化器，采用 **Modified Natural Gradient (修正自然梯度)**。

设当前体素的分布为 $\theta$，原始欧氏梯度向量为 $g$，修正后的梯度为 $\hat{g}$：

$$
\hat{g} = g - \langle g, \theta \rangle \mathbf{1}
$$

通过减去梯度在当前分布下的期望（内积 $\langle g, \theta \rangle$），强制修正梯度向量的各项分量之和为 0。

## 3.8 Discrete Computed Tomography (离散 CT 应用)

基于**比尔-朗伯定律 (Beer-Lambert law)**，前向传递模型为：

$$
I(X, \mathbf{r}) = I_0 \exp\left( - \sum_{i \in \mathbf{r}} \hat{\mu}_i \Delta_i \right)
$$
其中，混合衰减系数 $\hat{\mu}_i = \sum_k \theta_{i,k} \mu^{(k)}$。损失函数定义为：

$$
\mathcal{L}(X) = \sum_{\mathbf{r}} (\log I(X, \mathbf{r}) - \log I_{\text{ref}}(\mathbf{r}))^2
$$

**高效条件损失评估 (What-If Replace):**
通过增量更新获取光学深度，无需重新追踪射线：

$$
\tau_i(\Theta, \mathbf{r}; k) = \tau(\Theta, \mathbf{r}) - \hat{\mu}_i \Delta_i + \mu^{(k)} \Delta_i
$$

### GPU 并行双通道 (Two-pass Kernel Design)

1. **Pass 1: Ray-Parallel (光线并行与条件损失累加)**
   GPU 为每条 X 射线分配线程。利用 3D-DDA 遍历网格，仅对相交体素计算 $\tau_i(\Theta, \mathbf{r}; k)$，得出 $m$ 种材质的条件误差 $\tilde{\mathcal{L}}_i(k)$ 并原子累加。
2. **Pass 2: Voxel-Parallel (体素并行与流形修正)**
   GPU 为每个体素分配线程。独立读取梯度向量 $g$，执行流形修正 $\hat{g}$，最后进行参数更新。

## 3.9 & 3.10 扩展：Scattering (散射) 与 Regularization (正则化)

为支持带散射的 X 射线，通过累加内散射辐射亮度扩展模型：

$$
I(\Theta, \mathbf{r}) = I_{\text{abs}}(\Theta, \mathbf{r}) + \int_0^\infty \hat{\mu}_s(\Theta, \mathbf{r}(t)) L_s(\mathbf{r}(t)) \, dt
$$

并引入连续的全变分（TV）正则化平滑分布梯度：
$$
\mathcal{L}_{\text{TV}}(\Theta) = \int_{\Omega} \|\nabla \Theta(\mathbf{x})\| \, d\mathbf{x}
$$

---

## 相关链接
- [Computer Graphics](/wiki?tag=Computer+Graphics)
- [Neural Networks](/wiki?tag=Neural+Networks)
- [OpenMP Parallel Programming](/wiki/openmp)
- [CUDA Parallel Computing](/wiki/cuda)
- [RenderFormer: Neural Rendering with Transformers](/wiki/renderformer)
