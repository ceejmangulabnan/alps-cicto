import { defineNuxtPlugin } from '#app'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
    CanvasRenderer,
    PieChart,
    LineChart,
    BarChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
])

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('VChart', VChart)
})
