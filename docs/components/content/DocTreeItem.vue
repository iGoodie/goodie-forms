<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <li class="tree-item">
    <div class="tree-line">
      <span class="tree-title">{{ title }}</span>

      <span class="tree-content">
        <slot />
      </span>
    </div>
  </li>
</template>

<style scoped>
.tree-item {
  margin-left: 10px;
  list-style: none;
  position: relative;
  padding-left: 1.5rem;
}

/* Vertical line */
.tree-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0.6rem;
  bottom: 0;
  width: 1px;
  background: var(--ui-border-muted);
}

/* Horizontal connector */
.tree-line {
  padding-left: 10px;
  position: relative;
  /* display: flex; */
  align-items: baseline;
  gap: 0.25rem;
}

.tree-line::before {
  content: "";
  position: absolute;
  left: -0.9rem;
  top: 0.9em;
  width: 0.9rem;
  height: 1px;
  background: var(--ui-border-muted);
}

/* Remove vertical line for last child */
.tree-item:last-child::before {
  height: 0.9em;
}

.tree-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-primary, #3b82f6);
  white-space: nowrap;
}

.tree-content {
  margin-left: 6px;
  display: inline;
  font-size: 14px;
  color: var(--ui-text-muted);
  flex: 1;
  min-width: 0;
}

/* Children container */
.tree-children {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-top: 0.25rem;
}
</style>
