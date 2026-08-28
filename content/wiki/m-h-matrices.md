---
title: "M-矩阵与 H-矩阵：定义、性质与谱半径判据"
date: "2026-08-28"
excerpt: "按严格的非奇异定义整理 M-矩阵与 H-矩阵的常用性质、等价判据和证明，并提炼单位对角 H-矩阵的谱半径结论。"
tags: ["Mathematics", "Numerical Linear Algebra", "Matrix Theory"]
---

# M-矩阵与 H-矩阵：定义、性质与常用证明

本文只讨论实方阵。所有矩阵不等式均为**逐元素**不等式，例如 $B\ge 0$ 表示每个 $b_{ij}\ge 0$。记

$$
\rho(A)=\max_{\lambda\in\sigma(A)}|\lambda|
$$

为谱半径，

$$
|A|=(|a_{ij}|)
$$

为逐元素绝对值。

本文采用 Kolotilina–Yeremin 论文中的严格约定：

$$
\boxed{M=sI-B,\qquad B\ge0,\qquad s>\rho(B)}
$$

才称为 M-矩阵。因此这里的 M-矩阵一律非奇异；不讨论 $s=\rho(B)$ 的奇异 M-矩阵。

---

## 1. 三个常用引理

### 引理 1：非负矩阵的谱半径具有单调性

若

$$
0\le B\le D,
$$

则

$$
\rho(B)\le\rho(D).
$$

证明：由非负性可归纳得到 $0\le B^k\le D^k$。取单调矩阵范数并使用 Gelfand 公式，

$$
\rho(B)
=\lim_{k\to\infty}\|B^k\|^{1/k}
\le
\lim_{k\to\infty}\|D^k\|^{1/k}
=\rho(D).
$$

特别地，非负矩阵的任意主子矩阵 $B[J,J]$ 满足

$$
\rho(B[J,J])\le\rho(B).
$$

### 引理 2：矩阵受其逐元素绝对值控制

对任意实方阵 $X$，

$$
\boxed{\rho(X)\le\rho(|X|).}
$$

证明：由三角不等式，

$$
|X^k|\le |X|^k.
$$

再使用单调矩阵范数及 Gelfand 公式即可。

### 引理 3：Neumann 级数

如果 $\rho(E)<1$，那么

$$
(I-E)^{-1}=\sum_{k=0}^{\infty}E^k.
$$

如果进一步 $E\ge0$，则

$$
(I-E)^{-1}\ge0.
$$

---

## 2. M-矩阵

### 2.1 定义

若存在 $B\ge0$ 和实数 $s$，使得

$$
M=sI-B,
\qquad
s>\rho(B),
$$

则称 $M$ 为 M-矩阵。

由于 $\rho(B)\ge0$，必有 $s>0$。

### 2.2 符号结构

当 $i\ne j$ 时，

$$
m_{ij}=-b_{ij}\le0.
$$

对角线上有

$$
m_{ii}=s-b_{ii}>0.
$$

这里使用了 $b_{ii}\le\rho(B)$。该不等式可由

$$
b_{ii}^k\le(B^k)_{ii}\le\|B^k\|
$$

以及 Gelfand 公式得到。

所以 M-矩阵一定是具有正对角元、非正非对角元的 Z-矩阵。

### 2.3 非奇异性与特征值位置

若 $\lambda\in\sigma(B)$，则

$$
s-\lambda\in\sigma(M).
$$

于是对任意 $\mu\in\sigma(M)$，存在 $\lambda\in\sigma(B)$ 使得

$$
\mu=s-\lambda.
$$

因此

$$
\operatorname{Re}\mu
=s-\operatorname{Re}\lambda
\ge s-|\lambda|
\ge s-\rho(B)>0.
$$

所以：

$$
\boxed{\operatorname{Re}\lambda(M)>0,\qquad M\text{ 非奇异}.}
$$

M-矩阵的特征值不一定全是实数；结论只是全部位于开右半平面。

### 2.4 逆矩阵逐元素非负

写成

$$
M=s\left(I-\frac Bs\right).
$$

因为

$$
\rho(B/s)=\rho(B)/s<1,
$$

所以

$$
\boxed{
M^{-1}
=\frac1s\sum_{k=0}^{\infty}\left(\frac Bs\right)^k
\ge0.
}
$$

而且由于级数第一项是 $I/s$，$M^{-1}$ 的每个对角元严格为正。

### 2.5 存在正的缩放向量

令

$$
d=M^{-1}\mathbf1.
$$

由于 $M^{-1}\ge0$ 且其对角元严格为正，

