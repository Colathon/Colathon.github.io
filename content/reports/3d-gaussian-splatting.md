---
title: "3D Gaussian Splatting：显式辐射场与可微光栅化"
date: "2026-06-03"
excerpt: "从场景表示、EWA 投影与雅可比、球谐颜色，到自适应密度控制与完整梯度推导，系统拆解 3DGS 的前向渲染与反向优化。"
tags: ["Computer Graphics", "Neural Networks", "AI Research"]
---

# 3D Gaussian Splatting (3DGS)

> Kerbl, Kopanas, Leimkühler, Drettakis. *3D Gaussian Splatting for Real-Time Radiance Field Rendering.* SIGGRAPH 2023.

---

## 1. 核心思想

把场景**显式**表示为一堆带朝向的 3D 高斯椭球（点云的"加厚"版），再用**可微分光栅化（splatting）** 投影到屏幕做 α 混合，而不是像 NeRF 那样沿光线做体积采样（ray marching）。

三个关键取舍：

- **显式表示** → 编辑、剔除、排序都直接；不需要 MLP 查询。
- **光栅化代替 ray marching** → 渲染从 per-ray 采样变成 per-Gaussian 投影，GPU 友好，**实时（>100 FPS）**。
- **各向异性高斯** → 单个基元能贴合表面/拉长的几何，用较少的基元表达较高的细节。

结果：训练几十分钟、渲染实时，质量对标甚至超过 Mip-NeRF360。

> 关于 NeRF 体积渲染与 3DGS 在成像公式上的代数同构，另见 [体积渲染与 3DGS 的统一](/wiki/volume-rendering-3dgs)。

---

## 2. 场景表示

### 2.1 单个 3D 高斯

世界坐标系下，以均值 $\mu$ 为中心的高斯（其协方差结构与 [多元正态分布](/wiki/multivariate-normal) 同源）：

$$
G(x) = \exp\!\left(-\tfrac{1}{2}(x-\mu)^{\top}\,\Sigma^{-1}\,(x-\mu)\right)
$$

每个高斯携带的可学习参数：

| 参数 | 含义 | 维度 |
|------|------|------|
| $\mu$ | 位置（均值） | 3 |
| $\Sigma$ | 协方差（形状/朝向），由 $r,s$ 间接得到 | 旋转 4 (四元数) + 缩放 3 |
| $\alpha$ | 不透明度（opacity） | 1 |
| SH | 球谐系数，表示**视角相关**颜色 | 度数 3 → 每通道 16，RGB 共 48 |

### 2.2 协方差的参数化（关键技巧）

$\Sigma$ 必须**半正定**才有物理意义，但直接优化一个 3×3 矩阵很难维持这个约束。作者把它分解成"缩放 + 旋转"，类比椭球的配置：

$$
\Sigma = R\,S\,S^{\top}\,R^{\top}
$$

- $S = \mathrm{diag}(s_x, s_y, s_z)$：三个轴向的尺度。
- $R$：由四元数 $r$ 转成的旋转矩阵。

优化时实际更新的是 $s$ 和 $r$，由此重建出的 $\Sigma$ 天然半正定。梯度对 $s$、$r$ 单独推导以便反传。

---

## 3. 渲染（前向）

### 3.1 投影：3D 高斯 → 2D 高斯

给定相机外参（world→camera）$W$，先把高斯变换到相机系；再用投影变换的**仿射近似**（其雅可比 $J$）投到图像平面。2D 协方差（EWA splatting，Zwicker et al.）：

$$
\Sigma' = J\,W\,\Sigma\,W^{\top}\,J^{\top}
$$

取 $\Sigma'$ 的左上 2×2 子块即屏幕空间的 2D 高斯。$J$ 是仿射近似带来的、对每个高斯都不同的雅可比。

**为什么要仿射近似**：透视投影是**非线性**的，高斯经非线性映射后不再是高斯。EWA 的做法是在每个高斯中心处对投影做**一阶泰勒展开**（线性化），这样高斯仍映射为高斯——$J$ 就是这个局部线性化的雅可比，逐高斯计算。

**$J$ 的推导**：设高斯中心经 $W$ 变换到相机系为 $\mathbf{t}=(t_x,t_y,t_z)$，针孔投影到像素坐标 $(u,v)$（焦距 $f_x,f_y$，主点 $c_x,c_y$）：

$$
u = f_x\frac{t_x}{t_z}+c_x,\qquad v = f_y\frac{t_y}{t_z}+c_y
$$

对 $\mathbf{t}$ 求偏导，得 $2\times3$ 雅可比：

