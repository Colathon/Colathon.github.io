---
title: "GPU 光栅化渲染管线全解"
date: "2026-06-24"
excerpt: "从 MVP 变换到阴影映射，完整拆解实时渲染的每一个环节：为什么透视除法在 P 矩阵外、Fragment Shader 到底在做什么、法线贴图如何工作、GPU 如何并行光栅化。"
tags: ["Computer Graphics", "GPU", "Rendering"]
---

# GPU 光栅化渲染管线全解

**2026 年 6 月 24 日**

---

## Executive Summary | 核心摘要

实时渲染本质上是把三维世界里的三角形"投影"到二维屏幕并着色的流水线。整个流程分为：把顶点坐标通过 MVP 矩阵变换到屏幕空间（顶点处理）→ 判断三角形覆盖了哪些像素（光栅化）→ 对每个像素运行着色程序决定颜色（片段着色）→ 保留离摄像机最近的像素（深度测试）→ 输出最终图像。阴影、法线贴图等效果是在这条基础管线之上叠加的额外技巧，不属于管线本身。

---

## 0 总览

```
顶点数据（OBJ/VBO）
        |
        v
[ 顶点着色器 (Vertex Shader) ]
   每个顶点并行运行
   · Model 矩阵：局部 → 世界坐标
   · View 矩阵：世界 → 相机坐标
   · Projection 矩阵：相机 → 裁剪坐标（clip space）
        |
        v
[ 透视除法 ]（固定硬件，不可编程）
   clip.xyz / clip.w → NDC [-1,1]³
        |
        v
[ 视口变换 ]
   NDC → 屏幕像素坐标
        |
        v
[ 光栅化 ]
   三角形覆盖测试 → 生成 fragment（像素候选）
   对每个 fragment 插值顶点属性（UV、法线、颜色…）
        |
        v
[ 片段着色器 (Fragment Shader) ]
   每个 fragment 独立运行
   · 采样纹理
   · Blinn-Phong 光照
   · 输出颜色
        |
        v
[ 深度测试 ]
   比较 fragment 深度与 Z-buffer 中已有的值
   胜者保留，更新 Z-buffer 和 Framebuffer
        |
        v
[ 帧缓冲输出到屏幕 ]
```

---

## 1 MVP 变换

渲染时所有顶点坐标都要经过三个矩阵的连乘：

$$
\text{clip} = P \cdot V \cdot M \cdot \text{position\_local}
$$

### 1.1 Model 矩阵（M）

把顶点从**模型自身坐标系**变换到**世界坐标系**。一个模型在场景里的位置、旋转、缩放都编码在 M 里。

### 1.2 View 矩阵（V）

把世界坐标变换到**相机坐标系**（以相机为原点，相机看向 -Z 方向）。本质是把相机的那套坐标轴的逆变换施加到整个世界。

### 1.3 Projection 矩阵（P）

把相机坐标映射到**裁剪坐标（clip space）**。透视投影矩阵会把近大远小的关系编码进 w 分量：

$$
w_{\text{clip}} = -z_{\text{eye}}
$$

注意：P 矩阵本身**不做除法**。它只是把 $z_{\text{eye}}$ 的绝对值存进 $w$ 分量，为下一步做准备。

### 1.4 为什么 Vertex Shader 在 GPU 上跑得快？

因为每个顶点的变换是完全独立的——顶点 A 的计算和顶点 B 的计算没有任何数据依赖。GPU 有成千上万个 Shader Core，可以同时处理所有顶点。一个几万顶点的模型，几乎在一瞬间全部完成 MVP 变换。

---

## 2 透视除法与 NDC

这一步由 GPU **固定硬件**完成，不属于可编程着色器。

$$
\text{NDC} = \frac{\text{clip.xyz}}{\text{clip.w}} = \frac{\text{clip.xyz}}{-z_{\text{eye}}}
$$

**NDC（Normalized Device Coordinates，归一化设备坐标）**是一个 $[-1,1]^3$ 的标准立方体空间。

