---
title: "M-内积下的主角与投影差：从 SVD 到二维块分解"
date: "2026-09-01"
excerpt: "从交叉 Gram 矩阵的 SVD 出发，构造主角向量与残差方向，并完整推导投影差如何由相互正交的二维块嵌回原来的 n 维空间。"
tags: ["Mathematics", "Numerical Linear Algebra", "Matrix Theory"]
---

# M-内积下的主角与投影差：从 SVD 到二维块分解

本文讨论同一个 $n$ 维实向量空间中的两个等维子空间

$$
\mathcal F,\mathcal G\subseteq\mathbb R^n,
\qquad
\dim\mathcal F=\dim\mathcal G=k,
$$

以及由对称正定矩阵 $M$ 定义的内积

$$
\langle x,y\rangle_M=x^{\mathsf T}My,
\qquad
\|x\|_M=\sqrt{x^{\mathsf T}Mx}.
$$

目标是把下面几件事串成一条完整的逻辑链：

$$
\boxed{
\text{交叉 Gram 矩阵的 SVD}
\longrightarrow
u_i,v_i,w_i
\longrightarrow
\text{二维主角块}
\longrightarrow
P_F-P_G
\longrightarrow
\sin\theta_{\max}
}.
$$

最容易混淆的地方是：二维块不是原来的 $n\times n$ 矩阵，而是原算子在某个二维不变平面中的坐标表示。本文会显式写出两者之间的维数和嵌入公式。

---

## 1. $M$-正交基与投影

取两个子空间的 $M$-正交基

$$
Q_F,Q_G\in\mathbb R^{n\times k},
$$

满足

$$
Q_F^{\mathsf T}MQ_F=I_k,
\qquad
Q_G^{\mathsf T}MQ_G=I_k.
$$

对应的 $M$-正交投影为

$$
P_F=Q_FQ_F^{\mathsf T}M,
\qquad
P_G=Q_GQ_G^{\mathsf T}M.
$$

例如，将 $x$ 投影到 $\mathcal F$ 时，投影系数是 $Q_F^{\mathsf T}Mx$，所以

$$
P_Fx=Q_F(Q_F^{\mathsf T}Mx).
$$

投影只依赖子空间，不依赖基向量的排列。若 $O_F$ 是任意 $k\times k$ 正交矩阵，并令

$$
\widetilde Q_F=Q_FO_F,
$$

则

$$
\widetilde Q_F\widetilde Q_F^{\mathsf T}M
=Q_FO_FO_F^{\mathsf T}Q_F^{\mathsf T}M
=P_F.
$$

因此交换列、改变符号或对所有列做正交混合，都不会改变投影。

---

## 2. SVD 自动寻找主角方向

原始 $Q_F,Q_G$ 的同编号列通常没有任何天然对应关系。真正的对应关系由交叉 Gram 矩阵

$$
C=Q_F^{\mathsf T}MQ_G\in\mathbb R^{k\times k}
$$

的 SVD 找到。令

$$
C=Y\Sigma Z^{\mathsf T},
\qquad
\Sigma=\operatorname{diag}(\sigma_1,\ldots,\sigma_k),
$$

其中

$$
1\ge\sigma_1\ge\cdots\ge\sigma_k\ge0.
$$

定义重新组合后的基

$$
U=Q_FY=[u_1,\ldots,u_k],
$$

$$
V=Q_GZ=[v_1,\ldots,v_k].
$$

因为 $Y,Z$ 正交，$U,V$ 仍分别是 $\mathcal F,\mathcal G$ 的 $M$-正交基，并且投影保持不变：

$$
P_F=UU^{\mathsf T}M,
\qquad
P_G=VV^{\mathsf T}M.
$$

更重要的是

$$
U^{\mathsf T}MV
=Y^{\mathsf T}Q_F^{\mathsf T}MQ_GZ
=Y^{\mathsf T}CZ
=\Sigma.
$$

所以

$$
\boxed{
\langle u_i,v_j\rangle_M
=\sigma_i\delta_{ij}.
}
$$

定义主角

$$
\sigma_i=\cos\theta_i,
\qquad
0\le\theta_1\le\cdots\le\theta_k\le\frac\pi2.
$$

这说明 SVD 做的事情是：在两个子空间中分别寻找适当的线性组合，使交叉内积矩阵变成对角矩阵。二维主角平面使用的是 SVD 之后的 $u_i,v_i$，不是原始 $Q_F,Q_G$ 中同编号的列。

SVD 的基本关系

$$
Cz_i=\sigma_i y_i,
\qquad
C^{\mathsf T}y_i=\sigma_i z_i
$$

还给出

$$
\boxed{
P_Fv_i=\cos\theta_i\,u_i,
\qquad
P_Gu_i=\cos\theta_i\,v_i.
}
$$

