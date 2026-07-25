---
title: "Planar Maps: An Interaction Paradigm for Graphic Design"
date: "2026-07-25"
excerpt: "精读 Baudelaire 与 Gangnet 在 CHI 1989 提出的 planar-map 绘图范式：从独立 path 与图层叠放出发，引入显式 vertex-edge-face、draw/erase/color 三种 map-sketching 原语，并分析图层歧义、局部编辑、交点重建、source-path provenance 与属性传播问题。"
tags: ["Computer Graphics", "Vector Graphics", "Planar Maps", "HCI"]
---

# Planar Maps: An Interaction Paradigm for Graphic Design —— 阅读报告

> Patrick Baudelaire, Michel Gangnet, CHI 1989, pp. 313-318
>
> [论文 PDF](https://www.lri.fr/~mbl/ENS/FONDIHM/2014/papers/Baudelaire-CHI89.pdf)

---

## 0. 先给结论：这篇论文真正提出了什么

这篇论文不是在发明平面图论，也不是在详细说明 DCEL、求交算法或数值鲁棒性。它的贡献是一个**交互与对象模型**：

1. 经典矢量绘图把文档组织成独立的 paths，再按图层前后叠放；
2. 但设计者经常真正关心的是 paths 共同围成的区域，以及区域之间共享的边界；
3. 因此作者把一个复杂矢量对象表示成 planar map，显式暴露 vertices、edges 和 faces；
4. 用户在同一张 map 上反复执行 drawing、edge erasing 和 face coloring，逐步构造复杂图案；
5. 经典 path 模型没有被删除，而是作为 map paradigm 的子集保留；path 与 map 通过 `insert` 和 `extract` 往返。

最简模型是：

```text
Document
└── rendering layers（决定前后顺序）
    ├── classical path object
    └── planar map object
        ├── vertices
        ├── edges
        └── faces
```

这篇论文最有价值的地方不是 `vertex-edge-face` 三个名词，而是它非常早地识别出：**source paths 与它们诱导的 regions 是两种不同、却都需要保留的对象身份。**

---

## 1. 出发点：四条线，还是一个矩形？

论文开头画了两对平行线。视觉上，人可以同时作两种解释：

```text
解释 A：四条相互独立的线

    ────────────
    │          │
    │          │
    ────────────

解释 B：一个可以选择、填色和移动的矩形区域
```

经典 path 软件通常只知道最初创建的四条线。即使它们恰好围成矩形，数据结构里也不一定存在一个名为“矩形内部”的对象，因此用户不能直接点击内部区域并填色。

问题不在于软件是否能最终画出一个填色矩形，而在于：

> 当前数据模型是否把设计者正在感知和操作的对象显式表示出来？

四条线可以重新绘制成一个 rectangle template，也可以执行 Boolean、join 或重新构造闭合 path；但这些都是绕过原表示的间接操作。论文希望让“线”和“线围出的区域”同时成为一等编辑对象。

---

## 2. 先统一术语：stroke、path、map、layer

这篇论文的术语带有 1989 年软件语境，最容易产生混淆。下面采用一个统一层级。

### 2.1 Stroke：一次连续绘制输入

用户从落笔到抬笔产生一条轨迹，可写成参数曲线：

$$
s:[0,1]\rightarrow\mathbb R^2.
$$

论文中的 stroke 主要指这条输入轨迹，而不是现代软件中单指颜色、宽度、虚线样式的 stroke appearance。

### 2.2 Path：保存下来的曲线对象

一次 stroke 通常生成一个 path。Path 可以：

- open 或 closed；
- 由 line segments、polyline 或 spline 构成；
- 由 template 参数定义，也可以由一串控制点定义；
- 带有 stroke、fill、texture 等渲染属性。

PostScript path 还可以通过多次 `moveto` 包含多个 subpaths。它能表达多个断开部分或 compound contour，但其中的区域仍主要由 fill rule 推导，并没有自动变成显式 faces。

### 2.3 Map：同一平面内的曲线分区

把多条 strokes 插入同一张 map 后，端点、拐角和交点成为 vertices；相邻 vertices 之间的曲线段成为 edges；平面被 edges 划分成 faces。

采用现代记号，可以写成：

$$
M=(V,E,F,A),
$$

其中 $A$ 保存 edge stroke、face fill 等属性。

一条 stroke 不等于一条 map edge。若一条 stroke 被其他曲线穿过三次，它会被切成四条 edges：

```text
source stroke

────────────────────────

insert into map

────●──────●────●────────
 e1    e2     e3    e4
```

### 2.4 Layer：前后合成位置

Layer 解决的是“谁覆盖谁”，不是“区域怎样划分”。论文采用 $2\frac12$D rendering layering：几何仍是二维的，但对象具有前后顺序。

在论文的简化模型中，一个 layer 放置一个主要对象：

```text
Layer 3  →  Map M
Layer 2  →  Path P
Layer 1  →  background path
```

因此 map 与 layer 不是同类概念：**map 是内容和拓扑，layer 是容器及其 z-order。**

---

## 3. 经典绘图范式：它强在哪里，又缺在哪里

经典系统的永久对象通常是独立 paths。它们支持两类编辑。

### 3.1 Global editing

对整个对象执行：

- erase；
- move；
- copy；
- transform；
- group；
- 改变 layer order。

### 3.2 Shape-specific editing

不同 path 类型使用各自的内部参数：

- rectangle、circle、oval 等 template 使用 bounding-box handles；
- polyline 编辑 vertices；
- spline 编辑 knots；
- Bézier path 编辑 anchors 和 control handles。

三次 Bézier 曲线由四个控制点定义：

$$
B(t)
=(1-t)^3P_0
+3(1-t)^2tP_1
+3(1-t)t^2P_2
+t^3P_3,
\qquad 0\le t\le1.
$$

$P_0,P_3$ 是端点，$P_1,P_2$ 通常不在曲线上，而是控制端点切向：

$$
B'(0)=3(P_1-P_0),
\qquad
B'(1)=3(P_3-P_2).
$$

经典范式非常适合独立对象的变形和前后叠放，但对“共享边界”和“由多条 path 共同围成的 region”缺乏直接表示。

---

## 4. 两个失败案例：为什么独立 paths 不够

### 4.1 Jigsaw puzzle：共享边界被重复保存

目标是用任意曲线把一个形状分成两块。经典做法往往要构造两个闭合 paths：

```text
left closed path     right closed path
        ╲             ╱
         ╲ shared    ╱
          boundary
```

分隔曲线必须在两个对象中各保存一份，并保持完全一致。修改一边而没有同步另一边，就会出现裂缝或重叠。

Planar map 中只保存一条 separator edge，左右两个 faces 同时引用它：

$$
F_L \mid_e F_R.
$$

### 4.2 Collage and masking：目标形状只是渲染假象

如果软件只能方便地创建椭圆、矩形和简单 paths，用户可能先画完整椭圆和圆，再用背景色矩形、椭圆遮住不需要的部分。

```text
stored objects
= complete ellipses
+ background-colored masks
+ layer order

visible result
= a small irregular contour
```

最终轮廓并没有作为真实 path 存在；移开遮罩就会看到完整原对象。Map sketching 则可以在交点处真正拆分 edges，再删除不需要的局部边段，使目标形状成为实际拓扑，而不是遮挡结果。

---

## 5. Map sketching：draw、erase、color

作者把 map 的基本交互压缩成三个原语：

$$
\boxed{\text{draw}+\text{erase edge}+\text{color face}}.
$$

它们模拟在一张透明纸上使用笔、橡皮和颜料。

### 5.1 Draw：把新 stroke 插入 map

插入一条 stroke 时需要：

1. 计算它与已有 edges 的交点；
2. 在所有交点创建 vertices；
3. 拆分新旧 edges；
4. 更新 boundary cycles；
5. 创建、分裂或调整 faces。

例如给矩形加入一条 separator：

```text
before                    after

┌───────────┐             ┌────●──────┐
│           │             │    │      │
│    F      │      →      │ F1 │  F2  │
│           │             │    │      │
└───────────┘             └────●──────┘
```

若 separator 在同一 face 的边界上连接两个位置，它把一个 face 分成两个。对于连通 plane graph，可用 Euler 关系作简单检查：

$$
|V|-|E|+|F|=2.
$$

### 5.2 Erase edge：删除交点之间的局部边段

擦除的基本单位不是整条 source stroke，而是相邻 vertices 之间的一条 edge。

若 edge 分隔两个不同 faces，删除它会合并区域：

$$
F_1\mid_e F_2
\longrightarrow
F_1\cup F_2.
$$

若 edge 是 dangling branch 或两侧属于同一 face，删除它不会合并两个不同区域。

### 5.3 Color face：给显式区域附加属性

Face 可以由多条不同 strokes 的片段共同围成。填充附着在 face 上，而不是必须附着在某条原始 closed path 上。

Drawing、erasing 和 coloring 可以任意交替：

```text
draw → color → draw → erase → color → ...
```

论文强调的闭包性质是：

$$
\text{valid map}
\xrightarrow{\text{simple graphical operation}}
\text{valid map}.
$$

它没有在本文中给出鲁棒实现细节，但把“每一步仍是可编辑 map”确立为交互契约。

---

## 6. 从原语组合出的高级操作

论文用多个图例说明，复杂命令可以作为基本 map rewrites 的宏。

### 6.1 Cleaning：移除 dangling edges

从 degree-1 endpoints 开始递归删除悬空边，直到不再产生新的 leaves：

```text
raw construction graph         cleaned cyclic core

────┬──╲                            ╭──╮
    │   ╲           →              ╲  ╱
────┴────                          ╱  ╲
```

它与递归 leaf stripping 或 graph 2-core 的思想相近。论文的目标是删除不参与闭合图案的施工线尾部。

### 6.2 Outlining：提取外轮廓

删除内部 separators，仅保留所选非透明区域之并的外边界：

$$
\partial\left(\bigcup_i F_i\right).
$$

复杂的内部交叉网络因此变成一个 outer contour。

### 6.3 Cutting / punching

用开放或闭合 contour 与 map 求交，再根据选择删除一侧、保留轮廓内部分或挖去内部区域。与 clipping mask 不同，结果会真实更新 vertices、edges 和 faces。

### 6.4 Construction lines

设计者可以先画过长的平行线、对角线、圆和辅助定位线；交点自动切分 edges；最后擦除不属于目标轮廓的边段。这把传统尺规施工流程直接搬进矢量编辑器。

---

## 7. 论文案例真正说明了什么

### 7.1 Logo 与 op-art

对于依赖相交轮廓、局部填色和黑白交错的图案，map sketching 允许：

```text
draw complete construction curves
→ obtain explicit faces
→ erase selected edge segments
→ color selected faces
```

用户不必事先把每块黑色区域分别构造成闭合 path。

### 7.2 伪三维图与 hidden-line removal

论文用灯具线框演示：先画椭圆、灯罩边线和支架，再手工擦除应被遮挡的 edge segments，最后给 faces 填色。

这里必须注意：

> Planar map 不理解三维，也不会自动判断 visibility。

它只提供“删除两个交点之间这段边”的方便操作。哪条线属于 silhouette、crease、occlusion boundary 或 hidden segment，仍由用户或上游三维算法决定。

因此对于 3D vector illustration，合理管线是：

```text
3D geometry + camera + visibility
                ↓
projected curves with provenance
                ↓
arrangement / planar map
                ↓
2D region editing or simplification
```

---

## 8. Layering：同样的像素，不同的对象分解

图形编辑中的歧义不可完全消除。两个重叠圆可以被解释为同一 map 中的两条曲线，也可以是两个独立 layers。

| 表示 | 交点 | Regions | 编辑行为 |
|---|---|---|---|
| 同一 map | 成为 vertices | 产生显式 faces | 移动曲线会重建 map |
| 两个 layers | 只是视觉重叠 | 没有共享 face | 两个对象独立移动 |

把整个文档强制做成一张 map 虽然能减少对象歧义，却会把所有视觉重叠都解释成拓扑相交，破坏独立对象和遮挡关系。因此作者保留 multi-object layering。

### 8.1 两种创建模式

经典模式中，每个新对象占据新的 layer；map-sketching 模式中，用户反复在当前 layer 的同一张 map 上增加 strokes。

UI 因而需要：

1. 在 standard path drawing 与 map sketching 间切换；
2. 创建空白 map layer；
3. 回到已有 layer，编辑其中的 path 或 map。

### 8.2 一张 map 可以有多个 connected components

两个断开的图形在经典范式中通常是两个对象；一张 planar map 却可以包含多个不连通 components。作者以岛屿和大陆为比喻：几何上不连接，不代表不能属于同一张地图。

这也导致不可从像素判断的歧义：

```text
one map with two components
vs.
two maps with one component each
```

渲染可能相同，但整体选择、移动和 layer order 不同。

### 8.3 无限透明纸的物理隐喻

作者建议把一张 map 理解为无限透明纸，在部分 faces 上绘制颜色：

- unbounded outer face 是透明的；
- hole 是透明 face；
- 一张纸可以包含多个分离 components；
- 多张纸按 layer order 合成。

这个模型清楚易懂，但也带来限制：同一 map 的所有 components 相对于其他 layers 共享一个全局深度顺序。若一个 component 应在对象 $B$ 前面、另一个应在 $B$ 后面，就必须拆分 maps 或引入局部 layering。

---

## 9. Editing a Map：几何拖动为什么会改变拓扑

移动一个 vertex 并让 incident edges 像橡皮筋一样伸缩，看似是普通几何操作，但移动后的 edges 可能穿过其他 edges。

普通 polyarc 可以保存未显式切分的自交；planar map 则要求最终每个交叉都成为 vertex：

```text
invalid as an embedded map      valid map

╲  ╱                            ╲  ╱
 ╳                   →           ●
╱  ╲                            ╱  ╲
```

因此一次 vertex drag 可能触发：

- 新交点 vertices 的创建；
- 旧 vertices 的消失；
- 多条 edges 的拆分或合并；
- faces 的 split、merge、appear、disappear；
- fill 和其他属性的重新对应。

这与网格中的普通 vertex relocation 不同：后者通常保持 combinatorial connectivity，只检查翻面和自交；planar-map 变形可能直接改变 $V,E,F$。

---

## 10. Extract、edit、reinsert：保留两层对象身份

论文提出一种干净的编辑策略：

1. 从 map 中提取一串 edges；
2. 暂时将它们作为普通 polyarc path；
3. 使用经典控制点工具自由编辑；
4. 编辑完成后重新插入 map；
5. 重新求交、切边并建立 faces。

形式化地：

$$
M
\xrightarrow{\operatorname{extract}}
(M\setminus P,P)
\xrightarrow{\operatorname{edit}}
(M\setminus P,P')
\xrightarrow{\operatorname{insert}}
M'.
$$

最后一页的总结图表达了一个双表示架构：

```text
CLASSICAL DRAWING                         MAP DRAWING

template / polyarc tools                 map-sketching tools
          ↓                                      ↓
        paths  ───────── insert ─────────────→  maps
        paths  ←──────── extract ─────────────  maps
          ↺                                      ↺
classic path editing                       local map editing
```

Map paradigm 包含 classical paradigm，而不是将其替换。

---

## 11. 编辑 constituent path：provenance 与属性传播

论文进一步要求：即使原始 path 插入 map 后已被交点切分、部分 edges 又被擦除，用户仍应能够选择并移动最初的 template 或 polyarc。

例如一条横线穿过三角形：

```text
source objects

     /\
────/──\────
   /____\

visible map after trimming

     /\
    /──\
   /____\
```

可见 map 只剩三角形内部的 separator，但系统若要允许“移动原始横线”，必须知道这条 separator 来自哪条 source path。

因此仅保存当前 DCEL 不够，还需要 provenance：

$$
\text{map edge}
\longrightarrow
(\text{source path},\text{parameter interval}).
$$

移动 source path 后，系统重算 arrangement，并尝试把旧 face attributes 传给新 faces。

困难在于对应关系不总唯一：

- 一个 face 可能 split 成多个 faces；
- 多个 faces 可能 merge；
- 小 face 可能出现或消失；
- 新旧边界的来源关系可能变化。

可使用面积重叠、包含测试、边界 provenance 或用户提示建立 correspondence，但论文只指出问题，没有给出完整算法。

这揭示了动态 planar map 的核心架构：

```text
source geometry
├── templates
├── polylines
└── Bézier paths
        ↓ arrangement / rebuild
derived topology
├── vertices
├── split edges
└── faces + attributes
```

---

## 12. 论文做到了什么，没有做到什么

### 12.1 真正贡献

- 把 planar map 从后台计算结构提升为用户可直接操作的绘图对象；
- 用 draw、erase edge、color face 建立简洁且可组合的交互原语；
- 说明 path/layer 与 map/cell 两种抽象必须共存；
- 很早就识别出 source-object identity、局部拓扑编辑与属性传播问题；
- 给出 classical paths 与 maps 之间 `insert/extract` 的统一框架。

### 12.2 本文没有解决

- 曲线 arrangement 的具体算法与复杂度；
- 退化交点、重合曲线、近切触等鲁棒性问题；
- DCEL 或其他数据结构的实现细节；
- face correspondence 的一般解；
- 局部深度顺序、透明度、混合模式和非流形重叠；
- 自动 hidden-line removal；
- 简化目标、误差度量或 progressive hierarchy。

论文自身把增量计算问题交给同年的后续工作。工程实现时应继续阅读 [Incremental Computation of Planar Maps](https://www.bitsavers.org/pdf/dec/tech_reports/PRL-RR-1.pdf)；现代“保留 source paths、动态重算 regions”的路线可对照 Illustrator Live Paint 与 [Dynamic Planar Map Illustration](https://research.adobe.com/publication/dynamic-planar-map-illustration/)。

---

## 13. 与 topology-changing progressive 3D vector illustration 的关系

### 13.1 已经被这篇论文覆盖的部分

下面这些不能单独作为新的研究贡献：

- 用 vertices、edges、faces 表示二维矢量图；
- 让两个 faces 共享一条 edge；
- 删除 separator 并合并 regions；
- 从 paths 构造 planar map；
- 在 map 与 source paths 之间保持某种往返编辑。

### 13.2 仍然开放的部分

当前课题更关心：

- 自动而不是手工地选择 topology-changing operations；
- 除 separator deletion 外，允许 face collapse 到 edge/vertex、junction rerouting 等操作；
- 每个中间结果保持合法 embedded map；
- 同时约束 curve、region、junction、visibility 和 semantic distortion；
- 保存可逆 operation records，形成 nested progressive hierarchy；
- 维护从 3D feature curves 到二维 edges/faces，再到各 LoD cells 的 provenance；
- 在近退化投影输入上保证组合一致性。

可以把目标抽象为局部 cavity rewrite：

$$
(K,\partial K,A_K)
\longrightarrow
(K',\partial K',A_{K'}),
$$

其中 $\partial K$ 固定局部操作与外部 map 的接口，$A_K$ 表示几何、区域及语义属性。每次 rewrite 需要同时给出：

- precondition；
- combinatorial update；
- geometric update；
- attribute propagation；
- validity check；
- inverse refinement record。

### 13.3 从本文继承的最重要问题

真正需要继承的不是 1989 年的 UI，而是它揭示的双重身份：

```text
original 3D / projected source curves
                    ↓
current planar-map cells
                    ↓
simplified cells at each LoD
```

如果只保存当前 map，就会丢失 3D provenance；如果只保存 source paths，就无法稳定表达 regions；如果只保存若干独立 simplification snapshots，又无法得到可逆 progressive hierarchy。

---

## 14. 最终心智模型

读完这篇论文，可以用下面五句话概括：

1. **Stroke 是一笔输入，path 是保存下来的曲线对象。**
2. **同一 map 内的 paths 会在交点处分裂，形成 vertices、edges 和 faces。**
3. **Layer 决定 map/path 对象之间的前后顺序；map 与 layer 不是同一类东西。**
4. **经典 path 编辑和 map-cell 编辑必须共存，insert/extract 是二者之间的桥。**
5. **动态编辑最难的不是重新画线，而是 topology correspondence、provenance 与 attribute propagation。**

从今天看，这是一篇短小但非常准确的问题定义论文：它没有给出完整的计算几何系统，却把后来 Live Paint、动态 planar maps、topology-aware vector editing 会反复遇到的核心矛盾提前说清楚了。

---

## 参考与延伸

- Patrick Baudelaire, Michel Gangnet. [Planar Maps: An Interaction Paradigm for Graphic Design](https://www.lri.fr/~mbl/ENS/FONDIHM/2014/papers/Baudelaire-CHI89.pdf). CHI 1989.
- Michel Gangnet, Jean-Claude Hervé, Thierry Pudet, Jean-Manuel Van Thong. [Incremental Computation of Planar Maps](https://www.bitsavers.org/pdf/dec/tech_reports/PRL-RR-1.pdf). SIGGRAPH 1989.
- Paul Asente, Michael Schuster, Teri Pettit. [Dynamic Planar Map Illustration](https://research.adobe.com/publication/dynamic-planar-map-illustration/). SIGGRAPH 2007.
- Boris Dalstein, Rémi Ronfard, Michiel van de Panne. [Vector Graphics Complexes](https://www.borisdalstein.com/research/vgc/). SIGGRAPH 2014.
