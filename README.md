# Noimpty 的赛博空间

基于 Hexo 8 与 Butterfly 5 的个人博客。

## 本地运行

需要 Node.js 20.19 或更高版本，推荐使用项目 `.nvmrc` 中的 Node.js 24。

```bash
npm install
npm run clean
npm run server
```

浏览器打开 `http://localhost:4000`。

## 常用目录

- `source/_posts/`：博客文章
- `source/img/`：图片资源
- `source/css/custom.css`：自定义视觉样式
- `_config.yml`：Hexo 主配置
- `_config.butterfly.yml`：Butterfly 主题配置

不要直接修改 `node_modules/hexo-theme-butterfly/`，重新安装依赖会覆盖里面的内容。

## 内容分类

博客使用两个主要分类：

- `学习`：设计与编程笔记、学习思考、问题排查和解决过程
- `生活`：日常记录、生活片段和碎碎念

更具体的主题使用标签，例如 `设计`、`编程`、`问题复盘`、`碎碎念`。分类用于决定文章属于哪个板块，标签用于描述文章具体写了什么。

## 替换头像

当前头像位于 `source/img/avatar.png`。以后需要替换时：

1. 用新的正方形图片覆盖 `source/img/avatar.png`。
2. 执行 `npm run clean && npm run server` 检查效果。

建议使用正方形图片，并避免把重要内容贴近边缘。

## 发布到 GitHub Pages

项目已包含 `.github/workflows/pages.yml`。将代码推送到 `main` 分支后，在仓库的 **Settings → Pages → Source** 中选择 **GitHub Actions**。

当前按用户站点 `https://hitzby.github.io` 配置。如果仓库名称不是 `hitzby.github.io`，需要把 `_config.yml` 中的 `url` 改成 `https://hitzby.github.io/仓库名`，并把 `root` 改成 `/仓库名/`。
