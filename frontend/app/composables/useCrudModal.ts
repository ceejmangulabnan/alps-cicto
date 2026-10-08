import { onScopeDispose, watch } from 'vue'
import { getErrorMessage } from '~/utils/apiError'

/**
 * The state machine behind every create/edit modal on the registry pages:
 * opening clears the previous outcome, submit runs the caller's work, the
 * saved tick shows for 900ms, then the modal closes — twelve near identical
 * copies across four pages collapse into this.
 *
 * `open` belongs to the caller (a page or modal component), so opening stays
 * a plain boolean flip; the composable layers submitting/error/saved and the
 * auto-close timer on top.
 */
export interface CrudModalOptions {
    /** The API calls to run on submit; rejects with the error to surface. */
    submit: () => Promise<void>
    /** Runs after a successful save, e.g. re-reading the registry. */
    onSaved?: () => Promise<void> | void
    /** Runs each time the modal opens, e.g. to reset the form fields. */
    onOpen?: () => void
    /** Shown when the submit work rejects without a server message. */
    failureMessage: string
}

export function useCrudModal(open: Ref<boolean>, options: CrudModalOptions) {
    const submitting = ref(false)
    const error = ref<string | null>(null)
    const saved = ref(false)

    let closeTimer: ReturnType<typeof setTimeout> | null = null

    const clearCloseTimer = () => {
        if (closeTimer) {
            clearTimeout(closeTimer)

            closeTimer = null
        }
    }

    watch(open, (value) => {
        if (!value) return

        error.value = null
        saved.value = false

        options.onOpen?.()
    })

    /** Closes the modal, unless a save is still in flight. */
    function close() {
        if (submitting.value) return

        clearCloseTimer()

        saved.value = false
        open.value = false
    }

    async function submit() {
        error.value = null
        submitting.value = true

        try {
            await options.submit()

            saved.value = true

            closeTimer = setTimeout(() => {
                closeTimer = null
                saved.value = false
                open.value = false
            }, 900)

            await options.onSaved?.()
        } catch (cause) {
            error.value = getErrorMessage(cause, options.failureMessage)
        } finally {
            submitting.value = false
        }
    }

    onScopeDispose(() => clearCloseTimer())

    return { submitting, error, saved, close, submit }
}
