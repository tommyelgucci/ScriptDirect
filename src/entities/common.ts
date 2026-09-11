import { z } from 'zod'

/** ISO 8601 timestamp, e.g. "2026-08-18T12:00:00.000Z". */
export const isoTimestampSchema = z.iso.datetime()

/** A 0-100 score used by Pulso (SceneMetric) fields. */
export const scoreSchema = z.number().min(0).max(100)
