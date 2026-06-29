---
title: "Gaussian Opacity Fields: 无界场景的高效自适应表面重建"
date: "2026-06-29"
excerpt: "精读 GOF 的方法部分：显式射线-高斯相交定义的不透明度场、多视角取 min 的空间雕刻思想，以及四面体网格 + Marching Tetrahedra + 二分搜索水平集的紧凑表面提取。"
tags: ["Computer Graphics", "Gaussian Splatting", "Surface Reconstruction"]
---

# Gaussian Opacity Fields (GOF) —— Method 部分阅读报告

> 论文主题：从 3D Gaussian Splatting (3DGS) 直接构建 **高斯不透明度场 (Gaussian Opacity Fields, GOF)**，
> 实现高效训练、直接的水平集表面提取（无需 Poisson 重建或 TSDF 融合），并用四面体网格 + Marching Tetrahedra
> 提取自适应、紧凑、细节丰富的网格。

---

## 0. 总览：Method 在解决什么

给定多张已标定、已知位姿的图像，目标是在 **高效重建 3D 场景** 的同时，支持 **细节丰富且紧凑的表面提取** 和 **照片级真实的新视角合成 (NVS)**。整条 Method 的逻辑链是：

1. **§3.1 建模**：用一组 3D 高斯基元表示场景（沿用 3DGS）。
2. **§3.2 GOF**：通过 **显式射线-高斯相交 (ray-Gaussian intersection)** 而非投影，定义任意 3D 点沿射线的不透明度，再对所有训练视角取 **最小值** 得到与视角无关的不透明度场 `O(x)`。
3. **§3.3 优化**：在纯光度损失之外，引入 **深度畸变损失** 和 **法向一致性损失** 两个正则项（扩展自 2DGS），并配合 **改进的稠密化策略**。
4. **§3.4 表面提取**：用 **四面体网格 (tetrahedral grid)** + **Marching Tetrahedra** + **二分搜索水平集** 提取自适应紧凑网格。

核心创新点在于：**不透明度可在任意 3D 点求值**（投影方法做不到，因为 3D→2D 投影丢失了 3D 信息），这使得 GOF 与体渲染过程保持一致，从而能够直接通过识别水平集来提取表面。

---

## 1. §3.1 建模 (Modeling)

场景由一组 3D 高斯基元表示：

$$
\{\mathcal{G}_k \mid k = 1, \cdots, K\}
$$

每个 3D 高斯 $\mathcal{G}_k$ 由 **中心** $\mathbf{p}_k \in \mathbb{R}^3$、**缩放矩阵** $\mathbf{S}_k \in \mathbb{R}^{3\times 3}$、以及由四元数参数化的 **旋转矩阵** $\mathbf{R}_k \in \mathbb{R}^{3\times 3}$ 共同定义：

$$
\mathcal{G}_k(\mathbf{x}) = e^{-\frac{1}{2}(\mathbf{x}-\mathbf{p}_k)^T \Sigma_k^{-1}(\mathbf{x}-\mathbf{p}_k)} \tag{1}
$$

其中协方差矩阵定义为：

$$
\Sigma_k = \mathbf{R}_k \mathbf{S}_k \mathbf{S}_k^T \mathbf{R}_k^T
$$

**说明**：$\mathbf{S}_k$ 是对角缩放矩阵，$\mathbf{R}_k$ 是旋转矩阵。把缩放和旋转分开参数化保证了 $\Sigma_k$ 始终是合法的半正定协方差矩阵。

---

## 2. §3.2 高斯不透明度场 (Gaussian Opacity Fields)

### 2.1 射线-高斯相交 (Ray-Gaussian Intersection)

与 3DGS "把高斯投影到 2D 屏幕再求值" 不同，GOF 直接计算 **一个高斯对一条射线的贡献**，即显式求射线与高斯的相交。这至关重要：它使得 **任意 3D 点** 的不透明度都能被求值，而投影方法在 3D→2D 投影时丢失了 3D 信息。

