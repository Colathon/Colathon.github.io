---
title: "Nakatsukasa Big Gap：Rayleigh–Ritz 块结构为何给出更尖锐的角度界"
date: "2026-09-05"
excerpt: "从 Ritz 基与其正交补下的三块矩阵出发，推导 small gap、Big Gap、两步耦合和 Schur 补修正，并说明何时应从单个 Ritz 向量改为整簇子空间认证。"
tags: ["Mathematics", "Numerical Linear Algebra", "Rayleigh–Ritz"]
---

# Nakatsukasa Big Gap：Rayleigh–Ritz 块结构为何给出更尖锐的角度界

经典 Davis–Kahan 型估计告诉我们

$$
\sin\angle(x,\widehat x)
\lesssim
\frac{\|r\|}{\text{局部 gap}}.
$$

如果目标特征值旁边恰好有另一个极近的特征值，局部 gap 很小，这个界可能大于 $1$，因而无法提供有效信息。

Nakatsukasa 的关键观察是：当 $\widehat x$ 不是任意近似向量，而是 Rayleigh–Ritz 过程产生的 Ritz 向量时，残差具有额外的正交与块结构。邻近的 Ritz 向量不会直接耦合；误差必须先泄漏到整个试探空间之外，再由外部空间绕回邻近 Ritz 方向。因此主导分母可以是远得多的 Big Gap，而 small gap 只进入修正项。

整篇文章的结构可以压缩为

$$
\boxed{
\text{Rayleigh--Ritz}
\longrightarrow
\begin{bmatrix}
\widehat\lambda&0&r_1^{\mathsf T}\\
0&\widehat\Lambda_2&R_2^{\mathsf T}\\
r_1&R_2&A_3
\end{bmatrix}
\longrightarrow
\text{两步耦合}
\longrightarrow
\frac{\text{residual}}{\text{Big Gap}}
}.
$$

前置内容可参阅 [Davis–Kahan：从 Ritz 残差与谱分离到子空间角](/wiki/davis-kahan-residual-separation)。

---

## 1. 统一记号，避免与 Lanczos 基混淆

设

$$
A=A^{\mathsf T}\in\mathbb R^{n\times n}.
$$

用

$$
V\in\mathbb R^{n\times k},
\qquad
V^{\mathsf T}V=I
$$

表示算法产生的试探空间基；它可以来自 Lanczos、LOBPCG、Jacobi–Davidson 等方法。论文原文把这个矩阵记作 $Q$，本文改用 $V$，以便把字母 $Q$ 留给其他上下文。

Rayleigh–Ritz 先计算

$$
H=V^{\mathsf T}AV,
$$

再做小矩阵特征分解

$$
H\Omega=\Omega\widehat\Lambda,
\qquad
\Omega^{\mathsf T}\Omega=I.
$$

原空间中的 Ritz 向量为

$$
\boxed{
\widehat X=V\Omega
=[\widehat x_1,\ldots,\widehat x_k].
}
$$

因此

$$
\widehat X^{\mathsf T}\widehat X=I,
\qquad
\widehat X^{\mathsf T}A\widehat X
=\widehat\Lambda
=\operatorname{diag}(\widehat\lambda_1,\ldots,\widehat\lambda_k).
$$

注意：$V$ 的列是试探空间的任意正交基，一般不是 Ritz 向量；$\widehat X=V\Omega$ 才是对投影矩阵 $H$ 对角化后得到的 Ritz 基。

---

## 2. 在 $[\widehat X,Q_\perp]$ 基下写出 $A$

取 $Q_\perp\in\mathbb R^{n\times(n-k)}$，使

$$
U=[\widehat X,Q_\perp]
$$

为方阵正交矩阵。将 $A$ 换到这组基下：

$$
\widetilde A
=U^{\mathsf T}AU.
$$

逐块展开：

$$
\begin{aligned}
\widehat X^{\mathsf T}A\widehat X&=\widehat\Lambda,\\
Q_\perp^{\mathsf T}A\widehat X&=R,\\
\widehat X^{\mathsf T}AQ_\perp&=R^{\mathsf T},\\
Q_\perp^{\mathsf T}AQ_\perp&=A_3.
\end{aligned}
$$

所以

$$
\boxed{
\widetilde A
=
\begin{bmatrix}
\widehat\Lambda&R^{\mathsf T}\\
R&A_3
\end{bmatrix}.
}
$$

