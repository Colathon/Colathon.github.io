---
title: "Poisson 表面重建（Poisson Surface Reconstruction）"
date: "2026-06-30"
excerpt: "把「从带法向的点云重建表面」化归为一个全局 Poisson 方程：指示函数的梯度应当等于点云法向场。从散度、Galerkin 离散到八叉树多重网格求解，给出完整的变分推导。"
tags: ["Computer Graphics", "3D Reconstruction", "Mathematics"]
---

# Poisson 表面重建（Poisson Surface Reconstruction）

**Poisson 重建**（Kazhdan, Bolitho & Hoppe, 2006）解决的问题是：给定一组**带朝外法向的有向点** $\{(\mathbf{p}_i, \mathbf{n}_i)\}$（通常来自 [SfM](/wiki/sfm) / MVS 或激光扫描），重建出一张**水密（watertight）**的三角网格表面。它的核心洞见是把这个看似几何的问题，转化为一个**全局的偏微分方程**求解——这正是它相比局部插值方法对噪声更鲁棒的根源。

## 1. 核心思想：法向场是指示函数的梯度

定义模型内部 $M$ 的**指示函数（indicator function）**：

$$
\chi_M(\mathbf{x}) =
\begin{cases}
1, & \mathbf{x} \in M \\
0, & \mathbf{x} \notin M
\end{cases}
$$

$\chi_M$ 在表面 $\partial M$ 处发生 $1 \to 0$ 的跳变，在其他地方是常数。因此它的梯度 $\nabla \chi_M$ 几乎处处为零，**只在表面处非零，且方向恰好是表面的内法向**（指向 $\chi=1$ 的一侧）。

这给出了全文的出发点：点云的法向样本，可以看作是指示函数梯度场 $\vec{V}$ 的离散观测。换言之，我们要找一个标量场 $\chi$，使其梯度尽可能匹配由点云法向构造的**向量场** $\vec{V}$：

$$
\nabla \chi = \vec{V}
$$

直接对一个跳变阶跃函数求梯度会得到狄拉克 $\delta$（曲面上的奇异测度），无法数值处理。实际做法是用一个**光滑核** $\tilde{F}$ 对法向做散布（splatting），得到一个处处有定义的光滑向量场：

$$
\vec{V}(\mathbf{x}) = \sum_{i} \tilde{F}(\mathbf{x} - \mathbf{p}_i)\, \mathbf{n}_i
$$

它是「被磨光后的指示函数」之梯度的估计。

## 2. 从「梯度匹配」到 Poisson 方程

$\nabla \chi = \vec{V}$ 是一个**超定**方程组：一个标量场只有 3 个自由度的梯度，却要去拟合一个一般的三维向量场（通常并不是某个标量场的精确梯度，即 $\vec{V}$ 不一定无旋）。因此不能精确求解，转而求最小二乘意义下的最优解：

$$
\min_{\chi} \int_{\mathbb{R}^3} \left\| \nabla \chi(\mathbf{x}) - \vec{V}(\mathbf{x}) \right\|^2 \, d\mathbf{x}
$$

这是一个标准的变分问题。其 **Euler–Lagrange 方程**通过取一阶变分得到：令 $\chi \to \chi + \epsilon\,\eta$，泛函对 $\epsilon$ 在 $0$ 处求导并令其为零，分部积分后（边界项消去）得

$$
\int \big(\nabla\chi - \vec{V}\big)\cdot \nabla\eta \; d\mathbf{x} = 0 \quad \forall \eta
\;\Longrightarrow\;
\nabla\!\cdot\!\big(\nabla\chi - \vec{V}\big) = 0
$$

即著名的 **Poisson 方程**：

$$
\Delta \chi = \nabla \cdot \vec{V} \tag{1}
$$

其中 $\Delta = \nabla\cdot\nabla$ 是 **Laplace 算子**，$\nabla \cdot \vec{V}$ 是向量场的**散度**。这一步是整个方法的命名来源：求表面 $\Leftrightarrow$ 解 Poisson 方程。把超定的「向量等式」投影到「散度」这个标量约束上，既可解又抓住了本质——散度算子恰好剔除了 $\vec{V}$ 中无法被任何梯度场表达的旋度成分。

> **为什么是 Poisson 而不是直接积分？** 若 $\vec V$ 恰好无旋，直接沿路径积分即可得到 $\chi$；但真实点云的法向有噪声、密度不均，$\vec V$ 含旋度分量。Poisson 方程等价于先把 $\vec V$ 做 **Helmholtz 分解**取其无旋部分再积分，是对噪声的全局最小二乘平滑，这就是它鲁棒的数学原因。

## 3. 有限元离散：Galerkin 投影

为了在计算机上求解 $(1)$，需要把无穷维的函数 $\chi$ 投影到有限维的基函数空间。Poisson 重建选用平移后的光滑核 $\{B_o\}$（每个对应八叉树的一个节点 $o$）作为基：

$$
\chi(\mathbf{x}) = \sum_{o} x_o \, B_o(\mathbf{x})
$$

