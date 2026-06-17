---
title: "渲染公式的统一与演进：从连续体积积分到离散高斯 Splatting"
date: "2026-06-02"
excerpt: "从概率论视角解析 NeRF 体积渲染与 3D Gaussian Splatting 的核心数学模型，揭示两者在成像公式上的代数同构与空间表征上的本质差异，并从协方差边缘化（Schur 补）出发证明 EWA Splatting 的「投影即沿光线积分」。"
tags: ["Computer Graphics", "Neural Networks", "AI Research"]
---

# 渲染公式的统一与演进：从连续体积积分到离散高斯 Splatting

## 1. 核心数学模型：图像生成的概率期望

无论是连续的 NeRF 还是离散的 3D Gaussian Splatting（3DGS），其最终成像模型（Image Formation Model）在代数结构上是同构的，本质都是一个沿射线计算颜色数学期望的**离散马尔可夫终止过程**。对于最终投射到 2D 屏幕上的像素颜色 $C$，其通用计算公式为：

$$C = \sum_{i=1}^N T_i \alpha_i c_i$$

**变量的概率论释义：**

- $c_i$：第 $i$ 个采样点/高斯球的固有颜色。
- $\alpha_i$：局部碰撞率/不透明度。光子在第 $i$ 个位置被截停（吸收或散射）的概率。
- $T_i$：透射率（生存概率）。光子无碰撞地穿过前 $i-1$ 个位置的联合概率，由前置区间的独立"未碰撞"概率连乘得到：
$$T_i = \prod_{j=1}^{i-1} (1 - \alpha_j)$$
- $T_i \alpha_i$：光子恰好在第 $i$ 个位置被截停的联合概率（贡献权重）。

最终颜色 $C$ 即为光子沿射线被各截停点颜色染色的数学期望。

> **背景色补偿**：贡献权重 $\{T_i \alpha_i\}$ 的总和为 $1 - T_{N+1}$，其中 $T_{N+1} = \prod_{j=1}^N (1-\alpha_j)$ 是穿透所有图元后的剩余透射率。当场景存在"逃逸"光子（尤其是无界场景）时，需补偿背景色 $c_{bg}$：
> $$C = \sum_{i=1}^N T_i \alpha_i c_i + T_{N+1} \cdot c_{bg}$$

---

## 2. 连续场渲染（NeRF）：基于实分析的积分微元

在最初的体积渲染（Volume Rendering）中，空间 $\mathbb{R}^3$ 被建模为连续的体密度场 $\sigma(\mathbf{x})$。

### 数学机理

$\sigma(\mathbf{x})$ 对应**非齐次泊松点过程**的强度函数（Intensity Function），表示光子在某坐标处单位距离内的碰撞概率密度。光子从 $t_a$ 飞行到 $t_b$ 且存活的真实透射率是一个连续积分：

$$T(t_a \to t_b) = \exp\left( -\int_{t_a}^{t_b} \sigma(\mathbf{r}(t))\, dt \right)$$

### $\alpha_i$ 的推导与离散化

由于 MLP 表达的连续函数无法直接求解析积分，必须沿光线做黎曼和离散化（Ray Marching）。在微小步长 $\delta_i$ 内，假设 $\sigma_i$ 恒定，由此推导该积分微元的等效不透明度：

$$\alpha_i = 1 - \exp(-\sigma_i \delta_i)$$

**核心痛点**：对于 $\sigma = 0$ 的真空区域，依然需要进行密集的神经网络推理（求 $\sigma$）和数值积分操作，计算存在大量冗余。

### 透射率的离散化：连乘即指数（与 3DGS 的统一根基）

$\alpha_i$ 的概率含义是"在第 $i$ 段内**至少发生一次碰撞**"的概率，正是该段生存概率的补：$\alpha_i = 1 - \exp(-\sigma_i\delta_i)$，故 $1-\alpha_i = \exp(-\sigma_i\delta_i)$ 就是该段的"未碰撞"概率。把它代回第 1 节那个看似纯离散的生存概率连乘：

