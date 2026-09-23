<script setup lang="ts">
type AssistanceStatus = 'Released' | 'For Release' | 'Pending' | 'Scheduled'

type AssistanceProgram = {
    id: string
    program: string
    recipient: string
    barangay: string
    items: string
    value: number
    date: string
    status: AssistanceStatus
}

const assistancePrograms: AssistanceProgram[] = [
    {
        id: 'AST-001',
        program: 'Rice Seed Subsidy',
        recipient: 'Rosa Dizon',
        barangay: 'Sindalan',
        items: '4 bags certified rice seed (40 kg), 1 bag fertilizer',
        value: 5200,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        id: 'AST-002',
        program: 'Rice Seed Subsidy',
        recipient: 'Jose Mendoza',
        barangay: 'Sto. Niño',
        items: '5 bags certified rice seed (40 kg), 2 bags urea',
        value: 7800,
        date: '2024-11-05',
        status: 'Released',
    },
    {
        id: 'AST-003',
        program: 'Corn Seed Assistance',
        recipient: 'Arturo Salazar',
        barangay: 'Pulung Bulu',
        items: '3 bags hybrid corn seed, 1 bag complete fertilizer',
        value: 6400,
        date: '2024-11-12',
        status: 'Released',
    },
    {
        id: 'AST-004',
        program: 'Veggie Growers Kit',
        recipient: 'Ana Reyes',
        barangay: 'Calulut',
        items: 'Assorted vegetable seeds, organic fertilizers, drip hoses',
        value: 3850,
        date: '2024-11-18',
        status: 'For Release',
    },
    {
        id: 'AST-005',
        program: 'Farm Machinery Access',
        recipient: 'Carlos Garcia',
        barangay: 'Pulung Bulu',
        items: 'Tractor service (2 ha), 1 pump engine rental',
        value: 9400,
        date: '2024-11-22',
        status: 'For Release',
    },
    {
        id: 'AST-006',
        program: 'Livelihood Starter Pack',
        recipient: 'Liza Ramos',
        barangay: 'Dolores',
        items: 'Feeds, 10 native chickens, starter housing',
        value: 15000,
        date: '2024-11-28',
        status: 'Pending',
    },
    {
        id: 'AST-007',
        program: 'Training - Rice Production',
        recipient: 'Elena Bautista',
        barangay: 'San Pedro',
        items: 'Capacity building (3-day), training kits',
        value: 2500,
        date: '2024-12-05',
        status: 'Scheduled',
    },
    {
        id: 'AST-008',
        program: 'Soil Amendment Support',
        recipient: 'Fe Domingo',
        barangay: 'Del Pilar',
        items: '10 bags biochar, 5 bags lime',
        value: 4600,
        date: '2024-12-08',
        status: 'Pending',
    },
]

const STATUS_STYLE: Record<AssistanceStatus, string> = {
    Released: 'status-cultivated',
    'For Release': 'status-preparation',
    Pending: 'status-harvesting',
    Scheduled: 'status-idle',
}

const kpis = computed(() => [
    {
        label: 'Total Programs',
        val: assistancePrograms.length,
        icon: 'i-lucide-hand-heart',
        color: '#2d6a2d',
        bg: '#e8f5e8',
    },
    {
        label: 'Released',
        val: assistancePrograms.filter((a) => a.status === 'Released').length,
        icon: 'i-lucide-check-circle',
        color: '#16a34a',
        bg: '#dcfce7',
    },
    {
        label: 'Pending Release',
        val: assistancePrograms.filter((a) => a.status !== 'Released').length,
        icon: 'i-lucide-clock',
        color: '#ca8a04',
        bg: '#fef3c7',
    },
    {
        label: 'Total Value (₱)',
        val: `${assistancePrograms
            .reduce((acc, a) => acc + a.value, 0)
            .toLocaleString()}`,
        icon: 'i-lucide-package',
        color: '#1d6fa4',
        bg: '#e0f0fb',
    },
])
</script>

<template>
    <div class="space-y-6 p-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">
                    Assistance Programs
                </h1>
                <p class="mt-0.5 text-sm text-gray-500">
                    Seed, fertilizer, training, and livelihood support
                </p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-[#2d6a2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#245524]"
            >
                <UIcon name="i-lucide-hand-heart" class="size-3.5" />
                Record Assistance
            </button>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-4 gap-4">
            <div v-for="kpi in kpis" :key="kpi.label" class="alps-card p-5">
                <div
                    class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    :style="{ background: kpi.bg }"
                >
                    <UIcon
                        :name="kpi.icon"
                        class="size-[18px]"
                        :style="{ color: kpi.color }"
                    />
                </div>
                <div
                    class="text-2xl font-bold font-sans"
                    :style="{
                        color: kpi.color,
                    }"
                >
                    {{ kpi.val }}
                </div>
                <div class="text-xs text-gray-500">{{ kpi.label }}</div>
            </div>
        </div>

        <div class="alps-card overflow-hidden">
            <div class="border-b border-gray-100 px-5 py-4">
                <h3 class="text-sm font-semibold text-gray-700">
                    Assistance Records
                </h3>
            </div>
            <table class="w-full text-xs">
                <thead class="border-b border-gray-100 bg-gray-50">
                    <tr>
                        <th
                            class="px-5 py-3 text-left font-semibold text-gray-600"
                        >
                            ID
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Program
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Recipient
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Barangay
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Items
                        </th>
                        <th
                            class="px-4 py-3 text-right font-semibold text-gray-600"
                        >
                            Value (₱)
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Date
                        </th>
                        <th
                            class="px-4 py-3 text-left font-semibold text-gray-600"
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="a in assistancePrograms"
                        :key="a.id"
                        class="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                        <td class="px-5 py-3 font-mono text-gray-400">
                            {{ a.id }}
                        </td>
                        <td class="px-4 py-3 font-medium text-gray-800">
                            {{ a.program }}
                        </td>
                        <td class="px-4 py-3 text-gray-700">
                            {{ a.recipient }}
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            {{ a.barangay }}
                        </td>
                        <td class="max-w-xs truncate px-4 py-3 text-gray-600">
                            {{ a.items }}
                        </td>
                        <td
                            class="px-4 py-3 text-right font-mono font-medium text-green-700"
                        >
                            {{
                                a.value > 0
                                    ? `₱${a.value.toLocaleString()}`
                                    : '—'
                            }}
                        </td>
                        <td class="px-4 py-3 text-gray-500">
                            <span class="flex items-center gap-1">
                                <UIcon
                                    name="i-lucide-calendar"
                                    class="size-[10px] text-gray-400"
                                />
                                {{ a.date }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span
                                :class="STATUS_STYLE[a.status] || 'status-idle'"
                                class="rounded px-2 py-0.5 text-[10px] font-medium"
                            >
                                {{ a.status }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
