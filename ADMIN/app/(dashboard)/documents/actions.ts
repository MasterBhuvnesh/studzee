'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createDocument, deleteDocument, updateDocument, type TDocumentInput } from '@/lib/backend/documents'
import { documentFormSchema } from '@/lib/schemas'

/**
 * Returns the new id rather than redirecting: the caller runs inside a
 * try/catch, which would swallow redirect()'s NEXT_REDIRECT throw and show
 * it as an error. The form navigates on the returned id instead.
 */
export async function createDocumentAction(input: TDocumentInput): Promise<string> {
  const parsed = documentFormSchema.parse(input)
  const result = await createDocument(parsed as TDocumentInput)
  revalidatePath('/documents')
  return result.doc.id as string
}

export async function updateDocumentAction(id: string, input: Partial<TDocumentInput>) {
  const parsed = documentFormSchema.partial().parse(input)
  await updateDocument(id, parsed as Partial<TDocumentInput>)
  revalidatePath('/documents')
  revalidatePath(`/documents/${id}`)
}

/**
 * Invoked through <form action=...> with no try/catch around it, so
 * redirecting here is safe.
 */
export async function deleteDocumentAction(id: string) {
  await deleteDocument(id)
  revalidatePath('/documents')
  redirect('/documents')
}