其中

$$
R=Q_\perp^{\mathsf T}A\widehat X
\in\mathbb R^{(n-k)\times k},
$$

$$
A_3=Q_\perp^{\mathsf T}AQ_\perp
\in\mathbb R^{(n-k)\times(n-k)}.
$$

$A_3$ 是 $A$ 在 Ritz 空间正交补上的压缩。由于 $A$ 对称，$A_3$ 也对称。

---

## 3. 坐标残差 $R$ 与实际 Ritz 残差

原空间中的实际 Ritz 残差矩阵记作

$$
\mathcal R
=A\widehat X-\widehat X\widehat\Lambda
\in\mathbb R^{n\times k}.
$$

因为

$$
I=\widehat X\widehat X^{\mathsf T}+Q_\perp Q_\perp^{\mathsf T},
$$

所以

$$
\begin{aligned}
A\widehat X
&=\widehat X\widehat X^{\mathsf T}A\widehat X
+Q_\perp Q_\perp^{\mathsf T}A\widehat X\\
&=\widehat X\widehat\Lambda+Q_\perp R.
\end{aligned}
$$

因此

$$
\boxed{
\mathcal R
=A\widehat X-\widehat X\widehat\Lambda
=Q_\perp R.
}
$$

$\mathcal R$ 是原空间中的向量，$R$ 是它在 $Q_\perp$ 基下的坐标。由于 $Q_\perp^{\mathsf T}Q_\perp=I$，

$$
(Q_\perp R)^{\mathsf T}(Q_\perp R)=R^{\mathsf T}R,
$$

所以二者具有完全相同的奇异值。对谱范数和 Frobenius 范数都有

$$
\boxed{
\|\mathcal R\|_2=\|R\|_2,
\qquad
\|\mathcal R\|_{\mathrm F}=\|R\|_{\mathrm F}.
}
$$

论文中没有下标的矩阵范数默认是谱范数，即算子 $2$-范数。

按列记

$$
R=[r_1,\ldots,r_k],
$$

则第 $i$ 个实际 Ritz 残差是

$$
A\widehat x_i-\widehat\lambda_i\widehat x_i
=Q_\perp r_i,
$$

并且

$$
\|A\widehat x_i-\widehat\lambda_i\widehat x_i\|_2
=\|r_i\|_2.
$$

---

## 4. 针对一个 Ritz 向量做三块划分

以 $\widehat x_1$ 为目标，将 Ritz 基分成

$$
\widehat X=[\widehat x_1,\widehat X_2],
$$

将 Ritz 值和残差相应分块：

$$
\widehat\Lambda
=\operatorname{diag}(\widehat\lambda_1,\widehat\Lambda_2),
\qquad
R=[r_1,R_2].
$$

于是

$$
\boxed{
\widetilde A
=
\begin{bmatrix}
\widehat\lambda_1&0&r_1^{\mathsf T}\\
0&\widehat\Lambda_2&R_2^{\mathsf T}\\
r_1&R_2&A_3
\end{bmatrix}.
}
$$

三个坐标块分别对应：

1. 目标 Ritz 向量 $\widehat x_1$；
2. 试探空间中的其他 Ritz 向量 $\widehat X_2$；
3. 整个试探空间之外的 $Q_\perp$。

最重要的是左上 $2\times2$ 块的非对角位置为零：

$$
\widehat x_1^{\mathsf T}A\widehat X_2=0.
$$

这是因为 Rayleigh–Ritz 已经把 $A$ 在试探空间内部的压缩对角化。目标 Ritz 向量与其他 Ritz 向量没有直接耦合。

---

## 5. 真实特征向量的坐标与角度

设 $(\lambda,x)$ 是与 $\widehat x_1$ 对应的真实特征对：

$$
Ax=\lambda x,
\qquad
\|x\|_2=1.
$$

在基 $[\widehat x_1,\widehat X_2,Q_\perp]$ 下写成

$$
x
=
[\widehat x_1,\widehat X_2,Q_\perp]
\begin{bmatrix}
w\\y\\z
\end{bmatrix}.
$$

其中：

- $w$ 是沿 $\widehat x_1$ 的标量分量；
- $y\in\mathbb R^{k-1}$ 是落入其他 Ritz 向量的分量；
- $z\in\mathbb R^{n-k}$ 是落到整个试探空间外的分量。

