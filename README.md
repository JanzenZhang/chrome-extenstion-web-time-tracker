# WebTime Tracker Pro

基于 React + shadcn/ui 构建的现代化 Chrome 扩展，用于追踪网站使用时间、设置每日限额、可视化浏览数据。

## ✨ 功能特性

- **📊 网站时长追踪** — 自动记录每个网站的访问时间
- **⏰ 每日限额** — 为特定网站设置每日使用限制，超时提醒与拦截
- **🎯 使用目标** — 设定每日最低使用目标，达标获得 🏆 成就徽章
- **📋 每日报告** — 每天 22:00 推送今日上网总结（总时长、效率评分、Top 网站）
- **⏱ 实时浮窗** — 在每个网页右下角显示当前站点今日累计使用时间
- **🍅 专注模式** — 番茄钟式专注计时，自动屏蔽娱乐网站
- **📈 数据可视化** — 饼图与柱状图展示使用分布和趋势
- **🏷️ 智能分类** — 内置 60+ 主流网站分类（生产力/娱乐），支持自定义覆盖
- **🔔 整点报时** — 每小时通知，深夜时段提醒休息
- **🌓 暗色模式** — 支持亮色/暗色主题切换
- **📰 New Tab 仪表盘** — 替换 Chrome 新标签页，展示今日统计、目标进度、一周趋势
- **📦 数据导出** — 一键导出使用数据为 JSON 文件
- **🧹 自动清理** — 自动清理 90 天前的历史数据，避免存储膨胀

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 3 |
| UI 组件 | shadcn/ui (Radix UI) |
| 图表 | Recharts |
| 动画 | Framer Motion |

## 📁 项目结构

```
src/
├── background.ts          # Service Worker：时间追踪、限额检查、通知
├── content.ts             # Content Script：页面拦截覆盖层
├── Popup.tsx              # 弹出窗口：统计、图表、专注模式
├── NewTab.tsx             # New Tab 仪表盘：全屏数据概览
├── Options.tsx            # 设置页面：限额管理、分类管理
├── popup-main.tsx         # Popup 入口
├── newtab-main.tsx        # New Tab 入口
├── options-main.tsx       # Options 入口
├── components/
│   ├── LimitsSection.tsx  # 限额管理组件
│   ├── GoalsSection.tsx   # 使用目标管理组件
│   ├── CategoriesSection.tsx # 分类管理组件
│   ├── ThemeProvider.tsx  # 主题上下文
│   ├── ThemeToggle.tsx    # 主题切换按钮
│   └── ui/               # shadcn/ui 基础组件
├── lib/
│   ├── categories.ts     # 网站分类字典与工具函数
│   └── utils.ts          # 通用工具函数
└── index.css             # 全局样式
```

## 🚀 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建扩展
npm run build
```

## 📥 安装到 Chrome

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择项目中的 `dist` 文件夹

## 📖 使用说明

- 点击浏览器工具栏的扩展图标查看今日统计
- 切换到 **专注模式** 标签开启番茄钟
- 点击 ⚙️ 进入设置页面管理限额和分类规则
- 点击 📥 导出使用数据
