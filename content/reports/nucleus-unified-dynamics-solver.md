---
title: "Nucleus: Towards a Unified Dynamics Solver for Computer Graphics"
date: "2026-08-06"
excerpt: "精读 Jos Stam 2009 年对 Maya Nucleus 的系统总结：用混合维度单纯复形统一点、线、面和体，用长度、角度、二面角及碰撞约束代替高刚度弹簧，再以顺序 Gauss–Seidel、交错调度和时空碰撞检测组成一个面向生产的统一动力学求解器。"
tags: ["Computer Graphics", "Physical Simulation", "Collision Detection", "Constraint Solver"]
---

# Nucleus: Towards a Unified Dynamics Solver for Computer Graphics —— 阅读报告

> Jos Stam
>
> *11th IEEE International Conference on Computer-Aided Design and Computer Graphics*, pp. 1–11, 2009
>
> [论文 PDF](https://www.research.autodesk.com/app/uploads/2023/03/nucleus-towards-a-unified.pdf_recHmh6P57XrpUS8l.pdf) · [作者说明](https://www.josstam.com/publications) · [DOI](https://doi.org/10.1109/CADCG.2009.5246818)

---

## 0. 先给结论：以后提到 Nucleus，应当想起什么

Nucleus 不是一篇只解决某个局部数值问题的算法论文，而是 Maya 商业动力学求解器的系统概览。它试图解决的问题是：刚体、布料、曲线、粒子等专用求解器各自工作良好，但彼此交互时容易产生单向耦合和顺序偏差，能否让它们共享表示、约束接口和时间步调度？

最值得记忆的主线是：

~~~text
点、边、三角形、四面体
        ↓
混合维度单纯复形：统一拓扑表示
        ↓
所有动力学自由度集中在顶点 x ∈ R^(3N)
        ↓
拉伸、剪切、弯曲、压力、刚性、碰撞都写成约束
        ↓
沿约束梯度做一次局部 Newton 修正
        ↓
以 nonlinear Gauss–Seidel 反复处理约束
        ↓
按 importance 与 order 交错调度不同约束类型
        ↓
用 space-time collision 检测补上帧间碰撞
~~~

本文真正应当留下的不是某个独立公式，而是四个设计判断：

1. **统一的关键是共同的底层自由度与约束接口，而不是为每种现象维护一个封闭求解器。**
2. **对近乎不可拉伸的材料，与其使用极硬弹簧，不如直接求解几何约束。**
3. **局部约束修正不满足交换律，调用次数与调用顺序本身就是求解器的一部分。**
4. **生产系统可以选择固定计算预算和近似响应，但必须明确它牺牲了什么精确性。**

---

## 1. 论文的出发点：为什么需要统一求解器

传统物理动画系统常按现象划分：

- 刚体由刚体求解器负责；
- 布料由质量—弹簧或有限元求解器负责；
- 粒子、毛发、流体又有各自的数据结构与积分器。

单个模块并不一定有问题，真正困难的是双向作用。例如足球撞上球网时：

- 球必须推动网；
- 网必须反作用于球；
- 碰撞响应会改变后续形变；
- 形变又会产生新的碰撞。

若先完整求球、再把球的位置交给布料求解器，网对球的作用可能延迟一帧；若改变模块顺序，又会得到另一种结果。Nucleus 的目标是把这些作用放进同一个固定时间步内反复协调。

这里的 unified 不应理解为“所有物理现象拥有完全相同的方程”。更准确地说，它统一了三个层次：

| 层次 | 统一内容 |
|---|---|
| 表示 | 点、线、面、体都由顶点和 simplices 组成 |
| 接口 | 各种现象都以约束模块参与求解 |
| 调度 | 所有模块共享同一个时间步和交错迭代序列 |

论文的设计哲学是 complexity through simple constraints：复杂行为不必由一个庞大模型直接编码，而可以从许多简单约束的竞争中涌现。例如旗帜飘动可以来自风的 drag/lift、不可拉伸约束和弯曲约束之间的作用，而不必完整求解高精度空气流场。

---

## 2. Shape Model：用单纯复形统一几何对象

### 2.1 四种基本 simplex

$k$-simplex 由 $k+1$ 个顶点组成：

| $k$ | 元素 | 常见用途 |
|---:|---|---|
| 0 | point | 粒子、网格顶点 |
| 1 | segment | 绳、毛发、网格边 |
| 2 | triangle | 布料和一般曲面 |
| 3 | tetrahedron | 三维体积材料 |

单纯复形是这些元素按面关系拼成的集合：一个 simplex 的所有低维面也属于复形，两个 simplices 的交集若非空，应当是它们共同的面。三角网格可视为二维单纯复形；Nucleus 进一步允许孤立点、边、三角形和四面体混合存在。

论文引用 simplicial approximation theorem 只是为了说明分片线性单形具有足够强的表达能力。它不是后续动力学或碰撞算法的正确性基础，也不需要为理解 Nucleus 证明该定理。

### 2.2 拓扑与几何分离

Nucleus 的 topology 模块只保存整数关系：

~~~cpp
class simplex {
    int k;
    int sign;
    int vertex[k + 1];
    int child[k + 1];
    int n_parents;
    int parent[n_parents];
};
~~~

- `vertex`：构成该 simplex 的顶点索引；
- `child`：它的 $(k-1)$ 维面，例如三角形的三条边；
- `parent`：包含它的高维 simplex，例如一条边两侧的三角形；
- `sign`：顶点排序相对原方向的奇偶性，用于维护 orientation。

真正的空间几何另存为顶点坐标：

$$
x_i(t)\in\mathbb R^3.
$$

因此同一份拓扑 $K$ 可以在不同时间拥有不同几何形状：

$$
\boxed{K\text{ 决定连接关系},\qquad x(t)\text{ 决定当前形状}.}
$$

这个分离带来三个直接收益：

1. 动力学只需推进顶点，不必为每种高维元素维护另一套状态；
2. parent/child 邻接可以用于生成拉伸、角度、弯曲和碰撞约束；
3. 同一套拓扑查询能够覆盖曲线、表面、体积及非流形连接。

---

## 3. Dynamics：状态、能量与简单弹簧

### 3.1 为什么是 $3N$ 维

若系统有 $N$ 个三维顶点，把所有位置摊平成：

$$
\mathbf x
=
(x_1^x,x_1^y,x_1^z,\ldots,x_N^x,x_N^y,x_N^z)^T
\in\mathbb R^{3N}.
$$

速度 $\mathbf v=\dot{\mathbf x}$、加速度和速度修正 $\Delta\mathbf v$ 也都是 $3N$ 维。高维 simplex 不增加独立自由度，它们只通过顶点关系产生能量或约束。

更一般的运动方程是：

$$
M\ddot{\mathbf x}
=
-\nabla U_{\mathrm{int}}(\mathbf x)
+F_e.
$$

论文假设单位质量，将 $M$ 省略，并把内部势能 $U_{\mathrm{int}}$ 记为 $f(x)$。需要区分：

$$
[U_{\mathrm{int}}]=\text{能量},
\qquad
[\nabla U_{\mathrm{int}}]=[F_e]=\text{力}.
$$

论文随后给出的总能量式和“每个时刻最小化总能量”的说法较为松散。若前式中的 $F_e$ 表示恒定物理外力，对应外部势能应为 $-F_e^Tx$；连续动力学对应的是作用量驻值，而不是逐时刻最小化机械能。这些记号不影响后文约束求解主线，但不应作为严格变分推导使用。

### 3.2 单位弹簧展示三种积分器的长期行为

一般一维弹簧满足：

$$
m\ddot x=-kx,
\qquad
\ddot x=-\omega^2x,
\qquad
\omega=\sqrt{k/m}.
$$

论文进一步取 $m=k=1$，得到：

$$
\ddot x=-x.
$$

精确能量为：

$$
E=\frac12v^2+\frac12x^2.
$$

因此状态 $(x,v)$ 在相空间中沿圆运动。令复数 $z=x+iv$，则：

$$
\dot z=-iz,
\qquad
z(t)=z_0e^{-it},
$$

也就是精确时间推进只旋转状态，不改变半径。

三种离散方法的区别可以压缩成下表：

| 方法 | 更新 | 能量表现 |
|---|---|---|
| 显式 Euler | $x_1=x_0+hv_0,\ v_1=v_0-hx_0$ | 每步乘 $1+h^2$，向外螺旋 |
| 隐式 Euler | 在下一状态计算右端并联立求解 | 每步除以 $1+h^2$，向内螺旋 |
| 辛 Euler | $v_1=v_0-hx_0,\ x_1=x_0+hv_1$ | 原能量有界振荡，保持修改后的能量 |

辛 Euler 的更新矩阵为：

$$
A=
\begin{pmatrix}
1&-h\\
h&1-h^2
\end{pmatrix},
\qquad
\det A=1.
$$

其特征多项式为：

$$
\lambda^2-(2-h^2)\lambda+1.
$$

与旋转矩阵的 $\lambda^2-2\cos\theta\lambda+1$ 比较：

$$
\cos\theta=1-\frac{h^2}{2}.
$$

恢复一般频率后，稳定条件为：

$$
\boxed{h\omega<2}
\qquad\Longleftrightarrow\qquad
h<2\sqrt{m/k}.
$$

所以辛积分改善了长期结构，却没有消除高刚度问题：$k$ 越大，仍然需要越小的时间步。这正是下一节放弃 stiff springs、改用 hard constraints 的动机。

---

## 4. Deformations as Constraints：三种基础几何约束

Nucleus 不用一个极大的 $k$ 惩罚变形，而直接要求：

$$
C(x)=0.
$$

弹簧惩罚与硬约束的关系可以写成：

$$
\underbrace{U(x)=\frac12kC(x)^2}_{\text{有限刚度惩罚}}
\quad\longrightarrow\quad
\underbrace{C(x)=0}_{\text{直接施加约束}}.
$$

### 4.1 Type 1：长度约束

$$
C_{1,(i,j)}(x)
=
\|x_j-x_i\|-l_{ij}.
$$

它保持一条边的目标长度，主要抵抗 stretch。三角形包含三条此类约束，四面体包含六条。

### 4.2 Type 2：方向夹角约束

定义单位方向：

$$
d_{ij}
=
\frac{x_j-x_i}{\|x_j-x_i\|}.
$$

约束两条相邻边的夹角：

$$
C_{2,(i,j,k)}(x)
=
\cos^{-1}(d_{ij}\cdot d_{ik})-\gamma_{kji}.
$$

同一个公式的物理解释随维度变化：

- 对一维曲线，它是相邻线段的 bending；
- 对二维三角形，它控制内部角度，表现为 shear；
- 对三维 simplex，它控制内部方向关系。

### 4.3 Type 3：法向夹角约束

定义三点产生的单位法向：

$$
n_{ijk}
=
\frac{d_{ij}\times d_{ik}}
{\|d_{ij}\times d_{ik}\|}.
$$

共享边 $(i,j)$ 的两个三角形可用二面角约束：

$$
C_{3,(i,j,k,l)}(x)
=
\cos^{-1}(n_{ijk}\cdot n_{jil})-\theta_{lkji}.
$$

对三角网格，它是典型的布料弯曲约束；对曲线和更高维元素，则可解释成 twist 或更高阶方向控制。

这三类公式中的归一化与 $\arccos$ 在零长边、退化三角形以及接近 $0/\pi$ 的夹角处条件很差。论文没有展开退化处理；实际实现通常需要阈值、替代表达或直接约束点积/余弦。

### 4.4 统一并不局限于形变

Nucleus 还把以下效果放进约束框架：

- drag、lift 与风向；
- 封闭或开放网格的压力；
- 刚体约束；
- 碰撞与自碰撞；
- point-to-surface；
- 粒子不可压缩约束。

统一的重点不是这些约束具有相同物理意义，而是求解器可以用共同协议调用它们。

---

## 5. 从全局非线性系统到局部 Gauss–Seidel

### 5.1 时间步结束时满足约束

假设当前外力已经给出速度 $v$。无约束预测位置为：

$$
\widehat x=x+hv.
$$

加入速度修正 $\Delta v$ 后，时间步结束位置为：

$$
x_{mathrm{new}}
=x+h(v+\Delta v)
=\widehat x+h\Delta v.
$$

Nucleus 希望：

$$
\boxed{C(\widehat x+h\Delta v)=0.}
$$

其中 $C:\mathbb R^{3N}\rightarrow\mathbb R^m$ 堆叠了 $m$ 个标量约束。

### 5.2 一次全局线性化

在 $\widehat x$ 处进行 Taylor 展开：

$$
C(\widehat x+h\Delta v)
\approx
C(\widehat x)+hJ(\widehat x)\Delta v,
$$

因此：

$$
\boxed{J\Delta v=-\frac1hC(\widehat x).}
$$

按通常 Jacobian 约定：

$$
J\in\mathbb R^{m\times3N}.
$$

论文写成 $3N\times m$，但若方程为 $J\Delta v=b$，矩阵必须是 $m\times3N$；可以将原文理解为梯度按列存储时漏写了转置。

在单位质量、约束可满足且矩阵满行秩时，最小范数修正可通过：

$$
JJ^Ty=b,
\qquad
\Delta v=J^Ty
$$

获得。LSQR/CGLS 则允许只提供 $Jp$ 与 $J^Tq$ 的矩阵—向量乘法。

问题在于长度、角度与二面角约束都是非线性的。一阶模型仅在当前状态附近可靠；时间步或约束违反较大时，一次全局线性解可能严重偏离真正约束面。

### 5.3 每次只处理一个约束

对第 $k$ 个约束，令当前预测状态为 $q=x+hv$，选择修正方向 $d$：

$$
f(\alpha)
=
c_k(q+\alpha d)
=0.
$$

通常取 $d=\nabla c_k(q)$，因为梯度垂直于约束面，是一阶意义下改变约束值最快的方向。以 $\alpha=0$ 做一次 Newton 修正：

$$
\alpha
=
-\frac{f(0)}{f'(0)}
=
-\frac{c_k(q)}{\nabla c_k(q)^Td}.
$$

若 $d=\nabla c_k$：

$$
\boxed{
\delta q
=
-\frac{c_k(q)}{\|\nabla c_k(q)\|^2}
\nabla c_k(q)
}.
$$

对应速度修正为 $\delta v=\delta q/h$。一般质量下应使用：

$$
\delta q
=
-\frac{c_k(q)}
{\nabla c_k^TM^{-1}\nabla c_k}
M^{-1}\nabla c_k,
$$

使质量大的顶点移动较少，固定顶点的逆质量为零。

Nucleus 每次访问一个约束只做一次 Newton，而不是把它解到机器精度。原因是后续约束仍会修改共享顶点；在单个约束上过度求精没有意义。更有效的策略是立即写回状态，让下一个约束看到最新结果，再通过多次 sweep 逐渐协调。这就是 nonlinear Gauss–Seidel。

---

## 6. Unified Solver：importance、order 与交错调度

约束投影一般不满足交换律：

$$
P_A(P_B(x))\ne P_B(P_A(x)).
$$

例如 collision 把顶点推出柱子后，stretch 可能又把它拉回柱子；若先 stretch 再 collision，虽然没有穿透，柱子附近的边却可能被显著拉长。因此“处理哪些约束”还不够，必须规定“各处理几次、以什么顺序处理”。

Nucleus 给每个约束类型两个调度参数：

| 参数 | 含义 |
|---|---|
| importance $I$ | 一个时间步中该类型获得多少次求解机会 |
| order $O$ | 同一调度槽中不同类型的先后顺序 |

最直接的非交错调度会整行执行：

~~~text
Bend × 9
Shear × 7
Stretch × 26
Self-Collision × 7
Collision × 6
~~~

它会让后面的整块调用覆盖前面结果。Nucleus 改为按列交错：令最大 importance 决定槽数，把每一类的调用大致均匀地分散在这些槽中；每一列内部再按 order 从上到下调用，最后一列保证所有类型都获得一次机会。

~~~cpp
for (slot : time_step_slots) {
    for (type : types_sorted_by_order) {
        if (scheduled(type, slot)) {
            type.solve_one_pass();
        }
    }
}
~~~

这样 collision 和 stretch 会反复交换最新状态，误差更容易分散到整件物体，而不是集中在最后被修改的局部。它减少但没有消除顺序偏差；importance、order、时间步、网格分辨率和遍历次序仍会共同影响表观刚度与最终结果。

核心求解器不需要理解约束内部。自定义模块只需提供求解回调、importance 和 order，即可插入指定类型之后。这种插件式调度是 Nucleus 作为商业库的重要工程特征；代价是立即写回的 Gauss–Seidel 依赖顺序，不易全局并行化。

---

## 7. Collisions：从端点重叠到时空检测

### 7.1 碰撞是单边约束

形变通常要求：

$$
C_{\mathrm{deform}}(x)=0.
$$

碰撞只禁止穿透，因此间隙函数满足：

$$
\boxed{C_{\mathrm{collision}}(x)\ge0.}
$$

若只在时间步末检查重叠，高速物体可能从障碍物一侧直接移动到另一侧，起点和终点都合法，中途却已穿透；开放布料也没有明确 inside/outside。Nucleus 因此检查整个时间步内的线性轨迹：

$$
p(\tau)
=(1-\tau)p^0+\tau p^1,
\qquad
\tau\in[0,1].
$$

### 7.2 一维：相对顺序的一次根

两个粒子的相对位置为：

$$
V_0=b_0-a_0,
\qquad
V_1=b_1-a_1.
$$

因为 $V(\tau)=(1-\tau)V_0+\tau V_1$ 是一次函数，若端点异号，碰撞时间为：

$$
\boxed{\tau=\frac{V_0}{V_0-V_1}.}
$$

响应可以在完全弹性与完全非弹性之间插值。若碰撞前后法向相对速度为 $u^-,u^+$，恢复系数形式为：

$$
u^+=-e u^-,
\qquad
0\le e\le1.
$$

### 7.3 二维：Point–Edge

对运动点 $p(\tau)$ 与运动边 $a(\tau)b(\tau)$，定义有符号面积：

$$
A(\tau)
=
\operatorname{cross}
\bigl(b(\tau)-a(\tau),p(\tau)-a(\tau)\bigr).
$$

$A(\tau)$ 至多为二次多项式。求得 $A(\tau_*)=0$ 只说明点和边的支撑直线共线，还要检查：

$$
p(\tau_*)
=
a(\tau_*)+s\bigl(b(\tau_*)-a(\tau_*)\bigr),
\qquad
0\le s\le1.
$$

### 7.4 三维：Vertex–Face 与 Edge–Edge

两类查询都可以用四点有符号体积构造共面条件。

VF：

$$
V_{\mathrm{VF}}(\tau)
=
\det(b-a,c-a,p-a).
$$

EE：

$$
V_{\mathrm{EE}}(\tau)
=
\det(b-a,c-a,d-a).
$$

在线性顶点轨迹下，三个向量都关于 $\tau$ 仿射，因此 $V(\tau)$ 至多是三次多项式。共面根仍只是候选：

- VF 需要检查点的三角形重心坐标非负；
- EE 需要检查两条有限线段参数均在 $[0,1]$。

论文将一维端点符号逻辑直接写成高维早退：若 $V(0)V(1)>0$ 就停止。但二次、三次函数可以在同号端点之间拥有两个根或一个偶重根，因此这个条件不能作为一般的安全排除规则。可靠实现必须隔离区间内的全部候选根，并处理切触、恒等共面、退化图元和浮点误差。

### 7.5 厚度把次数提高到六次

加入半径或厚度后，接触条件从严格相交变成距离达到阈值。论文列出的最高多项式次数为：

| 图元对 | 最高次数 |
|---|---:|
| point–point | 2 |
| point–edge | 4 |
| point–triangle | 6 |
| edge–edge | 6 |

六次来源于点—平面或线—线距离中的标量三重积：线性运动下该量最高三次，平方并清除距离分母后最高六次。论文明确承认实根计算与数值精度非常棘手，却将具体处理留在范围之外。

### 7.6 Broad phase 与固定步长响应

Nucleus 先用层次包围结构剔除不可能相交的图元对，再对候选执行昂贵窄相测试：

- 有稳定拓扑的 simplicial complex 使用 k-DOP tree；
- 无结构粒子系统使用 spatial hash，避免频繁构建层次拓扑。

对于连续检测，包围体必须覆盖整个时间步内的 swept primitives，而不仅是起点或终点。

一种精确事件式模拟会不断找全局最早 TOI、把整个系统推进到该时刻、处理碰撞，再求剩余时间。它在大量碰撞下成本很高，还可能遇到 Zeno 现象：恢复系数小于 1 的球可以在有限时间内反弹无限次。

Nucleus 选择固定时间步：顺序处理检测到的碰撞，但不为每个事件反复推进全局时钟；当所有碰撞暂时解决或达到最大迭代数即停止。它计算量有界、不易锁死，却明确是一种近似，且结果会受到碰撞处理顺序影响。

---

## 8. 工程实现与论文贡献应怎样评价

Nucleus 最初从一个烟雾—布料 demo 发展而来，随后替换 Maya 原布料求解器，并逐渐扩展到 nCloth 与 nParticle。论文强调核心库相对 Maya 代码库很小，并通过稳定 API 隔离底层求解器与上层产品。

这段历史说明它的优先级不是推导一个统一、全局最优的物理离散，而是：

- 约束模块易于添加；
- 不同对象能够双向互动；
- 固定计算预算下不容易爆炸或卡死；
- 艺术家能够通过参数得到稳定、可控的效果；
- 底层修改不破坏 Maya 上层接口。

因此这篇论文的主要贡献更接近 architecture + design philosophy，而不是一套可逐行复现的完整算法。它展示了统一表示、局部约束求解、交错调度和时空碰撞怎样组合成真实产品，但省略了大量决定实际鲁棒性的细节。

---

## 9. 批判性阅读：哪些结论不能读得太满

### 9.1 这是一篇 overview，不是完整复现说明

作者自己将其称为 extended abstract。论文没有完整给出：

- 质量、阻尼、摩擦与材料参数的全部形式；
- 每种约束的退化处理和软化规则；
- importance 调度的精确生成公式；
- 碰撞根求解的数值鲁棒实现；
- 收敛判据、误差界和复杂度分析。

因此读者能重建系统骨架，却不能仅靠这 11 页复现 Maya Nucleus。

### 9.2 统一接口不等于统一物理原理

拉伸、风、压力、碰撞和刚性都能进入同一调度器，不代表它们来自同一个一致的能量或互补系统。importance 和 order 是很实用的工程控制，却也让结果依赖迭代预算与模块排列。

### 9.3 稳定不等于准确

固定时间步、有限迭代和隐式/约束式修正能够避免爆炸与锁死，但可能引入：

- 数值阻尼或能量误差；
- 约束残差；
- 顺序偏差；
- 时间步和网格相关的表观材料参数；
- 与严格事件顺序不同的碰撞响应。

“生产中稳定”与“物理或几何上精确”是两项不同指标。

### 9.4 碰撞部分不能直接作为鲁棒实现

高次多项式求根细节被明确省略；端点同号排除对二次、三次函数不成立；恒等共面、偶重根、退化边和有限精度也没有系统讨论。Section 7 应被理解为 collision pipeline 的结构说明，而不是经过证明的窄相算法。

### 9.5 实验评价以演示为主

论文结果主要依赖 Maya 产品应用、动画和实时 demo，没有提供现代论文常见的：

- 与基线的统一性能表；
- 约束残差和能量误差；
- 穿透率与失败案例；
- 不同时间步、网格分辨率下的收敛研究。

商业落地证明了方法实用，却不能替代定量实验。

---

## 10. 最终记忆卡

以后再次看到 Stam 2009 的 Nucleus，可以用下面十条恢复全文：

1. **目标**：解决布料、粒子、曲线等专用求解器彼此交互时的耦合和顺序问题；
2. **表示**：点、边、三角形、四面体统一为混合维度 simplicial complex；
3. **自由度**：$N$ 个三维顶点组成 $x\in\mathbb R^{3N}$，高维元素只提供拓扑与约束；
4. **积分动机**：显式 Euler 加能量，隐式 Euler 过度耗散，辛 Euler 长期结构较好但仍要求 $h\sqrt{k/m}<2$；
5. **核心转变**：用 $C(x)=0$ 直接表达不可拉伸、剪切和弯曲，而不是令弹簧 $k$ 极大；
6. **三类约束**：边长、两方向夹角、两法向二面角，同一公式在不同 simplex 维度有不同物理解释；
7. **局部求解**：预测 $\widehat x=x+hv$，沿单约束梯度做一次 Newton 修正，以 nonlinear Gauss–Seidel 多次 sweep；
8. **调度**：importance 决定调用次数，order 决定同槽顺序；按列交错约束可减轻但不能消除顺序偏差；
9. **碰撞**：碰撞是单边约束；时间步内线性轨迹的二维 point–edge 为二次问题，三维 VF/EE 共面条件为三次，厚度可升至六次；
10. **定位**：这是一个成功商业求解器的架构总结，强项是简单模块的组合与可控性，弱项是数学、数值和实验细节不足。

一句话评价：

> Nucleus 最有价值的思想不是某个单独约束或碰撞公式，而是把混合维度几何、局部约束投影、调用调度和时空碰撞组织成一个小而可扩展的统一运行时，并诚实地以有限预算下的稳定近似换取商业生产中的可用性。

---

## 参考与延伸

- Stam, J. (2009). *Nucleus: Towards a Unified Dynamics Solver for Computer Graphics*. CAD/Graphics 2009, pp. 1–11.
- Müller, M., Heidelberger, B., Hennix, M., & Ratcliff, J. (2006). *Position Based Dynamics*. VRIPhys 2006, pp. 71–80.
- Bridson, R., Fedkiw, R., & Anderson, J. (2002). *Robust Treatment of Collisions, Contact and Friction for Cloth Animation*. ACM TOG 21(3), pp. 594–603.
- Provot, X. (1995). *Deformation Constraints in a Mass-Spring Model to Describe Rigid Cloth Behavior*. Graphics Interface 1995, pp. 147–154.
- Goldenthal, R., Harmon, D., Fattal, R., Bercovier, M., & Grinspun, E. (2007). *Efficient Simulation of Inextensible Cloth*. ACM TOG 26(3).
