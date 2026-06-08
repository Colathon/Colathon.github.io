---
title: "CUDA Parallel Computing"
date: "2026-05-26"
tags: ["Parallel Computing", "GPU", "CUDA", "NVIDIA", "High-Performance Computing"]
---

# CUDA 并行计算笔记

## 一、什么是 CUDA

CUDA（Compute Unified Device Architecture）是 NVIDIA 于 2006 年推出的并行计算平台和编程模型。核心思想是让开发者用类 C 语言直接调度 GPU 上的大量核心并行工作。

### CPU vs GPU 的设计哲学

| | CPU | GPU |
|---|---|---|
| 核心数量 | 少（几个到几十个） | 海量（几千个） |
| 单核性能 | 极强 | 较弱 |
| 控制逻辑 | 复杂（乱序执行、分支预测） | 极简（共享给多个 Thread） |
| 缓存 | 大（MB 级） | 小（KB 级共享内存） |
| 适合任务 | 复杂逻辑、低延迟串行 | 大量同构并行计算 |

GPU 的设计选择：**砍掉每个 Thread 的独立控制单元，把省出来的芯片面积全部塞满算术单元**，以此换取极高的并行吞吐量。

---

## 二、执行层次结构

CUDA 的并行组织从大到小分为四层：

```
Grid（网格）
 └── Block（线程块）× N
      └── Warp（线程束）× M        ← 硬件执行单位
           └── Thread（线程）× 32
```

### Thread（线程）

- 最小执行单位，干一件具体的事
- 有自己私有的寄存器
- 通过内置变量 `threadIdx`、`blockIdx` 知道自己负责哪部分数据

### Block（线程块）

- 一组 Thread 的团队，通常 128～1024 个 Thread
- **同一 Block 内的 Thread 可以互相通信**：共享一块片上 SRAM（共享内存），可以用 `__syncthreads()` 同步
- Block 边界 = 一个 SM 的管辖范围
- **Block 之间完全独立，无法通信**

### Warp（线程束）

- Block 里的 Thread 每 32 个打成一组
- **真正并行执行的最小单位**：32 个 Thread 同一时刻执行完全相同的指令，各自处理不同数据
- 这种模型叫 **SIMT（Single Instruction Multiple Threads）**
- Warp 切换是零开销的（每个 Warp 有专属寄存器，无需保存/恢复状态）

### Grid（网格）

- 一次 Kernel 调用产生的所有 Block 的集合
- 覆盖整个计算任务

---

## 三、调度机制

工作分配分两层：

1. **程序员（CPU 侧）定规模**：调用 Kernel 时写死 Grid/Block 的尺寸
   ```cpp
   myKernel<<<gridDim, blockDim>>>(参数);
   // 例如：<<<(1024,1,1), (256,1,1)>>>
   // 1024 个 Block，每个 Block 256 个 Thread
   ```

2. **GPU 硬件自主调度**：GPU 内的 **GigaThread Engine** 自动将 Block 分配给空闲 SM，CPU 不再介入

### SM（流式多处理器）

- GPU 的核心计算单元，包含若干 CUDA Core、共享内存、Warp 调度器
- 一个 SM 可同时持有多个 Block，当某个 Warp 等待内存时自动切换到另一个 Warp

---

## 四、内存层次

从快到慢：

| 层级 | 位置 | 延迟 | 容量 | 作用域 |
|---|---|---|---|---|
| 寄存器 | SM 片上 | ~1 cycle | 极小 | 单个 Thread 私有 |
| 共享内存 | SM 片上 | ~几 cycle | ~数十 KB/SM | Block 内 Thread 共享 |
| L1/L2 缓存 | 片上 | 中 | MB 级 | 自动管理 |
| 全局内存（显存）| 片外 DRAM | ~几百 cycle | GB 级 | 所有 Thread 可访问 |

> **性能优化的核心**：尽量把频繁访问的数据放到共享内存，减少全局内存访问次数。

---

## 五、Warp 延迟隐藏

GPU 访问显存需要几百个 cycle，如果傻等就会大量浪费。

**Warp 调度器的做法**：

1. Warp 0 发出内存请求，进入等待状态
2. 立刻切换到 Warp 1 执行计算
3. Warp 1 也等内存时，切换到 Warp 2
4. Warp 0 的数据回来后，再切回来继续

因为 SM 上所有活跃 Warp 的寄存器都物理常驻在硬件寄存器文件（Register File）中，切换时只需调度器更新指针指向不同的寄存器组，无需像 CPU 那样进行上下文的保存与恢复，因此是真正的零开销。SM 上同时驻留大量 Warp，就能让计算核心始终保持满载。

> **延伸概念：Occupancy（占用率）**
> 寄存器文件容量是固定的。如果每个 Thread 使用的寄存器过多，SM 能同时驻留的 Warp 数量就会下降，导致掩盖延迟的能力减弱。调优的目标之一就是在寄存器使用量与活跃 Warp 数量（Occupancy）之间取得平衡。

---

## 六、Warp Divergence（束分歧）

SIMT 的代价：如果 Warp 内 Thread 走了不同分支，GPU 必须串行执行两条路径。

