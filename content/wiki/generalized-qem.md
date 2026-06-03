---
title: "广义二次误差度量（Generalized QEM）算法笔记"
date: "2026-06-01"
tags: ["Computer Graphics", "Mesh Simplification", "Geometry Processing"]
---

# 广义二次误差度量（Generalized QEM）算法笔记

> 基于 Garland & Heckbert, *Simplifying Surfaces with Color and Texture using Quadric Error Metrics*, 1998

---

## 1. 问题背景

三维模型简化的目标是在减少多边形数量的同时，尽量保留原始模型的视觉特征。现实中的模型不仅有几何信息，还有颜色、纹理坐标、表面法线等顶点属性（vertex attributes）。

1997年的原始QEM算法（Garland & Heckbert, SIGGRAPH 97）只处理纯几何简化。1998年的推广版本将误差度量扩展到任意维度，使得几何与属性可以在同一个框架下联合优化。

---

## 2. 基础算法回顾

### 2.1 边坍缩（Edge Contraction）

算法的基本操作是将边 $(v_1, v_2)$ 坍缩为单点 $\bar{v}$，记作：

$$
(v_1, v_2) \rightarrow \bar{v}
$$

具体步骤：
1. 将 $v_1, v_2$ 移动到目标位置 $\bar{v}$
2. 用 $v_1$ 替换所有出现的 $v_2$
3. 删除 $v_2$ 及退化面

所有边按坍缩代价维护在一个最小堆中，每次取代价最小的边执行坍缩，并更新邻边代价。

### 2.2 基本二次型（Basic Quadric）

每个面定义一个平面方程：

$$
\mathbf{n}^T \mathbf{v} + d = 0, \quad \mathbf{n} = [n_x, n_y, n_z]^T \text{ 为单位法线}
$$

顶点 $\mathbf{v}$ 到该平面的平方距离为：

$$
D^2 = (\mathbf{n}^T \mathbf{v} + d)^2 = \mathbf{v}^T (\mathbf{n}\mathbf{n}^T) \mathbf{v} + 2d\mathbf{n}^T \mathbf{v} + d^2
$$

定义**二次型（Quadric）** $Q = (\mathbf{A}, \mathbf{b}, c)$：

$$
\mathbf{A} = \mathbf{n}\mathbf{n}^T, \quad \mathbf{b} = d\mathbf{n}, \quad c = d^2
$$

$$
Q(\mathbf{v}) = \mathbf{v}^T \mathbf{A} \mathbf{v} + 2\mathbf{b}^T \mathbf{v} + c
$$

每个顶点的初始 $Q$ 为其所有邻面二次型之和（分量逐项相加）：

$$
Q_{\text{vertex}} = \sum_{\text{incident faces}} Q_{\text{face}}
$$

坍缩边 $(v_1, v_2)$ 后，新顶点的二次型为：

$$
Q = Q_1 + Q_2
$$

### 2.3 顶点位置选择

**Subset placement**：从两端点中选误差较小者作为 $\bar{v}$，即 $\arg\min(Q(v_1), Q(v_2))$。

**Optimal placement**：对合并后的二次型 $Q$，求使 $Q(\bar{v})$ 最小的点。由于 $Q$ 是二次函数，令梯度为零：

$$
\frac{\partial Q}{\partial \mathbf{v}} = 2\mathbf{A}\bar{v} + 2\mathbf{b} = 0
$$

$$
\bar{v} = -\mathbf{A}^{-1}\mathbf{b}, \quad Q(\bar{v}) = -\mathbf{b}^T \mathbf{A}^{-1} \mathbf{b} + c
$$

若 $\mathbf{A}$ 不可逆（存在无穷多最优点，即 $Q$ 的等值面退化为柱面或平行平面），则退回 subset placement。

---

## 3. 不连续性保留

### 3.1 形状不连续性（Shape Discontinuities）

折痕等 $C^0$ 连续处由误差度量**隐式保留**。以立方体棱边为例，棱边上的顶点同时受到来自两个垂直面的二次型约束，沿棱方向移动代价极低，偏离棱方向代价极高，算法自然将顶点约束在棱上。

### 3.2 边界曲线（Boundary Curves）

开放边界只有单侧有面，没有对侧面的约束，顶点可以自由漂移。