相交点定义为 **高斯沿射线达到最大值的点**。给定相机中心 $\mathbf{o} \in \mathbb{R}^3$ 和射线方向 $\mathbf{r} \in \mathbb{R}^3$，射线上任意点写作：

$$
\mathbf{x} = \mathbf{o} + t\mathbf{r}
$$

其中 $t$ 是射线的深度。先把点 $\mathbf{x}$ 变换到该 3D 高斯的局部坐标系，并按其缩放归一化：

$$
\mathbf{o}_g = \mathbf{S}_k^{-1}\mathbf{R}_k(\mathbf{o} - \mathbf{p}_k) \tag{2}
$$

$$
\mathbf{r}_g = \mathbf{S}_k^{-1}\mathbf{R}_k\mathbf{r} \tag{3}
$$

$$
\mathbf{x}_g = \mathbf{o}_g + t\mathbf{r}_g \tag{4}
$$

**推导说明（公式2-4 的来历）**：目标是把 (1) 中的二次型 $(\mathbf{x}-\mathbf{p}_k)^T\Sigma_k^{-1}(\mathbf{x}-\mathbf{p}_k)$ 化简为标准单位球高斯 $\mathbf{x}_g^T\mathbf{x}_g$。利用 $\Sigma_k^{-1} = \mathbf{R}_k \mathbf{S}_k^{-1}\mathbf{S}_k^{-1}\mathbf{R}_k^T$（其中用到 $\mathbf{R}_k$ 正交、$\mathbf{S}_k$ 对角），令 $\mathbf{x}_g = \mathbf{S}_k^{-1}\mathbf{R}_k(\mathbf{x}-\mathbf{p}_k)$ 即得 $(\mathbf{x}-\mathbf{p}_k)^T\Sigma_k^{-1}(\mathbf{x}-\mathbf{p}_k)=\mathbf{x}_g^T\mathbf{x}_g$。三步几何含义：① 平移到高斯中心（减 $\mathbf{p}_k$）；② 旋转对齐到高斯主轴；③ 除以缩放（乘 $\mathbf{S}_k^{-1}$）把椭球归一化为单位球。代入 $\mathbf{x}=\mathbf{o}+t\mathbf{r}$ 即把射线原点与方向分别变换为 $\mathbf{o}_g$、$\mathbf{r}_g$。

在该局部坐标系中，高斯沿射线的取值退化为一个 **1D 高斯**：

$$
\mathcal{G}_k^{1D}(t) = e^{-\frac{1}{2}\mathbf{x}_g^T\mathbf{x}_g} = e^{-\frac{1}{2}(\mathbf{r}_g^T\mathbf{r}_g\,t^2 + 2\mathbf{o}_g^T\mathbf{r}_g\,t + \mathbf{o}_g^T\mathbf{o}_g)} \tag{5}
$$

公式 (5) 的最大值在二次项取极值时达到。其闭式解为：

$$
t^* = -\frac{B}{A} \tag{6}
$$

其中 $A = \mathbf{r}_g^T\mathbf{r}_g$，$B = \mathbf{o}_g^T\mathbf{r}_g$。

**说明**：该公式与 [Keselman and Hebert 2022] 在世界空间中直接计算射线-高斯相交的结果等价。但使用归一化高斯坐标（变换射线）能给出更清晰的几何解释，并简化后续 §3.3 中相交平面法线的定义。

由此定义高斯 $\mathcal{G}_k$ 对给定相机中心 $\mathbf{o}$ 和射线方向 $\mathbf{r}$ 的贡献为：

$$
\mathcal{E}(\mathcal{G}_k, \mathbf{o}, \mathbf{r}) = \mathcal{G}_k^{1D}(t^*) \tag{7}
$$

### 2.2 体渲染 (Volume Rendering)

与 3DGS 类似，相机射线的颜色按基元的深度顺序 $1, \cdots, K$ 进行 alpha 混合：

