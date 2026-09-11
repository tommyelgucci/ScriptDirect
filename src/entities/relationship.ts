import { z } from 'zod'
import { idSchema } from './id'

export const relationshipTypeSchema = z.enum(['family', 'friendship', 'romance', 'rivalry', 'other'])
export type RelationshipType = z.infer<typeof relationshipTypeSchema>

export const relationshipSchema = z
  .object({
    id: idSchema('rel'),
    characterAId: idSchema('chr'),
    characterBId: idSchema('chr'),
    type: relationshipTypeSchema,
    description: z.string().optional(),
  })
  .refine((relationship) => relationship.characterAId !== relationship.characterBId, {
    message: 'A relationship must connect two different characters',
    path: ['characterBId'],
  })
export type Relationship = z.infer<typeof relationshipSchema>
