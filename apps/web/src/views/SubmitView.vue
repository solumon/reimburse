<script setup lang="ts">
import { computed, ref } from 'vue';

import ReimbursementForm from '@/features/reimbursements/ReimbursementForm.vue';

const copied = ref('');
const today = new Date();
const progress = computed(() => Math.min(100, Math.round((today.getDate() / 7) * 100)));
const daysText = computed(() => today.getDate() <= 7 ? `距截止 ${7 - today.getDate()} 天` : '本月提交期已过');

async function copy(label: string, value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
  copied.value = `${label}已复制`;
  setTimeout(() => { copied.value = ''; }, 1800);
}
</script>

<template>
  <section class="two-col">
    <div class="main-col">
      <article class="card">
        <div class="card-title">报销规则 & 发票抬头</div>
        <div class="rule-list">
          <div class="rule-item"><span class="rule-check">✓</span><span>仅报销 <b>晚上 22:00 之后</b> 的加班打车费用</span></div>
          <div class="rule-item"><span class="rule-check">✓</span><span>需提供 <b>企微打卡截图</b></span></div>
          <div class="rule-item"><span class="rule-check">✓</span><span>需提供 <b>打车发票 + 行程单</b></span></div>
          <div class="rule-item"><span class="rule-check">✓</span><span>每月第一周统一提交报销</span></div>
        </div>
        <div class="info-rows company-info">
          <div class="info-row"><span class="label">公司抬头</span><span class="value">北京天学网教育科技股份有限公司</span><button class="copy-btn" type="button" @click="copy('公司抬头', '北京天学网教育科技股份有限公司')">复制</button></div>
          <div class="info-row"><span class="label">税号</span><span class="value">9111 0108 5768 5233 77</span><button class="copy-btn" type="button" @click="copy('税号', '911101085768523377')">复制</button></div>
        </div>
        <p v-if="copied" class="success">{{ copied }}</p>
      </article>
      <article class="card">
        <div class="card-title">提交报销</div>
        <ReimbursementForm />
      </article>
    </div>
    <aside class="side-col">
      <article class="card">
        <div class="card-title">本月报销进度</div>
        <div class="deadline">每月 7 日前</div>
        <div class="progress"><span :style="{ width: `${progress}%` }" /></div>
        <div class="progress-meta"><span>{{ progress }}%</span><span>{{ daysText }}</span></div>
        <p class="audit-tip"><b>人事财务审核中</b>，报销后会第一时间转账，请耐心等待。</p>
      </article>
      <article class="card">
        <div class="card-title">发票获取小贴士</div>
        <div class="rule-item"><span class="rule-check">1</span><span><b>滴滴发票及行程单：</b>我的 → 全部订单 → 开发票 → 网约车。</span></div>
        <div class="rule-item tip"><span class="rule-check">2</span><span><b>企微打卡截图：</b>工作台 → 打卡 → 统计 → 截图。</span></div>
      </article>
    </aside>
  </section>
</template>

<style scoped lang="scss">
.company-info { margin-top: 16px; }
.deadline { color: #dc2626; text-align: right; font-weight: 500; }
.progress { height: 8px; overflow: hidden; margin-top: 12px; border-radius: 4px; background: #e5e7eb; span { display: block; height: 100%; background: #4f46e5; } }
.progress-meta { display: flex; justify-content: space-between; margin-top: 10px; color: #6b7280; }
.audit-tip { margin-top: 14px; padding: 8px 10px; border-left: 3px solid #4f46e5; border-radius: 6px; background: #f9fafb; color: #6b7280; font-size: 12px; b { color: #4f46e5; } }
.tip { margin-top: 12px; }
</style>
