---
title: "Davis–Kahan：从 Ritz 残差与谱分离到子空间角"
date: "2026-09-05"
excerpt: "从候选子空间的补空间坐标出发，推导 Sylvester 方程，解释 residual / separation 结构、簇内 gap 与外部 gap 的区别，并接入 Lanczos 和广义特征值问题。"
tags: ["Mathematics", "Numerical Linear Algebra", "Eigenvalue Problems"]
---

# Davis–Kahan：从 Ritz 残差与谱分离到子空间角

Knyazev–Argentati 的主角理论告诉我们怎样度量两个子空间的误差：

$$
\|P_X-P_Q\|_2=\sin\theta_{\max}.
$$

Davis–Kahan 理论回答紧接着的问题：如果真实子空间 $\mathcal X$ 不知道，只掌握候选 Ritz 子空间 $\mathcal Q$、它的残差以及谱间隔，怎样为 $\sin\theta_{\max}$ 给出上界？

整篇的主线是

$$
\boxed{
\text{候选空间在真实补空间中的坐标}
\longrightarrow
\text{Sylvester 方程}
\longrightarrow
\frac{\text{residual}}{\text{separation}}
\longrightarrow
\sin\Theta
}.
$$

关于主角、投影差和 $M$-内积几何，可先阅读 [M-内积下的主角与投影差](/wiki/principal-angles-projector-blocks)。

---

## 1. 统一记号

先在普通欧氏内积下讨论对称特征值问题

$$
A=A^{\mathsf T}\in\mathbb R^{n\times n}.
$$

使用以下记号：

| 记号 | 尺寸 | 含义 |
|---|---:|---|
| $\mathcal X$ | $k$ 维 | 真实目标不变子空间 |
| $X$ | $n\times k$ | $\mathcal X$ 的正交基 |
| $X_\perp$ | $n\times(n-k)$ | $\mathcal X^\perp$ 的正交基 |
| $\mathcal Q$ | $k$ 维 | 数值方法得到的候选子空间 |
| $Q$ | $n\times k$ | $\mathcal Q$ 的正交基，通常是选中的 Ritz 向量 |
| $T=Q^{\mathsf T}AQ$ | $k\times k$ | $A$ 在候选空间中的压缩 |
| $R=AQ-QT$ | $n\times k$ | Ritz 残差矩阵 |
| $S=X_\perp^{\mathsf T}Q$ | $(n-k)\times k$ | 候选空间落入真实补空间的坐标 |

两个容易混淆的字母必须分开：

- $\mathcal R(X)$ 表示矩阵 $X$ 的列空间；
- $R=AQ-QT$ 表示残差矩阵。

另外，本文的 $S$ 是补空间泄漏坐标，不是 SVD 中的奇异值对角矩阵；后者统一记作 $\Sigma$。

---

## 2. 为什么真实正交补也是不变子空间

设 $\mathcal X$ 是 $A$ 的不变子空间，并取其中的正交特征基 $X$：

$$
AX=X\Lambda.
$$

因为 $A$ 对称，$\mathcal X^\perp$ 也不变。事实上，对任意 $x\in\mathcal X$ 和 $y\in\mathcal X^\perp$，

$$
x^{\mathsf T}Ay=(Ax)^{\mathsf T}y=0,
$$

所以 $Ay\in\mathcal X^\perp$。因此可以选择 $X_\perp$ 为补空间中的正交特征基，使

$$
AX_\perp=X_\perp\Lambda_\perp.
$$

在完整正交基 $[X,X_\perp]$ 下，$A$ 分块对角化为

$$
[X,X_\perp]^{\mathsf T}A[X,X_\perp]
=
\begin{bmatrix}
\Lambda&0\\
0&\Lambda_\perp
\end{bmatrix}.
$$

这里 $\Lambda$ 是目标簇，$\Lambda_\perp$ 是目标簇外的真实谱。

---

## 3. 候选空间的 Ritz 矩阵和残差

设 $Q^{\mathsf T}Q=I$，定义

$$
T=Q^{\mathsf T}AQ,
\qquad
R=AQ-QT.
$$

$T$ 是 $A$ 在候选空间中的坐标表示；$R$ 测量 $A$ 作用后无法留在候选空间中的部分。它自动满足 Galerkin 正交性：

$$
Q^{\mathsf T}R
=Q^{\mathsf T}AQ-Q^{\mathsf T}QT
=T-T
=0.
$$