为什么要这一步？

- 透视投影后，远处物体的坐标 $|z_{\text{eye}}|$ 更大，除以 $w$ 后自然就"缩小了"——这就是近大远小的来源
- NDC 与设备无关：不管屏幕分辨率是 1080p 还是 4K，NDC 坐标都是 $[-1,1]$，后续只需一次视口变换就能适配任意屏幕

透视除法不放进 P 矩阵的原因：矩阵乘法是线性运算，无法表达"除以自身 w 分量"这种非线性操作。硬件在矩阵运算后单独执行这一步。

---

## 3 光栅化

光栅化的任务是：**把三角形转换成一组像素候选（fragment）**。

### 3.1 三角形覆盖测试

对屏幕上的每个像素中心，判断它是否在三角形内部。具体方法是计算像素点对三角形三条边的有符号面积，全部同号则在内部。

### 3.2 重心坐标插值

像素一旦被判定在三角形内部，它的顶点属性（UV 坐标、法线、颜色等）就通过**重心坐标**插值得到：

$$
f(P) = \lambda_1 f(A) + \lambda_2 f(B) + \lambda_3 f(C), \quad \lambda_1+\lambda_2+\lambda_3=1
$$

其中 $\lambda_i$ 是点 P 对三个顶点的权重，由面积比确定。

透视正确插值：在透视投影下，屏幕空间的线性插值不等于三维空间的线性插值，GPU 会自动用 $1/z$ 权重修正（透视除法已经完成，所以 $z$ 已知）。

### 3.3 光栅化是流式的，不存储覆盖图

光栅化不会预先扫描所有三角形并生成一张"哪个像素被哪些三角形覆盖"的全局表——这张表存下来会占用大量内存，也没必要。

实际流程是**流式**的：三角形一个一个流进来，对每个三角形立即生成 fragment，立即送给 Fragment Shader 处理，立即做深度测试，写入 Z-buffer 和 Framebuffer。处理完这个三角形再处理下一个，中间不保留覆盖信息。

---

## 4 深度测试与 Z-buffer

### 4.1 Z-buffer 机制

GPU 维护一张与屏幕等大的**深度缓冲区（Z-buffer）**，初始值为最远深度（通常 1.0）。每个 fragment 处理完后：

1. 取出该像素在 Z-buffer 里存储的深度 $d_{\text{stored}}$
2. 比较当前 fragment 的深度 $d_{\text{current}}$
3. 如果 $d_{\text{current}} < d_{\text{stored}}$：更新 Z-buffer，写入颜色到 Framebuffer
4. 否则：丢弃该 fragment

这样无论三角形以何种顺序送入，最终每个像素保留的一定是最近的那个面。Z-buffer 让渲染顺序不影响正确性。

### 4.2 Early-Z 优化

标准管线顺序是：Fragment Shader → 深度测试。但这意味着一个最终被遮挡的像素也跑完了整个 Fragment Shader，浪费算力。

**Early-Z** 是 GPU 的硬件优化：如果 Fragment Shader 里没有写 `gl_FragDepth`（修改深度）、也没有 `discard`（提前丢弃），GPU 可以在 Fragment Shader **之前**先做深度测试——通过测试的 fragment 才进入 Shader，被遮挡的直接丢弃。

```
有 Early-Z 时：
  深度测试（提前） → Fragment Shader（只跑胜者）→ 写入 Framebuffer

没有 Early-Z 时（有 discard 或 gl_FragDepth）：
  Fragment Shader → 深度测试 → 写入 Framebuffer
```

---

## 5 Fragment Shader：每个 Fragment 独立运行

Fragment Shader 是**每个 fragment 独立跑一次**，而不是"每个像素把所有三角形信息融合后跑一次"。

如果三角形 A 和三角形 B 都覆盖了像素 (100, 200)，那么这个像素的 Fragment Shader 会被执行**两次**：一次处理 A 的 fragment，一次处理 B 的 fragment。两次执行完全独立，各自输出一个颜色，然后由深度测试决定哪个写入 Framebuffer。

