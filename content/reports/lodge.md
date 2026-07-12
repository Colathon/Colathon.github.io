---
title: "LODGE: Level-of-Detail Large-Scale Gaussian Splatting with Efficient Rendering"
date: "2026-07-12"
excerpt: "精读 LODGE 的方法部分：从 3DGS 的 tile-based 光栅化瓶颈出发，构建按观察距离切换的多层 Gaussian LoD；再用代价驱动的深度阈值、基于相机聚类的 chunk、可见性过滤与跨 chunk 不透明度混合，同时压低每像素高斯长尾、GPU 显存占用和切换伪影。"
tags: ["Computer Graphics", "Gaussian Splatting", "Level of Detail", "Large-scale Rendering"]
---

# LODGE: Level-of-Detail Large-Scale Gaussian Splatting with Efficient Rendering —— Method 部分阅读报告

> 论文目标：让大规模 3D Gaussian Splatting 场景不仅能在桌面 GPU 上实时渲染，也能进入显存和算力都受限的移动设备。
>
> LODGE 的方案可以概括为两层：**LoD 负责少算**——远处使用更平滑、更稀疏的高斯集合，缩短每个像素需要混合的高斯列表；**chunk 负责少装**——按相机活动区域预计算局部所需的 active Gaussians，运行时只把最近的两个 chunk 放进显存，并通过不透明度混合消除切换突跳。

---

## 0. 先给结论：LODGE 到底在优化什么

理解 LODGE 最容易卡住的地方，是把“高斯总数”“当前加载的高斯数”和“一个像素真正处理的高斯数”混在一起。它们对应三个不同问题：

| 问题 | 直接后果 | LODGE 的处理 |
|---|---|---|
| 远处仍由大量细小高斯表示 | 单像素 / 单 tile 要排序、混合很多高斯，渲染慢 | 多层 **LoD 表示** |
| 完整场景全部常驻 GPU | 大场景装不进移动设备显存 | 基于相机位置的 **chunk** |
| 相机跨过 chunk 边界时集合突然变化 | 画面 popping / 闪变 | 两个最近 chunk 的 **opacity blending** |

因此，LODGE 并不是简单地“把空间切块，然后只画眼前的一块”。每个 chunk 保存的仍然是能从该区域看见的**整个场景表示**，只是近处取高细节层、远处取低细节层，再过滤掉从这个 chunk 基本不可见的高斯。

整条方法链如下：

1. 从完整 3DGS 模型出发，构造多个越来越平滑、越来越稀疏的 LoD 层。
2. 用深度阈值决定给定相机下每个空间距离区间应该取哪一层。
3. 不直接为每一帧重新筛选，而是聚类训练相机得到 chunks，并为每个 chunk 预计算 active Gaussians。
4. 对每个 chunk 再做可见性过滤，进一步缩小需要加载的集合。
5. 运行时同时使用最近的两个 chunks，对二者差集中的高斯连续调节不透明度，平滑跨区。

---

## 1. 预备：为什么 3DGS 的瓶颈不只是“高斯总数多”

### 1.1 3DGS 的像素混合

一个 3D Gaussian 由均值（位置）$\mu$、协方差 $\Sigma$、不透明度 $o$ 和视角相关颜色描述。投影到屏幕后，在像素 $\mathbf p$ 上的贡献由二维高斯决定：