$$
d>0,
\qquad
Md=\mathbf1>0.
$$

因此每个 M-矩阵都存在 $d>0$，使得 $Md>0$。

反过来，如果 $Z$ 是 Z-矩阵，并存在 $d>0$ 使 $Zd>0$，则 $Z$ 是 M-矩阵。这是常用的正向量判据。

### 2.6 主子矩阵仍是 M-矩阵

若

$$
M=sI-B,\qquad B\ge0,\qquad s>\rho(B),
$$

则任意主子矩阵满足

$$
M[J,J]=sI-B[J,J].
$$

由引理 1，

$$
\rho(B[J,J])\le\rho(B)<s.
$$

因此

$$
\boxed{M[J,J]\text{ 仍是 M-矩阵}.}
$$

特别地，所有主子矩阵均非奇异，所有主子式均为正。

### 2.7 单位对角形式

对于 $E\ge0$，严格定义立即给出

$$
\boxed{I-E\text{ 是 M-矩阵}\iff\rho(E)<1.}
$$

这是证明迭代收敛时最常用的形式。

### 2.8 Z-矩阵的常用等价判据

若 $Z$ 的非对角元均非正，则下列条件等价：

1. $Z$ 是本文严格意义下的 M-矩阵；
2. $Z^{-1}$ 存在且 $Z^{-1}\ge0$；
3. 存在 $d>0$，使得 $Zd>0$；
4. $Z$ 的所有主子式均为正；
5. $Z$ 的所有特征值实部均为正。

在实际证明中，最常用的是 $1\Rightarrow2\Rightarrow3$，以及用条件 3 识别 M-矩阵。

---

## 3. H-矩阵

### 3.1 比较矩阵与定义

对 $A=(a_{ij})\in\mathbb R^{n\times n}$，定义比较矩阵

$$
\langle A\rangle_{ij}
=
\begin{cases}
|a_{ii}|,&i=j,\\
-|a_{ij}|,&i\ne j.
\end{cases}
$$

如果

$$
\boxed{\langle A\rangle\text{ 是 M-矩阵},}
$$

则称 $A$ 为 H-矩阵。

在本文的严格约定下，H-矩阵自动非奇异；不需要再额外说“非奇异 H-矩阵”。

每个 M-矩阵都是 H-矩阵，但 H-矩阵本身不必具有非正非对角元。例如

$$
A=\begin{bmatrix}2&1\\-1&2\end{bmatrix}
$$

不是 M-矩阵，但其比较矩阵

$$
\langle A\rangle
=\begin{bmatrix}2&-1\\-1&2\end{bmatrix}
$$

是 M-矩阵，所以 $A$ 是 H-矩阵。

### 3.2 基本比较不等式

对任意向量 $x$，逐元素成立

$$
\boxed{\langle A\rangle |x|\le |Ax|.}
$$

因为第 $i$ 个分量满足反三角不等式

$$
|a_{ii}||x_i|-
\sum_{j\ne i}|a_{ij}||x_j|
\le
\left|\sum_j a_{ij}x_j\right|.
$$

这是 H-矩阵许多性质的核心。

### 3.3 H-矩阵自动非奇异

设 $Ax=0$。由基本比较不等式，

$$
\langle A\rangle |x|\le0.
$$

由于 $\langle A\rangle$ 是 M-矩阵，

$$
\langle A\rangle^{-1}\ge0.
$$

左乘该逆矩阵得到

$$
|x|\le0.
$$

又因为 $|x|\ge0$，所以 $x=0$。因此

$$
\boxed{A\text{ 非奇异}.}
$$

### 3.4 主子矩阵仍是 H-矩阵

对任意指标集 $J$，

$$
\langle A[J,J]\rangle
=\langle A\rangle[J,J].
$$

M-矩阵的主子矩阵仍是 M-矩阵，因此

$$
\boxed{A[J,J]\text{ 仍是 H-矩阵，因而非奇异}.}
$$

这正是稀疏近似逆中各个局部主子矩阵系统可解的原因。

### 3.5 广义严格对角占优

因为 $\langle A\rangle$ 是 M-矩阵，可取

$$
d=\langle A\rangle^{-1}\mathbf1>0.
$$

于是

$$
\langle A\rangle d>0,
$$

即

$$
\boxed{
|a_{ii}|d_i
>
\sum_{j\ne i}|a_{ij}|d_j,
\qquad i=1,\ldots,n.
}
$$

反过来，如果存在这样的 $d>0$，那么 $\langle A\rangle$ 是 M-矩阵，因而 $A$ 是 H-矩阵。

