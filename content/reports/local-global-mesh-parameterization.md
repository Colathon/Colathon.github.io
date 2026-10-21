---
title: "A Local/Global Approach to Mesh Parameterization"
date: "2026-10-21"
excerpt: "Liu 等人把低畸变参数化写成每个三角形的局部最佳变换与全局 Poisson 拼接：Local phase 用二维 Procrustes/SVD 提取最近旋转，Global phase 用固定的余切 Laplacian 解所有 UV 顶点。本文从 Jacobian、余切权重和线性系统完整推导 ARAP，并分析它为何以极小角度代价显著改善面积，却不能保证无翻转或全局双射。"
tags: ["Computer Graphics", "Geometry Processing", "Mesh Parameterization", "ARAP", "Local-Global Optimization"]
---

# A Local/Global Approach to Mesh Parameterization —— 阅读报告

> Ligang Liu, Lei Zhang, Yin Xu, Craig Gotsman, Steven J. Gortler
>
> *Computer Graphics Forum (Proceedings of the Symposium on Geometry Processing)*, 27(5), 1495–1504, 2008
>
> [论文 PDF](https://www.cs.harvard.edu/~sjg/papers/arap.pdf) · [DOI](https://doi.org/10.1111/j.1467-8659.2008.01290.x)

---

## 0. 先给结论：这篇论文最值得记住什么

给定一个三角曲面，参数化要为每个三维顶点求二维坐标 $u_i\in\mathbb R^2$。理想情况下，每个三角形从自身平面到 UV 平面的 Jacobian 都应当只是旋转：

$$
J_t\approx R_t,\qquad R_t\in SO(2).
$$

困难在于，相邻三角形共享顶点，不能让每个三角形各自选择一套互不兼容的二维位置。论文把这个矛盾拆成两个交替步骤：

~~~text
当前全局 UV 顶点 U
        ↓
Local phase：每个三角形独立寻找最接近当前 Jacobian 的旋转 Rt
        ↓
Global phase：解一个全局 Poisson 方程，让共享顶点尽量满足所有局部旋转
        ↓
新的全局 UV 顶点 U
        ↓
重复，直到能量不再明显下降
~~~

对应的 ARAP 能量是

$$
E(U,R)=\sum_{t\in F}A_t\|J_t(U)-R_t\|_F^2,
\qquad R_t\in SO(2).
\tag{1}
$$

这篇论文最重要的贡献不是发明 SVD、余切 Laplacian、Poisson 方程或交替优化，而是发现参数化可以被组织为：

$$
\boxed{
\text{大量彼此独立的小型局部闭式问题}
+
\text{一个矩阵固定的全局稀疏线性问题}
}
$$

它由此得到一个简洁、快速且影响深远的 ARAP 参数化算法，并在同一框架中解释了 ASAP 与 LSCM 的关系。

它也有一个必须明确的限制：这里的 “global” 指全局拼接，不是全局最优，更不是全局双射保证。算法可能产生翻转或远距离重叠，论文只能在最后额外修复少量翻转。

---

## 1. 问题与符号

设三角网格为

$$
M=(V,F),
$$

顶点的三维位置为

$$
p_i\in\mathbb R^3,
$$

待求的二维参数坐标为

$$
u_i=(u_i^x,u_i^y)^T\in\mathbb R^2.
$$

对每个三角形 $t=(i,j,k)$，先把它无畸变地放到自身的二维局部坐标系中，得到

$$
x_i^t,x_j^t,x_k^t\in\mathbb R^2.
$$

上标 $t$ 表示局部坐标依赖三角形：一个三维顶点可能属于多个三角形，在每个三角形自己的局部坐标系中，它的 $x_i^t$ 可以不同；但全局 UV 坐标 $u_i$ 只有一份。

常令 $x_i^t$ 为原点，并组成两组边矩阵：

$$
X_t=
\begin{bmatrix}
x_j^t-x_i^t & x_k^t-x_i^t
\end{bmatrix}\in\mathbb R^{2\times2},
$$

$$
U_t=
\begin{bmatrix}
u_j-u_i & u_k-u_i
\end{bmatrix}\in\mathbb R^{2\times2}.
$$

三角形上的映射是仿射的，因此其线性部分满足

$$
J_tX_t=U_t,
$$

从而

$$
\boxed{J_t=U_tX_t^{-1}}.
\tag{2}
$$

$J_t$ 描述该三角形从源表面局部平面到 UV 平面的全部一阶畸变。

---

## 2. Jacobian、奇异值与“尽可能刚性”

对 $J_t$ 做标准 SVD：

$$
J_t=P_t\Sigma_tQ_t^T,
\qquad
\Sigma_t=
\begin{bmatrix}
\sigma_{1,t}&0\\
0&\sigma_{2,t}
\end{bmatrix},
\qquad \sigma_{1,t},\sigma_{2,t}\ge0.
\tag{3}
$$

奇异值的几何意义是两个主方向上的伸缩量：

- $\sigma_1=\sigma_2$：局部保角，只发生统一缩放和旋转；
- $\sigma_1=\sigma_2=1$：局部等距，只发生旋转；
- $\sigma_i\to0$：某一方向被压扁；
- $\sigma_1/\sigma_2$ 偏离 $1$：存在各向异性拉伸。

因此，“as-rigid-as-possible” 的自然目标是让每个 $J_t$ 接近旋转矩阵：

$$
R_t^TR_t=I,
\qquad
\det R_t=1.
$$

满足这两个条件的二维旋转组成特殊正交群

$$
SO(2)=\left\{
\begin{bmatrix}
\cos\theta&-\sin\theta\\
\sin\theta&\cos\theta
\end{bmatrix}
:\theta\in\mathbb R
\right\}.
$$

$SO(2)$ 只包含旋转，不包含镜像反射；一般的 $O(2)$ 才同时允许行列式为 $-1$ 的反射。

---

## 3. 统一的 Local/Global 能量

论文先写出一个更一般的形式：

$$
E(U,L)
=
\sum_{t\in F}A_t\|J_t(U)-L_t\|_F^2,
\tag{4}
$$

其中 $L_t$ 是每个三角形希望达到的局部线性变换。不同的可行集合产生不同参数化：

- 若 $L_t$ 可以是 similarity $s_tR_t$，得到 ASAP；
- 若 $L_t$ 只能是 rotation $R_t$，得到 ARAP；
- 论文还给出二者之间的 Hybrid 模型。

这里 $A_t$ 是源三角形面积，使离散和对网格细分更稳定，也对应连续积分中的面积测度。

优化变量分成两组：

$$
U=\{u_i\}_{i\in V},
\qquad
L=\{L_t\}_{t\in F}.
$$

同时优化是非线性的，但固定一组后，另一组很容易求：

1. 固定 $U$，每个三角形独立求最优 $L_t$；
2. 固定所有 $L_t$，对全部 $U$ 解一个线性最小二乘问题。

这就是 Local/Global 名字的来源。

---

## 4. Local phase：二维 Procrustes 问题

ARAP 的局部问题是

$$
R_t^*
=
\arg\min_{R\in SO(2)}\|J_t-R\|_F^2.
\tag{5}
$$

展开平方：

$$
\begin{aligned}
\|J-R\|_F^2
&=\operatorname{tr}\big((J-R)^T(J-R)\big)\\
&=\operatorname{tr}(J^TJ)+\operatorname{tr}(R^TR)
-2\operatorname{tr}(R^TJ).
\end{aligned}
$$

因为 $R^TR=I$，前两项与 $R$ 无关，所以最小化等价于

$$
\max_{R\in SO(2)}\operatorname{tr}(R^TJ).
\tag{6}
$$

代入 SVD $J=P\Sigma Q^T$：

$$
\operatorname{tr}(R^TJ)
=\operatorname{tr}(R^TP\Sigma Q^T)
=\operatorname{tr}(Q^TR^TP\Sigma).
$$

若 $PQ^T$ 本身行列式为 $+1$，最近旋转就是

$$
R^*=PQ^T.
$$

一般情况下需要排除反射，得到 orientation-preserving Procrustes 解：

$$
\boxed{
R^*=P
\begin{bmatrix}
1&0\\
0&\det(PQ^T)
\end{bmatrix}
Q^T
}.
\tag{7}
$$

论文讨论的 “signed singular value” 是处理方向的记账方式，不是否定标准奇异值非负。标准 SVD 中 $\sigma_i\ge0$；为了区分 $\det J$ 的符号，可以把反射符号吸收到一个主伸缩量或对角修正矩阵中。

对方向保持的三角形，将最优旋转代回式 (5)，有

$$
\begin{aligned}
\min_{R\in SO(2)}\|J-R\|_F^2
&=\|P\Sigma Q^T-PQ^T\|_F^2\\
&=\|P(\Sigma-I)Q^T\|_F^2\\
&=\|\Sigma-I\|_F^2\\
&=(\sigma_1-1)^2+(\sigma_2-1)^2.
\end{aligned}
\tag{8}
$$

所以 ARAP 的几何含义不是只保角，而是要求两个方向的伸缩都接近 $1$。

Local phase 的每个三角形彼此独立，只需计算一个 $2\times2$ SVD 或等价的解析极分解，很适合并行。

---

## 5. 为什么余切权重会自然出现

这一部分是从连续有限元到离散公式的关键。

固定某个三角形 $t$ 的目标变换 $L_t$，定义三个顶点上的残差：

$$
r_i=u_i-L_tx_i^t,
\qquad
r_j=u_j-L_tx_j^t,
\qquad
r_k=u_k-L_tx_k^t.
\tag{9}
$$

在三角形内部用分片线性形函数插值：

$$
r(x)=r_i\phi_i(x)+r_j\phi_j(x)+r_k\phi_k(x).
$$

因为 $r$ 在三角形内是线性的，$\nabla r$ 是常量。又因为

$$
r(x)=u(x)-L_tx,
$$

所以

$$
\nabla r=J_t-L_t.
$$

从而式 (4) 的单三角形项就是连续 Dirichlet energy：

$$
A_t\|J_t-L_t\|_F^2
=\int_t\|\nabla r\|_F^2\,dA.
\tag{10}
$$

把 $r=\sum_i r_i\phi_i$ 代入：

$$
\begin{aligned}
\int_t\|\nabla r\|_F^2dA
&=\int_t
\left\langle
\sum_i r_i\nabla\phi_i,
\sum_j r_j\nabla\phi_j
\right\rangle dA\\
&=\sum_{i,j}r_i^Tr_j
\int_t\nabla\phi_i\cdot\nabla\phi_j\,dA.
\end{aligned}
$$

线性三角形有限元的局部刚度矩阵满足

$$
\int_t\nabla\phi_i\cdot\nabla\phi_j\,dA
=-\frac12\cot\theta_{ij}^t,
\qquad i\ne j,
$$

其中 $\theta_{ij}^t$ 是边 $(i,j)$ 对面的角。整理对角项后得到 cotangent identity：

$$
\boxed{
A_t\|\nabla r\|_F^2
=
\frac12
\sum_{(i,j)\in t}
w_{ij}^t\|r_i-r_j\|^2
},
\tag{11}
$$

其中

$$
w_{ij}^t=\cot\theta_{ij}^t.
$$

再利用

$$
r_i-r_j
=(u_i-u_j)-L_t(x_i^t-x_j^t),
$$

可把总能量改写为

$$
\boxed{
E(U,L)
=\frac12
\sum_{t\in F}
\sum_{(i,j)\in t}
w_{ij}^t
\left\|
(u_i-u_j)-L_td_{ij}^t
\right\|^2
},
\tag{12}
$$

其中

$$
d_{ij}^t=x_i^t-x_j^t.
$$

因此余切权重不是作者为了方便而突然设计的，而是分片线性有限元离散连续积分

$$
\int_M\|\nabla r\|^2dA
$$

的必然结果。

---

## 6. Global phase：从每条边到 Poisson 方程

固定所有 $L_t$。对式 (12) 中一条有向边的项

$$
E_{ij}^t
=\frac12w_{ij}^t
\left\|(u_i-u_j)-g_{ij}^t\right\|^2,
\qquad
g_{ij}^t=L_td_{ij}^t,
$$

分别对端点求导：

$$
\nabla_{u_i}E_{ij}^t
=w_{ij}^t\big[(u_i-u_j)-g_{ij}^t\big],
\tag{13}
$$

$$
\nabla_{u_j}E_{ij}^t
=-w_{ij}^t\big[(u_i-u_j)-g_{ij}^t\big].
\tag{14}
$$

同一条无向边不管原始记录顺序如何，对顶点 $i$ 装配时都可以把它重新定向为从 $i$ 指向 $j$。因为

$$
d_{ji}^t=-d_{ij}^t,
$$

所以换向时残差和导数符号会一起变化，不会漏掉顶点在原记录中作为第二个端点的贡献。

把所有包含 $i$ 的三角形和邻边贡献相加，并令梯度为零：

$$
\sum_{t\ni i}
\sum_{\substack{j\in t\\j\ne i}}
w_{ij}^t
\left[(u_i-u_j)-L_td_{ij}^t\right]
=0.
\tag{15}
$$

移项得到

$$
\sum_{t\ni i}
\sum_{\substack{j\in t\\j\ne i}}
w_{ij}^t(u_i-u_j)
=
\sum_{t\ni i}
\sum_{\substack{j\in t\\j\ne i}}
w_{ij}^tL_td_{ij}^t.
\tag{16}
$$

### 6.1 内边的两个余切权重如何合并

若边 $(i,j)$ 是内边，属于两个三角形 $t_1,t_2$，则左端的全局边权为

$$
w_{ij}
=\sum_{t\supset\{i,j\}}w_{ij}^t
=\cot\alpha_{ij}+\cot\beta_{ij}.
\tag{17}
$$

若采用另一种常见 convention，整体还会带 $1/2$；只要能量、矩阵与右端使用同一 convention，解不变。

边界边只有一个相邻三角形：

$$
w_{ij}=\cot\alpha_{ij}.
$$

需要注意，左端可以把两个余切权重合并，因为它们都乘同一个 $(u_i-u_j)$；右端通常仍保留两项：

$$
w_{ij}^{t_1}L_{t_1}d_{ij}^{t_1}
+w_{ij}^{t_2}L_{t_2}d_{ij}^{t_2},
$$

因为两个相邻三角形的局部坐标和最佳旋转并不相同。

### 6.2 装配成 cotangent Laplacian

定义矩阵 $K\in\mathbb R^{n\times n}$：

$$
K_{ij}=
\begin{cases}
-w_{ij},&i\ne j,\ j\in N(i),\\
0,&i\ne j,\ j\notin N(i),
\end{cases}
$$

$$
K_{ii}=\sum_{j\in N(i)}w_{ij}.
\tag{18}
$$

于是

$$
(KU)_i
=\sum_{j\in N(i)}w_{ij}(u_i-u_j).
$$

将右端记作

$$
b_i(L)
=
\sum_{t\ni i}
\sum_{\substack{j\in t\\j\ne i}}
w_{ij}^tL_td_{ij}^t,
\tag{19}
$$

便得到 Global phase 的线性方程：

$$
\boxed{KU=B(L)}.
\tag{20}
$$

二维坐标可以拆成两个具有相同系数矩阵的系统：

$$
Ku=b_x,
\qquad
Kv=b_y.
$$

由于 $K$ 只取决于原始三角网格和余切权重，在整个迭代中固定不变。对加锚点后的 $K$ 做一次 Cholesky 分解，后续每轮只需更新右端并回代。

这正是算法快的核心原因。

### 6.3 为什么要固定自由度

式 (12) 只含坐标差，因此整体平移不会改变能量：

$$
u_i\mapsto u_i+c.
$$

所以 $K$ 至少有常向量零空间。实现中必须固定一个顶点、固定质心，或以其他方式消除平移自由度。根据所用模型和规范化方式，也常固定第二个自由度来消除整体旋转或尺度退化。

---

## 7. ASAP、LSCM 与 ARAP 的关系

### 7.1 ASAP：局部允许 similarity

ASAP 允许

$$
L_t=s_tR_t.
$$

二维 similarity 的一般矩阵形式是

$$
L_t=
\begin{bmatrix}
a_t&-b_t\\
b_t&a_t
\end{bmatrix}.
$$

它允许旋转和统一缩放，却不允许两个方向采用不同缩放。于是理想状态只要求

$$
\sigma_{1,t}=\sigma_{2,t},
$$

不要求它们等于 $1$。论文证明这一能量与 LSCM 等价。

因此可以把 LSCM 理解成：

> 每个三角形都尽量像某个相似变换，但每个三角形可以选择自己的局部尺度。

这解释了为什么 LSCM 非常保角，却可能出现严重的尺度和面积不均匀。

### 7.2 ARAP：局部只允许 rotation

ARAP 要求

$$
L_t=R_t\in SO(2).
$$

它不仅希望两个奇异值相等，还希望

$$
\sigma_{1,t}\approx\sigma_{2,t}\approx1.
$$

因此 ARAP 同时约束角度、长度和面积，代价是可能比 LSCM 多一点角度误差。

### 7.3 Hybrid 是否重要

Hybrid 确实是论文提出的扩展，用参数在 ASAP 与 ARAP 之间连续插值。它展示了框架的统一性，也允许用户控制保角与保尺度的折中。

但它不是理解论文主贡献所必需的。抓住两个端点已经足够：

$$
\text{ASAP/LSCM：允许每个三角形自由选择尺度},
$$

$$
\text{ARAP：把理想局部尺度固定在 }1.
$$

---

## 8. 完整算法

### 8.1 预处理

对每个三角形：

1. 建立局部二维坐标 $x_i^t$；
2. 计算 $X_t^{-1}$、面积 $A_t$ 和余切权重；
3. 装配全局 cotangent Laplacian $K$；
4. 加入必要锚点并对 $K$ 做一次稀疏 Cholesky 分解。

### 8.2 初始化

先生成一个合理的无翻转平面参数化：

- 单边界网格使用 Floater shape-preserving parameterization；
- 多边界网格使用 LSCM。

记为 $U^{(0)}$。

### 8.3 交替迭代

第 $k$ 轮：

~~~text
Local:
  for every triangle t:
    Jt = Ut Xt^{-1}
    对 Jt 做 2×2 SVD / 极分解
    计算最近旋转 Rt

Global:
  用所有 Rt 装配 B(R)
  解 K u = bx
  解 K v = by

Stop:
  当能量或顶点变化足够小时停止
~~~

通常约十轮以内即可收敛。Local phase 天然并行，Global phase 复用同一矩阵分解。

---

## 9. 收敛性：能保证什么，不能保证什么

Local phase 对固定的 $U^{(k)}$ 精确最小化每个局部变换：

$$
R^{(k)}=\arg\min_R E(U^{(k)},R),
$$

所以

$$
E(U^{(k)},R^{(k)})
\le
E(U^{(k)},R^{(k-1)}).
\tag{21}
$$

Global phase 对固定的 $R^{(k)}$ 精确最小化全部 UV 顶点：

$$
U^{(k+1)}=\arg\min_U E(U,R^{(k)}),
$$

所以

$$
E(U^{(k+1)},R^{(k)})
\le
E(U^{(k)},R^{(k)}).
\tag{22}
$$

因此每个完整迭代都使能量不增。

但原问题由于旋转和顶点耦合而非凸。交替优化通常只能保证到达一个局部稳定点，不能保证：

- 全局最优；
- 与初值无关；
- 三角形不翻转；
- chart 在平面中不自重叠。

这里的 Global phase 只是“同时更新所有顶点”，不是“求出非凸问题的全局最优”。

---

## 10. 初始化敏感性

论文用 Floater 与 LSCM 两种不同初值做了实验。初始展开差异明显，但经过一至三轮迭代后便迅速接近，最终得到相似结果。

这说明该方法对**合理初值**在实验上比较稳定，但不能推出它对任意初值不敏感。它仍要求初始参数化：

- 没有严重翻转；
- 不处于极端退化状态；
- 与一个低畸变解相距不要过远。

所以这篇论文的方法更准确地说是“从现有参数化继续改善 ARAP 能量”，而不是从任意二维顶点位置自动恢复一个好参数化。

---

## 11. 为什么 ARAP 仍可能翻转

ARAP 能量没有显式强制

$$
\det J_t>0.
$$

更关键的是，它在三角形退化时并不发散。考虑

$$
J_t=
\begin{bmatrix}
1&0\\
0&\varepsilon
\end{bmatrix},
\qquad \varepsilon\to0^+.
$$

奇异值为 $1$ 和 $\varepsilon$，于是

$$
E_t^{\mathrm{ARAP}}
=A_t\big[(1-1)^2+(\varepsilon-1)^2\big]
\longrightarrow A_t.
\tag{23}
$$

三角形已经压成线段，能量却只是有限值。优化迭代可以穿过 $\det J_t=0$，进入翻转构型。

论文观察到 Global phase 在高曲率表面或紧凑边界附近偶尔产生少量翻转，于是在最终结果上使用 Karni 等人的 convex virtual boundary 后处理修复。

这意味着：

1. 无翻转不是原优化算法的内在保证；
2. 中间迭代也可能非法；
3. 后处理结果未必仍是原 ARAP 能量的驻点；
4. 远距离的全局自重叠并没有被显式检测。

这正是后来 bijective parameterization 工作重点解决的问题。

---

## 12. 实验指标如何理解

设归一化源面积权重为

$$
\omega_t=\frac{A_t}{\sum_sA_s}.
$$

### 12.1 角度失真

论文使用

$$
D^{\mathrm{angle}}
=\sum_t\omega_t
\left(
\frac{\sigma_{1,t}}{\sigma_{2,t}}
+
\frac{\sigma_{2,t}}{\sigma_{1,t}}
\right).
\tag{24}
$$

对 $r>0$ 有

$$
r+\frac1r\ge2,
$$

所以

$$
D^{\mathrm{angle}}\ge2.
$$

等号成立当且仅当每个三角形

$$
\sigma_{1,t}=\sigma_{2,t}.
$$

它衡量保角程度，不关心统一缩放到底是多少。

### 12.2 面积失真

局部面积缩放率为

$$
a_t=\sigma_{1,t}\sigma_{2,t}.
$$

论文使用

$$
D^{\mathrm{area}}
=\sum_t\omega_t
\left(
\sigma_{1,t}\sigma_{2,t}
+
\frac1{\sigma_{1,t}\sigma_{2,t}}
\right).
\tag{25}
$$

因此

$$
D^{\mathrm{area}}\ge2,
$$

等号当且仅当

$$
\sigma_{1,t}\sigma_{2,t}=1.
$$

### 12.3 ARAP 为什么同时改善两者

ARAP 直接要求

$$
(\sigma_1-1)^2+(\sigma_2-1)^2
$$

尽量小，所以自然同时促使

$$
\frac{\sigma_1}{\sigma_2}\approx1,
\qquad
\sigma_1\sigma_2\approx1.
$$

它不是严格优化式 (24) 或式 (25)，但它的理想点同时是保角和保面积的。

---

## 13. 实验结果究竟证明了什么

论文比较了 LSCM、direct ABF++、LABF、inverse curvature、curvature prescription 和 ARAP。部分数据如下：

| Model | Method | $D^{\mathrm{angle}}$ | $D^{\mathrm{area}}$ |
|---|---|---:|---:|
| Gargoyle | LSCM | 2.00 | 88.14 |
| Gargoyle | ARAP | 2.06 | 2.05 |
| Isis | LSCM | 2.05 | 15.36 |
| Isis | ARAP | 2.19 | 2.11 |
| Cow | LSCM | 2.01 | 30.09 |
| Cow | ARAP | 2.03 | 2.03 |
| Beetle | LSCM | 2.00 | 2.08 |
| Beetle | ARAP | 2.01 | 2.01 |

最值得注意的是 Gargoyle 和 Cow：LSCM 的角度指标几乎达到理论最优 $2$，面积指标却分别高达 $88.14$ 和 $30.09$。

这并不矛盾。LSCM 允许

$$
\sigma_1=\sigma_2=s_t,
$$

而每个三角形的 $s_t$ 可以不同。一个区域整体放大十倍、另一个区域整体缩小十倍，两边仍然都很保角。

ARAP 则额外要求

$$
s_t\approx1.
$$

因此它用很小的角度损失换来了显著更均匀的尺度和面积。论文 checkerboard 可视化中，ARAP 的方格大小通常也更一致。

需要避免过度解读：

- ARAP 并非角度误差最小；
- 不可展曲面不存在完美等距平面展开，它只能折中；
- 对只重视保角的应用，LSCM 仍可能更适合；
- 这些结果没有证明 ARAP 对所有模型和所有下游任务都最好。

作者报告 Local/Global ARAP 通常十轮以内收敛，运行时间与当时的 ABF++ 等方法相当。其主要优势是固定矩阵预分解和简单的局部闭式更新。

---

## 14. 真正足以构成论文的亮点

### 14.1 把 deformation 的 Local/Global 方法迁移到 parameterization

论文明确继承 Sorkine 与 Alexa 2007 ARAP deformation 的思想，因此 Local/Global 不是凭空发明的。新的洞察在于把参数化理解为源三角形到 UV 三角形的二维变形，并把局部变换放在**每个三角形 Jacobian**上。

这种表示恰好与有限元余切离散兼容，于是局部旋转与全局 Poisson 拼接自然连接起来。

### 14.2 在一个框架中解释 LSCM 与 ARAP

允许局部 similarity 得到 ASAP，并与 LSCM 等价；限制为 rotation 得到 ARAP。这个统一视角揭示了两类参数化的本质差异：

$$
\text{LSCM：追求 }\sigma_1=\sigma_2,
$$

$$
\text{ARAP：追求 }\sigma_1=\sigma_2=1.
$$

它不是只给一个新算法，还提供了理解已有方法的语言。

### 14.3 把非线性目标变成固定线性系统的重复求解

所有非线性都被隔离到 per-triangle 最近旋转；Global phase 的矩阵始终是同一个 cotangent Laplacian。只需一次矩阵分解，后续反复回代。

这种结构后来成为几何处理中特别有代表性的算法范式：

> Think globally, act locally.

### 14.4 贡献来自组合，不是工具清单

| 组成 | 单独是否新 | 在本文中的价值 |
|---|---|---|
| SVD / 极分解 | 否 | 给每个三角形的最近 proper rotation 闭式解 |
| cotangent Laplacian | 否 | 把连续 Dirichlet 型残差装配成稀疏全局系统 |
| Poisson solve | 否 | 处理共享顶点的一致性 |
| 交替优化 | 否 | 使非凸问题的每个子问题都易解 |
| 固定矩阵分解 | 常见技巧 | 让多轮迭代实际足够快 |
| 整体方法 | 是核心贡献 | 正确表示和组合形成简洁、统一、高效的参数化框架 |

因此评价这篇论文时，最准确的说法是：

> 数学工具本身并不陌生，难点在于找到一个让这些工具恰好闭合的建模方式。

---

## 15. 存在的不足与批判性阅读

### 15.1 没有局部双射保证

能量在 $\det J_t=0$ 时有限，也没有 barrier 或精确安全步长。Global phase 可能一次把某些三角形推过退化状态。

### 15.2 没有全局双射保证

即使所有三角形都保持正方向，二维 chart 仍可能发生远距离覆盖。算法没有边界碰撞检测或全局自交约束。

### 15.3 依赖有效初始化

它是非凸的 block coordinate descent。论文展示了对两种合理初值不太敏感，但这不是任意初值上的理论保证。

### 15.4 后处理与原目标脱节

翻转修复不是 ARAP 能量的一部分。修复后的参数化可能增加 ARAP 能量，也未必解决全局重叠。

### 15.5 不优化 seam

闭合曲面必须先切成 chart。论文只优化给定 chart 的 UV，不决定切缝位置、chart 数量、atlas packing 或 seam consistency。

### 15.6 ARAP 的目标并非普适

它把单位尺度当作理想状态。实际任务可能更需要严格保角、严格保面积、各向异性 texel density、特征方向对齐或特定边界形状。

### 15.7 钝角网格与数值问题

余切权重在钝角对面可能为负。整体有限元刚度矩阵在适当约束下仍有明确来源，但局部“正弹簧”直觉不再成立；退化、极瘦三角形也会恶化条件数。论文对这些鲁棒性细节讨论有限。

### 15.8 实验规模按现代标准有限

论文提供了有说服力的代表模型和指标，但缺少现代常见的大规模 benchmark、失败率、初值消融、网格质量敏感性和全局重叠统计。

### 15.9 “快速收敛”不等于“到达最佳解”

十轮左右能量停止明显下降，只表示当前交替更新接近固定点，不证明它是最低畸变的参数化。

---

## 16. 与 Bijective Parameterization with Free Boundaries 的关系

两篇论文的差别可以理解为优化目标与合法性保证的演进。

| | Local/Global ARAP 2008 | Bijective Free Boundaries 2015 |
|---|---|---|
| 主要目标 | 快速得到接近等距的自由边界参数化 | 在自由边界优化中始终维持全局双射 |
| 畸变核心 | $\|J_t-R_t\|_F^2$ | 对退化发散的对称伸缩能量 |
| 优化器 | Local/Global 交替优化 | L-BFGS + 安全线搜索 |
| 局部翻转 | 可能发生，最终后处理 | 解析首个零面积时刻，禁止跨越 |
| 全局重叠 | 没有直接处理 | 边界屏障、空间哈希、首个接触时刻 |
| 边界 | 自由 | 自由且维持简单边界 |
| 理论重点 | 能量单调下降与高效求解 | 可行域不变量与双射保证 |

ARAP 解决的是：

$$
\text{如何高效地降低失真？}
$$

2015 年的工作进一步追问：

$$
\text{降低失真的过程中，如何保证每一步始终合法？}
$$

后者不是简单地换一个更好的能量，而是补上 Local/Global ARAP 最明显的结构性缺口：退化和全局自交没有被原算法纳入可行域。

---

## 17. 实现时最容易踩的坑

1. **混淆局部坐标与全局 UV**：$x_i^t$ 属于三角形局部坐标系，$u_i$ 才是全局未知量。
2. **把标准奇异值理解成可为负**：SVD 的奇异值始终非负；符号只用于记录 Jacobian 方向。
3. **最近正交矩阵与最近旋转混为一谈**：若直接用 $PQ^T$，可能得到反射；应检查行列式并使用式 (7)。
4. **只对边记录中的第一个端点求导**：装配时无向边会同时作用于两个端点，可按当前顶点重新定向。
5. **把内边右端也粗暴合并成一个旋转**：左右两个三角形的 $R_t$ 不同，右端应保留各自贡献。
6. **忘记 Laplacian 零空间**：至少要去除整体平移自由度，否则线性系统奇异。
7. **把能量下降当作无翻转保证**：ARAP 在退化处有限，二者没有逻辑关系。
8. **把 Global phase 当成全局最优**：它只对固定局部旋转的二次子问题全局最优。
9. **把自由边界当成无需 seam**：闭曲面仍要先切开，论文不负责选 seam。
10. **忽略 cotangent convention 的 $1/2$**：不同文献定义不同，只要整套推导一致即可。

---

## 18. 最终心智模型

读完这篇论文，可以保留下面七句话：

1. 每个三角形的畸变由 $J_t=U_tX_t^{-1}$ 描述。
2. Local phase 从 $J_t$ 中提取每个三角形最想要的 proper rotation。
3. Global phase 让共享顶点在所有局部愿望之间做最小二乘折中。
4. 余切权重来自分片线性有限元的 Dirichlet energy，不是经验拼出来的。
5. 固定 cotangent Laplacian 可以预分解，使多轮非线性迭代很便宜。
6. ASAP/LSCM 允许局部尺度变化，ARAP 则把理想尺度固定为 $1$。
7. 算法降低失真很有效，但不提供无翻转或全局双射保证。

最精炼的总结是：

$$
\boxed{
\text{每个三角形先独立选择想要的旋转，
再由全局 Poisson 方程寻找最一致的 UV。}
}
$$

从研究方法论看，它最值得学习的地方是：复杂的新问题不一定需要全新的数学工具；找到正确的表示与问题拆分，常见工具也能组合出一篇经典工作。

---

## 参考与延伸

- Ligang Liu, Lei Zhang, Yin Xu, Craig Gotsman, Steven J. Gortler. [A Local/Global Approach to Mesh Parameterization](https://www.cs.harvard.edu/~sjg/papers/arap.pdf). SGP 2008.
- Olga Sorkine, Marc Alexa. [As-Rigid-As-Possible Surface Modeling](https://doi.org/10.2312/SGP/SGP07/109-116). SGP 2007.
- Bruno Lévy et al. [Least Squares Conformal Maps for Automatic Texture Atlas Generation](https://doi.org/10.1145/566570.566590). SIGGRAPH 2002.
- Michael S. Floater. [Parametrization and Smooth Approximation of Surface Triangulations](https://doi.org/10.1016/S0167-8396(96)00031-3). 1997.
- Jason Smith, Scott Schaefer. [Bijective Parameterization with Free Boundaries](https://people.engr.tamu.edu/schaefer/research/bijective.pdf). SIGGRAPH 2015.
