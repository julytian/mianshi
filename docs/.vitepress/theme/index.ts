import DefaultTheme from 'vitepress/theme'
import PlanChecklist from './components/PlanChecklist.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlanChecklist', PlanChecklist)
  },
}