解决方案：对每条边界边，构造一个**穿过该边且垂直于相邻面**的约束平面（boundary constraint plane），形成对应的二次型，乘以大权重 $w \gg 1$ 后加入端点的初始二次型：

$$
Q_{\text{vertex}} \leftarrow Q_{\text{vertex}} + w \cdot Q_{\text{constraint}}
$$

---

## 4. 广义误差度量（Generalized Error Metric）

将每个顶点扩展为 $n$ 维向量，前3维为几何坐标，后续维为属性。以带颜色的模型为例（$n=6$）：

$$
\mathbf{v} = [x, y, z, r, g, b]^T \in \mathbb{R}^n
$$

由于属性在三角形上线性插值，三角形三个顶点确定了 $\mathbb{R}^n$ 中的一个**二维平面**（而非超平面——三角形无论嵌入几维空间，自身始终是二维流形）。广义 QEM 度量的是点到这个二维平面的距离。

### 4.1 构造二次型

给定三角形 $T = (\mathbf{p}, \mathbf{q}, \mathbf{r})$，$\mathbf{p}, \mathbf{q}, \mathbf{r} \in \mathbb{R}^n$，先对 $(\mathbf{q}-\mathbf{p})$ 和 $(\mathbf{r}-\mathbf{p})$ 做 Gram-Schmidt，得到平面内正交基：

$$
\mathbf{e}_1 = \frac{\mathbf{q} - \mathbf{p}}{\|\mathbf{q} - \mathbf{p}\|}, \qquad
\mathbf{e}_2 = \frac{\mathbf{r} - \mathbf{p} - (\mathbf{e}_1 \cdot (\mathbf{r} - \mathbf{p}))\mathbf{e}_1}{\|\mathbf{r} - \mathbf{p} - (\mathbf{e}_1 \cdot (\mathbf{r} - \mathbf{p}))\mathbf{e}_1\|}
$$

```
         r
         *
        / \        e₁, e₂ 张成三角形所在的2维平面
       /   \       以 p 为原点构成局部坐标系
      *─────*
      p     q
      │
      e₁ ──→  （沿 p→q 方向）
      e₂ ↑    （Gram-Schmidt 后垂直 e₁，仍在平面内）
```

设 $\mathbf{u} = \mathbf{p} - \mathbf{v}$，点 $\mathbf{v}$ 到平面的平方距离等于 $\mathbf{u}$ 中垂直于平面的分量：

```
‖u‖² = (u·e₁)² + (u·e₂)² + D²
                              ↑
                    这是我们要的距离
→  D² = ‖u‖² − (u·e₁)² − (u·e₂)²
```

将 $\mathbf{u} = \mathbf{p} - \mathbf{v}$ 代入展开，整理为二次型 $D^2 = \mathbf{v}^T\mathbf{A}\mathbf{v} + 2\mathbf{b}^T\mathbf{v} + c$：

$$
\mathbf{A} = \mathbf{I} - \mathbf{e}_1\mathbf{e}_1^T - \mathbf{e}_2\mathbf{e}_2^T \quad (n \times n)
$$

$$
\mathbf{b} = (\mathbf{p} \cdot \mathbf{e}_1)\mathbf{e}_1 + (\mathbf{p} \cdot \mathbf{e}_2)\mathbf{e}_2 - \mathbf{p}
$$

$$
c = \mathbf{p} \cdot \mathbf{p} - (\mathbf{p} \cdot \mathbf{e}_1)^2 - (\mathbf{p} \cdot \mathbf{e}_2)^2
$$

结构与基础QEM完全相同，只是 $\mathbf{A}$ 从 $\mathbf{n}\mathbf{n}^T$（点到超平面）换成了 $\mathbf{I} - \mathbf{e}_1\mathbf{e}_1^T - \mathbf{e}_2\mathbf{e}_2^T$（点到2维平面）。顶点二次型仍为所有邻面之和，最优目标点求解公式也不变：

$$
Q_{\text{vertex}} = \sum_{\text{faces}} Q_{\text{face}}, \qquad \bar{v} = -\mathbf{A}^{-1}\mathbf{b}
$$

此时 $\bar{v} \in \mathbb{R}^n$，前3维为新的几何坐标，后续维为自动合成的属性值。$\mathbf{A}$ 的非对角项隐式编码了位置与属性之间的相关性，optimal placement 时一并优化（见第5节）。

