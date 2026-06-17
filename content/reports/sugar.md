---
title: "SuGaR: Surface-Aligned Gaussian Splatting for Efficient 3D Mesh Reconstruction and High-Quality Mesh Rendering"
date: "2026-06-16"
excerpt: "三步把杂乱的 3DGS 整理成可抽网格的形态：表面对齐正则化 → 水平集采点 + 泊松重建抽网格 → 把薄高斯绑回三角形联合优化，得到可编辑、可渲染的网格 + 高斯混合表示。"
tags: ["Computer Graphics", "Gaussian Splatting", "Mesh Reconstruction"]
---

# SuGaR 阅读笔记

> **SuGaR: Surface-Aligned Gaussian Splatting for Efficient 3D Mesh Reconstruction and High-Quality Mesh Rendering**
> Antoine Guédon, Vincent Lepetit — CVPR 2024
> [arXiv 2311.12775](https://arxiv.org/abs/2311.12775) · [项目主页](https://anttwo.github.io/sugar/) · [代码](https://github.com/Anttwo/SuGaR)

## TL;DR

3DGS 渲染质量高、训练快,但优化后的高斯杂乱无章,直接抽网格非常困难。SuGaR 的做法是分三步:**(1)** 用一个正则项逼高斯变扁、贴合并均匀分布在场景表面;**(2)** 利用这种对齐,从密度的水平集采点 + 泊松重建快速抽出网格;**(3)** 把新的薄高斯重新绑定到网格三角形上联合优化,得到一个可编辑、可渲染的"网格 + 高斯"混合表示。整条流程在单卡上几分钟到一小时内完成。

## 背景(简述)

从隐式 SDF 抽网格通常靠 Marching Cubes,慢且依赖体素分辨率;NeRF 类方法抽出的网格往往粗糙。3DGS 是显式离散表示,但高斯本身既不扁也不贴表面,法向无意义,没法直接得到干净几何。SuGaR 的核心贡献就是先用正则化把"杂乱椭球"整理成"贴表面的薄片",再用经典几何处理(泊松重建)拿网格。

---

## 方法

### 1. 表面对齐正则化(§4.1)

**密度函数。** 给定高斯泼溅场景,空间任意点 $p$ 的密度由所有高斯按 alpha 混合系数加权求和:

$$d(p) = \sum_g \alpha_g \exp\!\left(-\tfrac{1}{2}(p-\mu_g)^{T}\Sigma_g^{-1}(p-\mu_g)\right) \tag{1}$$

其中 $\mu_g,\,\Sigma_g,\,\alpha_g$ 分别是高斯的中心、协方差和混合系数。

**理想情形下只剩最近高斯。** 如果高斯已经分布良好且贴合表面,它们彼此重叠很小。此时对表面附近的点 $p$,贡献最大的那个高斯 $g^*$ 远盖过其余,密度可近似为单项:

$$\alpha_{g^*}\exp\!\left(-\tfrac{1}{2}(p-\mu_{g^*})^{T}\Sigma_{g^*}^{-1}(p-\mu_{g^*})\right) \tag{2}$$

$$g^* = \arg\min_g\Big\{(p-\mu_g)^{T}\Sigma_g^{-1}(p-\mu_g)\Big\} \tag{3}$$

> **关于 (3) 取 min 而非 max:** 花括号里是平方马氏距离(恒非负),而单个高斯的贡献是 $\alpha_g\exp(-\tfrac12\times\text{马氏距离})$。马氏距离越小,贡献越大,所以"贡献最大的高斯"等价于"马氏距离最小的高斯"——文字说"最大"针对贡献,公式取 min 针对距离,指的是同一个 $g^*$。

**两个理想化假设。** 希望高斯 **(a)** 扁平(三个缩放因子里最小的 $s_g\to 0$,对应轴 $n_g$ 即表面法向),**(b)** 不半透明(要求 $\alpha_g = 1$,半透明的高斯渲染时直接移除)。在这两个假设下,密度退化为只由最近高斯决定的理想密度:

$$\bar d(p) = \exp\!\left(-\tfrac{1}{2 s_{g^*}^{2}}\,\langle p-\mu_{g^*},\, n_{g^*}\rangle^{2}\right) \tag{5}$$

其中用到了扁平近似:

$$(p-\mu_g)^{T}\Sigma_g^{-1}(p-\mu_g) \;\approx\; \frac{1}{s_g^{2}}\,\langle p-\mu_g,\, n_g\rangle^{2} \tag{4}$$

#### (4) 的推导

**① 协方差的谱分解。** 3DGS 把协方差写成 $\Sigma_g = R_g S_g^2 R_g^{T}$,其中 $R_g=[\,e_1\,|\,e_2\,|\,e_3\,]$ 是正交主轴,$S_g=\mathrm{diag}(s_1,s_2,s_3)$ 是各轴缩放。

**② 求逆。** 因 $R$ 正交、$S$ 对角,逆很干净——本质就是 $\Sigma_g^{-1}$ 的谱分解(特征值 $1/s_i^2$,特征向量为主轴 $e_i$):

$$\Sigma_g^{-1} = R_g S_g^{-2} R_g^{T} = \sum_{i=1}^{3}\frac{1}{s_i^{2}}\,e_i e_i^{T}$$

**③ 代回二次型。** 利用 $(p-\mu_g)^{T}e_i e_i^{T}(p-\mu_g)=\langle p-\mu_g,\,e_i\rangle^2$,马氏距离变成沿三个主轴投影的加权平方和:

$$(p-\mu_g)^{T}\Sigma_g^{-1}(p-\mu_g) = \sum_{i=1}^{3}\frac{1}{s_i^{2}}\,\langle p-\mu_g,\,e_i\rangle^{2}$$

**④ 扁平极限。** 记最小缩放因子 $s_g := s_{\min}$,对应轴 $n_g$(法向)。当高斯被压扁、$s_g\to 0$ 时,系数 $1/s_g^2\to\infty$ 把另外两项有限的 $1/s_2^2,\,1/s_3^2$ 彻底盖过,只剩法向一项,即得 (4)。

> **几何直观:** 扁高斯是一张薄煎饼,$n_g$ 是它的法线,$\langle p-\mu_g, n_g\rangle$ 就是 $p$ 到煎饼所在平面的带符号垂直距离。马氏距离几乎只取决于"沿法向偏离平面多远、再除以煎饼多薄";面内平移几乎不影响。这正是正则化想要的效果——逼高斯变扁、贴表面,法向才有意义。

**从密度到 SDF。** 对理想密度 $\bar d$ 反解(取对数移项),得到对应表面的带符号距离:

$$\bar f(p) = \pm\, s_{g^*}\sqrt{-2\log\big(\bar d(p)\big)} \tag{6}$$

更一般地,对**真实密度** $d$(而非 $\bar d$)套用同一关系,定义理想距离函数(原文 erratum 订正过这里用的是 $d$):

$$f(p) = \pm\, s_{g^*}\sqrt{-2\log\big(d(p)\big)} \tag{7}$$

在理想情形 $d = \bar d$ 时,$f$ 就对应场景真实表面。

**正则项。** 采样一组点 $\mathcal P$,惩罚"解析理想 SDF $f(p)$" 与 "当前表面 SDF 的估计 $\hat f(p)$" 之间的差异:

$$\mathcal R = \frac{1}{|\mathcal P|}\sum_{p\in\mathcal P}\big|\hat f(p) - f(p)\big| \tag{8}$$

* $f(p)$:由 (7) 从密度解析算出的理想 SDF。
* $\hat f(p)$:当前高斯所成表面的廉价估计——用训练视角的高斯深度图,$\hat f(p)$ 取 $p$ 的深度与其投影处深度图值之差(见原文 Fig. 5)。深度图可直接扩展光栅化器高效渲染。
* 采样点按高斯分布取,因为这些位置对 $\mathcal R$ 梯度大、信息量高:

$$p \sim \prod_g \mathcal N(\,\cdot\,;\,\mu_g,\,\Sigma_g) \tag{9}$$

**法向正则项。** 额外约束 SDF 的梯度方向(即表面法向)与最近高斯的法向轴 $n_{g^*}$ 一致:

$$\mathcal R_{\mathrm{Norm}} = \frac{1}{|\mathcal P|}\sum_{p\in\mathcal P}\left\|\frac{\nabla f(p)}{\lVert\nabla f(p)\rVert_2} - n_{g^*}\right\|_2^{2} \tag{10}$$

### 2. 高效网格提取(§4.2)

思路:在密度的**水平集**(由参数 $\lambda$ 指定)上采一批带法向的点,再跑泊松重建得到网格。比 Marching Cubes 快、可扩展、保细节。难点在于高效地找到落在水平集上的点:

1. 仍借助各训练视角下的高斯深度图。对深度图上随机采的像素 $m$,沿其视线方向 $v$ 采 $n$ 个点 $p + t_i v$,其中 $p$ 是深度图给出的 3D 点,$t_i\in[-3\sigma_g(v),\,3\sigma_g(v)]$,$\sigma_g(v)$ 是该高斯沿相机方向的标准差(对应 1D 高斯 99.7% 置信区间)。
2. 用 (1) 算出这些点的密度 $d_i = d(p + t_i v)$。若存在 $i,j$ 使 $d_i < \lambda < d_j$,说明这段里有一个水平集交点;线性插值求系数 $t^*$,使 $d(p + t^* v) = \lambda$,取离相机最近的那个作为表面点 $\hat p$。
3. 表面点法向取密度梯度的归一化解析值 $\dfrac{\nabla d(\hat p)}{\lVert\nabla d(\hat p)\rVert_2}$。
4. 对所有"水平集点 + 法向"做泊松重建,得到表面网格。

### 3. 把新高斯绑定到网格(§4.3)

抽出初始网格后,再精炼:给每个三角形按预定义的重心坐标绑定 $n$ 个薄高斯(三角形越多则每片绑的越少),高斯均值由网格顶点经重心坐标显式计算。对原始 3DGS 结构做两处修改以保证高斯始终扁平、与三角形对齐:

* 每个高斯只学 **2 个**缩放因子(而非 3 个);
* 二维旋转用**复数**而非四元数编码。

此外每个高斯仍保留不透明度和一组球谐系数来编码各向异性颜色。随后用 GS 光栅化器对网格与绑定高斯做**联合优化**,得到可用传统 DCC 工具(Blender / Unity / Unreal)编辑、又能高质量渲染的混合表示。

---

## 小结

SuGaR 的关键不是抽网格本身,而是**先把高斯整理成可被经典几何处理消费的形态**:扁、不透明、贴表面、法向明确。一旦做到这点,泊松重建这种成熟工具就能廉价地接管。最终的"网格 + 绑定高斯"混合表示把可编辑性(改网格)和高质量渲染(高斯光栅化)解耦,是它实用价值的来源。

需要注意:输出仍是**三角网格**(泊松重建天然如此),拓扑质量(edge flow、四边形规整度)不在其优化目标内;若需要 quad-dominant 网格,得在导出三角网格后另接独立的 remeshing 步骤。

## 相关链接

* [3D Gaussian Splatting：显式辐射场与可微光栅化](/reading/3d-gaussian-splatting) —— SuGaR 的底座表示
* [Simplifying Surfaces with Color and Texture using Quadric Error Metrics](/reading/generalized-qem) —— 网格简化用的 QEM
* [Single Edge Collapse Quad-Dominant Mesh Reduction](/reading/mesh-reduction-knodt) —— 三角网格转 quad-dominant 的后处理