例如

$$
P_Fv_i
=Q_FQ_F^{\mathsf T}MQ_Gz_i
=Q_FCz_i
=\sigma_iQ_Fy_i
=\sigma_i u_i.
$$

---

## 3. 从 $u_i,v_i$ 构造单位残差方向 $w_i$

记

$$
c_i=\cos\theta_i,
\qquad
s_i=\sin\theta_i.
$$

对每个正主角 $\theta_i>0$，定义投影残差

$$
r_i=v_i-P_Fv_i=v_i-c_i u_i.
$$

它与整个 $\mathcal F$ 都 $M$-正交，因为

$$
Q_F^{\mathsf T}Mr_i
=Cz_i-c_i y_i
=0.
$$

它的长度为

$$
\begin{aligned}
\|r_i\|_M^2
&=\|v_i-c_i u_i\|_M^2\\
&=1-2c_i\langle u_i,v_i\rangle_M+c_i^2\\
&=1-c_i^2\\
&=s_i^2.
\end{aligned}
$$

因此定义单位残差方向

$$
\boxed{
w_i=\frac{v_i-c_i u_i}{s_i}
}
$$

后，有

$$
\|w_i\|_M=1,
\qquad
w_i\perp_M\mathcal F,
$$

以及最核心的局部分解

$$
\boxed{
v_i=c_i u_i+s_iw_i.
}
$$

不同正主角对应的 $w_i$ 彼此 $M$-正交，而且所有 $u_i$ 与所有 $w_j$ 都 $M$-正交。因此每个

$$
\Pi_i=\operatorname{span}\{u_i,w_i\}
$$

都是一个二维主角平面，不同 $\Pi_i$ 彼此 $M$-正交。

若 $\theta_i=0$，则 $u_i=v_i$，残差为零，不存在唯一的 $w_i$，也不需要构造二维平面。

---

## 4. 单个二维平面中的投影差

令

$$
D=P_F-P_G.
$$

在 $\Pi_i$ 的 $M$-正交基 $(u_i,w_i)$ 中，先计算 $D$ 对两个基向量的作用。

由

$$
P_Fu_i=u_i,
\qquad
P_Gu_i=c_i v_i,
$$

得到

$$
\begin{aligned}
Du_i
&=u_i-c_i(c_i u_i+s_iw_i)\\
&=s_i^2u_i-c_is_iw_i.
\end{aligned}
$$

又因为

$$
P_Fw_i=0,
\qquad
P_Gw_i=s_iv_i,
$$

所以

$$
Dw_i=-c_is_i u_i-s_i^2w_i.
$$

将两条等式按列排在一起。令

$$
B_i=[u_i,w_i]\in\mathbb R^{n\times2},
$$

以及

$$
D_i=
\begin{bmatrix}
s_i^2&-c_is_i\\
-c_is_i&-s_i^2
\end{bmatrix}
\in\mathbb R^{2\times2}.
$$

则

$$
\boxed{
DB_i=B_iD_i.
}
$$

维数为

$$
\underbrace{D}_{n\times n}
\underbrace{B_i}_{n\times2}
=
\underbrace{B_i}_{n\times2}
\underbrace{D_i}_{2\times2}.
$$

这才是“$P_F-P_G$ 在第 $i$ 个主角平面中等于二维块”的严格含义。$D_i$ 不是原来的 $n\times n$ 矩阵，而是 $D$ 限制在不变平面 $\Pi_i$ 后的坐标矩阵。

直接计算可得

$$
D_i^2=s_i^2I_2.
$$

所以 $D_i$ 的特征值为

$$
+s_i,qquad-s_i,
$$

谱范数为

$$
\boxed{\|D_i\|_2=s_i=\sin\theta_i.}
$$

---

## 5. 将二维块嵌回原来的 $n$ 维空间

二维块嵌回原空间时，对应的矩阵是

$$
\boxed{
B_iD_iB_i^{\mathsf T}M.
}
$$

维数检查为

$$
\underbrace{B_i}_{n\times2}
\underbrace{D_i}_{2\times2}
\underbrace{B_i^{\mathsf T}M}_{2\times n}
\in\mathbb R^{n\times n}.
$$

为了看出它与原投影的直接关系，利用主角基展开

$$
P_F=\sum_{i=1}^k u_i u_i^{\mathsf T}M,
\qquad
P_G=\sum_{i=1}^k v_i v_i^{\mathsf T}M.
$$

因此

$$
D=P_F-P_G
=\sum_{i=1}^k
\left(u_i u_i^{\mathsf T}M-v_i v_i^{\mathsf T}M\right).
$$

对一个正主角，代入 $v_i=c_i u_i+s_iw_i$：