$$T_i = \prod_{j=1}^{i-1}(1-\alpha_j) = \prod_{j=1}^{i-1}\exp(-\sigma_j\delta_j) = \exp\!\left(-\sum_{j=1}^{i-1}\sigma_j\delta_j\right)$$

而右端正是连续透射率 $T(t_a\to t_b)=\exp\!\big(-\int_{t_a}^{t_b}\sigma\,dt\big)$ 的黎曼离散化。换言之，**离散的"未碰撞概率连乘"与连续的指数透射率积分是同一个量**，只是把连续指数切成了小段。这条恒等式正是 NeRF 与 3DGS 能共用同一个 $\alpha$-blending 期望模型（第 1 节）的根基：两者只是在「如何得到每个 $\alpha_i$」上分道扬镳，成像层完全一致。

---

## 3. 离散点渲染（3DGS）：显式的协方差评估

为了规避连续场随机采样的低效，3DGS 采用离散且无结构的几何图元（三维高斯球）来替代连续场。空间中不再有连续分布的介质，只有明确定义的实体集合。

### 数学机理

在此框架下，$\alpha_i$ 不再是由积分推导出的微元属性，而是由图元固有属性与**空间相对位置**共同决定的确定性函数评估值：

$$\alpha_i = O_i \cdot \exp\left(-\frac{1}{2} \mathbf{u}^T \Sigma_{2D}^{-1} \mathbf{u}\right)$$

其中 $\mathbf{u} = \mathbf{x}_{pixel} - \boldsymbol{\mu}_{2D} \in \mathbb{R}^2$ 是像素坐标与高斯中心在**屏幕空间（2D）**的偏移向量，$\Sigma_{2D} \in \mathbb{R}^{2\times2}$ 是投影后的二维协方差矩阵（详见 3.1 节）。

### $\alpha_i$ 的双重决定因素

- **$O_i$（Learned per-point opacity）**：基础不透明度。训练阶段可优化的变量，渲染阶段退化为与该高斯点绑定的固定标量（常数）。
- **$G(\mathbf{u})$（2D Gaussian Evaluation）**：空间衰减系数。根据像素与该高斯点二维投影中心的**马氏距离**，给出一个 $(0, 1]$ 之间的确定衰减率。

### 3.1 EWA Splatting：三维高斯到二维的投影

3DGS 并非直接在三维空间中评估高斯，而是先将三维高斯**投影（Splat）**到图像平面，再在 2D 屏幕空间中计算 $\alpha$。

设三维高斯的协方差矩阵为 $\Sigma_{3D} \in \mathbb{R}^{3\times3}$，$W$ 为世界坐标系到相机坐标系的旋转矩阵，$J \in \mathbb{R}^{2\times3}$ 为透视投影在高斯均值处的**雅可比矩阵**（仿射局部近似），则投影后的二维协方差为：

$$\Sigma_{2D} = J W \Sigma_{3D} W^T J^T \in \mathbb{R}^{2\times2}$$

这意味着：同一个三维高斯在不同视角下，其投影到屏幕的"形状"（即 $\Sigma_{2D}$ 的椭圆轮廓）会随相机位姿动态变化。

> 关于这里用 $2\times3$ 的 $J$ 直接得到 $2\times2$、以及它与 EWA 原始管线中"先得 $3\times3$ 再截断"为何等价、又为何等价于"沿光线积分"，见 3.2 节。

### 3.2 投影即积分：从「截断协方差」到「边缘化」的概率论证明

3.1 节用 $2\times3$ 的 $J$ 一步得到 $2\times2$，其实折叠掉了一个关键步骤。EWA 原始管线里 $J$ 是 $3\times3$，先得到光线坐标系（ray space）中的三维协方差

$$\Sigma' = J_{3\times3}\,W\,\Sigma_{3D}\,W^T\,J_{3\times3}^T \in \mathbb{R}^{3\times3},$$