因为坐标变换正交，

$$
|w|^2+\|y\|_2^2+\|z\|_2^2=1.
$$

又因为 $|x^{\mathsf T}\widehat x_1|=|w|$，

$$
\boxed{
\sin\angle(x,\widehat x_1)
=\sqrt{\|y\|_2^2+\|z\|_2^2}.
}
$$

所以问题变成分别控制内部混合 $y$ 和外部泄漏 $z$。

---

## 6. 三行特征方程

在变换后的坐标中，特征方程为

$$
\widetilde A
\begin{bmatrix}
w\\y\\z
\end{bmatrix}
=
\lambda
\begin{bmatrix}
w\\y\\z
\end{bmatrix}.
$$

将三行分别乘开：

$$
(\lambda-\widehat\lambda_1)w=r_1^{\mathsf T}z,
$$

$$
\boxed{
(\lambda I-\widehat\Lambda_2)y=R_2^{\mathsf T}z,
}
$$

$$
\boxed{
(\lambda I-A_3)z
=r_1w+R_2y
=R
\begin{bmatrix}
w\\y
\end{bmatrix}.
}
$$

这两条方程直接揭示了误差传播路线：

$$
\boxed{
\widehat x_1
\xrightarrow{\ r_1\ }
Q_\perp
\xrightarrow{\ R_2^{\mathsf T}\ }
\widehat X_2.
}
$$

目标 Ritz 向量不能直接混入邻近 Ritz 向量；它必须先经过外部空间。这就是后面 Big Gap 能成为主分母的根源。

---

## 7. small gap、Big Gap 与经典 gap

论文针对真实目标特征值 $\lambda$ 定义

$$
\boxed{
\mathrm{gap}
=\operatorname{dist}
\bigl(\lambda,\sigma(\widehat\Lambda_2)\bigr)
=\min_{j\ge2}|\lambda-\widehat\lambda_j|
}
$$

和

$$
\boxed{
\mathrm{Gap}
=\operatorname{dist}
\bigl(\lambda,\sigma(A_3)\bigr).
}
$$

它们比较的对象不同：

| 名称 | 比较对象 | 控制的误差传播 |
|---|---|---|
| small $\mathrm{gap}$ | $\lambda$ 与其他 Ritz 值 | 外部泄漏 $z$ 混回其他 Ritz 方向 $y$ |
| Big $\mathrm{Gap}$ | $\lambda$ 与补空间压缩 $A_3$ 的谱 | 误差从整个 Ritz 空间泄漏到 $Q_\perp$ |
| classical $\mathrm{gap}_c$ | $\widehat\lambda_1$ 与除目标外的真实特征值 | 无结构 Davis–Kahan 单向量界 |

当试探空间同时捕获一批相邻特征模态时，这些相邻模态位于 $\widehat\Lambda_2$ 中，而 $A_3$ 主要对应尚未被试探空间捕获的外部谱。因此通常可能出现

$$
\mathrm{Gap}\gg\mathrm{gap}.
$$

例如

$$
\lambda_1=1,
\qquad
\lambda_2=1.000001,
\qquad
\lambda_3=100,
$$

若试探空间已同时捕获前两个模态，则对第一个 Ritz 向量而言，

$$
\mathrm{gap}\approx10^{-6},
\qquad
\mathrm{Gap}\approx99.
$$

---

## 8. 为什么逆矩阵范数等于 gap 的倒数

因为 $A_3=A_3^{\mathsf T}$，存在正交矩阵 $Z$ 使

$$
A_3=Z\operatorname{diag}(\mu_1,\ldots,\mu_{n-k})Z^{\mathsf T}.
$$

所以

$$
(\lambda I-A_3)^{-1}
=Z\operatorname{diag}
\left(
\frac1{\lambda-\mu_1},\ldots,
\frac1{\lambda-\mu_{n-k}}
\right)Z^{\mathsf T}.
$$

谱范数等于特征值绝对值的最大值，故

$$
\boxed{
\|(\lambda I-A_3)^{-1}\|_2
=\frac1{\min_j|\lambda-\mu_j|}
=\frac1{\mathrm{Gap}}.
}
$$

同理，由 $\widehat\Lambda_2$ 已经对角，

$$
\boxed{
\|(\lambda I-\widehat\Lambda_2)^{-1}\|_2
=\frac1{\mathrm{gap}}.
}
$$