$$
J=\frac{\partial(u,v)}{\partial(t_x,t_y,t_z)}
=\begin{pmatrix}
\dfrac{f_x}{t_z} & 0 & -\dfrac{f_x\,t_x}{t_z^{2}}\\[8pt]
0 & \dfrac{f_y}{t_z} & -\dfrac{f_y\,t_y}{t_z^{2}}
\end{pmatrix}
$$

要点：

- $J$ 在**每个高斯中心 $\mathbf{t}$** 处取值，故各高斯不同；深度 $t_z$ 越大，投影"压缩"越强（$1/t_z$、$1/t_z^2$ 项）。
- 第三行（对深度的导数）丢弃 → 直接对应"取左上 $2\times2$"。
- 实现上会把 $t_x/t_z,\,t_y/t_z$ **clamp** 到略大于视场的范围，避免边缘外高斯让 $J$ 数值爆炸。

### 3.2 颜色合成（α 混合）

某像素的颜色由覆盖它的 $N$ 个高斯按深度**从前到后**混合：

$$
C = \sum_{i \in N} c_i\,\alpha_i \prod_{j=1}^{i-1}(1-\alpha_j)
$$

- $c_i$：第 $i$ 个高斯在当前视角方向上由 SH 解出的颜色。
- $\alpha_i = \sigma_i \cdot G^{2D}_i(\text{pixel})$：学习到的 opacity 乘以该像素处 2D 高斯的取值。

> 注意这就是 NeRF 用的同一个体渲染方程，区别在于：3DGS 是对**已排序的离散高斯**求和，而非沿光线积分采样点。两者成像公式的代数同构详见 [体积渲染与 3DGS 的统一](/wiki/volume-rendering-3dgs)。

### 3.3 基于 Tile 的可微分光栅化（为什么快）

每帧一次性完成，避免 per-pixel 排序：

1. **分块**：屏幕切成 16×16 的 tile。
2. **视锥剔除**：剔掉不在视锥内 / 落在近平面附近不稳定的高斯。
3. **实例化 + 排序**：给每个 (高斯, tile) 配键 = `tile_id | depth`，用 GPU **radix sort 全局排序一次**（近似按深度，不做精确 per-pixel 排序）。
4. **逐 tile 混合**：每个 tile 内的线程按排序顺序做 front-to-back α 混合，累积透射率到阈值即可提前终止。

反向传播沿同样的顺序回放，梯度可以一路传到每个高斯的 $\mu, \Sigma(s,r), \alpha,$ SH。

### 3.4 球谐 (SH) 颜色展开

3.2 里的 $c_i$ 不是一个固定 RGB，而是**随观察方向变化**的。对单位观察方向 $\mathbf{d}=(x,y,z)$，每个颜色通道为：

$$
c(\mathbf{d}) = \max\!\Big(0,\ \tfrac{1}{2} + \textstyle\sum_{\ell=0}^{L}\sum_{m=-\ell}^{\ell} k_\ell^{m}\,Y_\ell^{m}(\mathbf{d})\Big)
$$

- $Y_\ell^m$：实球谐基函数；$k_\ell^m$：每通道一组可学习系数。
- 系数个数 $=(L+1)^2$。3DGS 用 $L=3$ → 每通道 16 个，RGB 共 **48**。
- $\ell=0$ 项是与方向无关的"基色"（DC 分量），高阶项叠加视角相关的高光/反射变化。训练中 $L$ 从 0 逐步升到 3，先学稳基色再学细节。
- $+\tfrac12$ 是偏置，最后 clamp 到 $\ge 0$。

实球谐基（图形学惯例，常数同官方 CUDA 实现，单位球面上等价于标准实 SH）：

$$
\begin{aligned}
\ell=0:\quad & Y_0^0 = 0.2820948\\[2pt]
\ell=1:\quad & Y_1^{-1}=-0.4886025\,y,\quad Y_1^{0}=0.4886025\,z,\quad Y_1^{1}=-0.4886025\,x\\[2pt]
\ell=2:\quad & Y_2^{-2}=1.0925484\,xy,\quad Y_2^{-1}=-1.0925484\,yz,\quad Y_2^{0}=0.3153916\,(2z^2-x^2-y^2),\\
            & Y_2^{1}=-1.0925484\,xz,\quad Y_2^{2}=0.5462742\,(x^2-y^2)\\[2pt]
\ell=3:\quad & Y_3^{-3}=-0.5900436\,y(3x^2-y^2),\quad Y_3^{-2}=2.8906114\,xyz,\\
            & Y_3^{-1}=-0.4570458\,y(4z^2-x^2-y^2),\quad Y_3^{0}=0.3731763\,z(2z^2-3x^2-3y^2),\\
            & Y_3^{1}=-0.4570458\,x(4z^2-x^2-y^2),\quad Y_3^{2}=1.4453057\,z(x^2-y^2),\\
            & Y_3^{3}=-0.5900436\,x(x^2-3y^2)