其第三个坐标轴沿视线（深度）方向。要得到屏幕上的二维 footprint，需**删掉 $\Sigma'$ 的第三行与第三列**得到 $\Sigma_{2D}$。本节回答：这个"删行删列"为何合法——它在概率论上恰好等于**把三维高斯沿视线方向积分（边缘化）**，也就是把那团椭球沿光线压扁。这正是「先投影、再在 2D 评估 $\alpha$」能替代「沿光线积分那团密度」的根本原因。

#### (1) 协方差的线性变换律

设 $X\sim\mathcal{N}(\mu,\Sigma)$，做线性变换 $Y=MX$。由期望线性性 $\mathbb{E}[Y]=M\mu$，且

$$\mathrm{Cov}(Y)=\mathbb{E}\big[(Y-M\mu)(Y-M\mu)^T\big]=M\,\mathbb{E}\big[(X-\mu)(X-\mu)^T\big]\,M^T=M\Sigma M^T.$$

又因高斯在仿射变换下仍是高斯，令 $M=JW$ 即得 $\Sigma'=(JW)\Sigma_{3D}(JW)^T$。3.1 节那个式子的全部来历就是这条变换律。

#### (2) 三个等价的面：积分 = 取子向量 = 取协方差子块

把向量按 $2{:}1$ 分块 $X=(X_a,X_b)$，$X_a\in\mathbb{R}^2$（屏幕两轴），$X_b\in\mathbb{R}^1$（深度轴）：

$$\Sigma'=\begin{pmatrix}\Sigma_{aa}&\Sigma_{ab}\\ \Sigma_{ab}^T&\sigma_b^2\end{pmatrix},\qquad \Sigma_{ab}=\mathbb{E}\big[(X_a-\mu_a)(X_b-\mu_b)^T\big]\in\mathbb{R}^{2\times1}.$$

这里 $\Sigma_{ab}$ 是"二维向量 $X_a$ 的每个分量分别与标量 $X_b$ 的协方差"摞成的一列，并无新定义，就是整阵 $\mathbb{E}[(X-\mu)(X-\mu)^T]$ 的非对角块。"沿深度积分"在三个层面是同一件事：

- **密度层面**：边缘分布 $p(x_a)=\int_{\mathbb{R}}p(x_a,x_b)\,dx_b$。
- **随机变量层面**：这就是"只看子向量 $X_a$"。而 $X_a=PX$，$P=[\,I_2\ \ 0\,]\in\mathbb{R}^{2\times3}$ 是选择矩阵。
- **矩阵层面**：由变换律 $\mathrm{Cov}(PX)=P\Sigma'P^T=\Sigma_{aa}$，正是左上 $2\times2$ 块（删掉深度对应的行列）。

更进一步，删行删列里的 $P$ 可以并进 $J$：

$$P\Sigma'P^T=(PJ_{3\times3})\,W\,\Sigma_{3D}\,W^T\,(PJ_{3\times3})^T,\qquad PJ_{3\times3}=J_{2\times3}.$$

$J_{2\times3}$ 正好是 $3\times3$ 雅可比的前两行。**这就是 3.1 节用 $2\times3$ 的 $J$ 与原始"$3\times3$ 后截断"完全等价的原因——边缘化被吸收进了 $J$。**

需要强调：「子向量协方差 = 协方差子块」对**任何**分布都成立；高斯的特殊之处在于其边缘分布**仍是高斯**、由均值与协方差完全确定，所以"取子块"就是全部答案，无需再补任何项。

#### (3) 亲手做一遍 $3\times3$、$2{:}1$ 的积分

用精度矩阵 $\Lambda=\Sigma'^{-1}$（密度指数里出现的是它），同样分块：

$$\Lambda=\begin{pmatrix}\Lambda_{aa}&\Lambda_{ab}\\ \Lambda_{ab}^T&\lambda_{bb}\end{pmatrix},\qquad \Lambda_{aa}\in\mathbb{R}^{2\times2},\ \Lambda_{ab}\in\mathbb{R}^{2\times1},\ \lambda_{bb}\in\mathbb{R}.$$