$$
\mathbf{c}(\mathbf{o}, \mathbf{r}) = \sum_{k=1}^{K} \mathbf{c}_k\, \alpha_k\, \mathcal{E}(\mathcal{G}_k, \mathbf{o}, \mathbf{r}) \prod_{j=1}^{k-1}\big(1 - \alpha_j\, \mathcal{E}(\mathcal{G}_j, \mathbf{o}, \mathbf{r})\big) \tag{8}
$$

其中 $\mathbf{c}_k$ 是用球谐函数建模的视角相关颜色，$\alpha_k \in [0,1]$ 是影响高斯 $k$ 不透明度的附加参数。渲染时采用与 3DGS 相同的基于 tile 的渲染流程。

### 2.3 不透明度场的定义

**单高斯沿射线的不透明度**：先考虑射线上只有单个高斯 $\mathcal{G}_k$ 的情形，定义射线上任意 3D 点的不透明度为：

$$
\mathbf{O}_k(\mathcal{G}_k, \mathbf{o}, \mathbf{r}, t) = \begin{cases} \mathcal{G}_k^{1D}(t) & \text{if } t \le t^* \\ \mathcal{G}_k^{1D}(t^*) & \text{if } t > t^* \end{cases} \tag{9.pre}
$$

其中 $\mathbf{x} = \mathbf{o} + t\mathbf{r}$。

**直观理解**：不透明度（即透射率的反面）沿射线 **单调增加直到达到最大值，之后保持恒定**（见论文 Fig.2）。即过了最浓点 $t^*$ 之后不透明度不再下降而是饱和。

**多高斯沿射线的不透明度**：类似公式 (8) 的体渲染过程，射线上任意点的累积不透明度定义为：

$$
\mathbf{O}(\mathbf{o}, \mathbf{r}, t) = \sum_{k=1}^{K} \alpha_k\, \mathbf{O}_k(\mathcal{G}_k, \mathbf{o}, \mathbf{r}, t)\prod_{j=1}^{k-1}\big(1 - \alpha_j\, \mathbf{O}_j(\mathcal{G}_j, \mathbf{o}, \mathbf{r}, t)\big) \tag{9}
$$

**关键理解（重要）**：$\mathbf{O}(\mathbf{o},\mathbf{r},t)$ 是 **沿射线累积** 的不透明度，而非点 $\mathbf{x}$ 自身的局部密度。它对应物理上的 $1-$透射率，衡量 "从相机到 $\mathbf{x}$ 这一路上光线被遮挡的程度"。因此被前景遮挡的视角，因射线在到达 $\mathbf{x}$ 之前已撞上前景，其累积不透明度反而是 **高** 的。

**与视角无关的不透明度场（取最小值）**：由于一个 3D 点可能被 **任意** 训练视角看到，定义点 $\mathbf{x}$ 的不透明度为所有训练视角/观察方向中的 **最小** 不透明度值：

$$
\mathbf{O}(\mathbf{x}) = \min_{(\mathbf{o}, \mathbf{r})} \mathbf{O}(\mathbf{o}, \mathbf{r}, t) \tag{10}
$$

我们称 $\mathbf{O}(\mathbf{x})$ 为 **高斯不透明度场 (GOF)**。

**为什么取 min（重要）**：min 是在 **有限的训练视角集合** 上取的，不是全空间所有方向（每个训练相机到 $\mathbf{x}$ 唯一确定一条射线，方向不可任选）。其逻辑来自 **空间雕刻 (space carving)**：

- "点是实体" 需要 **所有** 视角都确认（for all）→ 对应取 min（min 高 ⟺ 每个视角都高）；
- "点是空的" 只需 **存在一个** 视角能看穿（exists）→ 一个反例即可证伪。