因此残差的每一列都与整个候选空间正交。

若 $R=0$，则

$$
AQ=QT,
$$

说明 $\mathcal Q$ 是一个精确不变子空间。但这只能证明它是“某个”不变子空间，并不能证明它就是指定的目标子空间 $\mathcal X$。

---

## 4. $S=X_\perp^{\mathsf T}Q$ 为什么就是角度误差

由完整正交分解

$$
I=XX^{\mathsf T}+X_\perp X_\perp^{\mathsf T},
$$

得到

$$
Q=XX^{\mathsf T}Q+X_\perp X_\perp^{\mathsf T}Q.
$$

定义

$$
C=X^{\mathsf T}Q,
\qquad
S=X_\perp^{\mathsf T}Q,
$$

便有

$$
\boxed{Q=XC+X_\perp S.}
$$

其中：

- $XC$ 是候选基落在真实目标空间中的部分；
- $X_\perp S$ 是候选基错误地落入真实补空间的部分；
- $S$ 是这个错误部分在 $X_\perp$ 基下的坐标。

又因为 $Q^{\mathsf T}Q=I$，

$$
C^{\mathsf T}C+S^{\mathsf T}S=I.
$$

$C=X^{\mathsf T}Q$ 的奇异值是 $\cos\theta_i$，于是 $S$ 的奇异值是 $\sin\theta_i$。特别地，

$$
\boxed{
\|S\|_2
=\|\sin\Theta(\mathcal X,\mathcal Q)\|_2
=\sin\theta_{\max}.
}
$$

因此 Davis–Kahan 真正需要控制的未知量就是 $S$。

---

## 5. Sylvester 方程的完整推导

从残差方程

$$
R=AQ-QT
$$

出发，左乘 $X_\perp^{\mathsf T}$：

$$
X_\perp^{\mathsf T}R
=X_\perp^{\mathsf T}AQ-X_\perp^{\mathsf T}QT.
$$

由

$$
AX_\perp=X_\perp\Lambda_\perp
$$

以及 $A=A^{\mathsf T}$，得到

$$
X_\perp^{\mathsf T}A
=\Lambda_\perp X_\perp^{\mathsf T}.
$$

所以

$$
X_\perp^{\mathsf T}AQ
=\Lambda_\perp X_\perp^{\mathsf T}Q
=\Lambda_\perp S,
$$

而

$$
X_\perp^{\mathsf T}QT=ST.
$$

最终得到

$$
\boxed{
\Lambda_\perp S-ST=X_\perp^{\mathsf T}R.
}
$$

这是一个 Sylvester 方程。左边是关于子空间误差 $S$ 的线性算子，右边是残差在真实补空间中的分量。

---

## 6. separation 为什么自然出现在分母

定义 Sylvester 算子

$$
\mathcal L(Z)=\Lambda_\perp Z-ZT.
$$

它的最小增益定义为

$$
\boxed{
\operatorname{sep}(\Lambda_\perp,T)
=
\min_{Z\ne0}
\frac{\|\Lambda_\perp Z-ZT\|_2}{\|Z\|_2}.
}
$$

记

$$
\delta=\operatorname{sep}(\Lambda_\perp,T).
$$

根据定义，对任意 $S$ 都有

$$
\|\Lambda_\perp S-ST\|_2
\ge\delta\|S\|_2.
$$

代入 Sylvester 方程，并使用 $\|X_\perp^{\mathsf T}R\|_2\le\|R\|_2$：

$$
\delta\|S\|_2
\le
\|X_\perp^{\mathsf T}R\|_2
\le
\|R\|_2.
$$

于是

$$
\boxed{
\|\sin\Theta(\mathcal X,\mathcal Q)\|_2
\le
\frac{\|R\|_2}
{\operatorname{sep}(\Lambda_\perp,T)}.
}
$$

分母不是额外塞入的参数，而是求解 Sylvester 方程时逆算子的最坏放大倍数。

---

## 7. 用标量方程理解 separation

若

$$
\Lambda_\perp=\operatorname{diag}(\nu_1,\ldots),
$$

并将对称矩阵 $T$ 对角化为

$$
T=Y\operatorname{diag}(\mu_1,\ldots,\mu_k)Y^{\mathsf T},
$$

令 $\widetilde S=SY$、$\widetilde E=X_\perp^{\mathsf T}RY$，则 Sylvester 方程逐元素变成

