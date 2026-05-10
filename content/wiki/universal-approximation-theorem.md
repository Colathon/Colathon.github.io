---
title: "万能逼近定理 (Universal Approximation Theorem)"
date: "2026-05-09"
tags: ["Neural Networks", "Mathematics", "Deep Learning Theory"]
---

# The Modern Mathematics of Deep Learning: 万能逼近定理 (Universal Approximation Theorem)

万能逼近定理（UAT）是神经网络研究的理论基石。它回答了一个基础的数学问题：**神经网络究竟能表示什么样的函数？** 只要隐藏层节点足够多，单隐层神经网络就能以任意精度逼近任何紧集上的连续函数。

## 1. 定理陈述与核心符号

**Theorem 1.15 (Universal Approximation Theorem - Hornik, 1991)**
设 $d \in \mathbb{N}$，紧集 $K \subset \mathbb{R}^d$。设 $\varrho \in L^\infty_{\mathrm{loc}}(\mathbb{R})$ 为激活函数，且 $\varrho$ 的间断点闭包是一个勒贝格零测集 (Lebesgue null set)。定义单隐层神经网络所能表示的函数族为：
$$ \tilde{\mathcal{F}} := \bigcup_{n \in \mathbb{N}} \mathcal{F}_{((d, n, 1), \varrho)} $$
则连续函数空间包含于神经网络函数族的闭包中，即 $C(K) \subset \mathrm{cl}(\tilde{\mathcal{F}})$ （闭包在 $L^\infty(K)$ 范数拓扑下取得），**当且仅当** 不存在一个多项式 $p: \mathbb{R} \to \mathbb{R}$ 使得 $p = \varrho$ 几乎处处成立。

### 泛函分析桥梁：Hahn-Banach 与 Riesz 定理
为了证明 $\tilde{\mathcal{F}}$ 在 $C(K)$ 中稠密，依据 **Hahn-Banach 定理 (HBT)**，这等价于：不存在非零的连续线性泛函 $F \in C(K)' \setminus \{0\}$，使得 $F$ 将 $\tilde{\mathcal{F}}$ 中的所有元素映射为 0。
依据 **Riesz-Markov-Kakutani (RMK) 表示定理**，任何 $C(K)$ 上的连续线性泛函 $F$ 都可以等价于对某个符号博雷尔测度 (signed Borel measure) $\mu$ 的积分。
核心任务转化为证明：如果对于所有的 $w \in \mathbb{R}^d$ 和 $b \in \mathbb{R}$，都有
$$ \int_K \varrho(\langle w, x \rangle + b) \, d\mu(x) = 0 $$
那么该测度必为零测度，即 $\mu = 0$。满足此条件的激活函数 $\varrho$ 称为 **discriminatory**。

---

## 2. 证明思路一：Sigmoid 与傅里叶变换 (特例：Discriminatory 验证)

这一思路主要由 **Cybenko (1989)** 提出，用于证明特定饱和激活函数（如 Sigmoid）满足 discriminatory 条件。

### 2.1 构造指示函数 (Indicator Functions)
Sigmoid 函数 $\varrho$ 满足渐近性质：当 $a \to \infty$ 时，$\varrho(ax+b) \to \mathbb{1}_{(0,\infty)}(x) + \varrho(b)\mathbb{1}_{\{0\}}(x)$。
利用神经网络参数的自由度，我们可以通过缩放权重，并在两个不同偏置处取极限相减（叠加原理），构造出特定区间 $[c_1, c_2]$ 上的指示函数：
$$ \lim_{a \to \infty} \left[ \varrho(a(x - c_1)) - \varrho(a(x - c_2)) \right] = \mathbb{1}_{[c_1, c_2]}(x) $$
将此极限代入积分假设中（依据勒贝格控制收敛定理），可得：
$$ \int_K \mathbb{1}_{[c_1, c_2]}(\langle w, x \rangle + b) \, d\mu(x) = 0 $$
这意味着测度 $\mu$ 在空间中任何超平面夹出的“带状区域”内的测度均为 0。

> **数学本质：** 为了证明 $\mu = 0$，最强力的工具是证明其傅里叶变换处处为 0。为了将 $\varrho$ 过渡到复指数函数 $e^{-2\pi ix}$，必须利用测度论的标准逼近路径：**指示函数 $\to$ 简单函数 (Simple Functions) $\to$ 连续函数 (复指数函数)**。把 $\varrho$ 拉伸成指示函数，是接入这套标准理论体系的入口。

### 2.2 傅里叶变换收尾
指示函数的线性组合构成了简单函数。既然指示函数的积分为 0，那么测度 $\mu$ 对所有简单函数的积分也为 0。复指数函数 $x \mapsto e^{-2\pi ix}$ 可以被简单函数一致逼近，因此：
$$ \int_K e^{-2\pi i(\langle w, x \rangle + b)} \, d\mu(x) = 0 \implies \int_K e^{-2\pi i \langle w, x \rangle} \, d\mu(x) = 0 \quad \forall w \in \mathbb{R}^d $$
由于测度 $\mu$ 的傅里叶变换恒为 0，这在分析学上意味着 $\mu = 0$。

---

## 3. 证明思路二：充要条件的通用证明 (高阶差分与魏尔斯特拉斯)

此思路证明了定理的充要条件：万能逼近成立 $\iff \varrho$ 不是多项式。

### 3.1 必要性证明 (Why polynomials fail)
若 $\varrho$ 是一个最高次为 $N$ 的多项式，那么单隐层神经网络的输出 $f(x) = \sum_{i=1}^m c_i \varrho(\langle w_i, x \rangle + b_i)$ 展开后，必定仍然是一个最高次不超过 $N$ 的多项式。
由于次数不超过 $N$ 的多项式空间是有限维的，它无法在无限维的连续函数空间 $C(K)$ 中稠密。根据 HBT，必然存在非零测度使得积分为 0 但测度本身不为 0。这就是为什么多项式激活函数不具备万能逼近能力。