这些等式依赖于对称或正规结构以及谱范数；对一般非正规矩阵并不成立。

---

## 9. 先用 Big Gap 控制外部泄漏

由最下面一行

$$
(\lambda I-A_3)z
=R
\begin{bmatrix}
w\\y
\end{bmatrix},
$$

得到

$$
z
=(\lambda I-A_3)^{-1}
R
\begin{bmatrix}
w\\y
\end{bmatrix}.
$$

因为

$$
\left\|
\begin{bmatrix}
w\\y
\end{bmatrix}
\right\|_2
\le1,
$$

所以

$$
\boxed{
\|z\|_2
\le
\frac{\|R\|_2}{\mathrm{Gap}}.
}
$$

这说明整个 Ritz 空间向外泄漏的幅度由 Big Gap 控制，而不是由 Ritz 空间内部的最近间隔控制。

---

## 10. 再用 small gap 控制内部混合

由中间一行

$$
(\lambda I-\widehat\Lambda_2)y=R_2^{\mathsf T}z
$$

得到精确关系

$$
\boxed{
y
=(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}z.
}
$$

真正的外部到内部传递算子是

$$
K_{\mathrm{mix}}
=(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}.
$$

它满足粗略上界

$$
\|K_{\mathrm{mix}}\|_2
\le
\frac{\|R_2\|_2}{\mathrm{gap}}.
$$

因此

$$
\boxed{
\|y\|_2
\le
\frac{\|R_2\|_2}{\mathrm{gap}}\|z\|_2
\le
\frac{\|R\|_2\|R_2\|_2}
{\mathrm{Gap}\,\mathrm{gap}}.
}
$$

small gap 并没有消失，但它只控制第二步“从外部绕回邻近 Ritz 向量”的放大，而不是第一步向外泄漏。

---

## 11. 第一条 Big-Gap 角度界

因为

$$
\sin\angle(x,\widehat x_1)
=\sqrt{\|y\|_2^2+\|z\|_2^2},
$$

结合前两节得到

$$
\boxed{
\sin\angle(x,\widehat x_1)
\le
\frac{\|R\|_2}{\mathrm{Gap}}
\sqrt{
1+rac{\|R_2\|_2^2}{\mathrm{gap}^2}
}.
}
$$

当

$$
\|R_2\|_2\lesssim\mathrm{gap}
$$

时，根号中的修正因子是常数量级，所以

$$
\sin\angle(x,\widehat x_1)
\lesssim
\frac{\|R\|_2}{\mathrm{Gap}}.
$$

与经典的 $\|r_1\|/\mathrm{gap}_c$ 相比，Big Gap 可以大得多。

若 $\|R_2\|_2/\mathrm{gap}$ 很大，这个界仍然正确，但未必尖锐。此时近似为

$$
\sin\angle(x,\widehat x_1)
\lesssim
\frac{\|R\|_2\|R_2\|_2}
{\mathrm{Gap}\,\mathrm{gap}}.
$$

所以 Big Gap 并不是无条件消灭 small gap；它能发挥多大作用取决于残差耦合结构。

---

## 12. 用 Schur 消元看有效 Big Gap 的损失

将

$$
y=(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}z
$$

代入最下面一行：

$$
(\lambda I-A_3)z
=r_1w
+R_2(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}z.
$$

移项得到

$$
\boxed{
\left[
\lambda I-A_3
-R_2(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}
\right]z
=r_1w.
}
$$

其中反馈修正的谱范数满足

$$
\left\|
R_2(\lambda I-\widehat\Lambda_2)^{-1}R_2^{\mathsf T}
\right\|_2
\le
\frac{\|R_2\|_2^2}{\mathrm{gap}}.
$$

所以可将有效 Big Gap 理解为

$$
\boxed{
\mathrm{Gap}_{\mathrm{eff}}
\gtrsim
\mathrm{Gap}
-\frac{\|R_2\|_2^2}{\mathrm{gap}}.
}
$$

要使这个下界为正，需要检查

$$
\boxed{
\mathrm{Gap}
>
\frac{\|R_2\|_2^2}{\mathrm{gap}}.
}
$$

这比强制要求 $\|R_2\|_2<\mathrm{gap}$ 更宽松。即使 $\|R_2\|_2/\mathrm{gap}>1$，只要 Big Gap 足够大，修正后的分母仍可能为正。

相应的更尖锐形式为