$$
(\nu_j-\mu_i)\widetilde S_{ji}
=\widetilde E_{ji}.
$$

所以

$$
\boxed{
\widetilde S_{ji}
=
\frac{\widetilde E_{ji}}{\nu_j-\mu_i}.
}
$$

这里：

- $\widetilde E_{ji}$ 是残差对某个错误方向的驱动；
- $|\nu_j-\mu_i|$ 是候选 Ritz 值与某个真实外部特征值的距离；
- $\widetilde S_{ji}$ 是由此产生的子空间泄漏。

在常见的对称、谱区间分离情形下，separation 正是由这类最近谱距离控制的。

---

## 8. 三种 gap 不要混淆

### 8.1 簇内 gap

目标簇内部不同特征值的最小间距，例如

$$
\gamma_{\mathrm{in}}
=\min_{i\ne j,\,\lambda_i,\lambda_j\in\sigma(\Lambda)}
|\lambda_i-\lambda_j|.
$$

它控制簇内单个特征向量能否稳定区分。若它很小，单个特征向量可以剧烈旋转。

### 8.2 真实外部 gap

目标簇与其余真实谱的距离：

$$
\gamma_{\mathrm{out}}
=\operatorname{dist}
\bigl(\sigma(\Lambda),\sigma(\Lambda_\perp)\bigr).
$$

它控制整个目标不变子空间与外部方向是否容易混合。

### 8.3 直接进入残差界的 separation

Sylvester 方程中直接出现的是

$$
\delta=\operatorname{sep}(\Lambda_\perp,T),
$$

即真实外部谱 $\Lambda_\perp$ 与候选 Ritz 矩阵 $T$ 的分离。

当 $T$ 已经可靠地逼近目标簇时，$\delta$ 与 $\gamma_{\mathrm{out}}$ 接近；但在完成目标簇识别之前，不能把二者直接当作同一个量。

---

## 9. 为什么小残差不自动推出小角度

考虑

$$
A=
\begin{bmatrix}
0&0\\
0&\varepsilon
\end{bmatrix},
\qquad
x=e_1,
\qquad
q=\frac{e_1+e_2}{\sqrt2}.
$$

$q$ 与目标向量 $e_1$ 的夹角始终为 $45^\circ$。但它的 Rayleigh 商为 $\varepsilon/2$，残差满足

$$
\|Aq-(\varepsilon/2)q\|_2=\frac{\varepsilon}{2}.
$$

当 $\varepsilon\to0$ 时，残差趋于零，角度却不变。原因是外部谱分离也同时趋于零；真正相关的是 residual/separation，而不是 residual 单独的大小。

---

## 10. 为什么零残差也可能选错模态

考虑

$$
A=
\begin{bmatrix}
0&0\\
0&10
\end{bmatrix},
$$

目标是 $x=e_1$，算法却返回 $q=e_2$。此时

$$
Aq-10q=0,
$$

但 $q$ 与目标空间正交。

因此残差只回答

> 当前空间是否接近某个不变子空间？

它不回答

> 当前空间是否对应用户指定的那一簇特征值？

后一个问题需要谱区间、特征值计数和外部 gap 认证。

---

## 11. 为什么对子空间需要外部 gap，而不是簇内 gap

设

$$
\sigma(A)=\{1,1.000001,10\},
$$

目标是前两个特征值对应的二维不变子空间。

簇内间距仅为

$$
10^{-6},
$$

所以两个单独特征向量很容易在目标二维空间内部旋转。但目标二维空间到外部特征值 $10$ 的距离约为 $9$，因此整个二维空间仍然稳定。

结论是

$$
\boxed{
\text{簇内 gap 控制单个向量，外部 separation 控制整个子空间。}
}
$$

---

## 12. Davis–Kahan 消费 gap，但不负责证明 gap

Davis–Kahan 是一个条件式结论：如果已经知道目标簇和外部谱至少相距 $\delta>0$，便可将残差转换成角度界。

它本身不负责证明：

- 目标区间里究竟有几个特征值；
- 当前 Ritz 值是否属于指定目标簇；
- 最近外部特征值在哪里；
- 所使用的 separation 下界是否可信。

因此认证流程必须是

$$
\boxed{
\text{count 确认身份}
\longrightarrow
\text{gap 认证外部分离}
\longrightarrow
\text{Davis--Kahan 给出 angle}.
}
$$

---

## 13. 与 Lanczos 的关系

为了避免记号冲突，把完整 Lanczos 基记为