这种保守/从严策略恰好对抗 3DGS 容易产生的悬浮物 (floater)。GOF 与 **视觉外壳 (visual hull)** 或 **空间雕刻** 思路相似，但传统空间雕刻每条射线的可见性是 0/1 二值，而 GOF 用体渲染让每个点的不透明度是连续值。这使得 GOF 可以直接通过识别其水平集来提取表面（类似 UNISURF），无需 Poisson 重建或 TSDF 融合。

> **备注（命名）**："Opacity along the ray" 重点在 *along the ray*，它是沿射线积累的不透明度（accumulated opacity / $1-$透射率），而非某点的局部不透明度。更精确的叫法是 "累积不透明度"。

---

## 3. §3.3 优化 (Optimization)

纯光度损失会导致重建欠约束、有噪声。因此扩展 2DGS 的正则项：**深度畸变损失** 与 **法向一致性损失**。

### 3.1 深度畸变损失 (Depth Distortion)

将 Mip-NeRF 360 提出的深度畸变损失应用到射线-高斯相交，以使高斯沿射线集中：

$$
\mathcal{L}_d = \sum_{i,j} \omega_i \omega_j |t_i - t_j| \tag{11}
$$

其中 $i, j$ 索引对该射线有贡献的高斯，$t_i$ 是公式 (6) 中相交点的深度，混合权重为：

$$
\omega_i = \alpha_i\, \mathcal{E}(\mathcal{G}_i, \mathbf{o}, \mathbf{r})\prod_{j=1}^{i-1}\big(1 - \alpha_j\, \mathcal{E}(\mathcal{G}_j, \mathbf{o}, \mathbf{r})\big)
$$

**重要说明**：畸变损失会同时最小化高斯间的距离与各高斯的权重；而最小化权重可能使先被混合的高斯 alpha 值增大，产生夸大的高斯，导致悬浮物。因此 **将权重 $\omega_i$ 的梯度分离 (detach)**，只最小化高斯间的距离。

### 3.2 法向一致性损失 (Normal Consistency)

**问题（重要）**：把 2DGS 的法向一致性正则应用到 3D 高斯的关键难点是——**3D 高斯的梯度始终从中心向外**。考虑把单个各向同性 3D 高斯渲染到图像平面，得到一个 2D 高斯。该 2D 高斯的梯度始终从投影 2D 中心向外发散，意味着两个不同像素处渲染出的法线只要 "中心→像素" 方向不同就会不同；而且投影 2D 中心处的法线 **没有良好定义**。这种歧义使优化困难。

> **符号澄清**：高斯密度函数本身的梯度 $\nabla \mathcal{G}$ 指向中心（向内），因为 $\nabla \mathcal{G} = -(\mathbf{x}-\mathbf{p})\mathcal{G}$。论文所说 "向外" 指的是 **用作法线的 $-\nabla\mathcal{G}$**（表面法线按定义指向密度下降方向，即物体外侧），二者差一个负号。

**解法（相交平面法线的定义）**：为缓解上述问题，将 3D 高斯的法线定义为 **给定射线方向下，射线-高斯相交平面的法线**（论文 Fig.3）。步骤如下：

1. **变换射线到高斯坐标系并归一化**（用公式 3 的缩放）。在该归一化坐标系中，椭球高斯被拉成 **单位球**，相交点是射线到球心的最近点，该处相交平面 **垂直于射线**，故法线就是射线方向的反向 $-\mathbf{r}_g$。

2. **反归一化（反 scale）**：把法线乘 $\mathbf{S}_k^{-1}$，得到平面法线方向 $-\mathbf{S}_k^{-1}\mathbf{r}_g$。

3. **反 world-to-Gaussian 旋转**：再变换回世界空间，得到相交平面的法线方向：

$$
\mathbf{n}_i = -\mathbf{R}_k^T \mathbf{S}_k^{-1}\mathbf{r}_g
$$

随后应归一化为单位向量。

**重要说明**：在世界空间中，相交平面 **不一定** 垂直于射线方向（因为非均匀缩放 $\mathbf{S}_k$ 的拉伸），但平面的法线 **始终** 垂直于相交平面。

