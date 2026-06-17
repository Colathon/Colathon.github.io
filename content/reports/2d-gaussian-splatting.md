---
title: "2D Gaussian Splatting: 几何精确的辐射场建模"
date: "2026-06-17"
excerpt: "深入分析 2DGS 的扁平高斯建模、显式光线-splat 求交算法，以及深度畸变与法线一致性正则化项。"
tags: ["Computer Graphics", "Gaussian Splatting", "AI Research"]
---

# 2D Gaussian Splatting (2DGS) 方法部分总结

> 论文：*2D Gaussian Splatting for Geometrically Accurate Radiance Fields* (Huang et al., SIGGRAPH 2024)
> 本报告覆盖论文的方法部分：第 4 节 **建模与光栅化（Modeling & Splatting）** 与第 5 节 **训练（Training）**。

---

## 4. 方法（Methodology）

2DGS 的核心思想：不同于 3DGS 用三维的"团块"（blob）建模整个角度辐射，2DGS 把基元简化为嵌入在三维空间中的**"扁平"二维高斯（flat 2D Gaussian）**。基元的密度分布在一个平面圆盘内，并把**密度变化最陡的方向定义为法线方向**，从而能更好地与薄表面对齐，在仅有稀疏标定点云与光度监督的条件下同时重建外观与几何。

---

### 4.1 建模（Modeling）

一个 2D splat 由以下量刻画：

- 中心点 $\mathbf{p}_k$
- 两个主切向量 $\mathbf{t}_u$、$\mathbf{t}_v$
- 缩放向量 $\mathbf{S} = (s_u, s_v)$，控制二维高斯的方差

基元法线由两个正交切向量定义：

$$
\mathbf{t}_w = \mathbf{t}_u \times \mathbf{t}_v
$$

把朝向组织成一个 $3\times 3$ 旋转矩阵 $\mathbf{R} = [\mathbf{t}_u, \mathbf{t}_v, \mathbf{t}_w]$，把缩放因子组织成一个 $3\times 3$ 对角矩阵 $\mathbf{S}$（其最后一项为零）。

2D 高斯定义在世界空间中的局部切平面上，参数化为：

$$
P(u,v) = \mathbf{p}_k + s_u \mathbf{t}_u u + s_v \mathbf{t}_v v = \mathbf{H}(u, v, 1, 1)^{\mathrm{T}} \tag{4}
$$

其中

$$
\mathbf{H} =
\begin{bmatrix}
s_u \mathbf{t}_u & s_v \mathbf{t}_v & \mathbf{0} & \mathbf{p}_k \\
0 & 0 & 0 & 1
\end{bmatrix}
=
\begin{bmatrix}
\mathbf{RS} & \mathbf{p}_k \\
\mathbf{0} & 1
\end{bmatrix}
\tag{5}
$$

$\mathbf{H} \in 4\times 4$ 是表示该 2D 高斯几何的齐次变换矩阵。对 $uv$ 空间中的点 $\mathbf{u} = (u, v)$，其 2D 高斯值由标准高斯给出：

$$
\mathcal{G}(\mathbf{u}) = \exp\!\left(-\frac{u^2 + v^2}{2}\right) \tag{6}
$$

中心 $\mathbf{p}_k$、缩放 $(s_u, s_v)$、旋转 $(\mathbf{t}_u, \mathbf{t}_v)$ 均为可学习参数。仿照 3DGS，每个 2D 高斯基元还带有不透明度 $\alpha$ 和用球谐函数参数化的视角相关外观 $c$。

---

### 4.2 光栅化（Splatting）

**动机。** 一种常见的渲染策略是用透视投影的仿射近似把 2D 高斯投到图像空间 [Zwicker et al. 2001]，但该投影只在高斯中心处精确，距离中心越远误差越大。Zwicker et al. 提出基于齐次坐标的方案：设 $\mathbf{W} \in 4\times 4$ 为世界空间到屏幕空间的组合变换矩阵，则屏幕空间点为：

$$
\mathbf{x} = (xz, yz, z, z)^{\mathrm{T}} = \mathbf{W} P(u,v) = \mathbf{W}\mathbf{H}(u, v, 1, 1)^{\mathrm{T}} \tag{7}
$$

其中 $\mathbf{x}$ 表示从相机发出、穿过像素 $(x, y)$ 并在深度 $z$ 处与 splat 相交的齐次射线。Zwicker et al. 用隐式方法 $\mathbf{M} = (\mathbf{W}\mathbf{H})^{-1}$ 把圆锥曲线投到屏幕空间，但当 splat 退化为线段（侧视）时，该逆变换会带来数值不稳定。为此，2DGS 采用受 [Sigg et al. 2006] 启发的**显式光线–splat 求交**。