### 3.2 充分性 - 一维情况的差分构造
假设平滑函数 $\varrho$ **不是多项式**。这意味着对于任意正整数 $n$，存在一点 $\theta \in \mathbb{R}$ 使得其 $n$ 阶导数非零：$\varrho^{(n)}(\theta) \neq 0$。
构造步长为 $hx$，基准点为 $\theta$ 的 $n$ 阶向前差分：
$$ \lim_{h \to 0} \frac{\Delta_{hx}^n \varrho(\theta)}{h^n} = x^n \varrho^{(n)}(\theta) $$
完全展开该差分算子，其对应的神经网络结构清晰可见：
$$ \lim_{h \to 0} \sum_{k=0}^n \underbrace{\frac{(-1)^{n-k}}{h^n} \binom{n}{k}}_{c_k \text{ (输出层权重)}} \varrho( \underbrace{kh}_{w_k} x + \underbrace{\theta}_{b_k} ) = x^n \varrho^{(n)}(\theta) $$
该求和式是一个包含 $n+1$ 个神经元的单隐层网络。当 $h \to 0$ 时，该网络在闭包中精准地“无中生有”生成了单项式 $x^n$。

### 3.3 充分性 - 高维推广与极化恒等式
在 $x \in \mathbb{R}^d$ 中，沿用上述差分构造，将输入权重设为 $k \cdot h \cdot w$，极限操作后得到的是**岭多项式 (Ridge Polynomials)**：
$$ \lim_{h \to 0} \tilde{f}_h(x) = \langle w, x \rangle^n $$
为了从 $\langle w, x \rangle^n$ 中提取出真正的多元交叉单项式（例如从 $\langle w, x \rangle^2$ 中提取 $x_1 x_2$），利用**极化恒等式 (Polarization Identity)**：
$$ \frac{1}{2} \left[ (x_1 + x_2)^2 - x_1^2 - x_2^2 \right] = x_1 x_2 $$
代数理论保证，集合 $\{ \langle w, x \rangle^n \mid w \in \mathbb{R}^d \}$ 的线性张成空间包含了所有 $d$ 维 $n$ 次齐次多项式。

### 3.4 矩问题收尾 (The Moment Problem)
神经网络的闭包可以构造出所有多元单项式 $x^\alpha = x_1^{\alpha_1} \dots x_d^{\alpha_d}$。根据**多元魏尔斯特拉斯逼近定理**，多项式能够在紧集 $K$ 上一致逼近任何连续函数。
回到测度 $\mu$。已知 $\mu$ 对所有神经网络的积分为 0，通过极限过渡，$\mu$ 对所有多维单项式 $x^\alpha$ 的积分也必须为 0：
$$ \int_K x^\alpha \, d\mu(x) = 0 \quad \text{for all multi-indices } \alpha $$
这被称为测度 $\mu$ 的所有**矩 (Moments)** 均为 0。在紧集上，如果一个符号测度的所有阶矩都为 0，则该测度必为零测度 ($\mu = 0$)。

---

## 4. 理论意义与历史地位：深度学习的“存在性证明”

万能逼近定理在深度学习的发展史上具有里程碑式的意义，它标志着神经网络研究从“生物类比”转向了“数学严谨性”。

### 4.1 理论上的完备性（合法性）
在 20 世纪 80 年代，人们对神经网络的怀疑主要集中在其是否有能力处理复杂的非线性问题。UAT 的出现给出了**存在性证明 (Existence Proof)**：它向世人保证，无论多么复杂的连续映射，只要我们愿意付出足够的计算代价（宽度），单隐层网络在理论上总能胜任。这为神经网络作为通用的**函数逼近器 (Function Approximator)** 奠定了法律地位。

### 4.2 局限性：存在性 $\neq$ 可学习性
UAT 虽然强大，但也划定了理论的边界。它只告诉我们“解存在”，但没有回答：
*   **如何找到解？** 随机梯度下降（SGD）是否能收敛到这个理论解？
*   **效率如何？** 逼近一个复杂的函数可能需要指数级数量的隐藏层神经元。
*   **泛化能力？** 在训练集上逼近得好，不代表在未见过的数据上表现好。

### 4.3 促成深度学习的转向
虽然 UAT 证明了单隐层网络的“万能”，但它在某种程度上也“误导”了研究者在很长一段时间内只关注浅层网络。直到后来人们意识到，虽然浅层网络能逼近任何函数，但**深度网络**能以更符合自然界层级结构的方式、用极少的参数量实现相同的逼近效果。这一认识最终促成了从神经网络到**深度学习 (Deep Learning)** 的范式转移。

---

## 5. 现代视角与扩展

*   **[Sobolev 空间](/wiki/sobolev-spaces)逼近**：现代研究证明神经网络不仅能逼近函数值，还能逼近其弱导数。
*   **非连续激活函数**：对于 ReLU 等非平滑函数，可以通过对平滑函数的极限逼近来证明。
*   **深度 vs 宽度**：UAT 证明了单层宽网络的表达力，但深层网络在处理具有层级结构的特征时具有更高的参数效率。

---

## 相关链接
- [神经网络的数学架构：仿射变换与流形逼近](/wiki/neural-networks-foundation)
- [Sobolev 空间与弱导数](/wiki/sobolev-spaces)
- [RenderFormer：函数逼近在渲染中的应用](/wiki/renderformer)