> **几何要点（重要）**：这里的 "相交平面" 不是射线截椭球的截面（那只是线段）。它是：射线先定出 "高斯沿射线最浓的点" $\mathbf{x}^*$（即 $t^*$ 处），再取高斯等值面在该点的 **切平面**。归一化空间里等值面是球、$\mathbf{x}^*$ 是最近点，故切平面垂直于射线，法线唯一且处处良定义——这正好治好了 "密度梯度法线放射状发散、中心未定义" 的毛病。

定义法线后，应用 **深度-法向一致性正则**：

$$
\mathcal{L}_n = \sum_i \omega_i (1 - \mathbf{n}_i^T \mathbf{N}) \tag{12}
$$

其中 $i$ 索引射线上相交的高斯，$\omega$ 是混合权重，$\mathbf{N}$ 是由深度图梯度估计的法线。当 $\mathbf{n}_i$ 与 $\mathbf{N}$ 完全同向时 $\mathbf{n}_i^T\mathbf{N}=1$，损失为 0。

### 3.3 最终损失 (Final Loss)

从一个初始稀疏点云出发，用多张已知位姿图像优化模型，总损失为：

$$
\mathcal{L} = \mathcal{L}_c + \alpha \mathcal{L}_d + \beta \mathcal{L}_n \tag{13}
$$

其中 $\mathcal{L}_c$ 是 RGB 重建损失，结合了 $\mathcal{L}_1$ 与来自 3DGS 的 D-SSIM 项；$\mathcal{L}_d$、$\mathcal{L}_n$ 是上述两个正则项。

**说明**：对 Tanks and Temples 数据集，采用 VastGaussian 提出的 **解耦外观建模 (decoupled appearance modeling)** 处理不均匀光照——用一个小卷积网络预测图像相关颜色，使模型不会伪造与几何不一致的光照。

### 3.4 改进的稠密化 (Improved Densification)

由于优化从稀疏点云开始，需增加 3D 高斯数量以更好重建场景。沿用 3DGS 的稠密化策略：高斯的稠密化（克隆或分裂）由 **视空间位置梯度** $\frac{dL}{d\mathbf{x}}$ 的幅值引导（$\mathbf{x}$ 为投影高斯中心）：

$$
\frac{dL}{d\mathbf{x}} = \sum_i \frac{dL}{d\mathbf{p}_i}\frac{d\mathbf{p}_i}{d\mathbf{x}} \tag{14}
$$

对像素 $\mathbf{p}_i$（该高斯有贡献的像素）求和。若 $\left\|\frac{dL}{d\mathbf{x}}\right\|_2$ 超过预设阈值 $\tau_{\mathbf{x}}$，该高斯被选为稠密化候选。

**问题（重要）**：该度量在识别过度模糊区域时无效——它无法区分 "重建良好的区域" 与 "不同像素的梯度信号相互抵消导致总梯度极小" 的区域。因此提出一个简单修改，**累加各像素梯度的范数**：

$$
M = \sum_i \left\|\frac{dL}{d\mathbf{p}_i}\frac{d\mathbf{p}_i}{d\mathbf{x}}\right\| \tag{15}
$$

度量 $M$ 能更好地指示存在显著重建误差的区域，从而获得更好的重建与新视角合成结果（见论文 Fig.4，玻璃区域在 3DGS 和 Mip-Splatting 中模糊，而本方法忠实渲染）。

> **(14) 与 (15) 的区别**：(14) 是 "先求和再取范数"，正负梯度会抵消；(15) 是 "先取范数再求和"，避免抵消，故能识别出梯度互相抵消的模糊区域。

---

## 4. §3.4 表面提取 (Surface Extraction)

