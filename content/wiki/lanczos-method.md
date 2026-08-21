---
title: "Lanczos 方法：从 Krylov 子空间到 Ritz 近似"
date: "2026-08-21"
excerpt: "从投影观点推导 Lanczos 三项递推与三对角矩阵，并解释 Ritz 向量、特征残差、有限精度问题和常见现代变体。"
tags: ["Mathematics", "Numerical Linear Algebra", "Algorithm"]
---

# Lanczos 方法：从 Krylov 子空间到 Ritz 近似

Lanczos 方法用于大型稀疏实对称矩阵的部分特征值问题：

$$
Ax=\lambda x,\qquad A=A^{\mathsf T}\in\mathbb R^{n\times n}.
$$

当 $n$ 很大时，通常既不需要也无法经济地计算完整特征值分解。实际目标往往只是求最大或最小的若干特征值及其特征向量。Lanczos 方法的核心思想是：在低维 Krylov 子空间中，用一个小型对称三对角矩阵 $T_m$ 近似大矩阵 $A$ 的作用。

---

## 1. Krylov 子空间

给定非零初始向量 $b$，令

$$
q_1=\frac{b}{\lVert b\rVert_2}.
$$

第 $m$ 阶 Krylov 子空间定义为

$$
\mathcal K_m(A,q_1)
=\operatorname{span}\{q_1,Aq_1,A^2q_1,\ldots,A^{m-1}q_1\}.
$$

若 $A$ 的标准正交特征向量为 $v_i$，且

$$
q_1=\sum_i c_i v_i,
$$

则

$$
p(A)q_1=\sum_i c_i p(\lambda_i)v_i.
$$

因此 Krylov 方法可以理解为利用多项式 $p$ 对不同谱分量进行放大或抑制。若初始向量在某个特征方向上没有分量，即 $c_i=0$，单向量 Krylov 方法在精确算术中就无法发现该方向。

---

## 2. 投影问题：$T_m$ 表示什么

设

$$
Q_m=[q_1,\ldots,q_m]\in\mathbb R^{n\times m},
\qquad Q_m^{\mathsf T}Q_m=I_m,
$$

其列向量构成 $\mathcal K_m(A,q_1)$ 的一组标准正交基。定义

$$
T_m=Q_m^{\mathsf T}AQ_m.
$$

这里必须区分

$$
Q_m^{\mathsf T}Q_m=I_m
$$

和

$$
Q_mQ_m^{\mathsf T}\ne I_n\qquad(m<n).
$$

矩阵

$$
P_m=Q_mQ_m^{\mathsf T}
$$

是到 Krylov 子空间上的正交投影。因此

$$
Q_mT_m
=Q_mQ_m^{\mathsf T}AQ_m
=P_mAQ_m.
$$

所以一般不能写成 $Q_mT_m=AQ_m$。准确地说，$T_m$ 描述的是：先让 $A$ 作用于 Krylov 子空间中的向量，再将结果投影回该子空间。

只有在当前 Krylov 子空间是 $A$ 的不变子空间，或者 $m=n$、$Q_n$ 是完整方形正交矩阵时，才有

$$
AQ_m=Q_mT_m.
$$

---

## 3. 为什么产生三项递推

一般的 Arnoldi 正交化会将 $Aq_j$ 对所有已有基向量 $q_1,\ldots,q_j$ 做正交化。对于对称矩阵，较早方向上的系数会自动为零。

当 $i\le j-2$ 时，利用 $A=A^{\mathsf T}$，

$$
q_i^{\mathsf T}Aq_j=(Aq_i)^{\mathsf T}q_j.
$$

又因为

$$
Aq_i\in\mathcal K_{i+1}\subseteq\mathcal K_{j-1},
$$

而 $q_j\perp\mathcal K_{j-1}$，所以

$$
q_i^{\mathsf T}Aq_j=0.
$$

因此 $Aq_j$ 在旧基向量中的分量只可能落在 $q_{j-1}$ 和 $q_j$ 上。剩余部分归一化后定义为 $q_{j+1}$，于是得到三项递推

$$
\boxed{
Aq_j
=\beta_{j-1}q_{j-1}
+\alpha_jq_j
+\beta_jq_{j+1}
}.
$$

其中

$$
\alpha_j=q_j^{\mathsf T}Aq_j,
$$

$$
w_j=Aq_j-\beta_{j-1}q_{j-1}-\alpha_jq_j,
$$