\end{aligned}
$$

---

## 4. 优化（训练）

### 4.1 损失函数

渲染图与真值图之间：

$$
\mathcal{L} = (1-\lambda)\,\mathcal{L}_1 + \lambda\,\mathcal{L}_{\text{D-SSIM}}
\qquad (\lambda = 0.2)
$$

用 SGD/Adam 直接优化所有高斯参数。

### 4.2 自适应密度控制 (Adaptive Density Control)

固定的初始点数表达不了细节，所以训练中动态增删高斯，由**视空间位置梯度**驱动（梯度大 = 该处重建不够好）：

- **Clone（克隆）**：欠重建区域里的**小**高斯 → 复制一份，沿位置梯度方向偏移。补"覆盖不足"。
- **Split（分裂）**：过重建区域里的**大**高斯 → 拆成两个更小的（尺度除以 $\phi \approx 1.6$），新位置以原高斯为 PDF 采样。修"一个高斯糊太大"。
- **Prune（剪枝）**：删除 $\alpha$ 低于阈值的高斯，以及屏幕空间过大的高斯。
- **Opacity reset**：每隔若干步把所有 $\alpha$ 压到接近 0，强迫优化重新"挣"出不透明度，能清掉相机附近的漂浮物（floaters）并控制总数。

### 4.3 梯度推导（反向传播）

整条反传链（从损失回到几何参数）：

$$
\mathcal{L}\;\to\;C\;\to\;\{c_i,\alpha_i\}\;\to\;\{\text{SH},\,\sigma_i,\,\Sigma'_i,\,\mu'_i\}\;\to\;\{\Sigma_i,\,\mu_i\}\;\to\;\{s_i,\,q_i\}
$$

**(a) α 混合 → $c_i,\alpha_i$**　记透射率 $T_i=\prod_{j<i}(1-\alpha_j)$：

$$
\frac{\partial C}{\partial c_i}=\alpha_i T_i,
\qquad
\frac{\partial C}{\partial \alpha_i}=c_i T_i-\frac{1}{1-\alpha_i}\sum_{j>i}c_j\,\alpha_j\,T_j
$$

第二项因为 $\alpha_i$ 也影响后面所有 $T_j$；实现上按 back-to-front 累加一个余项即可 $O(N)$ 完成。

**(b) SH → 系数**　颜色对方向基本是线性的，故对系数的梯度就是基函数取值：

$$
\frac{\partial \mathcal{L}}{\partial k_\ell^m}=\frac{\partial \mathcal{L}}{\partial c}\;Y_\ell^m(\mathbf{d})
$$

（未被 clamp 时偏导为 1；另有一支经 $\mathbf{d}$ 回流到 $\mu$，量级小。）

**(c) opacity 与 2D 高斯**　$\alpha_i=\sigma_i\,G^{2D}_i$，令 $d=p-\mu'$：