Fragment Shader 能拿到的信息：
- 从顶点插值过来的 UV 坐标、法线、世界坐标等
- 采样纹理（包括法线贴图、Shadow Map）
- uniform 变量（光源位置、时间等全局参数）

Fragment Shader 输出的是这个 fragment 的颜色，而不是屏幕颜色——屏幕颜色由深度测试在所有竞争者中选出最终胜者决定。

---

## 6 Blinn-Phong 光照模型

Fragment Shader 里最常见的着色模型：

$$
L = L_a + L_d + L_s = k_a I_a + k_d I(\boldsymbol{n}\cdot\boldsymbol{l}) + k_s I(\boldsymbol{n}\cdot\boldsymbol{h})^p
$$

其中 $I$ 是光源强度（标量或 RGB，**不是矩阵**），$I_a$ 是环境光强度，$k_a, k_d, k_s$ 是材质的三个响应系数，三项求和即为该像素最终输出的颜色。

| 分量 | 物理含义 | 与视角的关系 |
|------|----------|------------|
| $k_a I_a$ | 环境光，防止全黑 | 无关 |
| $k_d I(\boldsymbol{n}\cdot\boldsymbol{l})$ | 漫反射，朝向光源更亮 | 无关 |
| $k_s I(\boldsymbol{n}\cdot\boldsymbol{h})^p$ | 镜面高光 | 有关（$\boldsymbol{h}$ 含视线方向 $\boldsymbol{v}$） |

$\boldsymbol{h} = \text{normalize}(\boldsymbol{l}+\boldsymbol{v})$ 是光源方向与视线方向的**半程向量**。

### 6.1 为什么 p 越大高光越锐利？

$\boldsymbol{n}\cdot\boldsymbol{h} \in [0,1]$，p 越大整体值确实变小。但关键是**不同角度的衰减速率不同**：

| 偏离角 | $p=1$ | $p=10$ | $p=100$ |
|--------|-------|--------|---------|
| 正对（$\boldsymbol{n}\cdot\boldsymbol{h}=0.99$）| 0.99 | 0.90 | 0.37 |
| 偏 $15°$（$\approx 0.97$）| 0.97 | 0.74 | 0.05 |
| 偏 $30°$（$\approx 0.87$）| 0.87 | 0.25 | 0.000017 |

p 增大后，偏离方向的值比正对方向下降快得多。高光的"有效区域"急剧收窄，视觉上从大片泛光变成一个小亮点——这就是锐利。可以同时调大 $k_s$ 来补回正对方向的亮度。

---

## 7 法线贴图（Normal Mapping）

### 7.1 问题来源：几何法线的精度瓶颈

一个三角形只有 3 个顶点，法线只能在这三点之间插值，表面看起来永远是光滑平面。如果要表现砖缝、皮革纹理、螺丝头，就需要把对应区域细分成几百万个三角形——代价极高。

**法线贴图的思路：几何不动，法线单独存一张图。**

一个覆盖屏幕 500×500 像素的大三角形，可以从 250,000 个独立法线里采样，每个像素都有自己的法线，光照结果就不一样，视觉上看起来有凹凸感，但几何体仍然是一个平面。

### 7.2 高多边形与低多边形

- **高多边形（High-poly）**：几百万个三角形，每块砖、每条缝都有真实几何，法线变化丰富
- **低多边形（Low-poly）**：几千个三角形，轮廓大致正确，表面光滑无细节

制作流程：
1. 先建高多边形精细模型
2. 再建低多边形简化版（轮廓相同）
3. **烘焙（Bake）**：对低多边形上每个纹理像素，向高多边形投射射线，记录对应位置的真实法线，存入纹理
4. 渲染时：低多边形做几何，但 Fragment Shader 采样法线贴图替代插值法线

### 7.3 为什么法线贴图是蓝紫色的？

