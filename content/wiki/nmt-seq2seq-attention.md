---
title: "神经机器翻译的数学推导：带注意力机制的 Seq2Seq 模型"
date: "2026-05-15"
tags: ["machine-learning", "nlp", "attention-mechanism", "mathematics"]
---

本文档详细拆解了引入 Bahdanau 注意力机制的 Seq2Seq 翻译模型。整个翻译过程本质上是一个从离散符号空间到连续欧氏空间，再映射回离散概率分布的自回归生成过程。

该模型建立在[神经网络基础](/wiki/neural-networks-foundation)之上。与 [RenderFormer](/wiki/renderformer) 中基于点积的注意力机制不同，Bahdanau 注意力采用加性模型来处理非对齐的序列信息。

假设源语言句子长度为 $T_x$，目标语言句子长度为 $T_y$。目标语言的词汇表记为 $\mathcal{V}$，其大小为 $|\mathcal{V}|$。

### 1. 编码器 (Encoder)：构建连续的隐流形表示

编码器的任务是将源语言的离散符号序列转化为连续的高维特征向量序列。

#### 1.1 离散符号的连续化 (Embedding)
设输入源句子的第 $i$ 个词为 $x_i$（通常以 One-hot 向量表示）。首先通过嵌入层将其映射为低维稠密实数向量：
$$\mathbf{e}(x_i) = E_{src} x_i$$
其中 $\mathbf{e}(x_i) \in \mathbb{R}^{d_{emb}}$，$E_{src}$ 是源语言的词嵌入矩阵。

#### 1.2 序列特征提取
使用循环神经网络（如双向 GRU/LSTM）对连续化的输入序列进行编码。在第 $i$ 步，网络读取当前输入 $\mathbf{e}(x_i)$ 和前一步的隐藏状态 $h_{i-1}$，输出当前状态：
$$h_i = f(\mathbf{e}(x_i), h_{i-1})$$
经过完全编码后，源句子被表示为一个隐藏状态的集合 $H = \{h_1, h_2, \dots, h_{T_x}\}$，其中每个 $h_i \in \mathbb{R}^h$ 包含了以第 $i$ 个词为中心的局部上下文信息。

### 2. 注意力机制 (Attention)：动态上下文对齐

在解码器生成第 $t$ 个目标词时，不再依赖单一的静态向量，而是根据当前解码状态对 Encoder 的集合 $H$ 进行动态的加权求和。

#### 2.1 打分函数 (Score Function)
设解码器在 $t-1$ 时刻的隐藏状态为 $s_{t-1} \in \mathbb{R}^h$（即 Query）。我们使用加性模型（Additive Attention）计算 $s_{t-1}$ 与编码器第 $i$ 个状态 $h_i$（即 Key）的相关性得分：
$$e_{t,i} = \mathbf{v}^\top \tanh(W h_i + U s_{t-1})$$
其中 $W \in \mathbb{R}^{h \times h}$ 和 $U \in \mathbb{R}^{h \times h}$ 是投影矩阵，将两空间特征映射到共享的隐空间，$\tanh$ 是逐元素作用的非线性激活函数。$\mathbf{v}^\top \in \mathbb{R}^{1 \times h}$ 是权重行向量，将隐空间表示投影为实数标量得分 $e_{t,i} \in \mathbb{R}$。

#### 2.2 概率权重归一化 (Softmax)
利用 Softmax 函数将标量得分转化为在源句子所有位置上的概率分布（非负且和为 1）：
$$\alpha_{t,i} = \frac{\exp(e_{t,i})}{\sum_{k=1}^{T_x} \exp(e_{t,k})}$$
这里 $\alpha_{t,i}$ 即为注意力权重。

#### 2.3 动态上下文向量 (Context Vector)
基于上述概率分布，对编码器的隐状态求数学期望（加权求和）：
$$c_t = \sum_{i=1}^{T_x} \alpha_{t,i} h_i$$
$c_t \in \mathbb{R}^h$ 是一个聚合了当前生成步所需所有源语言信息的动态向量。

### 3. 解码器 (Decoder)：自回归状态更新

解码器是一个以离散输出作为反馈信号的动力系统。在时刻 $t$，解码器接收上一步生成的（或训练时给定的）目标词 $y_{t-1}$。首先将其做 Embedding 映射得到稠密向量 $\mathbf{e}(y_{t-1})$。随后更新当前时刻的隐藏状态：
$$s_t = g(\mathbf{e}(y_{t-1}), s_{t-1}, c_t)$$
这里非线性函数 $g$（通常是一层 GRU）综合了前一个词的信息、解码器历史状态以及刚计算出的动态上下文信息。此时，$s_t \in \mathbb{R}^h$ 已经具备了预测第 $t$ 个词所需的全部上下文特征。

### 4. 输出层：从高维空间到离散概率分布

这是翻译发生的最后一步，即测量当前特征空间坐标与词汇表锚点之间的“距离”。

#### 4.1 特征融合
通常会将当前的解码器状态 $s_t$、上下文向量 $c_t$ 以及上一个词的嵌入特征进行拼接并做一次仿射变换（引入非线性），得到最终的综合输出特征 $\mathbf{v}_t$：
$$\mathbf{v}_t = \tanh(W_s s_t + W_c c_t + W_e \mathbf{e}(y_{t-1}))$$
其中 $\mathbf{v}_t \in \mathbb{R}^{d_{out}}$。

#### 4.2 词表空间投影 (Logits)
利用输出权重矩阵 $W_{out} \in \mathbb{R}^{|\mathcal{V}| \times d_{out}}$ 将综合特征投影到整个词汇表的大小：
$$\mathbf{z}_t = W_{out} \mathbf{v}_t + b_{out}$$
这里 $\mathbf{z}_t \in \mathbb{R}^{|\mathcal{V}|}$ 是 Logits 向量，代表了生成各个词的未归一化倾向值。

#### 4.3 概率分布生成 (Softmax)
再次使用 Softmax 将实数向量映射为离散型概率质量函数（PMF）：
$$\mathbf{p}_t = \text{Softmax}(\mathbf{z}_t)$$
此时 $\mathbf{p}_t$ 是一个长度为 $|\mathcal{V}|$ 的概率向量，它的第 $k$ 个分量表示在当前已知上下文条件下，目标句子第 $t$ 个位置是词表第 $k$ 个词的条件概率 $P(y_t = k \mid y_{<t}, \mathbf{x})$。

#### 4.4 最终离散输出
根据概率分布 $\mathbf{p}_t$ 决定当前输出 $\hat{y}_t$：
- **贪心搜索 (Greedy Search)**：$\hat{y}_t = \text{argmax}(\mathbf{p}_t)$
- **束搜索 (Beam Search)**：保留 Top-K 个高概率路径序列，在句末计算联合概率 $\prod_{t} \mathbf{p}_{t,\hat{y}_t}$ 的最大值。

---

## 相关链接
- [神经网络的数学架构：仿射变换与流形逼近](/wiki/neural-networks-foundation)
- [RenderFormer：基于 Transformer 的神经渲染架构](/wiki/renderformer) - 探讨缩放点积注意力机制（Scaled Dot-Product Attention）在几何渲染中的应用。
- [通用近似定理](/wiki/universal-approximation-theorem)

