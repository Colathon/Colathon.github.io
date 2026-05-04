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
**文件位置**：`content/blog/`
- **目的**：正式的、长篇的技术文章或反思。
- **发布流程**：在此文件夹下创建 `.md` 文件，确保包含完整的 YAML 前置信息（Title, Date, Summary, Tags）。

### 6. 数字花园 (Wiki Notes)
**文件位置**：`content/wiki/`
- **目的**：碎片化的知识、论文笔记、代码片段。
- **动态增长**：
    - 在 `content/wiki/` 创建新文件。
    - **标签过滤**：在 Markdown 头部定义的 `tags` 会自动生效。用户可以通过 `/wiki?tag=标签名` 查看分类。
    - **更新目录**：如果新增了领域，记得在 `content/wiki/welcome.md` 中添加对应的分类链接。
- **格式建议**：
    ```markdown
    ---
    title: "笔记标题"
    date: "2026-05-04"
    excerpt: "一句话摘要"
    tags: ["Computer Graphics", "Research"]
    ---
    正文...
    ```

### 7. 阅读清单与项目 (Reading & Projects)
**文件位置**：`app/reading/page.tsx` 或 `app/projects/page.tsx`
- **修改方式**：直接修改代码顶部的 `const papers = [...]` 或 `const projects = [...]` 数组。
- **更新技巧**：复制现有的对象模板，粘贴后修改内容即可。

---

## 📸 AI 协作流程 (Agent Workflow)
如果您正在使用 AI 代理（如 Gemini CLI）管理此仓库：
1. **直接投喂**：发送论文 PDF 或链接给 AI，要求：“基于此内容为我的 Wiki 添加笔记”。
2. **自动分类**：AI 会自动提取标签并更新 `welcome.md`。
3. **一键发布**：要求 AI “提交并推送”。

## ⚠️ 注意事项
-   **图标引用**：代码中严禁直接导入 `Github` 图标组件（会导致构建报错），请统一使用 `Link2` 组件。
-   **特殊字符**：在正文中写英文单引号（'）时，建议写成 `&apos;`，否则可能会触发布署时的代码检查报错。
