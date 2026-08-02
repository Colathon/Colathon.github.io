---
title: "A Large Scale Benchmark and an Inclusion-Based Algorithm for Continuous Collision Detection"
date: "2026-08-02"
excerpt: "以 Wang et al. 2021 的大规模 CCD benchmark 为入口，梳理三角网格窄相连续碰撞检测的 multivariate / univariate 两种建模，以及 IRF、FPRF、TightCCD、Root Parity、BSC 等代表方法；再提炼本文真正需要长期记住的八角点 AABB inclusion、保守浮点谓词、参数域二分、TOI 与 L∞ 最小间距扩展。"
tags: ["Computer Graphics", "Collision Detection", "Physical Simulation", "Computational Geometry"]
---

# A Large Scale Benchmark and an Inclusion-Based Algorithm for Continuous Collision Detection —— 阅读报告

> Bolun Wang, Zachary Ferguson, Teseo Schneider, Xin Jiang, Marco Attene, Daniele Panozzo
>
> *ACM Transactions on Graphics*, 40(5), Article 188, 2021
>
> [论文 PDF](https://continuous-collision-detection.github.io/tight_inclusion/CCD-benchmark-paper-350ppi.pdf) · [项目主页与代码](https://continuous-collision-detection.github.io/tight_inclusion/) · [DOI](https://doi.org/10.1145/3460775)

---

## 0. 先给结论：以后提到这篇论文，应当想起什么

这篇论文的 benchmark 贡献至少与新算法同样重要。它做了三件事：

1. 用手工退化样例和真实仿真序列组成约 6000 万次窄相 CCD 查询，并用 Mathematica 的精确符号求解生成 ground truth；
2. 说明当时常见算法普遍落入三类：正确但太慢、很快但漏碰撞、不会漏但过度保守；
3. 回到 Snyder 1992 的 inclusion-based root finding，针对 CCD 的多仿射结构，把昂贵的通用区间算术改造成“八角点求值 + 输出 AABB + 保守布尔谓词 + 参数域二分”。

最值得记忆的一条链是：

~~~text
线性运动的 VF / EE 查询
        ↓
多变量方程 F(t,u,v)=0
        ↓
取当前 (t,u,v) 参数盒的 8 个角点
        ↓
对 8 个三维输出点建立 x/y/z 轴对齐包围盒 B_F(I)
        ↓
若原点不在 B_F(I)，安全排除；否则继续切分输入参数盒
        ↓
按层级和时间顺序搜索，返回保守 TOI
~~~

本文方法的核心公式不是一个新的三次方程，而是：

$$
F(I)
\subseteq
\operatorname{conv}\{F(\text{8 corners of }I)\}
\subseteq
B_F(I).
$$

作者选择最后那个较松的 AABB，而没有直接使用八点凸包，因为原点-AABB 测试只需要逐坐标 min/max 和符号比较，容易做浮点过滤和 AVX2 向量化。

最小间距扩展同样只有一条核心：

$$
F=0
\quad\longrightarrow\quad
\|F\|_\infty\le d
\quad\longleftrightarrow\quad
F\in[-d,d]^3.
$$

也就是把“输出包围盒是否碰到原点”改成“输出包围盒是否碰到以原点为中心的立方体”。

---

## 1. 论文实际解决的是什么 CCD

### 1.1 Broad phase 与 narrow phase

一个完整碰撞检测管线通常分两层：

- **Broad phase**：利用 BVH、AABB、spatial hash 等快速过滤绝大多数不可能碰撞的图元对；
- **Narrow phase**：对留下的具体 primitive pair，严格判断时间步内是否碰撞，并求首次接触时间。

本文研究的是第二层。输入已经是一对：

- vertex-face（VF，顶点—三角形）；或
- edge-edge（EE，边—边）。

它不比较 BVH 构建、遍历、GPU broad phase，也不解决任意刚体形状之间的全管线碰撞检测。Section 7 才把 broad phase 作为上层组件接回来。

### 1.2 运动假设

每个顶点在一个时间步内沿直线运动：

$$
p_i(t)=(1-t)p_i^0+t p_i^1,\qquad t\in[0,1].
$$

因此这里的 $t$ 是时间步内的归一化参数：$t=0$ 是开始，$t=1$ 是结束。

三角网格在一般位置下的首次接触可以归结为 VF 或 EE；点—点、点—边等退化情况也包含在这两个表达的边界参数里。

### 1.3 VF 的多变量方程

给定运动顶点 $p(t)$ 和运动三角形顶点 $v_1(t),v_2(t),v_3(t)$，三角形内一点写成重心坐标：

$$
q(t,u,v)
=
(1-u-v)v_1(t)+u v_2(t)+v v_3(t).
$$

定义相对位置向量：

$$
F_{\mathrm{vf}}(t,u,v)
=
p(t)-q(t,u,v).
\tag{1}
$$

合法参数域为：

$$
\Omega_{\mathrm{vf}}
=
[0,1]
\times
\{(u,v):u\ge0,\ v\ge0,\ u+v\le1\}.
$$

若存在 $(t,u,v)\in\Omega_{\mathrm{vf}}$ 使

$$
F_{\mathrm{vf}}(t,u,v)=\mathbf0,
$$

就表示运动顶点与运动三角形上的某一点重合。

### 1.4 EE 的多变量方程

两条运动边上的点分别为：

$$
e_1(t,u)=(1-u)p_1(t)+u p_2(t),
$$

$$
e_2(t,v)=(1-v)p_3(t)+v p_4(t).
$$

定义：

$$
F_{\mathrm{ee}}(t,u,v)
=
e_1(t,u)-e_2(t,v),
\tag{2}
$$

参数域为：

$$
\Omega_{\mathrm{ee}}=[0,1]^3.
$$

同样，$F_{\mathrm{ee}}=\mathbf0$ 就是两条边在同一时刻具有同一个空间点。

### 1.5 TOI 是最早根，不只是“有没有根”

Time of Impact 定义为：

$$
t^\star
=
\inf\left\{
t\in[0,1]:
\exists(u,v),\ F(t,u,v)=\mathbf0
\right\}.
$$

若没有碰撞，返回 $+\infty$。仿真中通常更看重一个保守估计：

$$
\widehat t\le t^\star.
$$

早报可能少走一点；晚报则可能跨过真实碰撞并产生穿透。因此 CCD 中 false negative 通常比 false positive 危险得多。

---

## 2. 两种主流符号语言：multivariate 与 univariate

### 2.1 Multivariate：直接求真实接触

式 (1)(2) 使用 $(t,u,v)$ 三个未知量，同时解三维向量方程：

$$
F(t,u,v)=\mathbf0.
$$

它的优点是语义直接：一个合法根就是一个真实接触，不需要先生成“共面候选根”再做 inside test。

容易混乱的是两组坐标：

$$
\underbrace{(t,u,v)}_{\text{参数空间}}
\overset{F}{\longmapsto}
\underbrace{(F^x,F^y,F^z)}_{\text{相对位置 / 输出空间}}.
$$

算法切分的一直是输入参数盒 $(t,u,v)$；$x,y,z$ 只用于判断该参数盒的函数值是否可能同时为零。

把线性轨迹展开后，$F$ 具有类似

$$
F(t,u,v)=A+Bt+Cu+Dv+Etu+Gtv
$$

的结构。它包含 $tu,tv$ 耦合项，但对每个变量单独看仍是仿射的，因此是 **multi-affine**。这正是本文八角点包围性质成立的原因。

### 2.2 Univariate：先找四点共面的时间

传统方法常利用一个几何必要条件：VF 的一个顶点和三角形三个顶点，或 EE 的四个端点，在接触时必定共面。

VF 中定义：

$$
n(t)
=
(v_2(t)-v_1(t))\times(v_3(t)-v_1(t)),
$$

$$
q(t)=p(t)-v_1(t).
$$

EE 中可用两条边方向的叉积作为 $n(t)$，端点差作为 $q(t)$。共面条件统一写成：

$$
f(t)=\langle n(t),q(t)\rangle=0.
\tag{3}
$$

在线性轨迹下，$f(t)$ 是一元三次多项式。找到根 $t^\star$ 后，再检查：

- VF 中点是否真的落在三角形内部；
- EE 中两条线段参数是否都在 $[0,1]$；
- 退化法向、平行边、端点接触等情况。

它把三变量系统降成一元三次方程，速度潜力很大，但 $f(t)=0$ 只说明共面，不等于碰撞。最麻烦的情况是两个图元始终共面，此时：

$$
f(t)\equiv0,
$$

出现无限多个共面根，而真实接触仍需另行判断。很多快速方法的 false negative 或大量 false positive，最终都与候选根过滤、浮点阈值或退化处理有关。

### 2.3 两种公式的领域取舍

| | Multivariate $F(t,u,v)=0$ | Univariate $f(t)=0$ |
|---|---|---|
| 未知量 | $t,u,v$ | 只有 $t$ |
| 根的语义 | 合法根直接对应接触 | 只是共面候选，还需过滤 |
| 典型优势 | 统一、无额外 corner case、适合保守包围 | 三次求根快 |
| 典型难点 | 多变量求根本身更贵 | 浮点阈值、伪根、无限根和退化过滤 |
| 本文立场 | 更容易做成可靠算法与 exact ground truth | 性能高，但可靠过滤仍然棘手 |

---

## 3. 相关工作方法地图：进入窄相 CCD 领域需要认识什么

### 3.1 Inclusion-based interval root finding（IRF）

Snyder 1992 的通用思想是：对当前参数域 $I$ 构造 inclusion function $\square F(I)$，满足

$$
F(I)\subseteq\square F(I).
$$

若

$$
\mathbf0\notin\square F(I),
$$

当前参数盒可以安全丢弃；否则继续二分。只要 inclusion function 收敛，即

$$
w(I)\to0
\Longrightarrow
w(\square F(I))\to0,
$$

就能逐步缩小候选根区域。

通用构造是把表达式中的标量运算替换成区间运算，例如：

$$
[a,b]+[c,d]=[a+c,b+d],
$$

$$
[a,b]\,[c,d]
=
[\min(ac,ad,bc,bd),\max(ac,ad,bc,bd)].
$$

它的最大优点是容易保证不漏根；缺点是区间乘法、外向舍入和重复变量造成的 dependency overestimation 很慢、很松。

论文中的 **IRF** 是多变量版本；**UIRF** 则把 inclusion bisection 用在一元共面函数上。UIRF 看似只切时间，但在 $f\equiv0$ 的共面退化下必须把整个时间域细分到最大精度，再逐段做几何验证，反而可能非常慢。

### 3.2 Floating-point root finder（FPRF）

FPRF 代表 Provot 风格的一元三次浮点求根：先解 $f(t)=0$，再做几何过滤。它极快，也是很多仿真代码的实际选择。

为缓解舍入误差，通常引入数值容差 $\eta$。问题是这个容差同时依赖：

- 场景尺度；
- 图元相对位置；
- 速度；
- 时间步；
- 多项式系数的条件数。

一个固定 $\eta$ 很难对所有场景可靠：太小会漏根，太大又会增加误报。本文 benchmark 中 FPRF 是“很快但有明显 false negative”的典型。

### 3.3 TightCCD（TCCD）

TCCD 也是一元共面路线，但将三次多项式写成 Bernstein 形式，并结合 VF / EE 的不等式约束做保守判断。其优点非常鲜明：

- 普通查询中极快；
- benchmark 中没有 false negative；
- 全部使用浮点运算。

但它的保守规则会在共面运动时把“可能共面”近似成“可能碰撞”。因此两个图元只要始终在同一平面内运动，即使空间上相距很远，也可能被报告为碰撞。这个结构性问题造成大量不可控 false positive。

TCCD 是一个重要参照：**保守性本身并不难，难的是既不漏碰撞，又不让过度保守摧毁仿真精度。**

### 3.4 Root Parity（RP / RRP）

Brochu et al. 2012 将多变量根问题转成拓扑意义上的 ray casting：从原点发射一条射线，与 $F(\partial\Omega)$ 的交点奇偶性对应域内根的奇偶性。

优点是可以用有理数或 floating-point expansion 构造几何谓词，避免普通浮点求根；但 parity 只保留模 2 信息：

$$
0\text{ 个根}\equiv2\text{ 个根}\pmod2.
$$

因此同一参数域内有两个接触根时，奇偶性仍为偶数，可能被当成无碰撞。这通常发生在较大时间步或高速运动中。

论文还指出参考实现没有完整覆盖 hourglass 等退化情况。作者另写了基于有理数的 **RRP** 来补齐退化处理，但它非常慢，而且“偶数个根不可区分”的 parity 局限仍然存在。

### 3.5 Bernstein Sign Classification（BSC）

Tang et al. 2014 将共面三次多项式和几何不等式转成 Bernstein 多项式符号分类。Bernstein 系数可以给出多项式在区间上的符号包围，因此避免显式写出所有根。

困难在于分类要求曲率单调，通常要在拐点处分割；而拐点位置包含除法，不能直接在普通浮点中精确表示。参考实现和退化处理仍会影响正确性。本文对实现做了保守补丁，但代价是额外 false positive，EE benchmark 中仍出现 false negative。

### 3.6 Symbolic / exact solver

Mathematica 对多变量方程进行精确符号求解，适合作为 ground truth，却需要每次查询数秒，无法进入仿真内循环。

这里有一条重要经验：**“使用 exact arithmetic”不自动等于“算法返回 exact answer”。** Root Parity 即使所有谓词都精确，奇偶性这个判据本身仍可能丢掉两个根；实现也仍需显式覆盖退化拓扑。

### 3.7 Collision culling 与 generalized trajectories

Broad-phase culling 与窄相求根正交：任何保守 BVH / AABB / spatial hash 都可以作为这些 CCD 方法的前处理，只要不丢掉潜在碰撞对。

本文还明确限制为每个时间步内的线性顶点轨迹。刚体螺旋运动、二次或更高阶轨迹存在专门 CCD 方法；本文的多仿射八角点性质不能不加修改地直接推广过去。

---

## 4. Section 4：benchmark 本身教会了什么

### 4.1 为什么要同时做 handcrafted 与 simulation 数据

论文构造了两类数据：

1. **Handcrafted dataset**：约 1.2 万个 VF 和 1.5 万个 EE 查询，专门覆盖点退化、近碰撞、共面运动、平行边、无限根、二重或三重根等病态情况；
2. **Simulation dataset**：约 1800 万个 VF 和 4100 万个 EE 查询，从牛头碰撞、环链下落、扭转垫子、高速球撞墙等仿真序列中提取。

只用真实仿真数据容易得到“算法一直正常”的错觉，因为退化事件很少；只用手工反例又无法代表平均性能。两者结合，才能分别回答：

- 普通查询是否足够快？
- 极端查询是否仍然正确？

### 4.2 Ground truth 与三个评价指标

作者用 Mathematica 精确、符号化求解多变量式 (1)(2)，为每次查询生成 ground truth。每个算法统计：

- 平均单查询时间 $t$；
- false positive（无碰撞却报告碰撞）；
- false negative（有碰撞却漏掉）。

三者不能只看一个：

- 只看时间，会奖励漏掉困难碰撞的算法；
- 只看 FN，会奖励“所有查询都报告碰撞”的算法；
- 只看 FP，又可能偏爱危险的非保守算法。

### 4.3 Simulation dataset 的代表结果

下表摘录 Table 1。时间单位为 $\mu s$，FP / FN 分别是 1800 万 VF 与 4100 万 EE 查询中的总计数：

| 方法 | VF / EE 时间 | VF / EE FP | VF / EE FN | 最应记住的现象 |
|---|---:|---:|---:|---|
| IRF | 115.89 / 215.80 | 2 / 71 | 0 / 0 | 可靠但慢 |
| UIRF | 6191.98 / 846.57 | 18 / 16781 | 0 / 0 | 一元不代表退化时更快 |
| FPRF | 7.53 / 0.23 | 0 / 0 | 5184 / 2317 | 极快，但会漏碰撞 |
| TCCD | 0.24 / 0.23 | 95638 / 82277 | 0 / 0 | 极快且不漏，但共面导致大量 FP |
| RP | 0.25 / 0.37 | 0 / 0 | 0 / 7 | parity 会漏偶数个根 |
| RRP | 1085.13 / 1468.70 | 0 / 0 | 0 / 7 | 精确退化处理很贵，parity 局限仍在 |
| BSC | 34.21 / 12.87 | 23015 / 4593 | 0 / 27 | Bernstein 分类仍受分割与退化实现影响 |
| Ours | 0.74 / 0.78 | 2 / 17 | 0 / 0 | 比最快方法约慢 3 倍，但取得更好的综合平衡 |

这张表最值得保留的不是某个小数，而是四个经验：

1. **univariate reduction 不是免费的**：降成三次方程后，可靠过滤候选根仍然可能比求根本身更难；
2. **无 false negative 不等于好用**：TCCD 展示了极快但过度保守的另一端；
3. **exact predicate 不会修复错误判据**：RRP 仍无法区分 0 根和 2 根；
4. **handcrafted degeneracy 必不可少**：在常规 simulation 上近乎完美的方法，仍可能在少量退化输入上系统性失败。

### 4.4 Handcrafted 结果揭示长尾

作者方法在 handcrafted 数据上保持 0 FN，但平均时间上升到约：

$$
1532.54\ \mu s\quad(\mathrm{VF}),\qquad
3029.83\ \mu s\quad(\mathrm{EE}).
$$

这不是普通查询都变成毫秒级，而是少数共面、近零和退化盒子需要大量细分，形成长尾。它解释了为什么作者必须同时提供：

- 精度阈值 $\delta$；
- 最大检查次数 $m_I$；
- 保守的提前终止结果。

---

## 5. 论文自己的方法：真正需要记住的设计

### 5.1 骨架来自 1992，创新在专用 inclusion predicate

算法骨架仍是经典 branch-and-bound：

~~~text
队列中保存 (t,u,v) 参数盒 I

取出 I
  ├─ 如果能证明 I 中无根：丢弃
  ├─ 如果候选区域已经足够小：返回保守结果
  └─ 否则：把 I 沿一个参数方向二分，子盒放回队列
~~~

本文没有发明二分求根，也没有发明多变量 $(t,u,v)$ 表达。它的核心贡献是：针对 $F$ 的 multi-affine 结构，设计一个比通用区间算术便宜得多的 inclusion function。

### 5.2 公式 (4)：从参数盒八角点得到输出 AABB

为避免论文中 $v$ 参数和 $v_i$ 输出点的记号冲突，重写如下。

当前输入参数盒：

$$
I
=
[t^-,t^+]\times[u^-,u^+]\times[v^-,v^+].
$$

对 $a,b,c\in\{-,+\}$，计算八个角点输出：

$$
q_{abc}=F(t^a,u^b,v^c)\in\mathbb R^3.
$$

分别取三维坐标极值：

$$
m^x=\min_{a,b,c}q_{abc}^x,\qquad
M^x=\max_{a,b,c}q_{abc}^x,
$$

$y,z$ 同理。定义：

$$
B_F(I)
=
[m^x,M^x]
\times
[m^y,M^y]
\times
[m^z,M^z].
\tag{4}
$$

因为 $F$ 是 multi-affine，参数盒内部任意输出都能写成八角点输出的凸组合：

$$
F(t,u,v)
=
\sum_{a,b,c\in\{-,+\}}
w_{abc}(t,u,v)\,q_{abc},
$$

$$
w_{abc}\ge0,\qquad
\sum_{a,b,c}w_{abc}=1.
$$

因此：

$$
F(I)
\subseteq
\operatorname{conv}\{q_{abc}\}
\subseteq
B_F(I).
$$

$B_F$ 是包含八点凸包的最小 axis-aligned box，不是最紧的任意包围集合。它丢掉了 $x,y,z$ 的联合相关性：构造 AABB 后出现的

$$
(m^x,m^y,m^z)
$$

可能把三个不同真实输出点的坐标拼在一起，本身并不是任何 $F(t,u,v)$。这正是假阳性的来源之一。

作者仍选择 AABB，因为判定

$$
\mathbf0\in B_F(I)?
$$

只需检查：

$$
m^x\le0\le M^x,\qquad
m^y\le0\le M^y,\qquad
m^z\le0\le M^z.
$$

任一坐标区间不含零，都能安全排除整个参数盒；三个区间都含零，只表示“不能排除”，不证明存在根。

### 5.3 分割的是 $(t,u,v)$，$x,y,z$ 只负责排除

必须始终区分：

| 空间 | 作用 |
|---|---|
| 输入参数空间 $(t,u,v)$ | 存放搜索域并执行二分 |
| 输出残差空间 $(F^x,F^y,F^z)$ | 检查该输入盒是否可能映射到原点 |

如果沿时间分割：

$$
t^m=\frac{t^-+t^+}{2},
$$

$$
I_1=[t^-,t^m]\times I_u\times I_v,\qquad
I_2=[t^m,t^+]\times I_u\times I_v.
$$

然后分别重新计算 $B_F(I_1)$ 和 $B_F(I_2)$。输出 AABB 从不被直接切分；它只由更小的输入盒重新诱导出来。

### 5.4 Boolean predicate 与保守浮点过滤

数学上测试 $\mathbf0\in B_F(I)$ 即可，但八个 $F$ 值由 double 计算，符号可能被舍入误差翻转。若因此错误丢弃参数盒，就会产生 false negative。

作者为 VF 和 EE 的每个坐标分量推导前向误差界，形式为：

$$
\epsilon^c=K\,\gamma_c^3,\qquad
\gamma_c=\max\left(1,\max_i|q_i^c|\right),
$$

其中常数 $K$ 由具体 VF / EE 表达式的浮点运算图决定。真正测试的是输出盒是否与误差盒相交：

$$
C_\epsilon
=
[-\epsilon^x,\epsilon^x]
\times
[-\epsilon^y,\epsilon^y]
\times
[-\epsilon^z,\epsilon^z],
$$

$$
B_F(I)\cap C_\epsilon\ne\varnothing?
$$

若某分量的绝对值大于误差界，符号可信；否则一律视作“可能为零”。这个策略允许假阳性，不允许因为浮点误差制造假阴性。

八个角点相互独立，作者用 AVX2 并行求值；三个坐标也可以逐轴检查，某一轴已经排除原点后立即返回。与通用 interval arithmetic 相比，这里只剩普通浮点、min/max 和少量比较。

### 5.5 切哪个参数方向：看输出敏感度，不只看输入边长

作者为三个参数估计每单位变化对 $F$ 的最大影响：

$$
\kappa_t
=
3\max_{i,j}
\|F(0,u_i,v_j)-F(1,u_i,v_j)\|_\infty,
$$

$$
\kappa_u
=
3\max_{i,j}
\|F(t_i,0,v_j)-F(t_i,1,v_j)\|_\infty,
$$

$$
\kappa_v
=
3\max_{i,j}
\|F(t_i,u_j,0)-F(t_i,u_j,1)\|_\infty.
$$

再计算当前区间对输出宽度的估计贡献：

$$
c_t=w(I_t)\kappa_t,\qquad
c_u=w(I_u)\kappa_u,\qquad
c_v=w(I_v)\kappa_v.
$$

选择最大的方向二分。含义是：不是切输入空间中看起来最长的边，而是切预计能让输出 AABB 缩小最多的参数方向。

相关命题保证：若

$$
w(I_t)<\frac{\alpha}{\kappa_t},\quad
w(I_u)<\frac{\alpha}{\kappa_u},\quad
w(I_v)<\frac{\alpha}{\kappa_v},
$$

则

$$
w(B_F(I))<\alpha.
$$

这给出了 inclusion function 随参数盒细分而收敛的定量保证。

### 5.6 为什么使用“按层 + 按时间”的优先队列

目标不是找到任意根，而是 earliest TOI。队列按：

1. 二分层级 $\ell$ 从小到大；
2. 同一层内按时间区间左端点从早到晚；

进行访问。算法记录每层第一个不能排除的时间区间 $I_f$。当精度达到要求或检查预算耗尽时，返回：

$$
\widehat t=\mathcal L(I_f),
$$

即候选时间区间左端点。这可能早于真实接触，但不会晚于它。

两个用户参数分别控制：

| 参数 | 直接作用 | 调小后的效果 |
|---|---|---|
| $\delta$ | 目标包围盒精度 | 更精确、更多细分、通常更少 FP |
| $m_I$ | 最大检查次数 | 更低最坏运行时间，但更早、更粗地报告碰撞 |

即使因 $m_I$ 提前停止，返回的仍是保守 TOI；损失的是精度，不是 no-false-negative 性质。

### 5.7 一眼看懂完整算法

~~~text
Q ← 整个合法参数域

while Q 非空:
    I ← 按层级和时间顺序取出参数盒
    用 I 的 8 个角计算 B_F(I)

    if B_F(I) 与浮点误差盒不相交:
        丢弃 I
        continue

    记录当前层最早候选时间区间

    if B_F(I) 足够小，或达到检查上限:
        返回最早候选区间左端点

    计算 c_t, c_u, c_v
    沿影响最大的输入参数方向二分 I
    合法子盒放回 Q

return +∞
~~~

### 5.8 什么是本文的新东西，什么不是

不是本文提出的：

- VF / EE 的 $(t,u,v)$ 多变量表达；
- Snyder 的 inclusion-based bisection；
- 用区间包围排除根的一般思想。

本文真正提出或系统化的是：

- 利用 CCD multi-affine 结构的八角点 AABB inclusion；
- 可证明保守的浮点 Boolean predicate；
- AVX2 友好的角点评估；
- 依据输出敏感度选择二分方向；
- 固定精度 / 固定运行预算下的保守 earliest-TOI 搜索；
- 对最小间距查询和仿真 line search 的扩展。

---

## 6. Section 5.3：结果与参数应该怎样解读

默认：

$$
\delta=10^{-6},\qquad m_I=10^6.
$$

simulation dataset 的全部查询都在 $10^6$ 次检查内结束。作者方法的平均时间约为：

$$
0.74\ \mu s\quad(\mathrm{VF}),\qquad
0.78\ \mu s\quad(\mathrm{EE}),
$$

约为最快但不可靠方法的 3 倍，却保持 0 FN。

在 handcrafted 数据中，只有约 $0.25\%$ 的 VF 和 $0.55\%$ 的 EE 查询需要超过 $10^6$ 次检查，但这些少量退化查询会形成极长尾。去掉检查上限后，handcrafted 平均时间上升到约 15.8 ms（VF）和 42.5 ms（EE）。

因此 $m_I$ 不是普通情况下的主要精度来源，而是防止少量病态输入无限消耗时间和内存的保险丝。即使把 $m_I$ 降到 1000，约 6000 万个 simulation queries 中也只有约 $0.07\%$ 会提前终止。

---

## 7. Section 6：Minimum Separation CCD

### 7.1 从“接触”改成“进入安全距离”

普通 CCD 检查：

$$
F(t,u,v)=\mathbf0.
$$

MSCCD 则在两个图元距离小于用户指定阈值 $d$ 时提前报告。传统定义使用欧氏距离：

$$
\|F(t,u,v)\|_2\le d.
$$

几何上，这要求判断 $F(\Omega)$ 是否与半径 $d$ 的球相交。对本文的 AABB inclusion 来说，球—映射区域的紧致保守测试并不自然。

若走 univariate 路线，欧氏最小间距会得到：

$$
\langle n(t),q(t)\rangle^2
-d^2\|n(t)\|^2=0,
$$

从普通 CCD 的三次多项式升为六次，还要额外检查点到三角形边、顶点的距离，并继续面对无限根退化。

### 7.2 作者的关键替换：$L^2\to L^\infty$

作者把距离定义改为：

$$
\|F(t,u,v)\|_\infty
=
\max(|F^x|,|F^y|,|F^z|).
$$

于是：

$$
\|F(t,u,v)\|_\infty\le d
\quad\Longleftrightarrow\quad
F(t,u,v)\in[-d,d]^3.
$$

对当前参数盒只需检查：

$$
B_F(I)\cap[-d,d]^3\ne\varnothing?
$$

也可以等价地把 $B_F(I)$ 六个面各向外扩张 $d$，再检查扩张盒是否包含原点。算法仍然切分 $(t,u,v)$，只把目标集合从一个点换成一个立方体；由于额外多了与 $d$ 的加减，前向误差过滤常数需要重新推导。

### 7.3 这个替换的代价必须记住

对任意 $r\in\mathbb R^3$：

$$
\|r\|_\infty
\le
\|r\|_2
\le
\sqrt3\,\|r\|_\infty.
$$

所以同一个数值 $d$ 下：

$$
\{r:\|r\|_2\le d\}
\subseteq
\{r:\|r\|_\infty\le d\}.
$$

$L^\infty$ 立方体比 $L^2$ 球更大。它不会漏掉欧氏距离小于 $d$ 的事件，但可能更早报告；同时 $L^\infty$ 与世界坐标轴绑定，不具有旋转不变性。

例如：

$$
r=(0.9d,0.9d,0.9d)
$$

满足

$$
\|r\|_\infty=0.9d<d,
\qquad
\|r\|_2\approx1.56d>d.
$$

因此本文 MSCCD 是一个方便、保守、非常适合 AABB predicate 的安全距离定义，却不是传统欧氏 MSCCD 的等价算法。

### 7.4 实验结论

与浮点 univariate MSRF 相比，作者方法在所有测试 $d$ 下保持 0 FN；MSRF 求解高阶多项式，在 $d$ 很小时数值问题和 false negative 明显增加。

当 $d$ 很小时，作者方法逐渐退化为 $d=0$ 的普通 CCD，simulation 平均时间仍约 $0.7\ \mu s$。当 $d$ 较大时，目标立方体变大，更多 AABB 无法排除，运行时间和 false positive 都会明显上升。这种扩展更适合“小安全余量”，不适合把图元人为膨胀得很厚。

---

## 8. Section 7：放进仿真器后，TOI 怎样被使用

### 8.1 Active set

约束式仿真先用 broad phase 得到候选集合 $C$，对每个候选求 TOI。若

$$
0\le t_c\le1,
$$

就把 $(c,t_c)$ 加入 active collision set，并利用 TOI 处的法向、接触点构造 gap constraint：

$$
\langle n,p_c^1-p_c^2\rangle\ge0.
$$

工程上常把它偏移为：

$$
\langle n,p_c^1-p_c^2\rangle\ge\eta>0,
$$

这样求解器稍微违反安全余量时，真实的零间距约束仍可能满足。此时必须在距离降到 $\eta$ 前提前激活约束，恰好可调用 $d=\eta$ 的 MSCCD。

这一节揭示了 TOI 精度的另一个作用：TOI 不只决定“停在哪里”，还参与计算接触法向和重心接触点。$\delta$ 太大时，接触点不准，生成的线性约束也会不准，最终仍可能相交。

### 8.2 Line search：为什么不能直接一步走到 $F=0$

隐式仿真常在一个物理时间步内求解：

$$
x^{n+1}=\arg\min_x E(x).
$$

第 $k$ 次 Newton 迭代给出方向 $\Delta x_k$，line search 选择：

$$
x_{k+1}=x_k+\alpha\Delta x_k,\qquad0<\alpha\le1,
$$

要求能量下降并且整条线段无穿透。对 CCD 而言，这条数值更新路径就是：

$$
x(t)=x_k+t\Delta x_k.
$$

普通 CCD 可以给出沿当前方向的首次接触 $t^\star$，但如果直接接受

$$
\alpha=t^\star,
$$

新迭代点恰好落在 $F=0$ 上。下一次 Newton 迭代的 CCD 在起点就发现根，返回 TOI $=0$，优化器可能零步长卡死。这里的 $t^\star$ 只是当前搜索方向的边界，不代表整个力学优化已经求解完成。

作者让当前最小距离为 $d_i$，选择：

$$
d=p\,d_i,\qquad0<p<1,
$$

再用 MSCCD 找到首次进入距离 $d$ 的时间。这样每个中间迭代点始终保留正间距，barrier 仍有定义，优化器可以重新计算方向；随着外层迭代：

$$
d_i\to0,\qquad t_i\uparrow t^\star.
$$

这本质上是一个 distance-aware fraction-to-the-boundary 策略。若采用 active-set 并显式管理接触约束，走到 $F=0$ 可以合理；若采用保持严格可行的 barrier line search，中间迭代点通常必须停在接触之前。

---

## 9. 局限与批判性阅读

### 9.1 AABB 丢失联合相关性

八点凸包比 AABB 更紧；AABB 把每个坐标独立取 min/max，会制造实际映射到不了的坐标组合。作者用更多参数域细分换取极便宜、鲁棒的 predicate。false positive 不是偶然 bug，而是这个设计的结构性代价。

### 9.2 “Provably conservative” 有明确前提

保证依赖：

- 三角网格 VF / EE 窄相模型；
- 每个时间步内线性顶点轨迹；
- 与论文误差分析相符的 double 运算顺序；
- 保守 broad phase 没有提前漏掉候选对；
- 实现没有被编译器重排成与误差常数不一致的表达。

它不自动覆盖非线性轨迹、单精度 GPU、任意曲面或不可靠 broad phase。

### 9.3 最小间距不是欧氏距离

Section 6 明确改变了问题定义。$L^\infty$ 很适合盒相交，但具有方向依赖，并可能比同阈值的欧氏距离更保守。若应用中的 $d$ 有严格物理或制造语义，不能把两者混用。

### 9.4 极端退化仍有长尾

方法通过 $m_I$ 把长尾变成“有界时间下的更粗保守答案”，并没有让所有共面、近零案例都在常数时间内精确解决。严格准确和最坏运行时间不能同时无代价获得。

### 9.5 仍然不是 exact CCD answer

本文保证 no false negative，而不是保证 FP $=0$ 或返回代数意义上的精确 TOI。作者也把 expansion arithmetic、更精确的多变量判根、欧氏 MSCCD、非线性轨迹和 GPU 保证列为后续方向。

---

## 10. 最终记忆卡

以后再次看到 Wang et al. 2021，可以用下面十条快速恢复全文：

1. **范围**：线性轨迹三角网格的窄相 VF / EE CCD，不是 broad-phase 全管线；
2. **Benchmark**：handcrafted degeneracy + 约 6000 万 simulation queries，Mathematica exact ground truth；
3. **领域主矛盾**：快、无 FN、少 FP 三者很难同时满足；
4. **两套公式**：multivariate $F(t,u,v)=0$ 直接表示接触；univariate $f(t)=\langle n,q\rangle=0$ 只表示共面候选；
5. **旧骨架**：Snyder 1992 inclusion-based bisection；
6. **新 predicate**：参数盒八角点经过 multi-affine $F$，其凸包包住全部输出，再用最小 AABB $B_F(I)$ 包住凸包；
7. **安全逻辑**：原点不在 $B_F(I)$ 则无根；在盒内只代表不能排除，继续切 $(t,u,v)$；
8. **工程关键**：前向误差过滤、AVX2、输出敏感度切分、按层和时间排序、$\delta/m_I$ 双旋钮；
9. **MSCCD**：把原点替换为 $[-d,d]^3$，即 $L^\infty$ 最小间距；方便但不同于欧氏距离；
10. **仿真意义**：保守 TOI 防穿透；barrier line search 不能总走到 $F=0$，需 MSCCD 留出正间距。

一句话评价：

> 这篇论文最聪明之处，不是提出复杂的新求根公式，而是认出 CCD 多变量函数的八角点结构足以支持一个极便宜的保守谓词，并用一套大规模 exact-ground-truth benchmark 说明这种“旧二分框架 + 新谓词工程”为什么比许多更花哨的快速方法可靠。

---

## 参考与延伸

- Wang, B., Ferguson, Z., Schneider, T., Jiang, X., Attene, M., & Panozzo, D. (2021). *A Large Scale Benchmark and an Inclusion-Based Algorithm for Continuous Collision Detection*. ACM TOG 40(5), Article 188.
- Snyder, J. M. (1992). Interval analysis for computer graphics.
- Provot, X. (1997). Collision and self-collision handling in cloth models.
- Brochu, T., Edwards, E., & Bridson, R. (2012). *Efficient Geometrically Exact Continuous Collision Detection*. ACM TOG 31(4).
- Tang, M. et al. (2014). Bernstein-sign-based exact continuous collision detection.
- Wang, H. et al. (2015). TightCCD / reliable floating-point continuous collision detection.
- Li, M. et al. (2020). *Incremental Potential Contact: Intersection- and Inversion-free, Large-Deformation Dynamics*. ACM TOG 39(4).