零均值下密度指数（二次型）按块展开（$x_b,\lambda_{bb}$ 为标量）：

$$Q=x_a^T\Lambda_{aa}x_a+2\,x_b\,\Lambda_{ab}^T x_a+\lambda_{bb}\,x_b^2.$$

对标量 $x_b$ 配方：

$$\lambda_{bb}x_b^2+2(\Lambda_{ab}^T x_a)x_b=\lambda_{bb}\Big(x_b+\tfrac{\Lambda_{ab}^T x_a}{\lambda_{bb}}\Big)^2-\frac{(\Lambda_{ab}^T x_a)^2}{\lambda_{bb}}.$$

积分 $\int_{\mathbb{R}}e^{-Q/2}\,dx_b$：完整平方项是关于 $x_b$ 的标准高斯，平移不变，积出来只给一个与 $x_a$ 无关的常数，丢弃。利用 $(\Lambda_{ab}^T x_a)^2=x_a^T\Lambda_{ab}\Lambda_{ab}^T x_a$，剩下：

$$p(x_a)\propto\exp\!\Big(-\tfrac12\,x_a^T\big[\,\underbrace{\Lambda_{aa}-\Lambda_{ab}\lambda_{bb}^{-1}\Lambda_{ab}^T}_{\text{精度阵 }\Lambda\text{ 对 }\lambda_{bb}\text{ 的 Schur 补}}\,\big]x_a\Big).$$

所以边缘分布的**精度**是 $\Lambda$ 的 Schur 补，其**协方差**是它的逆。再用一条分块求逆的对偶恒等式

$$\boxed{\;\Lambda_{aa}-\Lambda_{ab}\lambda_{bb}^{-1}\Lambda_{ab}^T=\Sigma_{aa}^{-1}\;}$$

（"精度阵的 Schur 补 = 协方差子块之逆"，对 $S=\Sigma_{aa}-\Sigma_{ab}\sigma_b^{-2}\Sigma_{ab}^T$ 用一次 Sherman–Morrison 秩一更新即可直接验证）代回，即得

$$\mathrm{Cov}(X_a)=\big(\Sigma_{aa}^{-1}\big)^{-1}=\Sigma_{aa}.$$

边缘化掉深度 $x_b$ 后，$x_a$ 的协方差**恰好是 $\Sigma'$ 的左上 $2\times2$ 块**，所有与深度耦合的量 $\Sigma_{ab},\sigma_b^2$ 被精确消去。"删第三行列 $=$ 沿光线积分"至此严格成立。$\blacksquare$

#### (4) 别和「切片」搞混：投影 vs 截面

同一个椭球，**积分（边缘化）**与**切片（条件化）**给出的二维椭圆来源完全不同，判据是动的是 $\Sigma$ 还是 $\Sigma^{-1}$：

| 操作 | 概率含义 | 二维协方差 | 几何含义 |
|---|---|---|---|
| 边缘化 $\int\!dx_b$ | 取子向量 $X_a$ | $\Sigma_{aa}$（删 **$\Sigma$** 的行列） | 椭球向平面的**投影外轮廓** |
| 条件化 $x_b=c$ | 固定 $X_b$ | $\Sigma_{aa}-\Sigma_{ab}\sigma_b^{-2}\Sigma_{ab}^T$（删 **$\Sigma^{-1}$** 的行列） | 平面去**切**椭球的**截面** |

（条件化还伴随条件均值的平移 $\mu_a+\Sigma_{ab}\sigma_b^{-2}(x_b-\mu_b)$，即"回归"。）3DGS 删的是 $\Sigma'$（协方差）本身的行列，所以做的是**边缘化/投影**：屏幕上那个椭圆是椭球的**影子轮廓**，而不是某个切片。

#### (5) 回扣渲染：深度信息在投影瞬间被丢弃