---

## 5. 相关性编码示例

以论文 Figure 6 为例，说明矩阵 $\mathbf{A}$ 如何编码位置与颜色的相关性。

网格为平坦平面（所有 $z=0$），每个顶点标注 `[x,y,z, r,g,b]`，rgb 值用括号标出：

```
          [1,2,0]          [2,2,0]
          (.3,.4,.3)        (.3,.5,.3)
               *────────────*
              /│╲          /│
             / │  ╲       / │
            /  │    ╲    /  │
[0,1,0]    /   │      ╲ /   │    [2,1,0]
(.5,.3,.3)*────┼───────*────*    (.5,.5,.3)
           ╲   │  中心 │   /
            ╲  │[1,1,0]│  /
             ╲ │(.5,.4,.3)/
              ╲│       │/
               *────────*
          [0,0,0]        [1,0,0]
          (.7,.3,.3)      (.7,.4,.3)
```

观察各顶点数据可知：
- $r$（红色）：y=0 时 r≈0.7，y=2 时 r≈0.3，**r 与 y 负相关**
- $g$（绿色）：x=0 时 g≈0.3，x=2 时 g≈0.5，**g 与 x 正相关**
- $z$ 全为 0，$b$ 全为 0.3，两者几乎不变

对中心顶点求和6个邻面的二次型后，得到矩阵 $\mathbf{A}$（行列顺序为 $x,y,z,r,g,b$）：

$$
\mathbf{A} = \begin{bmatrix}
0.06 & 0 & 0 & 0 & -0.59 & 0 \\
0 & 0.23 & 0 & 1.15 & 0 & 0 \\
0 & 0 & 6.00 & 0 & 0 & 0 \\
0 & 1.15 & 0 & 5.77 & 0 & 0 \\
-0.59 & 0 & 0 & 0 & 5.94 & 0 \\
0 & 0 & 0 & 0 & 0 & 6.00
\end{bmatrix}
$$

用注释标出各区块的含义（行列均按 x,y,z,r,g,b 顺序）：

```
          x       y       z       r       g       b
      ┌────────┬───────┬───────┬───────┬───────┬───────┐
  x   │  0.06  │   0   │   0   │   0   │-0.59 ←┼── x与g强相关
      ├────────┼───────┼───────┼───────┼───────┼───────┤
  y   │   0    │  0.23 │   0   │  1.15←┼── y与r强相关    │
      ├────────┼───────┼───────┼───────┼───────┼───────┤
  z   │   0    │   0   │  6.00 │   0   │   0   │   0   │← z不变，惩罚极大
      ├────────┼───────┼───────┼───────┼───────┼───────┤
  r   │   0    │  1.15 │   0   │  5.77 │   0   │   0   │
      ├────────┼───────┼───────┼───────┼───────┼───────┤
  g   │ -0.59  │   0   │   0   │   0   │  5.94 │   0   │
      ├────────┼───────┼───────┼───────┼───────┼───────┤
  b   │   0    │   0   │   0   │   0   │   0   │  6.00 │← b不变，惩罚极大
      └────────┴───────┴───────┴───────┴───────┴───────┘
        ↑
      x方向惩罚极小（平坦网格，x方向可自由滑动）
```

关键观察：

| 元素 | 值 | 含义 |
|------|-----|------|
| $A_{x,x} = 0.06$ | 极小 | 网格平坦，$x$ 方向可自由滑动 |
| $A_{z,z} = 6.00$ | 极大 | $z$ 全为0，偏离惩罚极大 |
| $A_{b,b} = 6.00$ | 极大 | $b$ 几乎不变，偏离惩罚极大 |
| $A_{y,r} = A_{r,y} = 1.15$ | 非零 | $y$ 与 $r$ 存在强相关 |
| $A_{x,g} = A_{g,x} = -0.59$ | 非零 | $x$ 与 $g$ 存在强相关 |

非对角项正是这一扩展相比 segregated metric（分开优化各属性）的核心优势——在 optimal placement 时，改变顶点的 $x$ 坐标，矩阵会自动对 $g$ 施加相应约束，合成出和原始表面一致的新属性值。

---

## 6. 空间复杂度

随属性维度 $n$ 的增加，二次型矩阵规模增长：

