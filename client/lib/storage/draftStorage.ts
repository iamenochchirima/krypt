import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface DraftDB extends DBSchema {
  drafts: {
    key: string
    value: {
      id: string
      formData: any
      collectionImage?: {
        name: string
        type: string
        size: number
        data: ArrayBuffer
      }
      bannerImage?: {
        name: string
        type: string
        size: number
        data: ArrayBuffer
      }
      nftAssets?: Array<{
        name: string
        type: string
        size: number
        data: ArrayBuffer
      }>
      lastUpdated: number
      blockchain: string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<DraftDB>>

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DraftDB>('nft-drafts', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export async function saveDraft(
  draftId: string,
  formData: any,
  collectionImage?: File,
  bannerImage?: File,
  nftAssets?: FileList | File[]
) {
  const db = await getDB()

  const blockchain = draftId.split('-')[0]

  const draft: any = {
    id: draftId,
    formData,
    lastUpdated: Date.now(),
    blockchain: blockchain,
  }

  if (collectionImage) {
    const buffer = await collectionImage.arrayBuffer()
    draft.collectionImage = {
      name: collectionImage.name,
      type: collectionImage.type,
      size: collectionImage.size,
      data: buffer,
    }
  }

  if (bannerImage) {
    const buffer = await bannerImage.arrayBuffer()
    draft.bannerImage = {
      name: bannerImage.name,
      type: bannerImage.type,
      size: bannerImage.size,
      data: buffer,
    }
  }

  if (nftAssets && nftAssets.length > 0) {
    draft.nftAssets = await Promise.all(
      Array.from(nftAssets).map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await file.arrayBuffer(),
      }))
    )
  }

  await db.put('drafts', draft)
}

export async function loadDraft(draftId: string) {
  const db = await getDB()
  const draft = await db.get('drafts', draftId)

  if (!draft) return null

  const result: any = {
    formData: draft.formData,
    lastUpdated: draft.lastUpdated,
  }

  if (draft.collectionImage) {
    const blob = new Blob([draft.collectionImage.data], { type: draft.collectionImage.type })
    result.collectionImage = new File([blob], draft.collectionImage.name, {
      type: draft.collectionImage.type,
    })
  }

  if (draft.bannerImage) {
    const blob = new Blob([draft.bannerImage.data], { type: draft.bannerImage.type })
    result.bannerImage = new File([blob], draft.bannerImage.name, {
      type: draft.bannerImage.type,
    })
  }

  if (draft.nftAssets) {
    result.nftAssets = draft.nftAssets.map((asset) => {
      const blob = new Blob([asset.data], { type: asset.type })
      return new File([blob], asset.name, { type: asset.type })
    })
  }

  return result
}

export async function deleteDraft(draftId: string) {
  const db = await getDB()
  await db.delete('drafts', draftId)
}

export async function getAllDrafts() {
  const db = await getDB()
  return db.getAll('drafts')
}