基函数 $B$ 由一个 box 滤波器多次自卷积近似高斯（$n$ 阶 B 样条）得到，兼具紧支撑与光滑性。代入 $(1)$ 并用 **Galerkin 法**（让残差与每个基函数正交，要求弱形式对所有基 $B_{o'}$ 成立），得到线性方程组：

$$
\sum_{o} x_o \left\langle \nabla B_o,\, \nabla B_{o'} \right\rangle = \left\langle \vec{V},\, \nabla B_{o'} \right\rangle, \quad \forall o'
$$

写成矩阵形式：

$$
L \mathbf{x} = \mathbf{b} \tag{2}
$$

其中**刚度矩阵**（stiffness matrix）的元素

$$
L_{o,o'} = \left\langle \nabla B_o,\, \nabla B_{o'} \right\rangle = \int_{\mathbb{R}^3} \nabla B_o(\mathbf{x}) \cdot \nabla B_{o'}(\mathbf{x})\, d\mathbf{x}
$$

是 Laplacian 在基下的离散；右端向量 $b_{o'} = \langle \vec{V}, \nabla B_{o'}\rangle$ 是法向场在该基方向上的投影。由于 $B$ 紧支撑，$L$ 是**稀疏对称正定**的，适合迭代求解。

## 4. 八叉树自适应与多重网格求解

均匀网格在 $\mathbb{R}^3$ 中代价是 $O(N^3)$，但表面只是二维流形——绝大多数体素是空的。Poisson 重建用**八叉树（octree）** $\mathcal{O}$ 自适应细分：仅在点 $\mathbf{p}_i$ 附近递归加密到最大深度 $D$，远离表面处保持粗节点。这样自由度数与表面积（而非体积）成正比。

求解 $(2)$ 采用**级联多重网格（cascadic multigrid）**：从八叉树的粗层（低深度）解起，把粗解作为细层的初值，逐层精化。每层用共轭梯度（CG）或 Gauss–Seidel 松弛若干步。由于粗层快速消除低频误差、细层处理高频细节，整体复杂度接近线性 $O(N)$。

## 5. 等值面提取与等值选取

解出系数 $\{x_o\}$ 后即得连续场 $\chi(\mathbf{x})$，但它不是严格的 $0/1$，而是磨光后的软指示函数。最终表面定义为某个**等值面（isosurface）**：

$$
\partial M = \big\{\, \mathbf{x} \;:\; \chi(\mathbf{x}) = \gamma \,\big\}
$$

等值 $\gamma$ 不取 $0.5$，而是取 $\chi$ 在所有**输入样本点处的平均值**，以保证表面尽量穿过原始数据：

$$
\gamma = \frac{1}{|S|}\sum_{i} \chi(\mathbf{p}_i)
$$

提取这张等值面用的正是 **[Marching Cubes](/wiki/marching-cubes)** 算法（其针对八叉树的变体 Octree Marching Cubes，以避免相邻不同深度叶子间的裂缝）。这两步——「解 Poisson 方程得到隐式场」与「Marching Cubes 抽取等值面」——共同构成了从有向点云到三角网格的完整管线。

## 6. Screened Poisson：加入点的位置约束

原始 Poisson 重建只约束了**梯度**（法向），不直接约束表面**经过**采样点，对稀疏区域容易过度平滑。**Screened Poisson Surface Reconstruction**（Kazhdan & Hoppe, 2013）在能量泛函中补一个**点插值（位置）项**：

$$
E(\chi) = \int \left\| \nabla \chi - \vec{V} \right\|^2 d\mathbf{x} \;+\; \alpha \sum_{i} \big( \chi(\mathbf{p}_i) - \gamma \big)^2
$$

其中 $\alpha$ 权衡「梯度拟合」与「让表面贴近样本点」。它对应的 Euler–Lagrange 方程在 $(1)$ 的 Laplacian 上加了一个由样本点构成的**质量项（screening term）**，故名「screened（屏蔽）Poisson」——与屏蔽 Poisson 方程 $(\Delta - \kappa^2)\chi = f$ 同构。这是当前实践（如 MeshLab、Open3D）中的默认版本，在锐利细节与抗噪间取得更好平衡。

## 7. 与其他方法的对比

| 维度 | Poisson 重建 | 局部方法（如 RBF / Ball-Pivoting） |
|---|---|---|
| **问题形式** | 全局 Poisson PDE（变分最小二乘） | 局部插值 / 三角化 |
| **抗噪性** | 强（全局平滑，散度剔除旋度噪声） | 弱（对离群点敏感） |
| **输出** | 必为水密闭合表面 | 可能有洞、非闭合 |
| **是否需法向** | 必需（朝向一致的有向点） | 部分需要 |
| **典型复杂度** | 八叉树 + 多重网格，近 $O(N)$ | 取决于局部邻域查询 |

## 相关链接

- [Marching Cubes：等值面提取算法](/wiki/marching-cubes) - Poisson 重建最后一步抽取等值面所用的算法。
- [Structure from Motion (SfM)](/wiki/sfm) - Poisson 重建的常见上游：先重建带法向的点云。
- [渲染公式的统一与演进](/wiki/volume-rendering-3dgs) - 同属三维重建/渲染管线的另一条技术路线。
- [Computer Graphics](/wiki?tag=Computer+Graphics) - 更多图形学笔记。