$$
V_m=[v_1,\ldots,v_m].
$$

对称 Lanczos 满足

$$
AV_m
=V_mT_m+\beta_m v_{m+1}e_m^{\mathsf T},
$$

其中 $T_m=V_m^{\mathsf T}AV_m$ 是三对角矩阵。对 $T_m$ 求解

$$
T_mY_I=Y_I\Theta_I
$$

并选出目标的 $k$ 个 Ritz 向量：

$$
Q=V_mY_I.
$$

这里 $V_m$ 的列是 Lanczos/Krylov 基，一般不是 Ritz 向量；真正的原空间 Ritz 向量是 $V_my_i$。

候选 Ritz 子空间的残差为

$$
\begin{aligned}
R
&=AQ-Q\Theta_I\\
&=\beta_m v_{m+1}e_m^{\mathsf T}Y_I.
\end{aligned}
$$

对单个 Ritz 向量 $q_i=V_my_i$，

$$
r_i
=\beta_m(e_m^{\mathsf T}y_i)v_{m+1},
\qquad
\|r_i\|_2
=|\beta_m e_m^{\mathsf T}y_i|.
$$

因此 Lanczos 负责产生候选子空间和可廉价计算的残差；Davis–Kahan 负责解释在给定外部 separation 后，这个残差对应多大的子空间角误差。

---

## 14. 推广到广义特征值问题

考虑

$$
Kx=\lambda Mx,
\qquad
K=K^{\mathsf T},
\qquad
M=M^{\mathsf T}\succ0.
$$

在 $M$-内积下选择候选基

$$
Q^{\mathsf T}MQ=I,
$$

Ritz 矩阵和铅笔残差为

$$
T=Q^{\mathsf T}KQ,
\qquad
R_K=KQ-MQT.
$$

通过白化变换

$$
A=M^{-1/2}KM^{-1/2},
\qquad
\widehat Q=M^{1/2}Q,
$$

得到普通对称问题。白化后的残差为

$$
\widehat R
=A\widehat Q-\widehat QT
=M^{-1/2}(KQ-MQT).
$$

因此对应的角度界为

$$
\boxed{
\|\sin\Theta_M(\mathcal X,\mathcal Q)\|_2
\le
\frac{
\|M^{-1/2}(KQ-MQT)\|_2
}{\delta},
}
$$

其中 $\delta$ 是白化问题中目标 Ritz 簇到真实外部谱的 separation 下界。

再结合 $M$-主角的投影恒等式，

$$
P_X=XX^{\mathsf T}M,
\qquad
P_Q=QQ^{\mathsf T}M,
$$

得到

$$
\boxed{
\|P_X-P_Q\|_M
=\sin\theta_{\max}^{(M)}
\le
\frac{
\|M^{-1/2}(KQ-MQT)\|_2
}{\delta}.
}
$$

---

## 15. 一张公式链记住全部结构

$$
\boxed{
\begin{gathered}
AX=X\Lambda,
\qquad
AX_\perp=X_\perp\Lambda_\perp,\\
T=Q^{\mathsf T}AQ,
\qquad
R=AQ-QT,\\
Q=XC+X_\perp S,
\qquad
S=X_\perp^{\mathsf T}Q,\\
\|S\|_2=\sin\theta_{\max},\\
\Lambda_\perp S-ST=X_\perp^{\mathsf T}R,\\
\operatorname{sep}(\Lambda_\perp,T)
=\min_{Z\ne0}
\frac{\|\Lambda_\perp Z-ZT\|_2}{\|Z\|_2},\\
\sin\theta_{\max}
\le
\frac{\|R\|_2}{\operatorname{sep}(\Lambda_\perp,T)},\\
\|P_X-P_Q\|_2=\sin\theta_{\max}.
\end{gathered}
}
$$

最简洁的理解是：残差是驱动力，外部 separation 是抵抗错误方向混合的刚度，二者的比值决定候选子空间能够偏转多远。

---

## 参考文献

- Chandler Davis and W. M. Kahan, [The Rotation of Eigenvectors by a Perturbation. III](https://doi.org/10.1137/0707001), *SIAM Journal on Numerical Analysis*, 1970.
- Andrew V. Knyazev and Merico E. Argentati, [Principal Angles between Subspaces in an A-Based Scalar Product](https://doi.org/10.1137/S1064827500377332), *SIAM Journal on Scientific Computing*, 2002.
