<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: { label: string; value: string }[]
  title?: string
  placeholder?: string
}>(), {
  title: '选择参与人',
  placeholder: '搜索',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const showModal = ref(false)
const searchKey = ref('')
const selected = ref<string[]>([...props.modelValue])

watch(() => props.modelValue, (val) => {
  selected.value = [...val]
})

const displayAvatars = computed(() => props.modelValue.slice(0, 3))
const overflowCount = computed(() => Math.max(0, props.modelValue.length - 3))

const filteredOptions = computed(() => {
  const q = searchKey.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o =>
    o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
  )
})

function openModal() {
  selected.value = [...props.modelValue]
  searchKey.value = ''
  showModal.value = true
}

function cancel() {
  showModal.value = false
}

function confirm() {
  emit('update:modelValue', [...selected.value])
  showModal.value = false
}

function toggleOption(value: string) {
  const idx = selected.value.indexOf(value)
  if (idx === -1) {
    selected.value.push(value)
  } else {
    selected.value.splice(idx, 1)
  }
}

function removeSelected(value: string) {
  const idx = selected.value.indexOf(value)
  if (idx !== -1) {
    selected.value.splice(idx, 1)
  }
}

function isSelected(value: string): boolean {
  return selected.value.includes(value)
}

function getSelectedLabel(value: string): string {
  const opt = props.options.find(o => o.value === value)
  return opt ? opt.label : value
}
</script>

<template>
  <div class="user-select">
    <!-- Collapsed display: avatar stack -->
    <div class="user-select__avatars" @click="openModal">
      <div
        v-for="name in displayAvatars"
        :key="name"
        class="user-select__avatar"
        :style="{ background: getAvatarColor(name) }"
        :title="name"
      >
        {{ getInitials(name) }}
      </div>
      <div v-if="overflowCount > 0" class="user-select__overflow">
        +{{ overflowCount }}
      </div>
    </div>
    <!-- Add button -->
    <div class="user-select__add" @click="openModal">+</div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="user-select-modal-overlay"
        @click.self="cancel"
      >
        <div class="user-select-modal">
          <!-- Header -->
          <div class="user-select-modal__header">
            <span class="user-select-modal__title">{{ title }}</span>
            <button
              class="user-select-modal__confirm-btn"
              @click="confirm"
            >
              确定{{ selected.length > 0 ? ` (${selected.length})` : '' }}
            </button>
          </div>

          <!-- Selected chips -->
          <div v-if="selected.length > 0" class="user-select-modal__selected">
            <div
              v-for="name in selected"
              :key="name"
              class="user-select-modal__chip"
            >
              <span
                class="user-select-modal__chip-avatar"
                :style="{ background: getAvatarColor(name) }"
              >{{ getInitials(name) }}</span>
              <span>{{ getSelectedLabel(name) }}</span>
              <span class="user-select-modal__chip-remove" @click.stop="removeSelected(name)">&times;</span>
            </div>
          </div>

          <!-- Search -->
          <div class="user-select-modal__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchKey"
              class="user-select-modal__search-input"
              :placeholder="placeholder"
              type="text"
            />
          </div>

          <!-- List -->
          <div class="user-select-modal__list">
            <div
              v-for="opt in filteredOptions"
              :key="opt.value"
              class="user-select-modal__item"
              :class="{ 'user-select-modal__item--selected': isSelected(opt.value) }"
              @click="toggleOption(opt.value)"
            >
              <span
                class="user-select-modal__item-avatar"
                :style="{ background: getAvatarColor(opt.value) }"
              >{{ getInitials(opt.value) }}</span>
              <span class="user-select-modal__item-name">{{ opt.label }}</span>
              <span class="user-select-modal__item-check">
                <svg v-if="isSelected(opt.value)" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="9" fill="#10b981"/>
                  <path d="M6 10l3 3 5-5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg v-else width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="#d1d5db" stroke-width="2" fill="none"/>
                </svg>
              </span>
            </div>
            <div v-if="filteredOptions.length === 0" class="user-select-modal__empty">
              暂无结果
            </div>
          </div>

          <!-- Footer -->
          <div class="user-select-modal__footer">
            <button class="user-select-modal__footer-btn" @click="cancel">取消</button>
            <button class="user-select-modal__footer-btn user-select-modal__footer-btn--primary" @click="confirm">
              确定{{ selected.length > 0 ? ` (${selected.length})` : '' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