法线是 $(n_x, n_y, n_z) \in [-1,1]^3$，图像文件只能存 $[0,255]$，所以：

$$
\text{RGB} = \frac{\boldsymbol{n}+1}{2} \times 255
$$

大多数法线贴图存的是**切线空间（Tangent Space）**下的法线，其中法线朝外对应 $(0,0,1)$，映射成 RGB 就是 $(128,128,255)$——蓝色。这与"颜色"完全无关，只是向量数据借用图像格式存储。

Fragment Shader 采样法线贴图后，需要用 **TBN 矩阵**（切线-副切线-法线构成的坐标变换）把切线空间法线变换回世界空间，才能代入 Blinn-Phong 计算。

---

## 8 阴影映射（Shadow Mapping）

Shadow Mapping **不在基础渲染管线之内**——基础管线只做局部光照（Blinn-Phong），完全不管"光到这个点之间有没有遮挡"。Shadow Mapping 是额外的两遍渲染技巧。

### 8.1 第一遍：从光源视角渲染，生成 Shadow Map

把"摄像机"放在光源位置，完整跑一遍渲染管线，但**只输出深度值**，不输出颜色。结果是一张**深度纹理（Shadow Map）**，存储的是"从光源看，每个方向最近的表面在哪"。

### 8.2 第二遍：正常渲染，Fragment Shader 里查询 Shadow Map

对每个 fragment，把它的世界坐标转换到光源的裁剪空间，得到：
- $(u,v)$：对应 Shadow Map 上的位置
- $d_{\text{current}}$：该点从光源看的深度

然后采样 Shadow Map 得到存储的最近深度 $d_{\text{shadow}}$：

- $d_{\text{current}} \approx d_{\text{shadow}}$：这个点就是光源能直接照到的最近面 → **有光**
- $d_{\text{current}} > d_{\text{shadow}}$：有物体挡在更近处 → **在阴影里**，关闭 $L_d$ 和 $L_s$

```
第一遍（Shadow Pass）
  场景 → 渲染管线（光源视角）→ Shadow Map（深度纹理）

第二遍（Main Pass）
  Shadow Map ↘
  场景 → 渲染管线（相机视角）→ Fragment Shader 里查 Shadow Map → 最终颜色
```

Shadow Map 分辨率有限，直接比较会有精度问题（Shadow Acne），通常加一个小偏移量（bias）来规避。

---

## 9 GPU 如何并行光栅化

光栅化看似存在依赖关系（Z-buffer 写入），但 GPU 通过硬件设计实现了大规模并行。

### 9.1 哪里可以并行

- **不同三角形覆盖不同像素**：完全独立，可以同时处理
- **同一三角形覆盖的不同像素**：Fragment Shader 完全独立，GPU 以 32~64 个 fragment 为一组（warp/wavefront）并行执行 SIMD 指令

### 9.2 Z-buffer 的竞争条件如何解决

当两个三角形覆盖**同一个像素**时，Z-buffer 的读-比较-写是潜在的竞争。GPU 通过专用硬件单元 **ROP（Render Output Unit）** 解决：ROP 对每个像素位置的深度操作做原子化处理，同一像素的并发写入串行化，不同像素的操作完全并行。

### 9.3 Tile-Based 架构（移动端）

ARM Mali、Apple GPU 等移动端架构把屏幕切成小 Tile（如 16×16 像素）：
1. 收集所有三角形，按覆盖的 Tile 分类
2. 每个 Tile 独立分配给不同核心并行处理
3. Tile 内部的 Z-buffer 保留在片上高速缓存里，处理完整个 Tile 才写回内存

不同 Tile 之间没有任何依赖，是完美的并行。同时减少了大量带宽（Z-buffer 不需要反复读写主内存）。

---

## 相关链接

- [DDPM：去噪扩散概率模型核心原理](/wiki/ddpm)
- [Volume Rendering & 3DGS](/wiki/volume-rendering-3dgs)
- [Computer Graphics](/wiki?tag=Computer+Graphics)
