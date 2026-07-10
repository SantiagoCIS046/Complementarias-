<template>
  <component :is="tag" class="skeleton-container" :class="variant">
    <!-- Table Skeleton -->
    <template v-if="variant === 'table'">
      <div class="skel-table-header" v-if="!hideHeader">
        <div class="skel-filters">
          <div class="skel-pill" v-for="i in 4" :key="i"></div>
        </div>
        <div class="skel-search"></div>
      </div>
      <div class="skel-table-head">
        <div class="skel-th" v-for="i in columns" :key="i"></div>
      </div>
      <div class="skel-row" v-for="r in rows" :key="r">
        <div class="skel-cell" v-for="c in columns" :key="c">
          <div class="skel-cell-inner" :style="{ width: getCellWidth(c) }"></div>
        </div>
      </div>
    </template>

    <!-- Table Body Skeleton (for rendering inside real tables) -->
    <template v-if="variant === 'table-tbody'">
      <tr class="skel-tr" v-for="r in rows" :key="r">
        <td class="skel-td" v-for="c in columns" :key="c">
          <div class="skel-cell-inner" :style="{ width: getCellWidth(c) }"></div>
        </td>
      </tr>
    </template>

    <!-- Stats Skeleton -->
    <template v-if="variant === 'stats'">
      <div class="skel-stat" v-for="i in count" :key="i">
        <div class="skel-stat-label"></div>
        <div class="skel-stat-value"></div>
        <div class="skel-stat-sub"></div>
      </div>
    </template>

    <!-- Card Skeleton -->
    <template v-if="variant === 'card'">
      <div class="skel-card" v-for="i in count" :key="i">
        <div class="skel-card-header">
          <div class="skel-avatar"></div>
          <div class="skel-card-info">
            <div class="skel-line skel-w-60"></div>
            <div class="skel-line skel-w-40 skel-sm"></div>
          </div>
        </div>
        <div class="skel-card-body">
          <div class="skel-line skel-w-100"></div>
          <div class="skel-line skel-w-80"></div>
        </div>
      </div>
    </template>

    <!-- Notification Skeleton -->
    <template v-if="variant === 'notification'">
      <div class="skel-notif" v-for="i in count" :key="i">
        <div class="skel-notif-icon"></div>
        <div class="skel-notif-content">
          <div class="skel-line skel-w-90"></div>
          <div class="skel-line skel-w-30 skel-xs"></div>
        </div>
      </div>
    </template>
  </component>
</template>

<script setup>
defineProps({
  tag: {
    type: String,
    default: 'div',
  },
  variant: {
    type: String,
    default: 'table', // table, stats, card, notification
  },
  rows: {
    type: Number,
    default: 5,
  },
  columns: {
    type: Number,
    default: 4,
  },
  count: {
    type: Number,
    default: 3,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
});

const getCellWidth = (col) => {
  const widths = ['55%', '35%', '45%', '30%', '25%'];
  return widths[(col - 1) % widths.length];
};
</script>

<style scoped>
/* ── Base Shimmer Animation ── */
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skel-line,
.skel-pill,
.skel-search,
.skel-th,
.skel-cell-inner,
.skel-stat-label,
.skel-stat-value,
.skel-stat-sub,
.skel-avatar,
.skel-notif-icon {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
  background-size: 800px 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}

/* ── Container base: siempre respeta el ancho del padre ── */
.skeleton-container {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── Table Skeleton ── */
.skel-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.skel-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.skel-pill {
  width: 64px;
  max-width: 18%;
  height: 28px;
  border-radius: 6px;
  flex-shrink: 1;
}

.skel-search {
  width: min(200px, 35%);
  height: 30px;
  border-radius: 6px;
  flex-shrink: 1;
}

.skel-table-head {
  display: flex;
  gap: 0;
  padding: 0;
  background: #e8f5e9;
  width: 100%;
  box-sizing: border-box;
}

.skel-th {
  flex: 1;
  min-width: 0;
  height: 40px;
  margin: 0;
  border-radius: 0;
  background: linear-gradient(90deg, #c8e6c9 25%, #a5d6a7 37%, #c8e6c9 63%);
  background-size: 800px 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

.skel-row {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafc;
  gap: 16px;
}

.skel-row:nth-child(even) {
  background: #fafbfc;
}

.skel-cell {
  flex: 1;
}

.skel-cell-inner {
  height: 14px;
}

.skel-tr {
  border-bottom: 1px solid #e2e8f0;
}
.skel-tr:nth-child(even) {
  background: #f8fafc;
}
.skel-td {
  padding: 12px 16px;
}

/* ── Stats Skeleton ── */
.skeleton-container.stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skel-stat {
  background: #fff;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  border-left: 4px solid #e2e8f0;
  min-width: 120px;
  flex: 1;
}

.skel-stat-label {
  width: 80%;
  height: 10px;
  margin-bottom: 10px;
}

.skel-stat-value {
  width: 40%;
  height: 24px;
  margin-bottom: 8px;
}

.skel-stat-sub {
  width: 65%;
  height: 10px;
}

/* ── Card Skeleton ── */
.skeleton-container.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skel-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  padding: 16px;
}

.skel-card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.skel-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skel-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skel-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Notification Skeleton ── */
.skel-notif {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f8fafc;
  align-items: flex-start;
}

.skel-notif-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

.skel-notif-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Shared Line Widths ── */
.skel-line {
  height: 12px;
}

.skel-sm { height: 10px; }
.skel-xs { height: 8px; }

.skel-w-30 { width: 30%; }
.skel-w-40 { width: 40%; }
.skel-w-60 { width: 60%; }
.skel-w-80 { width: 80%; }
.skel-w-90 { width: 90%; }
.skel-w-100 { width: 100%; }
</style>
