---
title: "神经网络的数学架构：仿射变换与流形逼近"
date: "2026-05-07"
excerpt: "从数学视角深入探讨神经网络的底层原理。涵盖层级仿射映射、非线性激活的拓扑意义、以及基于多元微积分链式法则的误差反向传播过程。"
tags: ["Neural Networks", "Mathematics", "Machine Learning"]
---

# 神经网络的数学架构：仿射变换与流形逼近

这份笔记旨在为具有数学背景的读者（如数学系学生）提供神经网络的严谨描述。我们将抛弃生物学比喻，将神经网络视为一个由参数化的算子复合而成的函数族。

---

## 1. 定义：作为函数逼近器的神经网络

从泛函分析的角度看，一个 $L$ 层的深度神经网络（Deep Neural Network, DNN）是一个复合映射 $f_\theta: \mathbb{R}^{d_{in}} \to \mathbb{R}^{d_{out}}$，其形式如下：

$$ f_\theta = \mathcal{A}_L \circ \sigma \circ \mathcal{A}_{L-1} \circ \sigma \circ \dots \circ \sigma \circ \mathcal{A}_1 $$

其中：
*   $\mathcal{A}_l(\mathbf{x}) = W^{(l)}\mathbf{x} + \mathbf{b}^{(l)}$ 是第 $l$ 层的**仿射变换（Affine Transformation）**。
*   $W^{(l)} \in \mathbb{R}^{n_l \times n_{l-1}}$ 是权重矩阵，$\mathbf{b}^{(l)} \in \mathbb{R}^{n_l}$ 是偏置向量。
*   $\sigma: \mathbb{R} \to \mathbb{R}$ 是逐元素作用的**非线性激活函数（Activation Function）**。
*   $\theta = \{W^{(l)}, \mathbf{b}^{(l)}\}_{l=1}^L$ 是模型的所有待求参数，位于高维欧氏空间 $\Theta$ 中。

### 1.1 结构变体：单隐层网络 (Single Hidden Layer)
单隐层神经网络是深度学习的基石，常被称为“浅层神经网络”。其数学表达为两次仿射变换与一次非线性的复合：

$$ f(\mathbf{x}) = \mathcal{A}_2 \circ \sigma \circ \mathcal{A}_1(\mathbf{x}) $$

*   **输入层 (Input)**: $\mathbf{x} \in \mathbb{R}^{d_{in}}$。
*   **隐层 (Hidden)**: $\mathbf{h} = \sigma(W^{(1)}\mathbf{x} + \mathbf{b}^{(1)})$。这里的 $\mathbf{h} \in \mathbb{R}^m$ 捕捉了输入数据的中间特征，其维度 $m$ 称为**宽度 (Width)**。
*   **输出层 (Output)**: $\mathbf{y} = W^{(2)}\mathbf{h} + \mathbf{b}^{(2)}$。

虽然下文提到的**普适逼近定理**证明了单隐层网络在理论上的完备性，但在处理图像、自然语言等高维流形时，增加网络的**深度 (Depth)** 通常比增加宽度更能有效地提取层级化的抽象特征。

### 1.2 为什么必须是非线性的？
若 $\sigma(x) = x$（恒等映射），由于仿射变换的复合仍然是仿射变换：
$$ \mathcal{A}_2(\mathcal{A}_1(\mathbf{x})) = W^{(2)}(W^{(1)}\mathbf{x} + \mathbf{b}^{(1)}) + \mathbf{b}^{(2)} = (W^{(2)}W^{(1)})\mathbf{x} + (W^{(2)}\mathbf{b}^{(1)} + \mathbf{b}^{(2)}) $$
多层线性网络将退化为单层线性回归。非线性算子 $\sigma$ 的引入打破了线性空间的叠加原理，使得网络能够扭曲输入空间的拓扑结构，从而拟合高度复杂的非线性流形。

---

## 2. 学习算子：反向传播 (Backpropagation) 的微积分本质

神经网络的“训练”本质上是在参数流形 $\Theta$ 上通过**梯度下降（Gradient Descent）**最小化一个标量损失函数 $\mathcal{L}(\theta)$。

### 2.1 链式法则与计算图
假设损失函数为 $\mathcal{L} = \frac{1}{2} \| y - f_\theta(x) \|^2$。为了更新参数 $W^{(l)}$，我们需要计算偏导数 $\frac{\partial \mathcal{L}}{\partial W^{(l)}}$。根据多元微积分的链式法则：