$$
\begin{aligned}
u_i u_i^{\mathsf T}M-v_i v_i^{\mathsf T}M
={}&s_i^2u_i u_i^{\mathsf T}M
-c_is_i u_iw_i^{\mathsf T}M\\
&-c_is_iw_i u_i^{\mathsf T}M
-s_i^2w_iw_i^{\mathsf T}M\\
={}&B_iD_iB_i^{\mathsf T}M.
\end{aligned}
$$

零主角满足 $u_i=v_i$，对应项直接抵消。因此

$$
\boxed{
P_F-P_G
=\sum_{\theta_i>0}B_iD_iB_i^{\mathsf T}M.
}
$$

这就是所有二维块“拼回”原来 $n\times n$ 投影差的公式。每一项都是秩不超过 2 的 $n\times n$ 算子，并且只在对应主角平面内非零。

---

## 6. 完整基与维数为什么总能对上

令

$$
m=\dim(\mathcal F\cap\mathcal G).
$$

零主角的数量恰好是 $m$，所以正主角数量为

$$
r=k-m.
$$

由维数公式

$$
\dim(\mathcal F+\mathcal G)=2k-m\le n
$$

得到

$$
m\ge2k-n,
$$

从而

$$
r=k-m\le n-k.
$$

同时 $r\le k$，因此

$$
\boxed{
r\le\min(k,n-k)\le\frac n2.
}
$$

这里没有假设 $k\le n/2$。当 $k>n/2$ 时，两个大子空间被维数强迫拥有至少 $2k-n$ 个公共方向，因此只有至多 $n-k$ 个正主角。

取

$$
h_1,\ldots,h_m
$$

为 $\mathcal F\cap\mathcal G$ 的 $M$-正交基，再取

$$
z_1,\ldots,z_\ell
$$

为公共正交补

$$
\mathcal F^{\perp_M}\cap\mathcal G^{\perp_M}
$$

的 $M$-正交基，其中

$$
\ell=n-2k+m.
$$

现在构造完整基

$$
B=
[u_1,w_1,\ldots,u_r,w_r,
h_1,\ldots,h_m,
z_1,\ldots,z_\ell].
$$

列数正好是

$$
2r+m+\ell
=2(k-m)+m+(n-2k+m)
=n.
$$

所以

$$
B\in\mathbb R^{n\times n},
\qquad
B^{\mathsf T}MB=I_n,
\qquad
B^{-1}=B^{\mathsf T}M.
$$

在这组完整坐标中，投影差真正变成分块对角矩阵：

$$
\boxed{
B^{\mathsf T}M(P_F-P_G)B
=\operatorname{diag}(D_1,\ldots,D_r,0_m,0_\ell).
}
$$

反过来，原坐标中的矩阵为

$$
P_F-P_G
=B\operatorname{diag}(D_1,\ldots,D_r,0_m,0_\ell)B^{\mathsf T}M.
$$

这说明原矩阵在标准坐标中可以完全稠密；只有换到主角基 $B$ 后，二维结构才显露出来。

---

## 7. 从局部残差到全局投影距离

单个主角方向满足

$$
\boxed{
\|v_i-P_Fv_i\|_M=\sin\theta_i.
}
$$

任取 $M$-单位向量 $x\in\mathcal G$，写成

$$
x=\sum_{i=1}^k a_i v_i,
\qquad
\sum_i|a_i|^2=1.
$$

则

$$
(I-P_F)x
=\sum_{\theta_i>0}a_i\sin\theta_i\,w_i,
$$

因而

$$
\|(I-P_F)x\|_M^2
=\sum_i|a_i|^2\sin^2\theta_i
\le\sin^2\theta_{\max}.
$$

在最大主角方向 $v_{\max}$ 上取到等号，所以

$$
\boxed{
\|(I-P_F)P_G\|_M
=\sin\theta_{\max}.
}
$$

另一方面，因为完整坐标矩阵是二维块的直和，

$$
\begin{aligned}
\|P_F-P_G\|_M
&=\left\|\operatorname{diag}(D_1,\ldots,D_r,0)\right\|_2\\
&=\max_i\|D_i\|_2\\
&=\max_i\sin\theta_i\\
&=\sin\theta_{\max}.
\end{aligned}
$$

因此在两个子空间等维时，

$$
\boxed{
\|P_F-P_G\|_M
=\|(I-P_F)P_G\|_M
=\sin\theta_{\max}.
}
$$

第一项是对称的投影距离，第二项是从 $\mathcal G$ 到 $\mathcal F$ 的最坏单向遗漏；等维条件使二者具有同一个最大主角正弦。

---

## 8. MAC 的直接解释

对 $M$-单位向量

$$
x=\sum_i a_i v_i\in\mathcal G,
$$

其投影保留量为

