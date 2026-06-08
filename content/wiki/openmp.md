---
title: "OpenMP Parallel Programming"
date: "2026-05-26"
tags: ["Parallel Computing", "C++", "Performance", "High-Performance Computing"]
---

# OpenMP 笔记

## 什么是 OpenMP

OpenMP（Open Multi-Processing）是一套用于**共享内存并行编程**的 API，支持 C、C++ 和 Fortran。

核心模型是 **fork-join**：主线程遇到并行区域时派生出多个线程，并行执行后再汇合。

---

## 基本使用方式

### `#pragma` 是给编译器的指令

`#pragma omp [指令名]` 本身不是普通代码，**默认作用于紧跟在它后面的那一条语句**，不需要大括号。

```c
// 没有大括号：只作用于下一行（for 循环）
#pragma omp parallel for
for (int i = 0; i < 10; i++) {
    printf("%d\n", i);
}

// 有大括号：作用于整个块
#pragma omp parallel
{
    printf("线程 %d\n", omp_get_thread_num());
    做其他事();
}
```

这和 `if` 不加括号只管下一行的逻辑完全一样。

---

## `parallel` 和 `for` 是两个不同的指令

```
#pragma omp parallel for
```

- **`parallel`**：创建一组线程（比如 4 个）
- **`for`**：把循环的迭代次数**拆分**给这些线程

**两者必须同时写，缺一不可：**

| 写法 | 效果 |
|------|------|
| `#pragma omp parallel` | 每个线程都完整跑一遍整个循环，重复执行 |
| `#pragma omp parallel for` | 循环被拆分，每个线程只跑自己那一段 ✅ |

例：循环 100 次、4 个线程：
```
线程0：i = 0~24
线程1：i = 25~49
线程2：i = 50~74
线程3：i = 75~99
```

编译时加 `-fopenmp`：
```bash
gcc -fopenmp program.c -o program
```

---

## 数据依赖问题

### OpenMP 不会检测依赖关系

如果循环的每一轮依赖前面的结果（如斐波那契）：

```c
for (int i = 2; i < 100; i++) {
    arr[i] = arr[i-1] + arr[i-2];  // 依赖前面的结果
}
```

强行加 `parallel for` 的结果：
- 线程2 去算 `arr[50]` 时，`arr[49]` 可能还没被线程1 算出来
- 结果**直接错误**，OpenMP 不报任何警告

### 两个选择

1. **不并行**：有依赖的循环直接串行跑，OpenMP 帮不了
2. **重新设计算法**：把依赖关系拆成独立阶段，阶段内并行、阶段间串行同步（需具体分析，没有通用方案）

> `parallel for` 只适合**每次迭代之间互相独立**的循环。

---

## 指定线程数

### 三种方式

```c
// 方式1：代码里设置
omp_set_num_threads(4);

// 方式2：pragma 里直接指定
#pragma omp parallel for num_threads(4)

// 方式3：环境变量（运行前）
export OMP_NUM_THREADS=4
```

优先级：`num_threads()` > `omp_set_num_threads()` > 环境变量

---

## 核、超线程与线程数的关系

### 概念区分

| 概念 | 说明 |
|------|------|
| 物理核（Core） | 真正独立的硬件计算单元 |
| 硬件线程（超线程） | 一个核模拟出的多个逻辑处理器，**共享**核内缓存和执行单元 |
| 软件线程 | OpenMP 创建的执行流，由操作系统调度到硬件线程上 |

OpenMP 指定的是**软件线程数**，具体跑在哪个核上由操作系统调度，OpenMP 管不到这层。

### 超线程对性能的影响

以 4核8线程 CPU 为例，开 8 个 OpenMP 线程不一定比开 4 个快：

- **计算密集型**：两个软件线程抢同一个核的执行单元，开**物理核数（4）**往往更优
- **内存/IO 密集型**：一个线程等内存时另一个可以继续算，超线程才有价值

### 绑定到具体核（可选）

```bash
export OMP_PROC_BIND=true     # 绑定线程，防止系统乱调度
export OMP_PLACES=cores       # 绑定到物理核（不用超线程）
export OMP_PLACES=threads     # 绑定到所有逻辑线程（含超线程）
```

> 想精确控制"线程X跑在核Y上"，需要用 `pthread_setaffinity_np()`，已超出 OpenMP 范围。

### 实际建议

先跑默认（OpenMP 默认用最大逻辑线程数），再试只用物理核数，对比性能选更快的。没有万能答案，取决于任务类型。

---

## 适用场景

- 科学计算、数值模拟
- 图像 / 信号处理
- 矩阵运算
- 快速并行化已有串行代码

## 与其他并行技术对比

| | OpenMP | MPI | [CUDA](/wiki/cuda) |
|---|---|---|---|
| 内存模型 | 共享内存 | 分布式内存 | GPU 显存 |
| 适用硬件 | 多核 CPU | 多节点集群 | NVIDIA GPU |
| 编程难度 | 低 | 中 | 高 |
| 扩展性 | 单机 | 跨节点 | 单机 GPU |

---

## 相关链接
- [CUDA Parallel Computing](/wiki/cuda)
