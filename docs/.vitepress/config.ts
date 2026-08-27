import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '前端面试作战手册',
  description: '资深前端备战：9 域 26 库 630 题，含 Nuxt / Vite / Webpack 与 Jenkins / Docker / k8s',
  lang: 'zh-CN',
  // GitHub Pages 项目站：https://julytian.github.io/mianshi/
  base: '/mianshi/',
  srcExclude: ['**/superpowers/**'],
  cleanUrls: true,
  themeConfig: {
    logo: undefined,
    nav: [
      { text: '总览', link: '/interview/00-overview' },
      { text: '60 天路线', link: '/interview/plans/60-day' },
      { text: '复习', link: '/interview/review/00-overview' },
      { text: '题库', link: '/interview/questions/01-js-ts' },
      { text: '模拟面试', link: '/interview/mocks/scripts' },
      { text: '简历', link: '/interview/resume/senior-frontend-guide' },
    ],
    sidebar: {
      '/interview/': [
        {
          text: '开始',
          items: [
            { text: '首页', link: '/' },
            { text: '总览', link: '/interview/00-overview' },
          ],
        },
        {
          text: '学习路线',
          items: [
            { text: '60 天完整主线', link: '/interview/plans/60-day' },
            { text: '30 天强化版', link: '/interview/plans/30-day' },
            { text: '14 天冲刺版', link: '/interview/plans/14-day' },
            { text: '7 天压缩版', link: '/interview/plans/7-day' },
          ],
        },
        {
          text: '复习',
          items: [
            { text: '复习总览', link: '/interview/review/00-overview' },
            { text: '面试前 3 天', link: '/interview/review/plans/3-day' },
            { text: '面试前 7 天', link: '/interview/review/plans/7-day' },
            { text: '面试前 14 天', link: '/interview/review/plans/14-day' },
            {
              text: '速记册（9）',
              collapsed: true,
              items: [
                { text: 'Web 与计算机基础', link: '/interview/review/sheets/01-web-fundamentals' },
                { text: '框架与数据', link: '/interview/review/sheets/02-framework-data' },
                { text: '工程与质量', link: '/interview/review/sheets/03-engineering-quality' },
                { text: '后台与业务前端', link: '/interview/review/sheets/04-admin-business' },
                { text: '移动端与跨平台', link: '/interview/review/sheets/05-mobile-cross' },
                { text: '架构与系统设计', link: '/interview/review/sheets/06-architecture' },
                { text: '运维与部署', link: '/interview/review/sheets/07-devops' },
                { text: '全栈、数据与 AI', link: '/interview/review/sheets/08-fullstack-ai' },
                { text: '领导力与求职', link: '/interview/review/sheets/09-leadership' },
              ],
            },
            {
              text: '专题讲义（12）',
              collapsed: true,
              items: [
                { text: 'JS 运行时与异步', link: '/interview/review/topics/01-js-runtime' },
                { text: 'TypeScript 类型系统', link: '/interview/review/topics/02-ts-types' },
                { text: '浏览器渲染与性能底座', link: '/interview/review/topics/03-browser-rendering' },
                { text: '网络与 Web 安全', link: '/interview/review/topics/04-network-security' },
                { text: 'Vue3 响应式与渲染', link: '/interview/review/topics/05-vue-reactivity' },
                { text: 'Nuxt SSR / 同构', link: '/interview/review/topics/06-nuxt-ssr' },
                { text: 'Vite 与 Webpack 构建器', link: '/interview/review/topics/07-vite-webpack' },
                { text: '性能、测试与质量门禁', link: '/interview/review/topics/08-perf-testing' },
                { text: '微前端与前端架构', link: '/interview/review/topics/09-microfrontend-architecture' },
                { text: '全栈数据与 Nest / Prisma', link: '/interview/review/topics/10-fullstack-data' },
                { text: 'Hybrid / 小程序 / H5', link: '/interview/review/topics/11-hybrid-miniapp-h5' },
                { text: 'Lead、行为与项目答辩', link: '/interview/review/topics/12-lead-behavioral' },
              ],
            },
          ],
        },
        {
          text: 'Web 与计算机基础',
          items: [
            { text: 'JS / TS', link: '/interview/questions/01-js-ts' },
            { text: 'HTML / CSS / 可访问性', link: '/interview/questions/16-html-css-a11y' },
            { text: '浏览器与 Web API', link: '/interview/questions/17-browser-web-api' },
            { text: '网络与 Web 安全', link: '/interview/questions/18-network-security' },
            { text: '手写题', link: '/interview/questions/10-handwriting' },
          ],
        },
        {
          text: '框架与数据',
          items: [
            { text: 'Vue3', link: '/interview/questions/02-vue3' },
            { text: 'Nuxt', link: '/interview/questions/23-nuxt' },
            { text: 'Vite', link: '/interview/questions/24-vite' },
            { text: 'Webpack', link: '/interview/questions/25-webpack' },
          ],
        },
        {
          text: '工程与质量',
          items: [
            { text: '工程化', link: '/interview/questions/03-engineering' },
            { text: '性能与用户体验', link: '/interview/questions/20-performance-ux' },
            { text: '测试与质量保障', link: '/interview/questions/21-testing-quality' },
            {
              text: 'AI 编程实践',
              collapsed: true,
              items: [
                { text: 'Cursor 工作流', link: '/interview/guides/ai-coding/cursor-workflow' },
                { text: '前端 Rules', link: '/interview/guides/ai-coding/rules' },
                { text: '前端 Skills', link: '/interview/guides/ai-coding/skills' },
                { text: 'Hooks 与 MCP', link: '/interview/guides/ai-coding/hooks-mcp' },
                { text: 'Vue 项目示例', link: '/interview/guides/ai-coding/vue-project-example' },
              ],
            },
          ],
        },
        {
          text: '后台与业务前端',
          items: [
            { text: 'Ant Design Vue', link: '/interview/questions/04-admin-antdv' },
            { text: 'Vant H5', link: '/interview/questions/05-h5-vant' },
          ],
        },
        {
          text: '移动端与跨平台',
          items: [
            { text: 'uni-app / 小程序', link: '/interview/questions/06-uniapp-miniprogram' },
            { text: 'Hybrid App', link: '/interview/questions/19-hybrid-app' },
          ],
        },
        {
          text: '架构与系统设计',
          items: [
            { text: '前端架构', link: '/interview/questions/14-frontend-architecture' },
            { text: '前端系统设计', link: '/interview/questions/11-frontend-system-design' },
            { text: '微前端', link: '/interview/questions/12-microfrontend' },
          ],
        },
        {
          text: '运维与部署',
          items: [
            { text: 'Jenkins / Docker / k8s', link: '/interview/questions/26-devops' },
            { text: 'Jenkins 教程', link: '/interview/guides/devops/jenkins' },
            { text: 'Docker 教程', link: '/interview/guides/devops/docker' },
            { text: 'Kubernetes 教程', link: '/interview/guides/devops/k8s' },
          ],
        },
        {
          text: '全栈、数据与 AI',
          items: [
            { text: 'Java 全栈偏前', link: '/interview/questions/07-java-fullstack' },
            { text: 'NestJS', link: '/interview/questions/13-nestjs' },
            { text: '数据库与 Prisma', link: '/interview/questions/15-database-prisma' },
            { text: 'NestJS + Prisma 教程', link: '/interview/guides/backend/nestjs-prisma' },
            { text: 'AI / vibe coding', link: '/interview/questions/09-ai-vibe-coding' },
          ],
        },
        {
          text: '领导力与求职',
          items: [
            { text: '架构 / Lead', link: '/interview/questions/08-architecture-lead' },
            { text: '项目答辩与行为面试', link: '/interview/questions/22-project-behavioral' },
            {
              text: '简历套件',
              collapsed: true,
              items: [
                { text: '资深前端简历指南', link: '/interview/resume/senior-frontend-guide' },
                { text: '资深前端简历模板', link: '/interview/resume/senior-frontend-template' },
                { text: '资深前端简历示例', link: '/interview/resume/senior-frontend-example' },
                { text: '项目经历改写清单', link: '/interview/resume/project-rewrite-checklist' },
                { text: 'ATS 简历检查清单', link: '/interview/resume/ats-checklist' },
              ],
            },
            {
              text: '故事、模拟、评分和反问',
              collapsed: true,
              items: [
                { text: '故事模板', link: '/interview/stories/template' },
                { text: '故事示例', link: '/interview/stories/examples' },
                { text: '模拟脚本', link: '/interview/mocks/scripts' },
                { text: '评分表', link: '/interview/mocks/scorecard' },
                { text: '反问清单', link: '/interview/mocks/reverse-questions' },
              ],
            },
          ],
        },
      ],
    },
    search: { provider: 'local' },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
  },
})