$$
\beta_j=\lVert w_j\rVert_2,
\qquad
q_{j+1}=\frac{w_j}{\beta_j}.
$$

以上正交性结论首先是精确算术下的结论。浮点数计算中的情况见第 9 节。

---

## 4. Lanczos 算法

初始化

$$
q_0=0,\qquad \beta_0=0,\qquad q_1=b/\lVert b\rVert_2.
$$

随后迭代：

```text
for j = 1, 2, ..., m
    w = A q_j - beta_(j-1) q_(j-1)
    alpha_j = q_j^T w
    w = w - alpha_j q_j
    beta_j = ||w||_2

    if beta_j = 0
        stop
    end

    q_(j+1) = w / beta_j
end
```

每一步的主要工作是一次矩阵向量乘积 $Aq_j$。对于含有 $N_{\mathrm{nz}}$ 个非零元的稀疏矩阵，单步主要代价约为 $O(N_{\mathrm{nz}})$。

---

## 5. 三对角矩阵如何逐步构造

三对角矩阵不是迭代结束后额外计算出来的；每一步产生的 $\alpha_j$ 和 $\beta_j$ 就是它的元素。

前几步递推为

$$
Aq_1=\alpha_1q_1+\beta_1q_2,
$$

$$
Aq_2=\beta_1q_1+\alpha_2q_2+\beta_2q_3,
$$

$$
Aq_3=\beta_2q_2+\alpha_3q_3+\beta_3q_4.
$$

相应的系数矩阵就是

$$
\boxed{
T_m=
\begin{bmatrix}
\alpha_1&\beta_1&&&\\
\beta_1&\alpha_2&\beta_2&&\\
&\beta_2&\alpha_3&\ddots&\\
&&\ddots&\ddots&\beta_{m-1}\\
&&&\beta_{m-1}&\alpha_m
\end{bmatrix}
}.
$$

从元素定义也可以看出这一点：

$$
(T_m)_{ij}=q_i^{\mathsf T}Aq_j.
$$

当 $|i-j|>1$ 时该内积为零，因而 $T_m$ 只有主对角线及其上下两条邻近对角线可能非零。

---

## 6. Lanczos 分解

把前 $m$ 个三项递推按列放在一起，可以得到

$$
\boxed{
AQ_m=Q_mT_m+\beta_mq_{m+1}e_m^{\mathsf T}
},
$$

其中

$$
e_m=(0,\ldots,0,1)^{\mathsf T}\in\mathbb R^m.
$$

为什么余项只在最后一列出现？对于 $j<m$，三项递推中的 $q_{j+1}$ 已经包含在 $Q_m$ 中；但对第 $m$ 列，

$$
Aq_m
=\beta_{m-1}q_{m-1}+\alpha_mq_m+\beta_mq_{m+1},
$$

而 $q_{m+1}\notin\operatorname{range}(Q_m)$。因此

$$
Q_mT_me_m
=P_mAq_m
=\beta_{m-1}q_{m-1}+\alpha_mq_m,
$$

缺少的子空间外分量正是 $\beta_mq_{m+1}$。等价地，

$$
(I-P_m)AQ_m=\beta_mq_{m+1}e_m^{\mathsf T}.
$$

因此 Lanczos 分解是精确等式；只有主动忽略最后一项时，才写成近似关系

$$
AQ_m\approx Q_mT_m.
$$

---

## 7. Ritz 值、Ritz 向量与残差

求小型三对角矩阵的特征对：

$$
T_my=\theta y,
\qquad \lVert y\rVert_2=1.
$$

这里：

- $y\in\mathbb R^m$ 是 $T_m$ 的特征向量，也是 Krylov 基底下的坐标；
- $\theta$ 是 $T_m$ 的精确特征值，作为 $A$ 的近似特征值时称为 Ritz 值；
- $u=Q_my\in\mathbb R^n$ 是映射回原空间的 Ritz 向量。

若 $y=(y_1,\ldots,y_m)^{\mathsf T}$，则

$$
u=Q_my=y_1q_1+\cdots+y_mq_m.
$$

不能直接把 $y$ 当作 $A$ 的近似特征向量，因为 $y$ 与 $A$ 所在空间的维数不同。

### 7.1 为什么需要残差

$(\theta,y)$ 是 $T_m$ 的精确特征对，但目标是 $A$ 的特征对。因此需要检查