#### 光线–splat 求交（Ray-splat Intersection）

通过求三个不平行平面的交点高效定位交点 [Weyrich et al. 2007]。给定图像坐标 $\mathbf{x} = (x, y)$，把像素射线参数化为投影空间中两个正交平面（x-平面与 y-平面）的交：

- x-平面由法向量 $(-1, 0, 0)$ 和偏移 $x$ 定义，写成 4D 齐次平面 $\mathbf{h}_x = (-1, 0, 0, x)^{\mathrm{T}}$；
- 类似地，y-平面为 $\mathbf{h}_y = (0, -1, 0, y)^{\mathrm{T}}$。

射线 $\mathbf{x} = (x, y)$ 由这两个平面的交确定。

接着把两个平面变换到 2D 高斯的局部坐标系（$uv$ 坐标系）。注意：用变换矩阵 $\mathbf{M}$ 变换平面上的点，等价于用其逆转置 $\mathbf{M}^{-\mathrm{T}}$ 变换齐次平面参数 [Blinn 1977]。因此应用 $\mathbf{M} = (\mathbf{W}\mathbf{H})^{-1}$ 等价于使用 $(\mathbf{W}\mathbf{H})^{\mathrm{T}}$，从而**无需显式求逆**：

$$
\mathbf{h}_u = (\mathbf{W}\mathbf{H})^{\mathrm{T}} \mathbf{h}_x \qquad \mathbf{h}_v = (\mathbf{W}\mathbf{H})^{\mathrm{T}} \mathbf{h}_y \tag{8}
$$

2D 高斯平面上的点表示为 $(u, v, 1, 1)$，交点应同时落在变换后的 x-平面与 y-平面上，故：

$$
\mathbf{h}_u \cdot (u, v, 1, 1)^{\mathrm{T}} = \mathbf{h}_v \cdot (u, v, 1, 1)^{\mathrm{T}} = 0 \tag{9}
$$

由此得到交点 $\mathbf{u}(\mathbf{x})$ 的高效解：

$$
u(\mathbf{x}) = \frac{\mathbf{h}_u^2 \mathbf{h}_v^4 - \mathbf{h}_u^4 \mathbf{h}_v^2}{\mathbf{h}_u^1 \mathbf{h}_v^2 - \mathbf{h}_u^2 \mathbf{h}_v^1}
\qquad
v(\mathbf{x}) = \frac{\mathbf{h}_u^4 \mathbf{h}_v^1 - \mathbf{h}_u^1 \mathbf{h}_v^4}{\mathbf{h}_u^1 \mathbf{h}_v^2 - \mathbf{h}_u^2 \mathbf{h}_v^1}
\tag{10}
$$

其中 $\mathbf{h}_u^i$、$\mathbf{h}_v^i$ 是 4D 平面的第 $i$ 个分量。注意根据式 (5)，$\mathbf{h}_u^3$ 与 $\mathbf{h}_v^3$ 恒为零。得到局部坐标 $(u, v)$ 后，用式 (7) 计算交点深度 $z$，用式 (6) 计算高斯值。

#### 退化处理（Degenerate Solutions）

当从倾斜视角观察 2D 高斯时，它在屏幕空间退化为一条线，可能在光栅化中被漏掉（也就是下式的前项，因为接近平行会导致u，v趋于无穷）。为此引入物体空间低通滤波 [Botsch et al. 2005]：

$$
\hat{\mathcal{G}}(\mathbf{x}) = \max\left\{ \mathcal{G}(\mathbf{u}(\mathbf{x})),\ \mathcal{G}\!\left(\frac{\mathbf{x} - \mathbf{c}}{\sigma}\right) \right\} \tag{11}
$$

其中 $\mathbf{u}(\mathbf{x})$ 由式 (10) 给出，$\mathbf{c}$ 是中心 $\mathbf{p}_k$ 的投影。直观上，$\hat{\mathcal{G}}(\mathbf{x})$ 被一个以 $\mathbf{c}$ 为中心、半径为 $\sigma$ 的固定屏幕空间高斯低通滤波器下界约束。实验中取 $\sigma = \frac{\sqrt{2}}{2}$，以保证渲染时有足够像素被使用。

#### 光栅化（Rasterization）

