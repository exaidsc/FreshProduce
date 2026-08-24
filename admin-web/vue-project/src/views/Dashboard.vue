<template>
  <div>
    <!-- 数据面板 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8"><el-card>今日订单量：<b style="color: red;">120</b></el-card></el-col>
      <el-col :span="8"><el-card>交易总额：<b style="color: red;">¥ 58,900</b></el-card></el-col>
      <el-col :span="8"><el-card>在售商品：<b style="color: red;">56</b></el-card></el-col>
    </el-row>

    <!-- 折线图和柱状图容器 -->
    <div style="display: flex; gap: 20px;">
      <div id="lineChart" style="width: 50%; height: 400px; background: #fff;"></div>
      <div id="barChart" style="width: 50%; height: 400px; background: #fff;"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import * as echarts from 'echarts'

onMounted(() => {
  // 折线图：日/月订单量
  const lineChart = echarts.init(document.getElementById('lineChart'))
  lineChart.setOption({
    title: { text: '近7日订单趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 132, 101, 134, 90, 230, 210], type: 'line', smooth: true }]
  })

  // 柱状图：商品销量排行
  const barChart = echarts.init(document.getElementById('barChart'))
  barChart.setOption({
    title: { text: '商品销量 Top 5' },
    xAxis: { type: 'category', data: ['苹果', '香蕉', '西瓜', '桃子', '草莓'] },
    yAxis: { type: 'value' },
    series: [{ data: [200, 150, 80, 60, 40], type: 'bar' }]
  })
})
</script>