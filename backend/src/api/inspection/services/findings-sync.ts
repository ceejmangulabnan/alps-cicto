import type { Core } from '@strapi/strapi'

import { extractDocumentId } from '../../farm/services/farm-code'

/**
 * Keeps an inspection's linked risk reports in step with its findings.
 *
 * An inspection is where a risk is observed, so it owns one report per finding:
 * the form sends a `findings` list and the server reconciles the reports against
 * it. Inspections are the only writer of these reports' risk fields — a report
 * filed here can be edited from the risks page but not deleted there, so the
 * invariant ("a risk seen in the field has a report") cannot be broken from the
 * outside.
 *
 * `findings` is deliberately not a schema attribute. The inspection owns no
 * risk columns: the level shown in the registry is the worst severity among the
 * linked reports, derived on read. The key only exists on the way in, which is
 * why it is registered as an extra root input param below — without that the
 * core controller would reject the unknown key before this middleware ran.
 */
const INSPECTION_UID = 'api::inspection.inspection'
const RISK_REPORT_UID = 'api::risk-report.risk-report'

type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

interface InspectionFindingInput {
    reportDocumentId?: string | null
    risk_type: string
    severity: Severity
}

interface ReconcileInput {
    inspectionDocumentId?: string
    parcelDocumentId?: string
    observedAt: string
    findings: InspectionFindingInput[]
    existingReportIds: string[]
}

/**
 * Registers the `findings` input key and the inspection documents middleware.
 * Called from `register()`, before routing, so the input param is merged into
 * the create/update routes when `initRouting()` runs.
 */
export function registerInspectionFindings(strapi: Core.Strapi) {
    strapi.contentAPI.addInputParams({
        findings: {
            schema: (z) =>
                z
                    .array(
                        z.object({
                            reportDocumentId: z.string().nullish(),
                            risk_type: z.string().min(1),
                            severity: z.enum([
                                'Low',
                                'Medium',
                                'High',
                                'Critical',
                            ]),
                        })
                    )
                    .optional(),
            matchRoute: (route) =>
                route.handler === `${INSPECTION_UID}.create` ||
                route.handler === `${INSPECTION_UID}.update`,
        },
    })

    strapi.documents.use(async (ctx, next) => {
        if (ctx.uid !== INSPECTION_UID) return next()
        if (ctx.action !== 'create' && ctx.action !== 'update') return next()

        const data = ctx.params?.data as Record<string, unknown> | undefined
        if (!data || typeof data !== 'object' || !('findings' in data)) {
            return next()
        }

        const findings = Array.isArray(data.findings)
            ? (data.findings as InspectionFindingInput[])
            : []

        // Peeled off before `next()` so it never reaches the database layer.
        delete data.findings

        let existingReportIds: string[] = []
        let parcelDocumentId = extractDocumentId(data.parcel)

        // Read the reports before the update so the dropped ones can be found
        // and deleted after it. The update itself need not populate them.
        if (ctx.action === 'update' && ctx.params?.documentId) {
            const current = (await strapi
                .documents(INSPECTION_UID)
                .findOne({
                    documentId: ctx.params.documentId,
                    populate: ['risk_reports'],
                })) as {
                parcel?: unknown
                risk_reports?: { documentId: string }[]
            } | null

            existingReportIds = (current?.risk_reports ?? []).map(
                (report) => report.documentId
            )
            parcelDocumentId =
                parcelDocumentId ?? extractDocumentId(current?.parcel)
        }

        const result = (await next()) as { documentId?: unknown; date?: unknown }

        const inspectionDocumentId =
            extractDocumentId(result?.documentId) ??
            (ctx.params?.documentId as string | undefined)

        const observedAt =
            (typeof result?.date === 'string' ? result.date : undefined) ??
            (typeof data.date === 'string' ? data.date : undefined) ??
            new Date().toISOString().slice(0, 10)

        await reconcileInspectionFindings(strapi, {
            inspectionDocumentId,
            parcelDocumentId,
            observedAt,
            findings,
            existingReportIds,
        })

        return result
    })
}

/**
 * Creates the reports a finding list implies, updates the ones it kept and
 * deletes the ones it dropped. `parcel_status` is never written here, so an
 * intervention opened from the risks page survives an inspection edit.
 */
async function reconcileInspectionFindings(
    strapi: Core.Strapi,
    {
        inspectionDocumentId,
        parcelDocumentId,
        observedAt,
        findings,
        existingReportIds,
    }: ReconcileInput
): Promise<void> {
    if (!inspectionDocumentId) return

    const kept = new Set(
        findings
            .map((finding) => finding.reportDocumentId)
            .filter((id): id is string => Boolean(id))
    )

    for (const reportDocumentId of existingReportIds) {
        if (!kept.has(reportDocumentId)) {
            await strapi
                .documents(RISK_REPORT_UID)
                .delete({ documentId: reportDocumentId, status: 'published' })
        }
    }

    for (const finding of findings) {
        const riskType = finding.risk_type?.trim()
        if (!riskType) continue

        const shared = {
            risk_type: riskType,
            severity: finding.severity,
            observed_at: observedAt,
            inspection: inspectionDocumentId,
            ...(parcelDocumentId ? { farm_parcel: parcelDocumentId } : {}),
        }

        if (finding.reportDocumentId) {
            await strapi.documents(RISK_REPORT_UID).update({
                documentId: finding.reportDocumentId,
                data: shared,
                status: 'published',
            })
            continue
        }

        await strapi.documents(RISK_REPORT_UID).create({
            data: { ...shared, parcel_status: 'Active' },
            status: 'published',
        })
    }
}
