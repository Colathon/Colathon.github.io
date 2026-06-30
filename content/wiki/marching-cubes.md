---
title: "Marching Cubes：等值面提取算法"
date: "2026-06-30"
excerpt: "把一个标量场的等值面抽成三角网格：8 顶点 → 256 种拓扑配置 → 沿边线性插值定顶点。给出查找表的构造、顶点插值公式、法向估计与歧义面问题的数学处理。"
tags: ["Computer Graphics", "3D Reconstruction", "Algorithm"]
---

# Marching Cubes：等值面提取算法

**Marching Cubes**（Lorensen & Cline, 1987）解决的问题是：给定一个三维空间上的**标量场** $f(\mathbf{x})$（来自 CT/MRI 体数据、SDF、或 [Poisson 重建](/wiki/poisson-reconstruction) 解出的指示函数），抽取出某个**等值面（isosurface）**

$$
S = \big\{\, \mathbf{x} \in \mathbb{R}^3 \;:\; f(\mathbf{x}) = \gamma \,\big\}
$$

并将其表示为一张三角网格。这里 $\gamma$ 是给定的**等值（isovalue）**。它是把「隐式表面」转换为「显式网格」的最经典算法，也是 Poisson 重建、SDF、NeRF/3DGS 提网格等管线共同的收尾步骤。

## 1. 核心思想：逐立方体「行进」

把空间划分成规则的体素网格。算法**逐个立方体（cube/voxel）**遍历，每个立方体有 8 个角点。对每个角点 $v_k$，用它的场值与等值比较，判断它在表面**内还是外**：

$$
s_k =
\begin{cases}
1, & f(v_k) \ge \gamma \quad (\text{在内部 / 实体侧}) \\
0, & f(v_k) < \gamma \quad (\text{在外部})
\end{cases}, \qquad k = 0, 1, \dots, 7
$$

> 等值面只可能穿过那些**两端符号不同**的边——一端在内、一端在外，由介值定理，连续场必在该边上某处取到 $\gamma$。立方体的局部表面拓扑因此完全由 8 个角点的内外状态决定。

## 2. 256 种配置与查找表

8 个角点、每个 2 种状态，共 $2^8 = 256$ 种组合。把这 8 个比特拼成一个**索引**：

$$
\text{index} = \sum_{k=0}^{7} s_k \cdot 2^k \in \{0, 1, \dots, 255\}
$$

预先为这 256 种情形打好**查找表（lookup table）**，每个 index 直接给出：该立方体内应生成哪几个三角形、各三角形的顶点落在哪几条**边**上。运行时只需查表，不做几何判断，这是 Marching Cubes 极快的原因。

利用**旋转对称**与**内外翻转对称**，256 种本质上可归约为 **15 种基本拓扑模式**，原始论文正是据此手工列出基表，再通过对称变换展开成完整的 256 项。

## 3. 顶点定位：沿边线性插值

查表告诉我们顶点落在**哪条边**，但具体落在边上的**哪个位置**，需要插值。设一条活动边的两端点为 $\mathbf{p}_a, \mathbf{p}_b$，场值分别为 $f_a, f_b$（一个 $\ge \gamma$、一个 $< \gamma$）。假设场沿这条边**线性变化**，则等值点 $\mathbf{p}$ 由线性插值给出：

$$
\mathbf{p} = \mathbf{p}_a + t\,(\mathbf{p}_b - \mathbf{p}_a), \qquad t = \frac{\gamma - f_a}{f_b - f_a} \tag{1}
$$

这一步至关重要：若不插值、一律取边中点（$t = 0.5$），会得到块状的「阶梯」表面；线性插值则让网格平滑贴合真实等值面，把体素的离散误差降到一阶。$(1)$ 也保证了相邻立方体在**共享边**上算出的是同一个点（因为同一条边的 $f_a, f_b$ 一致），从而网格天然**无缝、流形**。

## 4. 法向估计：场的梯度

得到顶点后还需顶点法向用于着色。等值面 $f(\mathbf{x}) = \gamma$ 的法向恰是场的**梯度方向**（梯度垂直于等值面）：

$$
\mathbf{n}(\mathbf{x}) = \frac{\nabla f(\mathbf{x})}{\|\nabla f(\mathbf{x})\|}
$$

但这里有个容易踩的坑：**等值面顶点 $\mathbf{p}$ 落在边上的分数位置 $t$，并不是整数网格角点**，它身上既没有「整数格点邻居」可供差分，场值又恒等于 $\gamma$（无高低差），所以**不能在顶点 $\mathbf{p}$ 处直接求梯度**。正确做法是「先在角点算、再沿边插值」，分三步——其中 $A, B$ 是该边的两个网格角点、$\mathbf{p} = A + t(B-A)$、$t$ 由公式 $(1)$ 给出：

