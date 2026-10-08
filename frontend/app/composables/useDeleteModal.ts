import { ref } from 'vue'
import { getErrorMessage } from '~/utils/apiError'

/**
 * The confirm-to-delete flow the registry pages share: hold the row being
 * removed, guard close while the delete is in flight, then reload on success.
 */
export interface DeleteModalOptions<T> {
    /** Performs the delete for the confirmed row. */
    remove: (target: T) => Promise<void>
    /** Runs after a successful delete, e.g. re-reading the registry. */
    onDeleted?: () => Promise<void> | void
    /** Shown when the delete rejects without a server message. */
    failureMessage: string
}

export function useDeleteModal<T>(options: DeleteModalOptions<T>) {
    const open = ref(false)
    const target = ref<T | null>(null)
    const deleting = ref(false)
    const error = ref<string | null>(null)

    /** Arms the modal on the row to delete. */
    function ask(row: T) {
        target.value = row
        error.value = null
        open.value = true
    }

    /** Backs out of the confirm, unless the delete is already running. */
    function close() {
        if (deleting.value) return

        target.value = null
        open.value = false
    }

    async function confirm() {
        const row = target.value

        if (!row) return

        deleting.value = true
        error.value = null

        try {
            await options.remove(row)

            target.value = null
            open.value = false

            await options.onDeleted?.()
        } catch (cause) {
            error.value = getErrorMessage(cause, options.failureMessage)
        } finally {
            deleting.value = false
        }
    }

    return { open, target, deleting, error, ask, close, confirm }
}