**动机**：传统做法是在感兴趣区域内稠密求值不透明度（适合 DTU 这类简单场景），但对大规模无界场景，稠密网格求值的计算量随分辨率立方增长；捕捉细节需高分辨率网格，开销巨大；稀疏网格虽减少求值，仍可能产生包含数亿点、数十亿面的巨大网格，简化需缓慢的后处理（如 BOG 的网格简化约需 4 小时）。为此提出基于 **四面体网格 + Marching Tetrahedra** 的自适应紧凑网格提取。

### 4.1 四面体网格生成 (Tetrahedral Grids Generation)

**核心洞察**：3D 高斯基元的 **位置和缩放** 是表面存在的可靠指示。为利用这点，为每个高斯基元定义一个 **3D 包围盒**，其范围是高斯缩放的 **3 倍**（即最大 3-sigma 范围）。包围盒中心不透明度最高，角点不透明度最低。注意此处 **不使用** 高斯的不透明度 $\alpha$，但 $\alpha$ 可用于过滤低不透明度高斯。

用这些包围盒的中心和角点创建四面体网格。受 Tetra-NeRF 启发，采用 CGAL 库的 **Delaunay 三角化** 构造四面体单元。由于生成的四面体单元可能连接相距很远的点，进行一个 **过滤步骤**：移除任何边连接非重叠高斯的单元——当连接边的长度超过两高斯最大缩放之和（最大 3-sigma 范围维度）时，认为两高斯非重叠。

### 4.2 高效不透明度求值 (Efficient Opacity Evaluation)

为高效求值四面体网格顶点的不透明度，设计了受 3DGS 启发的 **基于 tile 的求值算法**：

1. 先将顶点投影到图像空间，按所在 tile 组织这些点；
2. 对每个 tile，取出投影其中的点列表，再次投影以确定其落入的像素，并识别对该像素有贡献的高斯；
3. 枚举所有点，基于预过滤的高斯列表求其不透明度。

该过程在所有训练图像上迭代，然后取 **所有训练图像中的最小不透明度** 作为四面体网格顶点的不透明度（对应公式 10 的 min）。算法概览见补充材料。

### 4.3 水平集的二分搜索 (Binary Search of Level Set)

确定顶点不透明度后，用 **Marching Tetrahedra** 提取三角网格。

**问题**：传统算法（Marching Cubes 和 Marching Tetrahedra）依赖 **线性插值** 来近似水平集，假设底层场是线性的。但该假设与 GOF 的非线性特性不符，导致伪影（论文 Fig.5(a) 可见明显的台阶状伪影）。

**解法**：为准确识别非线性不透明度场中的水平集，将线性假设放宽为 **单调递增假设**。这使得可以实现一个 **二分搜索算法** 来精确定位水平集。实践中进行 **8 次二分搜索**（等效模拟 256 次稠密求值），即可得到一致可靠的结果（Fig.5 对比了二分搜索带来的改进）。

---

## 5. Method 小结与关键贡献

| 模块 | 核心做法 | 解决的问题 |
|---|---|---|
| §3.1 建模 | 沿用 3DGS，高斯由 $\mathbf{p}_k,\mathbf{S}_k,\mathbf{R}_k$ 参数化，$\Sigma_k=\mathbf{R}_k\mathbf{S}_k\mathbf{S}_k^T\mathbf{R}_k^T$ | 合法半正定协方差 |
| §3.2 GOF | 显式射线-高斯相交（公式2-7）+ 沿射线累积不透明度（公式9）+ 多视角取 min（公式10） | 任意 3D 点可求不透明度；与体渲染一致；可直接提取水平集 |
| §3.3 优化 | 深度畸变损失（11，detach 权重梯度）+ 相交平面法线一致性（12）+ 改进稠密化度量（15） | 抑制悬浮物、解决法线发散歧义、识别模糊区域 |
| §3.4 提取 | 高斯包围盒 → Delaunay 四面体网格 + 过滤 → tile 化高效求值 → Marching Tetrahedra + 二分搜索水平集 | 自适应、紧凑、细节丰富的网格；避免线性插值伪影 |