| 模型类型 | 顶点向量 | $\mathbf{A}$ 大小 | 独立系数数量 |
|----------|----------|-------------------|-------------|
| 纯几何 | $[x,y,z]^T$ | $3 \times 3$ | $\binom{5}{2} = 10$ |
| 几何 + 2D纹理 | $[x,y,z,s,t]^T$ | $5 \times 5$ | $\binom{7}{2} = 21$ |
| 几何 + 颜色 | $[x,y,z,r,g,b]^T$ | $6 \times 6$ | $\binom{8}{2} = 28$ |
| 几何 + 法线 | $[x,y,z,a,b,c]^T$ | $6 \times 6$ | $\binom{8}{2} = 28$ |

由于 $\mathbf{A}$ 是对称矩阵，独立系数数量为 $\binom{n+2}{2}$，随属性数量**二次增长**。

---

## 7. 属性约束处理

### 7.1 颜色（RGB）

Optimal placement 可能合成出略微超出 $[0,1]$ 范围的颜色值。直接 clamp 到颜色立方体的最近点，因偏差极小，不引入可见伪影。

### 7.2 纹理坐标（ST）

同颜色处理，clamp 到合法范围。

### 7.3 表面法线

合成的法线向量长度可能不为1，需要归一化：

$$
\mathbf{n}_{\text{new}} \leftarrow \frac{\mathbf{n}_{\text{new}}}{\|\mathbf{n}_{\text{new}}\|}
$$

---

## 8. 属性连续性的限制

### 8.1 假设前提

算法假设每个顶点的属性唯一且连续，可以用单一向量 $\mathbf{v} \in \mathbb{R}^n$ 表示。

### 8.2 纹理接缝问题

当纹理绕柱面一圈时，接缝处顶点需要同时持有 $s=0$ 和 $s=1$ 两个纹理坐标，违反了单值假设。

当前的 workaround：将接缝处每个顶点复制为两个顶点，各持独立的纹理坐标但相同的空间位置，再用 boundary constraint 维护接缝。

此方案的局限：若不连续性过于密集（如每个面都有独立纹理），boundary constraint 泛滥，算法失效。

完整的解决方案（论文中作为 future work）：允许每个顶点持有多套属性值，对应多个二次型。

### 8.3 欧氏度量的合理性

算法对所有属性使用欧氏距离度量误差。

**对颜色的辩护**：虽然 RGB 空间在感知上非欧氏，但模型最终以 Gouraud shading 显示，即在 RGB 空间线性插值——显示管线本身就是欧氏的，因此用欧氏距离度量颜色误差与显示方式自洽。

**对法线的辩护**：单位法线位于球面 $S^2$ 上，对法线做欧氏度量简化等价于对 Gauss 映射做曲面简化。只要法线变化缓慢（局部），球面测地距离与欧氏距离近似相等，结果可靠。

---

## 9. 算法流程总结

```
初始化：
  对每个面 T = (p, q, r)：
    计算 e1, e2（Gram-Schmidt）
    计算 A = I - e1*e1^T - e2*e2^T
    计算 b, c
    将 Q_face 累加到各端点的 Q_vertex

  对每条边界边：
    构造约束平面二次型，乘以大权重，加入端点 Q_vertex

  对每条边 (v1, v2)：
    Q = Q1 + Q2
    计算最优目标点 v_bar = -A^{-1} b（若 A 不可逆则用 subset）
    计算坍缩代价 cost = Q(v_bar)
    插入最小堆

简化循环（直到达到目标面数）：
  取堆顶边 (v1, v2)
  执行坍缩 → v_bar
  前3维更新几何坐标，后续维 clamp 到合法属性范围
  更新邻边的 Q 和 cost，重新入堆
```

---

## 10. 参考文献

- Garland, M. & Heckbert, P. S. (1997). *Surface Simplification Using Quadric Error Metrics*. SIGGRAPH 97, pp. 209–216.
- Garland, M. & Heckbert, P. S. (1998). *Simplifying Surfaces with Color and Texture using Quadric Error Metrics*. IEEE Visualization 98.

---

## 相关内容
- [Mesh Reduction (Knodt 2024)](/wiki/mesh-reduction-knodt)
- [RenderFormer: Neural Rendering Transformer](/wiki/renderformer)