$$
\sin\angle(x,\widehat x_1)
\le
\frac{\|r_1\|_2}
{\mathrm{Gap}-\|R_2\|_2^2/\mathrm{gap}}
\sqrt{
1+rac{\|R_2\|_2^2}{\mathrm{gap}^2}
},
$$

其中主分子已经从整个 $\|R\|_2$ 改成目标 Ritz 向量自己的残差 $\|r_1\|_2$。

---

## 13. 为什么逐列残差可能比 $\|R_2\|/\mathrm{gap}$ 更尖锐

写成

$$
R_2=[r_2,\ldots,r_k],
\qquad
y=[y_2,\ldots,y_k]^{\mathsf T}.
$$

中间方程逐元素是

$$
(\lambda-\widehat\lambda_j)y_j=r_j^{\mathsf T}z,
\qquad j=2,\ldots,k.
$$

所以

$$
\boxed{
|y_j|
\le
\frac{\|r_j\|_2}
{|\lambda-\widehat\lambda_j|}
\|z\|_2.
}
$$

统一使用 $\|R_2\|/\mathrm{gap}$，相当于把最坏分子和最坏分母强行组合，可能过度悲观。逐列分析保留了以下信息：

- 某个 Ritz 值可能离 $\lambda$ 很近；
- 但它自己的残差也可能极小；
- 因而它实际造成的内部混合仍然有限。

这也是论文后续尖锐误差界的重要改进。

---

## 14. 为什么把近重 Ritz 向量组成一个块

如果多个目标特征值极其接近，甚至重合，那么单个特征向量本身就不稳定或不唯一。此时应把对应 Ritz 向量组成目标块

$$
\widehat X_1
=[\widehat x_1,\ldots,\widehat x_s].
$$

块内任意正交旋转

$$
\widehat X_1\longmapsto\widehat X_1W
$$

都不改变其列空间。因此认证整个子空间时，块内极小间距不应该进入误差界。

三块划分相应变成：

1. 目标 Ritz 块 $\widehat X_1$；
2. 试探空间中未选入目标的其他 Ritz 块 $\widehat X_2$；
3. 试探空间外部 $Q_\perp$。

新的 small gap 是目标 Ritz 块到 $\widehat X_2$ 的距离，而不是目标簇内部特征值之间的距离；Big Gap 仍是目标簇到 $A_3$ 的分离。

因此：

$$
\boxed{
\begin{aligned}
\text{认证单个 Ritz 向量}
&:\quad
\text{簇内 small gap 仍可能进入修正项};\\
\text{认证整个近重特征簇}
&:\quad
\text{簇内旋转不算误差，簇内 gap 消失}.
\end{aligned}
}
$$

若 small gap 为零，单个特征向量方向没有唯一意义，只能认证整个不变子空间。

---

## 15. 与 Lanczos 的直接联系

设 $V_m$ 是完整 Lanczos 基：

$$
AV_m
=V_mT_m+\beta_m v_{m+1}e_m^{\mathsf T}.
$$

对小矩阵求解

$$
T_mY=Y\widehat\Lambda,
\qquad
\widehat X=V_mY.
$$

于是

$$
\begin{aligned}
A\widehat X-\widehat X\widehat\Lambda
&=AV_mY-V_mY\widehat\Lambda\\
&=\beta_m v_{m+1}e_m^{\mathsf T}Y.
\end{aligned}
$$

因此各 Ritz 残差为

$$
\boxed{
A\widehat x_i-\widehat\lambda_i\widehat x_i
=\beta_m(e_m^{\mathsf T}y_i)v_{m+1}.
}
$$

Nakatsukasa 的界所需要的 $r_i$、$R_2$ 都可以由这些 Lanczos 残差组成。Lanczos 负责制造结构化 Ritz 信息，Big-Gap 分析负责更充分地利用这些信息。

---

## 16. 哪些量能算，哪些量仍然未知

完成 Rayleigh–Ritz 后直接可得：

- Ritz 值 $\widehat\lambda_i$；
- Ritz 向量 $\widehat x_i$；
- 每列残差范数 $\|r_i\|$；
- 整体残差范数 $\|R\|$；
- Ritz 值之间的计算间距。

但论文定义中的下列对象通常不能直接严格得到：