**与同类方法的关系**：
- 与 **visual hull / space carving** 相似，但不透明度是连续值（体渲染）而非二值轮廓；
- 与 **UNISURF** 类似，通过识别水平集直接提取表面，无需 Poisson 重建（SuGaR）或 TSDF 融合（2DGS）；
- GOF 是通用框架，也可用于从预训练 3DGS 或 Mip-Splatting 模型提取网格。

---

## 公式速查表

| 编号 | 公式 | 含义 |
|---|---|---|
| (1) | $\mathcal{G}_k(\mathbf{x}) = e^{-\frac{1}{2}(\mathbf{x}-\mathbf{p}_k)^T\Sigma_k^{-1}(\mathbf{x}-\mathbf{p}_k)}$ | 3D 高斯定义 |
| (2)(3)(4) | $\mathbf{o}_g=\mathbf{S}_k^{-1}\mathbf{R}_k(\mathbf{o}-\mathbf{p}_k),\ \mathbf{r}_g=\mathbf{S}_k^{-1}\mathbf{R}_k\mathbf{r},\ \mathbf{x}_g=\mathbf{o}_g+t\mathbf{r}_g$ | 射线变换到归一化高斯坐标 |
| (5) | $\mathcal{G}_k^{1D}(t)=e^{-\frac{1}{2}(\mathbf{r}_g^T\mathbf{r}_g t^2+2\mathbf{o}_g^T\mathbf{r}_g t+\mathbf{o}_g^T\mathbf{o}_g)}$ | 沿射线的 1D 高斯 |
| (6) | $t^*=-\frac{B}{A},\ A=\mathbf{r}_g^T\mathbf{r}_g,\ B=\mathbf{o}_g^T\mathbf{r}_g$ | 最大不透明度点深度 |
| (7) | $\mathcal{E}(\mathcal{G}_k,\mathbf{o},\mathbf{r})=\mathcal{G}_k^{1D}(t^*)$ | 高斯对射线的贡献 |
| (8) | $\mathbf{c}(\mathbf{o},\mathbf{r})=\sum_k \mathbf{c}_k\alpha_k\mathcal{E}_k\prod_{j<k}(1-\alpha_j\mathcal{E}_j)$ | 体渲染颜色 |
| (9) | $\mathbf{O}(\mathbf{o},\mathbf{r},t)=\sum_k\alpha_k\mathbf{O}_k\prod_{j<k}(1-\alpha_j\mathbf{O}_j)$ | 沿射线累积不透明度 |
| (10) | $\mathbf{O}(\mathbf{x})=\min_{(\mathbf{o},\mathbf{r})}\mathbf{O}(\mathbf{o},\mathbf{r},t)$ | GOF（多视角取 min） |
| (11) | $\mathcal{L}_d=\sum_{i,j}\omega_i\omega_j|t_i-t_j|$ | 深度畸变损失 |
| (12) | $\mathcal{L}_n=\sum_i\omega_i(1-\mathbf{n}_i^T\mathbf{N})$ | 法向一致性损失 |
| (13) | $\mathcal{L}=\mathcal{L}_c+\alpha\mathcal{L}_d+\beta\mathcal{L}_n$ | 最终总损失 |
| (14) | $\frac{dL}{d\mathbf{x}}=\sum_i\frac{dL}{d\mathbf{p}_i}\frac{d\mathbf{p}_i}{d\mathbf{x}}$ | 3DGS 原稠密化度量（先和后范数） |
| (15) | $M=\sum_i\left\|\frac{dL}{d\mathbf{p}_i}\frac{d\mathbf{p}_i}{d\mathbf{x}}\right\|$ | 改进度量（先范数后和） |

---

*注：公式 (2)(3) 中旋转矩阵的转置写法取决于 $\mathbf{R}_k$ 表示 "世界←局部" 还是 "局部←世界" 的约定，本报告按论文截图原文记号呈现。法线公式中的 $\mathbf{R}_k^T$ 同理。*