把结论放回 $\alpha_i=O_i\exp\!\big(-\tfrac12\,\mathbf{u}^T\Sigma_{2D}^{-1}\mathbf{u}\big)$：被积掉的深度轴在 $\Sigma_{2D}$ 与 $G(\mathbf{u})$ 里**彻底不再出现**。逐像素权重只由"平面内椭圆形状 $\Sigma_{2D}$ $+$ 投影中心 $\boldsymbol{\mu}_{2D}$"决定，深度只剩中心标量 $\mu_z$ 拿去做排序。也就是说，每个高斯沿视线方向的内部结构在"投影—边缘化"那一刻就被压平丢弃了——这正是 3DGS 几何/多视图一致性受限的数学根源，也是 2DGS 等"面元（surfel）"方法要把基元换成固定朝向、改用真实光线-平面求交去补回来的东西。

### 3.3 视角相关颜色：球谐函数

3DGS 中 $c_i$ 并非固定的 RGB 值，而是通过**球谐函数（Spherical Harmonics，SH）**系数编码的视角相关颜色：

$$c_i = \sum_{l=0}^{L} \sum_{m=-l}^{l} k_{lm}^{(i)} Y_l^m(\mathbf{d})$$

其中 $\mathbf{d}$ 是观察方向，$Y_l^m$ 是实球谐基函数，$k_{lm}^{(i)}$ 是每个高斯点的可学习系数。这使得 3DGS 可以表达镜面高光等视角相关效果，而不仅仅是漫反射颜色。

---

## 4. 总结：算法演进的本质差异

| 对比维度 | 连续体积渲染（NeRF） | 离散点渲染（3D Gaussian Splatting） |
|---|---|---|
| **空间假设** | 充满介质的连续场 $\mathbb{R}^3 \to [0, +\infty)$ | 离散的无结构几何图元集合 |
| **$\alpha_i$ 的物理来源** | 数值积分产生的微小区间碰撞概率近似 | 离散图元基础透明度 $\times$ 二维投影协方差衰减 |
| **空白区域处理** | 必须采样并送入网络推理（昂贵的随机采样） | 无实体点存在，直接跳过计算（零成本） |
| **颜色表示** | MLP 输出 RGB（或 SH 系数） | 每点球谐系数评估，天然视角相关 |
| **渲染前置步骤** | 光线步进即可 | **必须按深度排序**（GPU Radix Sort，$O(N\log N)$） |
| **GPU 计算亲和度** | 低（分支发散严重，依赖连续网络调用） | 高（天然契合离散图元光栅化与 $\alpha$-blending） |

**关于深度排序**：由于 alpha-blending 公式不满足交换律（$T_i \alpha_i$ 依赖前置项的连乘），3DGS 在每帧渲染前必须对所有可见高斯按相机深度从后往前排序。这是 3DGS 的关键算法开销，在 GPU 上通过基数排序（Radix Sort）实现，但与连续网络推理相比仍然快得多。

**结论**：3DGS 在图像生成模型层与 NeRF 完全保持一致（均为 $\alpha$-blending 期望模型，且离散透射率连乘正是连续指数积分的离散化，见 2 节末），但在空间表征层将其从连续函数离散化为显式高斯分布，并通过 EWA Splatting 把三维几何**沿视线边缘化（投影）**到二维屏幕空间评估（见 3.2 节：该投影在数学上等价于把高斯沿光线积分，对应"删 $\Sigma'$ 第三行列 $=$ 取协方差子块"），从而利用 GPU 的光栅化管线实现了渲染速度的飞跃。这一"沿视线积分掉深度"的代价，是单个图元的纵深结构在投影时被压平，也就埋下了几何与多视图一致性的隐患——后续 [2DGS](/reading/2d-gaussian-splatting) 等工作正由此切入。

---

## 相关链接

- [RenderFormer：基于 Transformer 的神经渲染架构](/wiki/renderformer) - 探讨神经渲染中的 NeRF 频域编码与注意力机制。
- [Computer Graphics](/wiki?tag=Computer+Graphics) - 更多图形学笔记。
