---
title: "Single Edge Collapse Quad-Dominant Mesh Reduction"
date: "2026-05-04"
excerpt: "Deep dive into Julian Knodt's 2024 method for preserving quad topology via per-edge weighted quadrics and recency-based partial ordering."
tags: ["Computer Graphics", "Geometry Processing", "Mesh Decimation", "Research"]
---

# Single Edge Collapse Quad-Dominant Mesh Reduction

This note provides a technical deep dive into the method proposed by **Julian Knodt (2024)** for simplifying quad-dominant meshes while preserving clean topology and edge loops.

## 1. Per-Edge Weighted Quadric

The traditional QEM (Garland & Heckbert) lacks constraints in the tangent plane of faces, leading to ambiguous vertex placement in coplanar regions. Knodt resolves this by introducing quadrics in the tangent space of each face.

### Dihedral-Angle Weighting
For each edge $e$ with vertices $v_0, v_1$, an additional quadric $Q_{edge}$ is introduced, orthogonal to the face normal:
$$Q_{edge} = \text{Quadric}\left(v_0, \frac{v_0 - v_1}{\|v_0 - v_1\|_2} \times \text{normal}(f)\right)$$

The weight $w$ is determined by the dihedral angle:
- **Manifold edge:** $w = \frac{1}{\pi} \arccos(n(f_0)^\top n(f_1))$
- **Non-manifold edge:** $w = 1$

The final edge quadric is scaled by the edge length to ensure consistent distance metrics:
$$Q'_{edge} = w \|v_0 - v_1\|_2 Q_{edge}$$

## 2. Partial Ordering & Recency Bias

A key insight of the paper is that a **total ordering** (strict cost-based) causes "deterministically random" collapses due to floating-point errors, which shatters quad topology.

### The $\epsilon$-band Heuristic
Edges are grouped into **equivalence classes** if their quadric errors are nearly equal:
$$a \approx b := |a - b| < \epsilon_{abs}$$

### Recency Metric
Within an equivalence class, the algorithm prioritizes edges based on **Recency**:
- When an edge is collapsed, the **recency** of the edges on the opposite side of the quads (opposing quad edges) is increased.
- High recency edges are collapsed first, which implicitly forces the decimation of **quad chords**.

## 3. Implementation: Dual Priority Queues

The system uses two priority queues to manage the collapse order:
1. **$pq_{qem}$**: Ordered strictly by quadric error.
2. **$pq_{\approx}$**: Ordered by **Recency**, and then by quadric error as a tie-breaker.

**Algorithm Flow:**
- Pop the best edge from $pq_{qem}$.
- Move all "approximately equal" edges (within $\epsilon_{abs}$) from $pq_{qem}$ to $pq_{\approx}$.
- Collapse edges from $pq_{\approx}$ based on high recency.
- This ensures that once a quad chord starts being collapsed, the algorithm "follows through" until the chord is decimated.

## 4. Minimizing Introduced Error

Unlike "memoryless" simplification which measures error from the current state, Knodt redefines the error to measure the **incremental error** introduced relative to the *decimated* mesh, while still grounding it in the original quadrics:
$$\text{QEM}(e=(v_0, v_1), v_{new}) = (Q_{v_0} + Q_{v_1})(v_{new}) - (Q_{v_0}(v_0) + Q_{v_1}(v_1))$$
This modification prevents penalizing future collapses for errors introduced by past ones, closely resembling the benefits of memoryless simplification without its implementation complexity.

## 5. Attribute & Skinning Preservation
The method treats **joint influences** (skinning weights) as vertex attributes.
- Uses a linear functional $j_{ib}(p) = g_{ji}^\top p + d_{ji}$ for each influence.
- Maintains a maximum of 16 influences per vertex during decimation, selecting the top 4 for the final result.

---
## Related
- [RenderFormer: Neural Rendering Transformer](/wiki/renderformer)
- [Mesh Simplification](/wiki/mesh-simplification)
- [QEM (Quadric Error Metrics)](/wiki/qem)
- [Edge Loops and Quad Topology](/wiki/quad-topology)