```cpp
// 危险代码：Warp 内一半 Thread 走 if，一半走 else
if (threadIdx.x % 2 == 0) {
    doSomething();   // 偶数 Thread 执行，奇数空转
} else {
    doOtherThing();  // 奇数 Thread 执行，偶数空转
}
// 吞吐量砍半
```

GPU 不适合逻辑复杂、分支多的任务的根本原因就在于此。

---

## 七、相关生态

- **cuBLAS**：线性代数运算库
- **cuDNN**：深度神经网络加速库
- **cuFFT**：快速傅里叶变换库
- **PyTorch / TensorFlow**：底层调用 cuDNN/cuBLAS，间接依赖 CUDA

---

## 八、完整示例：矩阵乘法（8×8）

用 **C = A × B**（A、B 均为 8×8 矩阵）说明所有层级的分工。

### 问题划分

结果矩阵 C 有 64 个格子，每个格子独立计算：`C[row][col] = Σ A[row][k] * B[k][col]`（k=0..7）

### Grid / Block / Thread 的划分

```
Grid:  2×2 = 4 个 Block
Block: 每个 Block 4×4 = 16 个 Thread，负责 C 的一个 4×4 区域
Thread: 每个 Thread 负责 C 的一个格子
```

```
C 矩阵（8×8）的 Block 划分：
┌─────────────┬─────────────┐
│  Block(0,0) │  Block(0,1) │   ← 各负责 C 的 4×4 区域
│  SM0 执行   │  SM1 执行   │
├─────────────┼─────────────┤
│  Block(1,0) │  Block(1,1) │
│  SM2 执行   │  SM3 执行   │
└─────────────┴─────────────┘
```

### CUDA Kernel 代码（朴素版）

```cpp
__global__ void matmul(float* A, float* B, float* C, int N) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;  // 全局行号
    int col = blockIdx.x * blockDim.x + threadIdx.x;  // 全局列号

    if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
            sum += A[row * N + k] * B[k * N + col];  // 点积
        }
        C[row * N + col] = sum;
    }
}

// 调用方式
dim3 blockDim(4, 4);       // 每个 Block：4×4 = 16 个 Thread
dim3 gridDim(2, 2);        // Grid：2×2 = 4 个 Block
matmul<<<gridDim, blockDim>>>(A, B, C, 8);
```

### Warp 在这里做什么

Block(0,0) 有 16 个 Thread，被切成：

```
Warp 0：Thread(0,0) ~ Thread(3,3) — 16 个 Thread（不足 32，实际补满或视为半个 Warp）
```

> 实际生产中 Block 通常设为 16×16=256 个 Thread，切成 8 个完整 Warp，
> 每个 Warp 32 个 Thread 同时计算 32 个不同格子的点积，
> 对所有 Thread 广播同一条指令：`sum += A[row][k] * B[k][col]`，
> 只是各自的 row/col 不同。

**Warp 延迟隐藏的关键时刻**：

```
时刻 1: Warp0 执行 sum += A[0][0] * B[0][col]（寄存器操作，极快）
时刻 2: Warp0 需要读取 A[0][1]，发出显存请求，等待中...
时刻 2: → 立刻切换 Warp1，执行它的乘加
时刻 3: Warp1 也等内存 → 切换 Warp2
时刻 N: A[0][1] 数据到了 → 切回 Warp0 继续
```

结果：k 从 0 循环到 7 的 8 次内存读取，全部被其他 Warp 的计算掩盖，**核心始终满载**。

### 共享内存优化版（Tiled MatMul）

```cpp
#define TILE 4

__global__ void matmul_tiled(float* A, float* B, float* C, int N) {
    __shared__ float tileA[TILE][TILE];  // Block 内共享
    __shared__ float tileB[TILE][TILE];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;
    float sum = 0.0f;

    // 分轮次载入 tile，逐块累加
    for (int t = 0; t < N / TILE; t++) {
        // 每个 Thread 负责搬运一个元素到共享内存
        tileA[threadIdx.y][threadIdx.x] = A[row * N + (t * TILE + threadIdx.x)];
        tileB[threadIdx.y][threadIdx.x] = B[(t * TILE + threadIdx.y) * N + col];

        __syncthreads();  // 等所有 Thread 搬完再计算

        for (int k = 0; k < TILE; k++) {
            sum += tileA[threadIdx.y][k] * tileB[k][threadIdx.x];
        }

        __syncthreads();  // 计算完再进入下一轮
    }

    C[row * N + col] = sum;
}
```

**优化效果**：每个 tile 只从显存读一次，Block 内 16 个 Thread 全部复用。
显存访问量从 `O(N³)` 降到 `O(N³ / TILE)`，tile 越大越省。

### 各层级分工总结

```
Grid        → 覆盖整个 8×8 结果矩阵，4 个 Block 并行
Block       → 负责 4×4 子区域，Thread 间共享内存，协作搬运 tile
Warp        → 32 个 Thread 同时执行同一条乘加指令，切换掩盖内存延迟
Thread      → 计算 C 矩阵中的一个格子（一次完整的点积）
```

---

## 相关链接
- [OpenMP Parallel Programming](/wiki/openmp)