流程与 3DGS 类似：先为每个高斯基元计算屏幕空间包围盒；再按中心深度对 2D 高斯排序，并依据包围盒组织成 tile；最后用体积 alpha 混合从前到后累积带 alpha 权重的外观：

$$
\mathbf{c}(\mathbf{x}) = \sum_{i=1} \mathbf{c}_i\, \alpha_i\, \hat{\mathcal{G}}_i(\mathbf{u}(\mathbf{x})) \prod_{j=1}^{i-1} \left(1 - \alpha_j\, \hat{\mathcal{G}}_j(\mathbf{u}(\mathbf{x}))\right) \tag{12}
$$

当累积不透明度达到饱和时，迭代终止。

---

## 5. 训练（Training）

仅用光度损失优化 2D 高斯会产生噪声较多的重建（三维重建任务的固有难题）。为改善几何重建，引入两个正则项：**深度畸变（depth distortion）** 与 **法线一致性（normal consistency）**。

### 深度畸变（Depth Distortion）

3DGS 的体渲染不考虑相交高斯基元之间的距离，导致高斯散布开时也可能得到相近的颜色与深度，这与"光线恰好与第一个可见表面相交一次"的表面渲染不同。借鉴 Mip-NeRF360，提出深度畸变损失，通过最小化光线–splat 交点之间的距离，使权重分布沿光线集中：

$$
\mathcal{L}_d = \sum_{i,j} \omega_i\, \omega_j\, |z_i - z_j| \tag{13}
$$

其中

$$
\omega_i = \alpha_i\, \hat{\mathcal{G}}_i(\mathbf{u}(\mathbf{x})) \prod_{j=1}^{i-1} \left(1 - \alpha_j\, \hat{\mathcal{G}}_j(\mathbf{u}(\mathbf{x}))\right)
$$

为第 $i$ 个交点的混合权重，$z_i$ 为交点深度。与 Mip-NeRF360 的畸变损失（其 $z_i$ 是采样点间距且不被优化）不同，本方法通过调整交点深度 $z_i$ **直接鼓励 splat 的集中**。该正则项用 CUDA 高效实现（类似 [Sun et al. 2022b]）。

### 法线一致性（Normal Consistency）

由于表示基于 2D 高斯面元，必须保证所有 2D splat 与真实表面局部对齐。在体渲染中沿光线可能存在多个半透明面元，取**累积不透明度达到 0.5 的中位交点 $\mathbf{p}_s$** 作为真实表面，并将 splat 法线与深度图梯度对齐：

$$
\mathcal{L}_n = \sum_i \omega_i \left(1 - \mathbf{n}_i^{\mathrm{T}} \mathbf{N}\right) \tag{14}
$$

其中 $i$ 遍历沿光线的相交 splat，$\omega$ 为交点混合权重，$\mathbf{n}_i$ 是朝向相机的 splat 法线，$\mathbf{N}$ 是由深度图梯度估计的法线。$\mathbf{N}$ 由邻近深度点的有限差分计算：

$$
\mathbf{N}(x, y) = \frac{\nabla_x \mathbf{p}_s \times \nabla_y \mathbf{p}_s}{|\nabla_x \mathbf{p}_s \times \nabla_y \mathbf{p}_s|} \tag{15}
$$

通过将 splat 法线与估计的表面法线对齐，保证 2D splat 在局部近似真实物体表面。

### 总损失（Final Loss）

从初始稀疏点云出发，用一组带位姿的图像优化模型，最小化：

$$
\mathcal{L} = \mathcal{L}_c + \alpha \mathcal{L}_d + \beta \mathcal{L}_n \tag{16}
$$

其中 $\mathcal{L}_c$ 是 RGB 重建损失，结合 $\mathcal{L}_1$ 与 [Kerbl et al. 2023] 的 D-SSIM 项；$\mathcal{L}_d$、$\mathcal{L}_n$ 为正则项。超参设置：有界场景 $\alpha = 1000$，无界场景 $\alpha = 100$，所有场景 $\beta = 0.05$。

---

## 方法小结

| 模块 | 关键点 | 对应公式 |
|------|--------|----------|
| 建模 | 用扁平 2D 高斯面元表示基元，法线由切向量叉乘定义；几何由齐次变换 $\mathbf{H}$ 描述 | (4)(5)(6) |
| 光栅化 | 用显式光线–splat 求交替代不稳定的矩阵求逆；低通滤波防退化；体积 alpha 混合 | (7)–(12) |
| 训练 | 深度畸变损失集中权重分布；法线一致性损失对齐表面法线 | (13)(14)(15)(16) |