$$
\alpha = oG(\mathbf p), \qquad
G(\mathbf p)=\exp\left[-\frac{1}{2}(\mathbf p-\mu')^T(\Sigma')^{-1}(\mathbf p-\mu')\right]. \tag{1}
$$

光栅化器把屏幕划成 $16\times16$ 像素的 tiles。一个投影高斯只要和某个 tile 相交，就会被分配到该 tile；随后 tile 内的高斯按深度排序，并为每个像素进行 alpha blending。

关键在于：**同一个 tile 内的线程共享待处理高斯列表，并要等待最慢的线程完成。** 所以性能并不只取决于场景中共有多少高斯，还强烈取决于：

- 一个 tile 相交了多少高斯；
- 一个像素前方叠了多少可见高斯；
- 是否存在少数“特别拥挤”的 tile，形成长尾。

这就是为什么远处密集的小高斯很麻烦。它们在最终图像里可能只贡献很少，但仍要经历 tile 分配、排序和 alpha blending。

### 1.2 重要性剪枝：删除“训练中几乎没贡献”的高斯

LODGE 沿用 RadSplat 的 rendering-aware importance pruning。对高斯 $i$，统计它在所有训练相机、所有像素上的 alpha blending 权重，并取其中最大值作为重要性分数 $\tau_i$。

这比只看原始不透明度更合理：一个高斯即使 $o_i$ 不低，也可能长期被前景遮挡，对最终图像没有实际贡献。删除 $\tau_i$ 低于阈值的高斯，通常能以很小的画质损失换取更少的显存和计算。论文在标准 3DGS 训练过程中执行两次这种剪枝。

> **直觉：** 不透明度回答“它自己有多实”；rendering importance 回答“考虑遮挡和混合以后，摄像机真的看见过它吗”。LODGE 后续构造 LoD 层和 chunk 可见性集合时，都复用了后一种判据。

---

## 2. 多层 LoD 表示：距离越远，表示越粗

### 2.1 LoD 层与 active Gaussians

LODGE 用多个高斯集合表示同一个场景：

$$
\mathcal G^{(0)},\mathcal G^{(1)},\ldots,\mathcal G^{(L-1)}.
$$

其中 $\mathcal G^{(0)}$ 是在原始训练图像上优化出的最精细模型；$l$ 越大，该层面向的观察距离越远，细节越低、高斯越少。

给定深度阈值

$$
d_0=0<d_1<\cdots<d_L=\infty,
$$

以及当前相机中心 $\mathbf c$，真正送入渲染器的 **active Gaussians** 为：

$$
\widetilde{\mathcal G}(\mathbf c)
=\bigcup_{l=0}^{L-1}
\left\{
g_i\in\mathcal G^{(l)}:
d_l\le \lVert\mu_i^{(l)}-\mathbf c\rVert_2<d_{l+1}
\right\}. \tag{2}
$$

式 (2) 看起来复杂，其实只是在做“按距离选档”：

- 距离在 $[d_0,d_1)$：用最细的 $\mathcal G^{(0)}$；
- 距离在 $[d_1,d_2)$：用较粗的 $\mathcal G^{(1)}$；
- 更远的区域依次使用更粗层。

注意它不是为整帧只选一个 LoD，而是**同一帧混合多个层级**：相机附近来自精细层，远处来自粗糙层。

### 2.2 为什么 LoD 能让 tile-based rasterization 真正加速

如果只删远处的细节而不考虑光栅化过程，很容易误以为“远处高斯投影很小，本来就不贵”。但大规模场景里，远处通常有数量巨大的高斯；大量投影同时落入少数 tiles，会形成很长的 per-pixel visible Gaussian 列表。

LoD 用少量更大的粗层高斯替代大量细小高斯后，论文 Figure 3 中可见高斯数量直方图的长尾被大幅截短：完整表示里，个别像素可见高斯数延伸到约千级；LoD 后尾部在约两百多个高斯附近结束。**加速的核心不是让每个高斯变便宜，而是让拥挤像素不再处理成百上千个高斯。**

---

## 3. 如何构造低细节层：先平滑，再剪枝，再微调

### 3.1 从采样理论看“远处需要多大的高斯”

LODGE 的 LoD 构建借用了 Mip-Splatting 的 3D 平滑思想。图像像素是对连续三维场景投影后的离散采样。屏幕空间采样间隔为 1 像素时，在焦距 $f$、深度 $d$ 处对应的世界空间间隔为：

$$
T=\frac{d}{f}.
$$

相机越远，$d$ 越大，一个像素覆盖的世界空间越大。根据 Nyquist 采样直觉，小于约 $2T$ 的结构在这个距离上已经无法可靠重建；继续保留大量比像素 footprint 更细的高斯，不仅不会带来可见细节，还会增加显存、排序与混合开销，并产生混叠。

所以目标不是粗暴删点，而是先把高频细节低通掉：对原高斯增加一个随目标观察深度 $d_l$ 增大的 3D smoothing filter。论文写成：

$$
\widetilde G(\mathbf x)
=\sqrt{\frac{|\Sigma|}{\left|\Sigma+\frac{s d_l}{f}\mathbf I\right|}}
\exp\left[
-\frac{1}{2}(\mathbf x-\mu)^T
\left(\Sigma+\frac{s d_l}{f}\mathbf I\right)^{-1}
(\mathbf x-\mu)
\right], \tag{3}
$$

其中 $s$ 是超参数。随着目标深度 $d_l$ 增大，协方差中的平滑项变强，高斯覆盖范围扩大；行列式比例构成的前因子用于补偿高斯变宽带来的幅度变化。

> **一句话读懂式 (3)：** 它在模拟“站到 $d_l$ 之外时，一个像素已经看不清更小结构”的事实，先把不可能稳定采样的高频细节烘焙进更平滑的表示。

### 3.2 为什么平滑以后还要剪枝

仅仅把高斯变宽，并不会直接减少高斯数量。但平滑后，邻近高斯的贡献会更重叠：多个细高斯原本分别负责的局部细节，现在可以由更少的宽高斯表达。于是许多高斯在 alpha compositing 中变得冗余，importance score 会下降。

LODGE 对每个低细节层执行以下流程：

1. 从最精细的 $\mathcal G^{(0)}$ 复制高斯；
2. 按该层目标深度 $d_l$ 加入式 (3) 的 3D 平滑；
3. 根据 rendering importance 迭代删除不再重要的高斯；
4. 每轮剪枝后做少量 fine-tuning，修补剪枝造成的误差；
5. 当前层稳定后，继续优化下一个更粗的层。

这个顺序非常重要：**平滑制造冗余，剪枝兑现压缩，微调恢复画质。** 如果直接从精细层猛烈剪枝，模型更容易留下孔洞；如果只平滑不剪枝，画面可能对了，但速度和显存没有真正下降。

---

## 4. 深度阈值怎么选：优化 tile 代价，而不是凭距离拍脑袋

LoD 层构造好以后，还需要决定 $d_1,d_2,\ldots$：距离多远时应该从细层切到粗层？

一个看似自然的目标是最小化全场景高斯数，但这并不等价于最快渲染。3DGS 以 $16\times16$ tiles 工作，真正限制性能的是同一 tile 内需要处理的高斯数。因此 LODGE 定义了一个经验代价：

1. 取一小部分训练视图；
2. 对候选深度阈值组合进行渲染；
3. 统计每个 tile 处理的高斯数；
4. 选择 **平均每 tile 高斯数最小** 的阈值。

如果对所有 $L-1$ 个阈值做联合网格搜索，复杂度会随维度爆炸。论文观察到相邻最优阈值大致落在形如

$$
\{(x,ax+b):x\in\mathbb R\}
$$

的近线性关系上。因此可以从 $d_1$ 开始，逐层贪心加入新阈值，把原本的高维搜索化成一系列一维搜索。

> **这里的关键选择：** 阈值不是为了让各距离段包含相同数量的高斯，也不是简单等距划分；它直接对准渲染器的工作单位 tile。优化指标与真正瓶颈一致，LoD 才能转化成 FPS。

---

## 5. Chunk-based rendering：把“每帧筛选”变成“分区预计算”

### 5.1 为什么有 LoD 以后仍然会爆显存

到目前为止，LoD 已经减少了每帧实际参与光栅化的 visible Gaussians，但各层 $\mathcal G^{(l)}$ 仍然要放在 GPU 中，且相机每移动一帧都要按式 (2) 重新计算 active set。对于大型场景，这带来两个问题：

- 多层模型全部常驻显存，移动 GPU 可能根本装不下；
- 逐帧对全场景做距离筛选，有额外计算开销。

LODGE 的处理是把训练相机位置用 K-means 聚成多个 chunks。对每个 chunk 中心 $\mathbf m_k$，只计算一次式 (2)，把结果保存为该 chunk 的 active Gaussians。运行时根据相机位置找到最近 chunk，直接使用预计算集合。

### 5.2 Chunk 不是空间裁剪盒

这是全文最容易误读的一点：一个 chunk 的 active set **不只是落在该空间块边界内的高斯**。它代表从该相机活动区域观察时所需的**整个场景**：靠近 chunk 中心的区域用高 LoD，远处区域用低 LoD。

可以把它理解成“站在这个街区时应该装入哪一版世界”，而不是“只装这个街区的几何”。这样从 chunk 内看向远方时，远景仍然完整，只是细节层级更低。

### 5.3 为什么阈值要加上 chunk 半径

预计算发生在 chunk 中心，但真实相机可能位于 chunk 边缘。如果完全按中心距离选层，一个对中心来说足够远的区域，对边缘相机可能已经很近，却仍使用低 LoD，导致细节不足。

因此论文用 **chunk radius** 修正深度阈值；这里的 radius 定义为该 chunk 中心到下一个最近 chunk 中心的距离，为 chunk 内的位置变化留出安全余量。直觉上相当于保守地把 LoD 切换边界向外推，使 chunk 内相机偏离中心后仍能获得足够分辨率。

---

## 6. Chunk 内可见性过滤：只保留“从这里真的用得到”的高斯

即使经过距离 LoD，一个 chunk 的 active set 里仍可能包含从这个相机区域完全看不到，或因遮挡几乎没有贡献的高斯。LODGE 再次使用 per-Gaussian importance：针对每个 LoD chunk 计算贡献，删除低于固定阈值的高斯。

为了让过滤更稳健，论文没有只使用训练相机的原始朝向，而是：

- 保留原相机位置；
- 对朝向加入随机扰动，生成额外观察方向；
- 在这些视图上共同计算重要性。

如果连位置和朝向都严格照搬训练集，确实还能删掉更多高斯，但代价是泛化脆弱：用户快速旋转相机，或使用更大的 field of view 时，会突然看见从未被原训练朝向覆盖的区域，此时被误删的高斯无法恢复，画面就会出现空洞。随机方向是在**压缩率与自由浏览鲁棒性**之间做的折中。

---

## 7. Opacity blending：为什么同时加载两个 chunks

### 7.1 直接切换为什么会 popping

相机跨过 Voronoi 边界、最近 chunk 从 $A$ 变成 $B$ 时，如果直接把 active set $\mathcal A$ 替换为 $\mathcal B$，大量高斯会在同一帧出现或消失。即使两组各自都能高质量重建，集合的离散变化仍会形成明显闪变。

LODGE 因此同时取离相机最近的两个 chunk，合并它们的 active sets：

- 两组交集中的高斯始终正常渲染；
- 只属于某一组的高斯，用连续变化的不透明度权重淡入 / 淡出。

### 7.2 插值权重的几何含义

设当前相机为 $\mathbf c$，某个差集高斯属于中心 $\mathbf m_f$ 的 chunk，另一个最近 chunk 的中心为 $\mathbf m_o$。先把相机相对 $\mathbf m_o$ 的位移投影到两个中心连线上：

$$
\bar t=
\frac{(\mathbf c-\mathbf m_o)^T(\mathbf m_f-\mathbf m_o)}
{\lVert\mathbf m_o-\mathbf m_f\rVert_2^2},
\qquad
t=\min(1,\max(0,\bar t)),
$$

再修改该高斯的不透明度：

$$
\widehat\alpha_i=\alpha_i t. \tag{4}
$$

如何读这个式子：

- 相机位于 $\mathbf m_o$ 附近时，$t\approx0$，属于 $\mathbf m_f$ 的独有高斯接近透明；
- 相机沿两个中心方向移动时，$t$ 连续增大；
- 到达 $\mathbf m_f$ 附近时，$t\approx1$，该高斯恢复完整不透明度；
- `clamp` 把中心连线范围外的权重限制在 $[0,1]$。

论文使用**投影长度**而不是相机到中心的欧氏距离。这样，即便相机没有恰好穿过 chunk 中心，只要沿着两个中心的主方向移动，混合权重也会稳定单调变化，过渡更平滑。

### 7.3 为什么额外计算并没有想象中大

朴素理解会觉得“同时画两块”把成本翻倍，但实际只有两个集合的**对称差**需要更新不透明度；交集中的高斯无需修改。取并集以后仍走标准 3DGS rasterization。

数据加载也可以放到后台：

1. 初始加载最近两个 chunks 的高斯属性；
2. 相机移动期间只更新两组差集的不透明度；
3. 越过最近 chunk 的中心后，卸载已经远离的 chunk；
4. 保留当前最近 chunk，并预取下一个 chunk。

切换时，当前最近 chunk 的权重已经接近 1。即使下一块加载稍有延迟，也不会立刻出现空洞，从而给异步 I/O 留出了缓冲时间。

---

## 8. 实验结果应该怎么看

论文在 Hierarchical 3DGS 的 SmallCity 和 Campus 大场景上比较了多种方法。截图中的 Table 1 显示：

| Scene | Method | PSNR ↑ | SSIM ↑ | LPIPS ↓ | #G ↓ | FPS ↑ |
|---|---|---:|---:|---:|---:|---:|
| SmallCity | 3DGS | 25.42 | 0.776 | 0.394 | 1375K | 85.25 |
| SmallCity | FLoD | 24.82 | 0.758 | 0.429 | 497K | 208.41 |
| SmallCity | **LODGE** | **26.57** | **0.815** | **0.325** | 877K | **257.46** |
| Campus | 3DGS | 24.14 | 0.785 | 0.430 | 1142K | 47.38 |
| Campus | FLoD | 24.10 | 0.777 | 0.453 | 595K | 120.61 |
| Campus | **LODGE** | **24.75** | **0.803** | **0.394** | 1464K | **218.96** |

这里有一个很值得注意的现象：**LODGE 并不总是以最少的 `#G` 取胜。** 例如 Campus 上它的高斯数高于 3DGS 和 FLoD，却仍有最高 FPS。这恰好支持前面的分析：tile-based 3DGS 的速度不由全局高斯总数单独决定；LoD 是否削掉了 per-tile / per-pixel 可见高斯长尾、chunk 是否避免加载无关集合，同样关键。

从项目页的定性与视频结果看，opacity blending 会牺牲一部分纯粹追求速度时的峰值 FPS，但能消除没有混合时明显的跨 chunk 突变。换句话说，它是用少量运行时成本换时间一致性。

---

## 9. 最容易混淆的四组概念

### 9.1 LoD layer 与 chunk

- **LoD layer**：同一个世界的不同频率 / 精度版本，回答“这个距离应该看多细”。
- **chunk**：相机可能活动的区域，回答“站在这里应该预先加载哪些高斯”。

每个 chunk 的 active set 会同时从多个 LoD layers 中取数据。

### 9.2 Smoothing 与 pruning

- **Smoothing**：让表示符合远距离采样率，把不可见的高频细节合并掉。
- **Pruning**：删除平滑以后变得冗余的高斯，真正降低数量。

前者为后者创造条件，后者把条件变成显存与速度收益。

### 9.3 Active Gaussian 与 visible Gaussian

- **Active Gaussian**：根据 LoD 距离、chunk 和离线可见性规则，允许进入当前渲染的候选集合。
- **Visible Gaussian**：投影、遮挡和 alpha blending 后，对某个像素实际产生贡献的高斯。

active set 是运行时粗筛，visible list 是光栅化中的实际工作量。

### 9.4 LODGE 与连续 LoD 方法

LODGE 使用多个离散高斯层，并通过 chunk 间 opacity blending 解决空间分区切换；它的重点是**大场景实时渲染与显存管理**。CLoD-GS 则给每个高斯学习距离衰减参数，用单一模型和连续虚拟距离控制细节，重点是**单模型连续质量伸缩**。二者都在做 LoD，但“层级怎么表示、过渡在哪里发生、主要系统瓶颈是什么”并不相同。

---

## 10. 一条主线回顾

LODGE 从 3DGS 的真实渲染瓶颈出发：远处海量细小高斯虽然对图像贡献有限，却会堆进同一批 $16\times16$ tiles，拉长像素的排序与 alpha blending 列表。它先依据目标深度对精细模型做 3D 低通平滑，让远距离不可采样的细节合并；再用 importance pruning 删除由此产生的冗余，并用少量微调恢复画质。运行时按距离从多个层中组成 active set，从而缩短可见高斯长尾。

但多层模型仍可能占满显存，也不适合每帧全局重算。于是 LODGE 聚类相机位置，把 active set 离线预计算成 chunks，再用带随机方向增强的可见性过滤压缩每块。最后同时加载最近两个 chunks，对二者差集做基于中心连线投影的不透明度插值，使高斯连续淡入淡出，并为后台预取留出时间。

因此它的完整逻辑不是“LoD + 分块”两个孤立技巧，而是一条相互咬合的系统设计：**采样理论决定远处应保留什么频率，importance pruning 决定哪些基元可以删，tile 代价决定在哪里切层，camera chunks 决定显存里装什么，opacity blending 决定切换时如何不闪。**

---

## 11. 相关链接

- [LODGE 项目主页](https://lodge-gs.github.io/) —— 视频、可视化结果与论文入口。
- [LODGE 论文](https://arxiv.org/abs/2505.23158) —— NeurIPS 2025 Spotlight。
- [3D Gaussian Splatting 阅读报告](/reading/3d-gaussian-splatting) —— tile-based rasterization 与 alpha blending 基础。
- [Mip-Splatting 阅读报告](/reading/mip-splatting) —— LODGE 构建低细节层时采用的 3D smoothing / Nyquist 直觉。
- [CLoD-GS 阅读报告](/reading/clod-gs) —— 可对照理解离散多层 LoD 与单模型连续 LoD 的区别。