令 $\mathbf{z}^{(l)} = W^{(l)}\mathbf{a}^{(l-1)} + \mathbf{b}^{(l)}$ 为线性输出，$\mathbf{a}^{(l)} = \sigma(\mathbf{z}^{(l)})$ 为激活输出。定义**误差项（Error term）**为：
$$ \delta^{(l)} = \frac{\partial \mathcal{L}}{\partial \mathbf{z}^{(l)}} \in \mathbb{R}^{n_l} $$

则对于任意权重元素 $W_{ij}^{(l)}$，其梯度为：
$$ \frac{\partial \mathcal{L}}{\partial W_{ij}^{(l)}} = \frac{\partial \mathcal{L}}{\partial z_i^{(l)}} \cdot \frac{\partial z_i^{(l)}}{\partial W_{ij}^{(l)}} = \delta_i^{(l)} \cdot a_j^{(l-1)} $$

### 2.2 梯度的递归推导
误差项 $\delta^{(l)}$ 可以通过从后向前递归计算得到：
$$ \delta^{(l)} = \left( (W^{(l+1)})^T \delta^{(l+1)} \right) \odot \sigma'(\mathbf{z}^{(l)}) $$
其中 $\odot$ 表示 Hadamard 积（逐元素乘法）。
*   这一递归过程在代数上等价于雅可比矩阵（Jacobian Matrix）的连乘。
*   **工程注记**：当 $L$ 很大且 $\sigma'(z)$ 在大部分区域接近 0 时（如 Sigmoid），梯度的连乘会导致 $\delta^{(l)}$ 呈指数级衰减，这就是著名的**梯度消失（Vanishing Gradient）**问题。

---

## 3. 常见的非线性映射及其性质

作为数学系学生，你可以将激活函数视为对空间进行折叠或拉伸的算子：

1.  **ReLU (Rectified Linear Unit)**: $\sigma(x) = \max(0, x)$
    *   **数学特性**：分段线性，保留了正向梯度的恒等性质。它将输入空间映射为一个半正定的锥体。
2.  **Softmax**: $\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_j e^{z_j}}$
    *   **数学特性**：将 $\mathbb{R}^n$ 映射到概率单纯形 $\Delta^{n-1}$。它常用于分类层的输出。
3.  **GeLU (Gaussian Error Linear Unit)**: $\sigma(x) = x \Phi(x)$
    *   **数学特性**：基于标准正态分布的累积分布函数 $\Phi(x)$ 对输入进行加权。这是目前 Transformer（如 **RenderFormer**）中主流的激活函数。
    *   **深层关联**：正态分布在神经网络理论中无处不在，例如在无限宽极限下，神经网络会收敛为[高斯过程 (Gaussian Process)](/wiki/gaussian-process)（即 NNGP 极限）。

---

## 4. 损失函数：测度空间的度量

训练的目标是缩小预测分布 $P_\theta$ 与真实分布 $P_{data}$ 之间的差异：

*   **均方误差 (MSE)**：$L^2$ 范数下的诱导度量。适用于回归任务。
*   **交叉熵 (Cross-Entropy)**：本质是两个概率分布之间的 **KL 散度 (Kullback–Leibler Divergence)**：
    $$ D_{KL}(P \| Q) = \sum P(x) \log \frac{P(x)}{Q(x)} $$
    它衡量了用模型分布 $Q$ 去逼近真实分布 $P$ 时损失的信息熵。

---

## 5. 宏观视角：普适逼近定理 (Universal Approximation Theorem)

神经网络之所以强大，其理论基石在于：
**定理**：只要激活函数 $\sigma$ 是有界的、非常数的连续函数，对于任何闭区间上的连续函数 $g$，总存在一个单隐层神经网络 $f_\theta$，使得在 $C^0$ 范数下 $\| f_\theta - g \|_\infty < \epsilon$。

这意味着神经网络在本质上是一组**完备的基函数**，能够以任意精度逼近紧集上的任何连续映射。关于该定理的现代数学证明与深度解析，请参阅：

- [万能逼近定理 (Universal Approximation Theorem) 深度解析](/wiki/universal-approximation-theorem)
- [Sobolev 空间与神经网络逼近论](/wiki/sobolev-spaces)


---

## 相关链接
- [Sobolev 空间与弱导数](/wiki/sobolev-spaces) - 深度学习逼近论与算子学习的数学基础。
- [DDPM：从马尔可夫链到去噪扩散](/wiki/ddpm) - 神经网络在生成概率流中的应用。
- [RenderFormer：基于 Transformer 的神经渲染](/wiki/renderformer) - 现代 Transformer 架构中的线性注意力与动态权重。
- [Welcome to my Wiki](/wiki/welcome)