- 与 Ritz 向量对应的准确特征值 $\lambda$；
- 补空间压缩 $A_3=Q_\perp^{\mathsf T}AQ_\perp$ 的最近谱位置；
- Big Gap 的可信正下界；
- 当前 Ritz 块是否恰好对应指定数量的目标特征值。

论文通常利用极值特征值的 min–max 性质、下一 Ritz 值或其他先验信息来估计 Big Gap。若任务要求可验证的严格证书，仅有经验估计还不够；必须把全矩阵的特征值计数或惯性信息转换成对 $A_3$ 的可信谱约束。

这正是完整 Count-to-Angle 流程中缺失的接口：

$$
\boxed{
\text{count/inertia}
\longrightarrow
\text{补空间位置与 Big Gap 下界}
\longrightarrow
\text{Nakatsukasa angle 界}.
}
$$

---

## 17. 常见误区

### 误区一：Big Gap 无条件替代 small gap

不对。small gap 仍通过 $\|R_2\|/\mathrm{gap}$ 或更细的逐列项进入修正。Big Gap 只有在耦合损失受控时才真正发挥作用。

### 误区二：$R_2$ 是目标与邻近 Ritz 向量的直接耦合

不对。目标与邻近 Ritz 块的直接耦合是零。$R_2$ 连接的是邻近 Ritz 块与外部空间；目标到邻近块需要经过 $r_1$ 和 $R_2$ 两步传播。

### 误区三：$A_3$ 的谱就是全矩阵剩余特征值

一般不完全相同。$A_3$ 是正交补上的压缩；只有当 Ritz 空间成为精确不变子空间时，块间残差消失，$A_3$ 才精确承载剩余谱。

### 误区四：残差很小就能识别目标模态

残差只证明接近某个不变对象。目标身份和 Big Gap 仍需要谱定位、计数或其他认证信息。

### 误区五：近重特征值仍应逐向量认证

近重或重特征值下，单个向量可以旋转甚至不唯一。应扩大目标块并认证整个子空间。

---

## 18. 一张公式链记住整篇结构

$$
\boxed{
\begin{gathered}
H=V^{\mathsf T}AV,
\qquad
H\Omega=\Omega\widehat\Lambda,
\qquad
\widehat X=V\Omega,\\
\widetilde A
=
\begin{bmatrix}
\widehat\lambda_1&0&r_1^{\mathsf T}\\
0&\widehat\Lambda_2&R_2^{\mathsf T}\\
r_1&R_2&A_3
\end{bmatrix},\\
x
=[\widehat x_1,\widehat X_2,Q_\perp]
\begin{bmatrix}w\\y\\z\end{bmatrix},
\qquad
\sin\angle(x,\widehat x_1)
=\sqrt{\|y\|_2^2+\|z\|_2^2},\\
(\lambda I-A_3)z
=R\begin{bmatrix}w\\y\end{bmatrix},
\qquad
\|z\|_2\le\frac{\|R\|_2}{\mathrm{Gap}},\\
(\lambda I-\widehat\Lambda_2)y
=R_2^{\mathsf T}z,
\qquad
\|y\|_2\le\frac{\|R_2\|_2}{\mathrm{gap}}\|z\|_2,\\
\sin\angle(x,\widehat x_1)
\le
\frac{\|R\|_2}{\mathrm{Gap}}
\sqrt{1+rac{\|R_2\|_2^2}{\mathrm{gap}^2}},\\
\mathrm{Gap}_{\mathrm{eff}}
\gtrsim
\mathrm{Gap}-\frac{\|R_2\|_2^2}{\mathrm{gap}}.
\end{gathered}
}
$$

整篇论文最值得记住的不是某一个最终常数，而是 Rayleigh–Ritz 产生的结构：目标 Ritz 向量与其他 Ritz 向量之间的直接耦合为零，因此局部近重性不会像任意无结构扰动那样直接作用；误差必须经过外部块，Big Gap 才可能成为真正主导的稳定尺度。

---

## 参考文献

- Yuji Nakatsukasa, [Sharp Error Bounds for Ritz Vectors and Approximate Singular Vectors](https://arxiv.org/abs/1810.02532), *Mathematics of Computation*, 2020；[正式 DOI](https://doi.org/10.1090/mcom/3519)。
- Chandler Davis and W. M. Kahan, [The Rotation of Eigenvectors by a Perturbation. III](https://doi.org/10.1137/0707001), *SIAM Journal on Numerical Analysis*, 1970.