所以：

$$
\boxed{
A\text{ 是 H-矩阵}
\iff
A\text{ 可通过正对角缩放变成严格行对角占优矩阵}.
}
$$

具体地，令 $D=\operatorname{diag}(d)$，则 $AD$ 严格行对角占优。

### 3.6 逆矩阵比较界

令 $Ax=b$。基本比较不等式给出

$$
\langle A\rangle |x|\le|b|.
$$

左乘非负矩阵 $\langle A\rangle^{-1}$，得到

$$
|x|\le\langle A\rangle^{-1}|b|.
$$

令 $b=e_j$，逐列得到常用界

$$
\boxed{|A^{-1}|\le\langle A\rangle^{-1}.}
$$

### 3.7 H-矩阵不一定正稳定或正定

H-矩阵控制的是绝对值意义下的对角占优，不固定对角元符号。例如 $-I$ 是 H-矩阵，因为

$$
\langle-I\rangle=I
$$

是 M-矩阵，但 $-I$ 的特征值为 $-1$。因此一般不能从“H-矩阵”单独推出正定性或特征值实部为正。

---

## 4. 核心定理：由 H-矩阵推出 $\rho(I-C)<1$

### 定理

设 $C\in\mathbb R^{n\times n}$ 是 H-矩阵，并且

$$
c_{ii}=1,
\qquad i=1,\ldots,n.
$$

那么

$$
\boxed{\rho(I-C)<1.}
$$

### 证明

因为 $c_{ii}=1$，矩阵 $I-C$ 的对角元为零。令

$$
E=|I-C|\ge0.
$$

则 $E$ 的对角元为零，非对角元为

$$
e_{ij}=|c_{ij}|.
$$

因此 $C$ 的比较矩阵恰好是

$$
\boxed{\langle C\rangle=I-E=I-|I-C|.}
$$

因为 $C$ 是 H-矩阵，$\langle C\rangle$ 是 M-矩阵。按照本文的严格定义，

$$
I-E\text{ 是 M-矩阵}
\quad\Longrightarrow\quad
\rho(E)<1.
$$

再由引理 2，

$$
\rho(I-C)
\le
\rho(|I-C|)
=\rho(E)
<1.
$$

所以

$$
\boxed{\rho(I-C)<1.}
$$

证毕。

### 这个定理与 $C=GA$ 的关系

在 FSAI 论文中取 $C=GA$。只要先前结果已经保证

$$
GA\text{ 是 H-矩阵},
$$

并且由构造式得到

$$
(GA)_{ii}=1,
$$

就可以直接套用上述定理。证明只使用 $C=GA$ 的整体性质，完全不依赖 $G$ 与 $A$ 各自的结构。

### 对迭代收敛的直接推论

考虑

$$
x^{(k+1)}=x^{(k)}+G(b-Ax^{(k)}).
$$

若 $x^\ast$ 满足 $Ax^\ast=b$，误差 $e^{(k)}=x^{(k)}-x^\ast$ 满足

$$
e^{(k+1)}=(I-GA)e^{(k)}.
$$

令 $C=GA$。由 $\rho(I-C)<1$，有

$$
(I-C)^k\to0,
$$

所以

$$
e^{(k)}\to0.
$$

---

## 5. 快速查阅表

| 对象 | 定义或判据 | 关键结论 |
|---|---|---|
| M-矩阵 | $M=sI-B,\ B\ge0,\ s>\rho(B)$ | $M^{-1}\ge0$，特征值实部正，主子矩阵仍是 M-矩阵 |
| H-矩阵 | $\langle A\rangle$ 是 M-矩阵 | $A$ 及所有主子矩阵非奇异，$|A^{-1}|\le\langle A\rangle^{-1}$ |
| H-矩阵缩放判据 | 存在 $d>0$，使 $|a_{ii}|d_i>\sum_{j\ne i}|a_{ij}|d_j$ | 正对角缩放后严格行对角占优 |
| 单位对角 H-矩阵 | $C$ 是 H-矩阵且 $c_{ii}=1$ | $\rho(I-C)<1$ |

最值得记住的两条链条是

$$
M=sI-B,\quad s>\rho(B)
\Longrightarrow
M^{-1}=\frac1s\sum_{k=0}^{\infty}(B/s)^k\ge0,
$$

以及

$$
C\text{ 是单位对角 H-矩阵}
\Longrightarrow
\langle C\rangle=I-|I-C|\text{ 是 M-矩阵}
\Longrightarrow
\rho(I-C)<1.
$$
