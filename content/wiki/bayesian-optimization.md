---
title: "贝叶斯优化 (BO) 与 偏好贝叶斯优化 (PBO) 核心理论"
date: "2026-05-22"
tags: ["AI Research", "Mathematics", "Machine Learning"]
excerpt: "探索黑盒优化的数学艺术：从标准贝叶斯优化的无梯度寻优，到应对人类偏好对齐 (RLHF) 的偏好贝叶斯优化 (PBO)。"
---

# 贝叶斯优化 (BO) 与 偏好贝叶斯优化 (PBO) 核心理论

## 0. 为什么需要贝叶斯优化？(The Significance of BO)

在探讨具体数学推导之前，必须先理清贝叶斯优化（Bayesian Optimization, BO）的生态位。它是一种针对**昂贵黑盒函数 (Expensive Black-box Functions)** 的全局优化策略。

### 0.1 拒绝反向传播：无梯度的艺术
在[神经网络的底层架构](/wiki/neural-networks-foundation)中，我们极度依赖**反向传播 (Backpropagation)** 和微积分链式法则来计算梯度，并引导参数更新。这是因为神经网络的函数解析式是白盒的，且评估一次的计算成本相对较低。

然而，在现实世界中，许多优化问题是**无梯度 (Derivative-free)** 且**评估极度昂贵**的。例如：
*   **超参数调优**：评估一组大模型超参数的收益，需要耗费数天和昂贵的算力进行完整训练。
*   **材料与药物发现**：验证一种新分子的活性，需要进行长达数周的湿实验。

对于这些目标函数 $f(t)$，我们既不知道它的数学表达式，也无法求导。传统的网格搜索 (Grid Search) 或随机搜索 (Random Search) 过于盲目，而在这种场景下，**“每一次尝试都极其昂贵，必须三思而后行”**。

### 0.2 核心思想：代理模型 + 主动规划
BO 的破局思路是：既然真正的 $f(t)$ 太贵，我们就用历史观测数据去拟合一个**廉价的概率代理模型 (Surrogate Model)**（通常是[高斯过程](/wiki/gaussian-process)）。
然后，利用代理模型输出的“均值”（预期收益，**Exploitation/开发**）和“方差”（不确定性，**Exploration/探索**），构建一个采集函数来“精打细算”地规划下一次实验，从而在最少的实验次数内找到全局最优解。

---

## 1. 贝叶斯优化 (BO) 标准框架

假设我们有一个黑盒目标函数 $f(t)$，评估一次 $f(t)$ 的成本极高。我们的目标是找到使其最大化的点：
$$t^* = \arg\max_{t \in \mathcal{X}} f(t)$$