$$
\frac{\partial \alpha_i}{\partial \sigma_i}=G^{2D}_i,\qquad
\frac{\partial G^{2D}}{\partial \mu'}=G^{2D}\,\Sigma'^{-1}d,\qquad
\frac{\partial G^{2D}}{\partial \Sigma'}= \tfrac{1}{2}\,G^{2D}\,\Sigma'^{-1}\,d\,d^{\top}\,\Sigma'^{-1}
$$

（用到 $\mathrm{d}\Sigma'^{-1}=-\Sigma'^{-1}(\mathrm{d}\Sigma')\Sigma'^{-1}$。）

**(d) 2D 协方差 → 3D 协方差**　$\Sigma'=U\Sigma U^{\top}$（$U=JW$ 取 $2\times3$）：

$$
\frac{\partial \mathcal{L}}{\partial \Sigma}=U^{\top}\frac{\partial \mathcal{L}}{\partial \Sigma'}\,U
$$

（$J$ 依赖 $\mu$，故另有一支梯度经 $J$ 回流到 $\mu$。）

**(e) 3D 协方差 → 缩放/旋转**（论文附录核心）　令 $M=RS$，$\Sigma=MM^{\top}$，且 $G_\Sigma=\partial\mathcal{L}/\partial\Sigma$（对称）：

$$
\frac{\partial \mathcal{L}}{\partial M}=2\,G_\Sigma\,M
$$

因 $S$ 对角，$M_{ij}=R_{ij}s_j$，故对缩放：

$$
\frac{\partial M_{ij}}{\partial s_k}=R_{ik}\,\delta_{jk}
\;\;\Rightarrow\;\;
\frac{\partial \mathcal{L}}{\partial s_k}=\sum_{i}\Big(\frac{\partial \mathcal{L}}{\partial M}\Big)_{ik}R_{ik}
$$

对旋转，$\dfrac{\partial M}{\partial q_\bullet}=\dfrac{\partial R}{\partial q_\bullet}S$，而 $R$ 对四元数 $q=(w,x,y,z)$ 的四个导数为：

$$
\frac{\partial R}{\partial w}=2\!\begin{pmatrix}0&-z&y\\ z&0&-x\\ -y&x&0\end{pmatrix}
\quad
\frac{\partial R}{\partial x}=2\!\begin{pmatrix}0&y&z\\ y&-2x&-w\\ z&w&-2x\end{pmatrix}
$$

$$
\frac{\partial R}{\partial y}=2\!\begin{pmatrix}-2y&x&w\\ x&0&z\\ -w&z&-2y\end{pmatrix}
\quad
\frac{\partial R}{\partial z}=2\!\begin{pmatrix}-2z&-w&x\\ w&-2z&y\\ x&y&0\end{pmatrix}
$$

于是 $\dfrac{\partial \mathcal{L}}{\partial q_\bullet}=\sum_{i,j}\Big(\dfrac{\partial \mathcal{L}}{\partial M}\Big)_{ij}\Big(\dfrac{\partial R}{\partial q_\bullet}S\Big)_{ij}$。

**(f) 位置 $\mu$**　两支汇合：经 (c) 的 $\mu'$（屏幕位置）+ 经 $J$ 对 (d) 的贡献，按投影链式法则回传。

---

## 5. 完整流程（端到端）

对照原论文 Fig. 2：实线为**操作流（前向）**，虚线为**梯度流（反向）**。稀疏点云由 [SfM](/wiki/sfm) 提供。

```text
                         ┌──────────────── 梯度流 (反向) ────────────────┐
                         ▼                                               │
 [SfM Points] ──► Initialization ──► ┌───────────────┐ ──► Projection ──► Differentiable ──► Image
                                     │ 3D Gaussians  │      ▲              Tile Rasterizer       │
                          ┌────────► └───────────────┘      │                   ▲                │
                          │                 │   ▲       [Camera]                │                │
              Adaptive Density Control ◄─────┘   └────────────────（梯度）───────┴────────────────┘
                  (Clone / Split / Prune)
```

> 渲染器同时服务于「优化」与「实时漫游」：训练时走完整反传，部署时只跑前向。

读法：稀疏点云 **初始化** 出 3D 高斯 → 配合相机 **投影** 到屏幕 → **可微 Tile 光栅化** 出图；图与真值的误差沿梯度流反传，一支更新高斯参数，一支驱动 **自适应密度控制** 增删高斯，回灌到 3D 高斯集合循环。

### 常用超参数（论文默认，供参考）

| 项目 | 取值 |
|------|------|
| 总迭代 | ~30,000 |
| densification 区间 | 第 500 步起，每 100 步一次，到 15,000 步止 |
| opacity reset 周期 | 每 3,000 步 |
| 位置梯度阈值 $\tau_{pos}$ | 0.0002 |
| split 尺度因子 $\phi$ | 1.6 |
| SH 最高度数 | 3（训练中逐步升阶） |
| 训练硬件 | 单卡 GPU |

---

## 6. 与 NeRF 速记对比

| 维度 | NeRF | 3DGS |
|------|------|------|
| 表示 | 隐式 MLP（连续场） | 显式 3D 高斯集合 |
| 渲染 | 沿光线体积采样 | 投影 + tile 光栅化 |
| 速度 | 慢（per-ray 多次查询） | 实时 |
| 编辑性 | 差 | 好（点级可操作） |
| 视角相关颜色 | MLP 输出 | 球谐 SH |
| 几何先验 | 无需点云 | 依赖 SfM 初始化 |

---

## 7. 待补 / 缝补区

- [x] EWA splatting 中 $J$ 的具体推导（见 §3.1）
- [x] SH 求颜色的展开式（见 §3.4）
- [x] 各参数梯度的解析式（见 §4.3）
- [ ] 后续工作：Mip-Splatting（抗锯齿）、2DGS（表面重建）、压缩与动态场景

---

## 相关链接

- [体积渲染与 3DGS 的统一](/wiki/volume-rendering-3dgs) - 从概率论视角看 NeRF 与 3DGS 成像公式的代数同构。
- [Structure-from-Motion (SfM)](/wiki/sfm) - 3DGS 初始化点云的来源。
- [多元正态分布](/wiki/multivariate-normal) - 高斯椭球协方差结构的数学基础。
- [RenderFormer：基于 Transformer 的神经渲染架构](/wiki/renderformer) - 另一种神经渲染范式。
- [DDPM](/wiki/ddpm) - 生成式渲染的扩散模型视角。
