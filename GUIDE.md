# 个人主页文案修改指南 - GUIDE.md

这份指南将帮助您在不需要深入代码的情况下，快速修改个人主页的内容。

## 🚀 核心流程
1.  **修改文件**：在本地电脑上找到对应文件进行编辑。
2.  **预览 (可选)**：执行 `npm run dev` 在浏览器查看效果。
3.  **发布**：执行以下 Git 命令：
    ```powershell
    git add .
    git commit -m "update content"
    git push origin main
    ```

---

## 📝 详细修改说明

### 1. 首页 (Home Page)
**文件位置**：`app/page.tsx`
-   **大标题**：查找 `Researcher, Developer, Explorer.` 进行修改。
-   **欢迎语**：查找 `Hi, I'm Colathon.` 修改下方的文字。
-   **邮箱/GitHub**：查找 `your-email@example.com` 和 `@Colathon` 进行替换。

### 2. 关于我 (About Page)
**文件位置**：`app/about/page.tsx`
-   **自我介绍**：在 `<p>` 标签内的英文即为正文。
-   **研究兴趣**：搜索 `Research Interests`，修改下方的列表项（`<li>` 标签内）。

### 3. 阅读清单 (Reading List)
**文件位置**：`app/reading/page.tsx`
-   **书籍与论文**：修改文件顶部的 `const papers = [...]` 数组。
-   **注意**：每项包含 `title` (标题), `authors` (作者), `source` (来源), `link` (链接), `note` (个人点评)。

### 4. 项目展示 (Projects)
**文件位置**：`app/projects/page.tsx`
-   **项目列表**：修改文件顶部的 `const projects = [...]` 数组。
-   **注意**：`tags` 是一个数组，如 `["Next.js", "AI"]`。

### 5. 博客文章 (Blog Posts)
**文件位置**：`content/blog/first-post.md`
-   **写新文章**：在此文件夹下创建新的 `.md` 文件（文件名建议英文，如 `my-new-post.md`）。
-   **文章格式**：
    ```markdown
    ---
    title: "文章标题"
    date: "2026-05-03"
    excerpt: "文章摘要"
    tags: ["标签1", "标签2"]
    ---
    这里开始写 Markdown 正文...
    ```

---

## 📸 更换头像
-   **方法**：直接用您的照片替换 `public/avatar.jpg` 文件。
-   **注意**：保持文件名为 `avatar.jpg`，且照片最好是正方形的。

## ⚠️ 注意事项
-   **图标引用**：代码中严禁直接导入 `Github` 图标组件（会导致构建报错），请统一使用 `Link2` 组件。
-   **特殊字符**：在正文中写英文单引号（'）时，建议写成 `&apos;`，否则可能会触发布署时的代码检查报错。