$$
\|P_Fx\|_M^2
=\sum_i|a_i|^2\cos^2\theta_i.
$$

最坏方向上的保留量为

$$
\min_{\substack{x\in\mathcal G\\\|x\|_M=1}}
\|P_Fx\|_M^2
=\cos^2\theta_{\max}
=1-\sin^2\theta_{\max}.
$$

所以若

$$
\sin\theta_{\max}\le\eta,
$$

则最坏方向子空间 MAC 满足

$$
\boxed{
\operatorname{MAC}_{\min}\ge1-\eta^2.
}
$$

---

## 9. 重复主角与不唯一性

如果若干奇异值相同，例如某个 SVD 块为

$$
\Sigma_{\mathrm{block}}=\sigma I,
$$

那么在这一块内可以同时对左右奇异向量做任意正交旋转。对应的单个 $u_i,v_i,w_i$ 和单个二维平面不再唯一，但以下对象保持不变：

- 对应主角子空间的整体 span；
- 投影 $P_F,P_G$；
- 投影差 $P_F-P_G$；
- 主角集合；
- 最大主角正弦。

这与重根或近重特征簇中的现象相同：单列 eigenvector 可以旋转，整个 invariant subspace 才是稳定对象。

---

## 10. 实际计算流程

给定已经 $M$-正交化的 $Q_F,Q_G$：

1. 形成交叉 Gram 矩阵

   $$
   C=Q_F^{\mathsf T}MQ_G.
   $$

2. 计算

   $$
   C=Y\Sigma Z^{\mathsf T}.
   $$

3. 得到主角基

   $$
   U=Q_FY,
   \qquad
   V=Q_GZ.
   $$

4. 对每个正主角构造

   $$
   r_i=v_i-P_Fv_i,
   \qquad
   w_i=r_i/\|r_i\|_M.
   $$

5. 形成局部二维块 $D_i$，或者直接使用

   $$
   \|r_i\|_M=\sin\theta_i.
   $$

6. 最大主角正弦为

   $$
   \sin\theta_{\max}
   =\max_i\|r_i\|_M.
   $$

理论上也可以由

$$
\sin\theta_{\max}
=\sqrt{1-\sigma_{\min}(C)^2}
$$

计算，但小角度时会出现 $1-\text{接近 }1$ 的消去。数值实现更适合直接计算投影残差的正弦侧信息，而不是只从 cosine 反推。

---

## 11. 最常见的四个误区

### 误区一：按原始列号配对 $Q_F,Q_G$

原始基没有天然列对应。SVD 的左右奇异向量负责寻找正确的线性组合，真正配对的是 $u_i,v_i$。

### 误区二：把二维块当成原来的 $n\times n$ 矩阵

二维块只是在 $\Pi_i$ 中的坐标表示。严格关系是

$$
(P_F-P_G)B_i=B_iD_i,
$$

嵌回原空间后是

$$
B_iD_iB_i^{\mathsf T}M.
$$

### 误区三：认为每个 $u_i$ 都需要一个 $w_i$

只有正主角需要 $w_i$。零主角对应公共方向，投影差在该方向上为零。

### 误区四：认为必须有 $k\le n/2$

没有这个要求。若 $k>n/2$，两个子空间必然有至少 $2k-n$ 维交集，所以正主角数量自动降到至多 $n-k$。

---

## 12. 一张公式链记住全部结构

$$
\boxed{
\begin{gathered}
C=Q_F^{\mathsf T}MQ_G=Y\Sigma Z^{\mathsf T},\\
U=Q_FY,\qquad V=Q_GZ,\\
\langle u_i,v_j\rangle_M=\cos\theta_i\,\delta_{ij},\\
v_i=\cos\theta_i\,u_i+\sin\theta_i\,w_i,\\
B_i=[u_i,w_i],\\
(P_F-P_G)B_i=B_iD_i,\\
D_i=
\begin{bmatrix}
\sin^2\theta_i&-\cos\theta_i\sin\theta_i\\
-\cos\theta_i\sin\theta_i&-\sin^2\theta_i
\end{bmatrix},\\
P_F-P_G=\sum_{\theta_i>0}B_iD_iB_i^{\mathsf T}M,\\
B^{\mathsf T}M(P_F-P_G)B
=\operatorname{diag}(D_1,\ldots,D_r,0),\\
\|P_F-P_G\|_M
=\|(I-P_F)P_G\|_M
=\sin\theta_{\max}.
\end{gathered}
}
$$

整套推导的本质是：SVD 先找到相互解耦的主角方向；每个正主角方向产生一个二维不变平面；投影差在这些平面上分别表现为一个 $2\times2$ 块；最后通过换基或秩二嵌入，将所有局部块恢复成原来的 $n\times n$ 算子。