**① 在角点 $A$ 用中心差分估梯度**（角点是整数格点，左右邻居 $v \pm h\mathbf{e}$ 是相邻立方体的共享角点，其场值在全局网格上现成存着），例如 $x$ 分量：

$$
\partial_x f(v) \approx \frac{f(v + h\mathbf{e}_x) - f(v - h\mathbf{e}_x)}{2h}
$$

三轴各做一次得到 $\nabla f(A)$，单位化即角点法向 $\mathbf{n}_A$。

**② 在角点 $B$ 同样做一遍**，得到 $\mathbf{n}_B$。

**③ 用与定位顶点相同的 $t$，把两端角点法向沿边线性插值到 $\mathbf{p}$**：

$$
\mathbf{n}(\mathbf{p}) = \frac{(1-t)\,\mathbf{n}_A + t\,\mathbf{n}_B}{\big\|\,(1-t)\,\mathbf{n}_A + t\,\mathbf{n}_B\,\big\|} \tag{2}
$$

也就是说：中心差分始终发生在**整数角点**上，顶点 $\mathbf{p}$ 的法向是**插值继承**来的，并非在 $\mathbf{p}$ 处差分。位置插值 $\mathbf{p} = A + t(B-A)$ 与法向插值 $(2)$ 共用同一个 $t$，是「同一套参数化」的两个分量——一个插出顶点在哪，一个插出它朝哪；这也保证相邻立方体共享这条边时得到完全一致的法向。如此即获得平滑的逐顶点法向，无需后续再从三角面片叉积重算。

## 5. 歧义问题（Ambiguity）

Marching Cubes 的经典缺陷在于**歧义面（ambiguous face）**：当一个立方体的某个面上，两个对角的角点同为「内」、另两个对角同为「外」时，该面上的等值线有两种连法，不同选择会导致相邻立方体之间出现**孔洞 / 裂缝**，破坏流形性。

判别一个面是否真正连通，需要看面中心的场值。对该面四角 $f_{00}, f_{10}, f_{11}, f_{01}$ 做双线性插值，其面心（鞍点）值的符号决定连法。一个常用的判据是比较对角乘积：

$$
f_{00}\,f_{11} \;\gtrless\; f_{10}\,f_{01}
$$

（相对 $\gamma$ 平移后）符号关系给出双线性曲面在该面是「连内」还是「连外」。后续工作据此改进：
- **Asymptotic Decider**（Nielson & Hamann, 1991）：用上述双线性鞍点判据消除面歧义。
- **Marching Tetrahedra**：先把立方体拆成 6 个四面体，四面体内无歧义，代价是三角形更多。
- **Dual Contouring**：在体素内部放顶点并用 Hermite 数据（含梯度），能更好还原**锐利边角**，而 Marching Cubes 会把尖角磨圆。

## 6. 算法整体复杂度与流程

```
for each cube in grid:                 # 遍历所有体素
    index = 0
    for k in 0..7:                     # 8 个角点定内外
        if f(v_k) >= gamma: index |= (1 << k)
    if index == 0 or index == 255:     # 全内或全外，无表面，跳过
        continue
    edges = edgeTable[index]           # 查：哪些边被穿过
    for each active edge:
        p = interpolate(p_a, p_b, gamma)   # 公式 (1) 定顶点
    for each triangle in triTable[index]:  # 查：如何连三角形
        emit triangle
```

复杂度对网格分辨率 $N^3$ 而言是 $O(N^3)$（须访问每个体素判内外），但只有跨越表面的体素产生三角形，输出三角形数与表面积 $O(N^2)$ 成正比。各立方体彼此独立、无数据依赖，因此**高度可并行**，天然适合 [CUDA](/wiki/cuda) / GPU 实现。

## 7. 在重建管线中的位置

Marching Cubes 几乎总是作为隐式表示的「出口」出现：

`有向点云` → `Poisson 求解 → 隐式场 χ` → **Marching Cubes 抽等值面** → `三角网格`

在 [Poisson 重建](/wiki/poisson-reconstruction) 中，最后一步抽取等值面 $\chi = \gamma$ 用的正是 Marching Cubes（八叉树变体）；在 NeRF / SDF 类神经场里，也是用它把网络隐式定义的密度/距离场转成可渲染、可编辑的网格。

## 相关链接

- [Poisson 表面重建](/wiki/poisson-reconstruction) - 解出隐式场后，用 Marching Cubes 抽取其等值面。
- [Structure from Motion (SfM)](/wiki/sfm) - 重建管线的上游：从图像得到点云。
- [CUDA](/wiki/cuda) - Marching Cubes 各立方体独立、适合 GPU 并行。
- [Computer Graphics](/wiki?tag=Computer+Graphics) - 更多图形学笔记。