$$
r=Au-\theta u
$$

是否足够小。利用 Lanczos 分解：

$$
\begin{aligned}
r
&=AQ_my-\theta Q_my\\
&=Q_m(T_my-\theta y)
  +\beta_mq_{m+1}e_m^{\mathsf T}y\\
&=\beta_m(e_m^{\mathsf T}y)q_{m+1}.
\end{aligned}
$$

于是

$$
\boxed{
\lVert Au-\theta u\rVert_2
=|\beta_m e_m^{\mathsf T}y|
=|\beta_my_m|
}.
$$

这个公式无需额外计算一次 $Au$，即可获得 Ritz 对的残差范数。

### 7.2 Galerkin 条件

虽然残差一般不为零，但

$$
Q_m^{\mathsf T}r=0.
$$

也就是说，残差与整个搜索子空间正交。这只保证子空间内已经无法看到误差，并不保证子空间外的误差为零。

### 7.3 残差的意义

对于对称矩阵，有

$$
\operatorname{dist}(\theta,\operatorname{spec}(A))
\le \lVert r\rVert_2.
$$

因此至少存在一个真实特征值 $\lambda$，满足

$$
|\lambda-\theta|\le\lVert r\rVert_2.
$$

所以“$\theta$ 是 $T_m$ 的精确特征值”和“$\theta$ 是 $A$ 的准确近似特征值”是两个不同问题；后者需要通过残差判断。

---

## 8. 终止与完整三对角化

如果某一步出现

$$
\beta_j=0,
$$

就无法定义新的 $q_{j+1}$。在精确算术中，这通常意味着

$$
AQ_j=Q_jT_j,
$$

当前 Krylov 子空间已经是 $A$ 的不变子空间。因此 $T_j$ 的特征对映射回原空间后，是 $A$ 在该不变子空间中的精确特征对。

如果运行到 $n$ 步，$Q_n$ 为方形正交矩阵，那么

$$
AQ_n=Q_nT_n.
$$

右乘 $Q_n^{\mathsf T}$ 得

$$
\boxed{
A=Q_nT_nQ_n^{\mathsf T}
},
$$

或

$$
T_n=Q_n^{\mathsf T}AQ_n.
$$

这说明完整 Lanczos 过程可以视为将对称矩阵正交相似变换为三对角矩阵的方法。不过在大型稀疏问题中，通常只进行 $m\ll n$ 步，用小矩阵 $T_m$ 近似所需的部分谱信息。

---

## 9. 有限精度问题

三项递推产生相互正交的 $q_j$，这是精确算术中的结论。在浮点数计算中，舍入误差会逐渐导致

$$
Q_m^{\mathsf T}Q_m\ne I.
$$

尤其当某个 Ritz 对已经收敛时，相应特征方向可能重新进入后续 Lanczos 向量，从而造成：

- 同一个特征值重复出现；
- 产生所谓的 ghost Ritz values；
- Ritz 向量之间失去应有的正交性。

常见处理方式包括：

- **完全重新正交化**：每一步对全部已有 $q_i$ 重新正交化；
- **选择性正交化**：只针对已经收敛的 Ritz 向量；
- **部分重新正交化**：监测正交性并在必要时修正；
- **重启和锁定**：限制子空间规模，并保存已经收敛的方向。

完全重新正交化最稳健，但需要保存全部 Lanczos 向量，并增加正交化成本。

---

## 10. 收敛的直观理解

Krylov 子空间中的向量具有形式

$$
p_{m-1}(A)q_1.
$$

因此 Lanczos 收敛可以从多项式滤波理解：通过选择适当的低次多项式，使目标特征值处的响应较大，而在其他特征值处较小。

常见现象是：

- 谱两端的极端特征值通常首先收敛；
- 与其他特征值分离较好的特征值通常收敛较快；
- 聚集在一起的特征值较难分辨；
- 初始向量在目标特征方向上的分量会影响收敛；
- 单向量 Lanczos 对高重数特征空间的处理能力有限，块 Lanczos 更适合这类问题。

---

## 11. 与相关 Krylov 方法的关系

### 11.1 Arnoldi

Arnoldi 方法适用于一般非对称矩阵，得到上 Hessenberg 投影矩阵。对称性使远离主对角线的投影系数为零，因此 Arnoldi 的长递推缩短为 Lanczos 的三项递推，投影矩阵也退化为对称三对角矩阵。