### 1.1 代理模型 (Surrogate Model)
我们使用高斯过程（GP）作为 $f(t)$ 的先验分布：
$$f(t) \sim \mathcal{GP}(m(t), k(t, t'))$$
对于已有的观测数据集 $\mathcal{D} = \{(t_i, y_i)\}_{i=1}^n$，其中 $y_i = f(t_i) + \epsilon$，假设观测噪声 $\epsilon \sim \mathcal{N}(0, \sigma_n^2)$。

根据[多元正态分布的条件化性质](/wiki/multivariate-normal)，给定新点 $t_*$，GP 提供的不仅是一个预测点，而是一个**随机变量**（后验分布）：
$$f(t_*) \mid \mathcal{D} \sim \mathcal{N}(\mu_*, \sigma_*^2)$$
* **$\mu_*$**：代表模型对该点函数值的期望（已知信息的**开发 / Exploitation** 价值）。
* **$\sigma_*^2$**：代表模型对该点预测的不确定度（未知信息的**探索 / Exploration** 价值）。

### 1.1.1 深度直觉：从先验到后验的“坍缩”
为了更好地理解 GP 的工作原理，我们可以将其拟合过程形象化：

**1. 先验 (Prior)：数学的“紧身衣”**
在没有任何观测数据（没有 $x, y$）时，我们面对的是一个完全未知的黑盒。如果我们不对其做任何假设，优化就无从谈起。先验（Prior）就是我们强行给这个未知函数穿上的“数学紧身衣”——我们假设函数必须是连续且平滑的。
*   **初始均值函数 $\mu_0(x) = 0$**：在没有数据前，最理性的假设是全空间表现均等（或者某个基准值）。
*   **初始协方差函数 $k(x, x')$ (先验的灵魂)**：即便没有数据，我们也掌握着一条极其重要的物理法则：**相似的参数组合，表现也应该相似**。通过[径向基函数 (RBF)](/wiki/gaussian-process) 等核函数，我们定义了空间的平滑度。
此时的先验是一个均值为 0、方差巨大且处处相等的水平面，其中蕴含着无数条符合平滑度要求的随机“波浪曲线”。

**2. 后验 (Posterior)：数据的“钉子”效应**
当我们引入真实观测数据 $\mathcal{D} = \{(x_i, y_i)\}$ 时，原本无处不在的先验概率 $P(f)$ 瞬间坍缩为后验概率 $P(f \mid \mathcal{D})$。在这个瞬间，发生了两件极其壮观的数学变化：
*   **“钉子”效应 (方差归零)**：在已观测的点 $x_i$ 上，我们确切知道了它的分数。因此在该点上，不确定度（方差）瞬间被压缩到 0。
*   **“涟漪”效应 (均值拉扯)**：受核函数平滑性的约束，观测点附近的空间均值会被这颗“钉子”强力拉扯；同时附近的方差也会随之减小。距离越远，这种拉扯感越弱，方差逐渐恢复到原始的巨大状态。

### 1.2 采集函数 (Acquisition Function)
采集函数 $\alpha(t)$ 是一层建立在后验分布 $\mathcal{N}(\mu(t), \sigma^2(t))$ 之上的廉价规划函数。通过最大化采集函数来决定下一个采样点：$t_{n+1} = \arg\max_t \alpha(t)$。

#### 策略 A：高斯置信上限 (Upper Confidence Bound, UCB)
最直观的权衡公式：
$$\alpha_{\text{UCB}}(t) = \mu(t) + \beta \sigma(t)$$
* **参数释义**：$\beta > 0$ 是权衡参数。$\beta$ 越大，算法越倾向于去方差大（未探索）的区域；$\beta$ 越小，越倾向于在已知高收益区域深挖。

#### 策略 B：期望改善 (Expected Improvement, EI)
学术界最严谨、最常用的策略。假设当前已知的最大观测值为 $y^+$。新点 $t$ 带来的“改善量”定义为 $I(t) = \max(0, f(t) - y^+)$。
由于 $f(t)$ 是服从 $\mathcal{N}(\mu(t), \sigma^2(t))$ 的随机变量，我们可以对这个改善量求数学期望：
$$\alpha_{\text{EI}}(t) = \mathbb{E}[I(t)] = \int_{y^+}^{\infty} (y - y^+) p(y \mid t, \mathcal{D}) \, dy$$
经过标准正态分布的积分换元，可得到闭式解：
$$\alpha_{\text{EI}}(t) = (\mu(t) - y^+) \Phi(Z) + \sigma(t) \phi(Z)$$
* **参数释义**：
    * $Z = \frac{\mu(t) - y^+}{\sigma(t)}$ （当 $\sigma(t) > 0$ 时）。
    * $\Phi(\cdot)$ 为标准正态分布的累积分布函数 (CDF)。
    * $\phi(\cdot)$ 为标准正态分布的概率密度函数 (PDF)。
* **物理意义**：左项由均值主导（ Exploitation），右项由方差主导（Exploration），依靠概率严密地将两者融合。

### 1.3 实践建议：冷启动与初始采样 (Initial Sampling)
在正式启动 BO 的“代理模型-采集函数”循环之前，算法需要一定的初始数据来构建最初的后验分布。这被称为**冷启动 (Cold Start)**。

*   **为什么要先跑数据？** 如果没有任何数据，GP 的后验就是先验（全空间方差一致）。此时采集函数可能会在空间中盲目选择，导致初期效率低下。
*   **采样策略**：通常不建议使用随机采样，而应使用**空间填充设计 (Space-filling Design)**，以确保初始点在参数空间内尽可能均匀分布。
    *   **拉丁超立方采样 (Latin Hypercube Sampling, LHS)**：确保每一维度的投影都能均匀覆盖。
    *   **Sobol 序列**：一种低差异序列，比纯随机采样更均匀地覆盖高维空间。
*   **初始样本量**：
    *   **经验法则**：通常设置初始样本量 $n_{\text{init}} \approx 2d + 1$（其中 $d$ 是参数空间的维度）。
    *   对于高维任务（如 20 维的适配器权重优化），通常先通过 LHS 跑 30-50 组数据，再移交给 BO 进行精细化搜索。

---

## 2. 偏好贝叶斯优化 (PBO) 数学拓展

在许多前沿任务中（如大语言模型的 RLHF 人类偏好对齐、图像生成质量评估、机器人姿态的主观反馈），我们无法得到连续且精确的具体 $y$ 值（比如“这句回答的质量是 8.5 分”）。人类只能提供低认知成本的回答：**“选项 $t_1$ 比选项 $t_2$ 更好”**。

偏好贝叶斯优化（Preferential Bayesian Optimization, PBO）正是应对这种场景的重要变体。其数据集不再是绝对值，而是成对比较：$\mathcal{D} = \{t_{i,1} \succ t_{i,2}\}_{i=1}^N$，表示在第 $i$ 次比较中，$t_{i,1}$ 优于 $t_{i,2}$。

### 2.1 似然函数：从高斯到 Probit 模型
在标准 BO 中，似然函数 $P(y \mid f(t))$ 是高斯分布。
在 PBO 中，我们需要一个将连续函数值 $f(t)$ 映射为“偏好概率”的模型。通常采用 **Thurstone-Mosteller 模型**（一种 Probit 模型）。

假设存在一个潜在的连续效用函数 $f(t) \sim \mathcal{GP}(0, k(t, t'))$。当比较 $t_1$ 和 $t_2$ 时，判定 $t_1 \succ t_2$ 的概率为：
$$P(t_1 \succ t_2 \mid f(t_1), f(t_2)) = \Phi \left( \frac{f(t_1) - f(t_2)}{\sqrt{2}\sigma_c} \right)$$
其中 $\Phi$ 是标准正态分布的 CDF，$\sigma_c$ 代表比较时的评估噪声。
* 如果 $f(t_1) \gg f(t_2)$，则 CDF 趋于 1，说明 $t_1$ 几乎必定胜出。
* 如果 $f(t_1) \approx f(t_2)$，则 CDF 趋于 0.5，说明两者难分伯仲。

于是，给定潜在效用函数向量 $\mathbf{f}$，整个观测数据集的**似然函数 (Likelihood)** 为：
$$P(\mathcal{D} \mid \mathbf{f}) = \prod_{i=1}^N \Phi \left( \frac{f(t_{i,1}) - f(t_{i,2})}{\sqrt{2}\sigma_c} \right)$$

### 2.2 核心难点：后验分布不再是闭式解
根据贝叶斯定理，潜在函数的后验分布为：
$$P(\mathbf{f} \mid \mathcal{D}) = \frac{P(\mathcal{D} \mid \mathbf{f}) P(\mathbf{f})}{P(\mathcal{D})}$$
* **$P(\mathbf{f})$** 是先验，服从多元正态分布 $\mathcal{N}(\mathbf{0}, \mathbf{K})$。
* **$P(\mathcal{D} \mid \mathbf{f})$** 是上述一堆 $\Phi$ 函数的乘积，**它不再是高斯分布**！

因为似然函数不是高斯的，共轭性质被破坏，导致归一化常数分母 $P(\mathcal{D})$ 无法解析积分，后验分布 $P(\mathbf{f} \mid \mathcal{D})$ 也就无法写成漂亮的 $\mathcal{N}(\mu_*, \sigma_*^2)$。没有了高斯过程引以为傲的闭式预测均值和方差，BO 的采集函数机制就彻底罢工了。

### 2.3 解决方案：拉普拉斯近似 (Laplace Approximation)
这是概率机器学习处理非高斯似然的标配救场操作。**拉普拉斯近似的核心思想是：在真实后验分布的众数（最高点）处，用一个多维高斯分布去硬套（二阶泰勒展开拟合）这个非高斯分布。**

**步骤 1：寻找最大后验估计 (MAP)**
我们首先定义未归一化的对数后验：
$$\Psi(\mathbf{f}) = \log P(\mathcal{D} \mid \mathbf{f}) + \log P(\mathbf{f})$$
$$= \sum_{i=1}^N \log \Phi \left( \frac{f(t_{i,1}) - f(t_{i,2})}{\sqrt{2}\sigma_c} \right) - \frac{1}{2}\mathbf{f}^T \mathbf{K}^{-1} \mathbf{f} - \text{const}$$
通过牛顿-拉夫逊法 (Newton-Raphson) 等基于梯度的优化算法求解其最大值，得到众数点：
$$\mathbf{\hat{f}} = \arg\max_{\mathbf{f}} \Psi(\mathbf{f})$$

**步骤 2：在 $\mathbf{\hat{f}}$ 处进行二阶泰勒展开**
对 $\Psi(\mathbf{f})$ 在 $\mathbf{\hat{f}}$ 处展开，由于一阶导数在极值点为 0，得到：
$$\Psi(\mathbf{f}) \approx \Psi(\mathbf{\hat{f}}) - \frac{1}{2}(\mathbf{f} - \mathbf{\hat{f}})^T \mathbf{H} (\mathbf{f} - \mathbf{\hat{f}})$$
其中，$\mathbf{H} = -\nabla^2 \Psi(\mathbf{\hat{f}})$ 是在 $\mathbf{\hat{f}}$ 处计算的负海森矩阵 (Hessian Matrix)。

**步骤 3：重构高斯后验**
由于上式的形式完全对应于一个以 $\mathbf{\hat{f}}$ 为均值，$\mathbf{H}^{-1}$ 为协方差的高斯分布的对数密度，我们就可以直接宣布近似成功，强行将其拉回高斯域：
$$P(\mathbf{f} \mid \mathcal{D}) \approx \mathcal{N}(\mathbf{\hat{f}}, \mathbf{H}^{-1})$$

### 2.4 PBO 的预测与规划
借助拉普拉斯近似，我们将非高斯的麻烦重新拉回了高斯过程的统治区。

对于任意新的测试点 $t_*$，其潜在效用函数的预测分布再次变为高斯分布：
$$f(t_*) \mid \mathcal{D} \sim \mathcal{N}(\mu_{pbo}, \sigma_{pbo}^2)$$
其中（令 $\mathbf{W}$ 为对角矩阵，其对角线元素来自对数似然函数的二阶导，使得 $\mathbf{H} = \mathbf{K}^{-1} + \mathbf{W}$）：
* **$\mu_{pbo} = \mathbf{k}_*^T \mathbf{K}^{-1} \mathbf{\hat{f}}$**
* **$\sigma_{pbo}^2 = k(t_*, t_*) - \mathbf{k}_*^T (\mathbf{K} + \mathbf{W}^{-1})^{-1} \mathbf{k}_*$**

拿到高斯形式的 $\mu_{pbo}$ 和 $\sigma_{pbo}^2$ 后，PBO 就可以和标准 BO 一样，无缝套用 EI 或 UCB 采集函数，来指导下一次该给人类呈现哪一对新的样本 $(t_1, t_2)$ 进行偏好比较了。

---

## 相关链接
- [高斯过程 (Gaussian Processes)](/wiki/gaussian-process) - BO 依赖的核心代理模型。
- [多元正态分布 (Multivariate Normal)](/wiki/multivariate-normal) - 拉普拉斯近似想要强行还原的目标分布。
- [神经网络的数学架构](/wiki/neural-networks-foundation) - 与本文对比：基于梯度与反向传播的参数寻优。