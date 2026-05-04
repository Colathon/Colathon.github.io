---
title: "Single Edge Collapse Quad-Dominant Mesh Reduction"
date: "2026-05-04"
excerpt: "Notes on Julian Knodt's 2024 paper on preserving quad topology during mesh decimation using modified edge collapse."
tags: ["Computer Graphics", "Geometry Processing", "Research"]
---

# Single Edge Collapse Quad-Dominant Mesh Reduction

This note summarizes the 2024 paper by **Julian Knodt** (ACM Transactions on Graphics), which addresses the challenge of simplifying quad-dominant meshes while preserving their quadrilateral structure.

## The Core Problem

Standard mesh reduction algorithms (like QEM - Quadric Error Metrics) are optimized for triangles. When applied to quad meshes, they often "shatter" quads into triangles because they lack a mechanism to maintain quad topology during individual edge collapses.

## Key Innovations

### 1. Dihedral-Angle Weighted Quadrics
Traditional QEM uses plane distances. This paper introduces edge-specific quadrics weighted by the **dihedral angle** between adjacent faces. 
- **Benefit:** Better respects geometric features (like sharp edges) and prevents the "clustering" of vertices that often happens in quad decimation.

### 2. Stateful Edge Collapse (Recency Bias)
The algorithm introduces a "greedy" local consistency check.
- **Heuristic:** When multiple edges have similar collapse costs, it prioritizes edges that are "near" recently collapsed ones.
- **Why?** This preserves the "flow" or alignment of quads, preventing the checkerboard-like patterns from breaking into triangles prematurely.

### 3. Attribute Preservation
- Supports **skinning weights** and other vertex attributes.
- Demonstrates superior performance in preserving joint influences compared to industry standards like Maya or Houdini's built-in decimators.

## Performance Metrics
- **Quad Retention:** Maintains a median of ~95% quads at 50% reduction.
- **Fidelity:** Lower Chamfer and Hausdorff distances than previous state-of-the-art methods.

## Personal Thoughts / Implementation Notes
*This is the primary paper I am currently reproducing and improving upon.*
- The recency bias seems key to maintaining the quad layout.
- Need to look into how the dihedral weighting affects the performance on high-curvature regions.

## Related
- [Mesh Simplification](/wiki/mesh-simplification)
- [Quadric Error Metrics](/wiki/qem)