### 11.2 共轭梯度法

对于对称正定线性系统 $Ax=b$，共轭梯度法与 Lanczos 方法建立在同一个 Krylov 子空间上：

$$
\mathcal K_m(A,r_0).
$$

Lanczos 主要从谱投影角度研究 $A$，CG 则利用相同结构构造线性方程的近似解。

### 11.3 Lanczos 双对角化

对于一般矩阵的奇异值问题，Golub–Kahan/Lanczos 双对角化构造一个小型双对角矩阵，其奇异值用于近似原矩阵的奇异值。这是大型稀疏 SVD 算法的基础。

---

## 12. 常见现代变体

- **隐式重启 Lanczos**：控制 Krylov 子空间维数，ARPACK 等软件采用这一思路；
- **厚重启 Lanczos**：重启时保留多个有用的 Ritz 向量；
- **块 Lanczos**：每次扩展一组向量，适合成簇或多重特征值；
- **shift-and-invert Lanczos**：对 $(A-\sigma I)^{-1}$ 运行 Lanczos，以寻找靠近 $\sigma$ 的内部特征值；
- **随机 Lanczos 求积**：将 Lanczos 与随机迹估计、高斯求积结合，用于近似 $\operatorname{tr}(f(A))$ 等谱统计量。

---

## 13. 常见误区

### 误区一：$T_m=Q_m^{\mathsf T}AQ_m$，所以 $Q_mT_m=AQ_m$

一般不成立，因为

$$
Q_mT_m=Q_mQ_m^{\mathsf T}AQ_m=P_mAQ_m,
$$

只是 $AQ_m$ 在当前子空间中的投影。

### 误区二：$y$ 是 $A$ 的近似特征向量

$y\in\mathbb R^m$ 只是小矩阵特征向量和子空间坐标。原空间中的近似特征向量是

$$
u=Q_my\in\mathbb R^n.
$$

### 误区三：$\theta$ 是 $T_m$ 的精确特征值，所以也是 $A$ 的特征值

它只是 $A$ 的 Ritz 值。是否准确需要检查

$$
\lVert Au-\theta u\rVert_2=|\beta_my_m|.
$$

### 误区四：Lanczos 分解本身是近似等式

在精确算术中

$$
AQ_m=Q_mT_m+\beta_mq_{m+1}e_m^{\mathsf T}
$$

是精确等式。忽略最后一项后才得到近似。

### 误区五：三项递推在计算机中永远保持正交性

浮点误差会破坏全局正交性，因此可靠实现通常需要某种重新正交化、重启或锁定机制。

---

## 14. 核心公式速查

Krylov 子空间：

$$
\mathcal K_m(A,q_1)
=\operatorname{span}\{q_1,Aq_1,\ldots,A^{m-1}q_1\}.
$$

三项递推：

$$
Aq_j
=\beta_{j-1}q_{j-1}
+\alpha_jq_j
+\beta_jq_{j+1}.
$$

投影矩阵：

$$
T_m=Q_m^{\mathsf T}AQ_m.
$$

投影解释：

$$
Q_mT_m=P_mAQ_m,
\qquad P_m=Q_mQ_m^{\mathsf T}.
$$

Lanczos 分解：

$$
AQ_m=Q_mT_m+\beta_mq_{m+1}e_m^{\mathsf T}.
$$

小型特征值问题与 Ritz 向量：

$$
T_my=\theta y,
\qquad
u=Q_my.
$$

Ritz 残差：

$$
Au-\theta u
=\beta_m(e_m^{\mathsf T}y)q_{m+1},
$$

$$
\lVert Au-\theta u\rVert_2
=|\beta_m e_m^{\mathsf T}y|.
$$

完整三对角化：

$$
A=Q_nT_nQ_n^{\mathsf T}.
$$

---

## 15. 一句话理解整个流程

$$
\boxed{
\text{矩阵向量乘法}
\longrightarrow
\text{Krylov 正交基}
\longrightarrow
\text{三项递推}
\longrightarrow
\text{小型三对角矩阵 }T_m
\longrightarrow
\text{Ritz 对}
\longrightarrow
\text{用残差判断是否收敛}
}.
$$

Lanczos 的价值在于：它不直接分解大型矩阵，而是仅通过矩阵向量乘法，把所需的谱信息压缩到一个小型三对角矩阵中。
