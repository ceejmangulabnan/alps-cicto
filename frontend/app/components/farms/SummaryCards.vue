<script setup lang="ts">
interface SummaryCard {
    label: string
    /** Pre-formatted: counts and formatted areas are both valid. */
    val: string | number
    color: string
    bg: string
    icon: string
}

defineProps<{
    cards: SummaryCard[]
}>()
</script>

<template>
    <div class="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
            v-for="card in cards"
            :key="card.label"
            class="alps-card relative overflow-hidden p-4"
        >
            <div
                class="absolute inset-x-0 top-0 h-0.5 opacity-70"
                :style="{
                    backgroundImage: `linear-gradient(90deg, ${card.color}, transparent)`,
                }"
            />
            <div
                class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                :style="{ background: card.bg }"
            >
                <UIcon
                    :name="card.icon"
                    class="size-4.5"
                    :style="{ color: card.color }"
                />
            </div>
            <div
                class="mb-1 text-xl font-bold font-sans"
                :style="{ color: card.color }"
            >
                {{ card.val }}
            </div>
            <div class="text-xs text-gray-500">{{ card.label }}</div>
        </div>
    </div>
</template>
