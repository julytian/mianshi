import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '前端面试作战手册',
  description: 'Vue3 / Lead / Java 全栈偏前 · 面试方案与题库',
  lang: 'zh-CN',
  // GitHub Pages 项目站：https://julytian.github.io/mianshi/
  base: '/mianshi/',
  ignoreDeadLinks: true,
  srcExclude: ['**/superpowers/**'],
  cleanUrls: true,
  themeConfig: {
    logo: undefined,
    nav: [
      { text: '总览', link: '/interview/00-overview' },
      { text: '冲刺计划', link: '/interview/plans/14-day' },
      { text: '题库', link: '/interview/questions/02-vue3' },
      { text: '故事', link: '/interview/stories/template' },
      { text: '模拟面', link: '/interview/mocks/scripts' },
    ],
    sidebar: {
      '/interview/': [
        {
          text: '开始',
          items: [
            { text: '首页', link: '/' },
            { text: '总览与侧重点矩阵', link: '/interview/00-overview' },
          ],
        },
        {
          text: '冲刺计划',
          items: [
            { text: '14 天主线', link: '/interview/plans/14-day' },
            { text: '7 天压缩版', link: '/interview/plans/7-day' },
            { text: '30 天加练版', link: '/interview/plans/30-day' },
          ],
        },
        {
          text: '前端基础',
          items: [
            { text: 'JS / TS', link: '/interview/questions/01-js-ts' },
            { text: 'Vue3', link: '/interview/questions/02-vue3' },
            { text: '手写题', link: '/interview/questions/10-handwriting' },
          ],
        },
        {
          text: '工程与架构',
          items: [
            { text: '工程化', link: '/interview/questions/03-engineering' },
            { text: '前端架构', link: '/interview/questions/14-frontend-architecture' },
            { text: '前端系统设计', link: '/interview/questions/11-frontend-system-design' },
            { text: '微前端', link: '/interview/questions/12-microfrontend' },
          ],
        },
        {
          text: '业务与多端',
          items: [
            { text: 'Ant Design Vue', link: '/interview/questions/04-admin-antdv' },
            { text: 'Vant H5', link: '/interview/questions/05-h5-vant' },
            { text: 'uni-app / 小程序', link: '/interview/questions/06-uniapp-miniprogram' },
          ],
        },
        {
          text: '全栈与 AI',
          items: [
            { text: 'Java 全栈偏前', link: '/interview/questions/07-java-fullstack' },
            { text: 'NestJS', link: '/interview/questions/13-nestjs' },
            { text: 'AI / vibe coding', link: '/interview/questions/09-ai-vibe-coding' },
          ],
        },
        {
          text: 'Lead',
          items: [
            { text: '架构 / Lead', link: '/interview/questions/08-architecture-lead' },
          ],
        },
        {
          text: '故事与模拟',
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
    search: { provider: 'local' },
    outline: { label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    darkModeSwitchLabel: '主题',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
  },
})
