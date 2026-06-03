---
title: "Structure from Motion (SfM)"
date: "2026-06-02"
tags: ["Computer Graphics", "3D Reconstruction", "Computer Vision"]
---

# Structure from Motion (SfM)

**SfM (Structure from Motion)** 是一种从运动中恢复结构的计算机视觉技术。简单来说，就是通过一系列不同视角拍摄的二维图像，自动计算出相机拍摄时的位置、姿态（相机参数），并同时重建出场景的稀疏三维点云。

## 直觉理解

想象你拿着手机绕着一个雕塑拍了一圈照片。SfM 的工作就是：
1. **找特征点**：在每张照片里找到那些独特的点（如角点、边缘）。
2. **匹配**：确定不同照片里的哪些点实际上是空间中的同一个点。
3. **几何推导**：利用“视差”原理——同一个点从不同角度看，在照片上的位置差异反映了距离和相机的相对移动。

最终，SfM 会告诉你：
- 每一张照片拍摄时，手机在三维空间里的精确位置和朝向。
- 雕塑表面一些关键点的三维坐标（稀疏点云）。

## 核心流程

典型的增量式 SfM（Incremental SfM）流程如下：

1. **特征提取与匹配 (Feature Extraction & Matching)**：
   - 使用 SIFT、ORB 等算子提取特征。
   - 在图像对之间进行特征匹配。
2. **几何校验 (Geometric Verification)**：
   - 使用 RANSAC 算法剔除错误的匹配点。
   - 估算基础矩阵（Fundamental Matrix）或本质矩阵（Essential Matrix）。
3. **增量重建 (Incremental Reconstruction)**：
   - **初始化**：选择两个具有良好视差的图像对作为起点，进行三角测量。
   - **影像注册 (Image Registration)**：通过 PnP (Perspective-n-Point) 算法确定新相机的位置。
   - **三角测量 (Triangulation)**：根据已定位的相机，计算更多特征点的三维坐标。
   - **捆绑调整 (Bundle Adjustment, BA)**：这是一个非线性优化过程，同时优化相机参数和点云坐标，以最小化重投影误差（Reprojection Error）。

## 关键输出

- **相机内参 (Intrinsic Parameters)**：焦距、主点坐标、畸变系数。
- **相机外参 (Extrinsic Parameters)**：每张图像在世界坐标系下的 R (旋转) 和 t (平移)。
- **稀疏点云 (Sparse Point Cloud)**：场景中特征点的三维坐标。

## 与 3D Gaussian Splatting (3DGS) 的关系

3DGS 论文中提到 "starting from sparse points produced during camera calibration"，这里的“稀疏点”通常就是由 SfM 产生的。

- **初始化**：3DGS 需要一个好的初始点云来放置高斯椭球（Gaussians）。SfM 提供的稀疏点云是极佳的起点。
- **相机参数**：3DGS 的优化过程需要精确的相机内参和外参，而这些正是 SfM 的直接输出。

**工作流：**
`照片序列` → `SfM (如使用 COLMAP)` → `稀疏点云 + 相机参数` → `3DGS 训练/优化` → `实时渲染的辐射场`

## 常用工具

- **COLMAP**：目前学界和业界最通用的开源 SfM/MVS 框架，3DGS 官方代码默认支持 COLMAP 的输出格式。
- **OpenMVG**：轻量级且模块化的 SfM 库。
- **VisualSFM**：较早期的带有图形界面的 SfM 工具。

## 延伸思考

SfM 得到的是**稀疏点云**，如果需要像模型一样稠密的表面，通常后续会接一个 **MVS (Multi-View Stereo)** 过程。而 3DGS 的出现，某种程度上提供了一种跳过传统 MVS 直接从稀疏点得到高质量渲染效果的新路径。
