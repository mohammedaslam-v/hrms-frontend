import { useEffect, type RefObject } from 'react'
import { fetchBlob } from '../../shared/api/client'

/**
 * Policy attachments are served behind requireAuth, and the access token lives
 * in memory as a Bearer header. A plain <img src> or <a href> cannot send that
 * header, so the browser gets a 401 — a broken image, a dead link. Every
 * attachment therefore goes through fetchBlob and is shown as a blob: URL.
 *
 * The stored policy HTML keeps the real /api/v1/company-policies/files/… URLs;
 * only the rendered DOM is swapped, so nothing temporary is ever saved.
 */
const FILES_SEGMENT = '/company-policies/files/'

export const isPolicyFileUrl = (url: string | null | undefined): url is string =>
  !!url && url.includes(FILES_SEGMENT)

// fetchBlob prepends /api/v1 itself, so hand it the path from the resource on.
const toApiPath = (url: string): string => url.slice(url.indexOf(FILES_SEGMENT))

export async function openPolicyFile(url: string, fileName?: string): Promise<void> {
  // Open the tab inside the click, before the await — a window.open after it
  // no longer counts as user-initiated and the popup blocker eats it.
  const tab = window.open('', '_blank')

  try {
    const blobUrl = URL.createObjectURL(await fetchBlob(toApiPath(url)))
    if (tab) {
      tab.opener = null
      tab.location.href = blobUrl
    } else {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName ?? ''
      a.click()
    }
    // The new tab has loaded it by then; the URL only pins memory after that.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (err) {
    tab?.close()
    window.alert(err instanceof Error ? err.message : 'Could not open the attachment.')
  }
}

/**
 * Makes attachments inside `rootRef` work: images are loaded with the token and
 * re-pointed at blob URLs, and clicks on attachment links open via openPolicyFile.
 * `html` is the rendered markup, so a new policy re-runs the image pass.
 */
export function usePolicyFiles(rootRef: RefObject<HTMLElement | null>, html: string): void {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let active = true
    const created: string[] = []

    root.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src')
      if (!isPolicyFileUrl(src)) return
      fetchBlob(toApiPath(src))
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          created.push(blobUrl)
          if (active) img.src = blobUrl
        })
        .catch(() => {
          // Leave the broken image; its alt text still names the file.
        })
    })

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest('a')
      const href = link?.getAttribute('href')
      if (!link || !isPolicyFileUrl(href)) return
      e.preventDefault()
      void openPolicyFile(href, link.getAttribute('download') ?? undefined)
    }
    root.addEventListener('click', onClick)

    return () => {
      active = false
      root.removeEventListener('click', onClick)
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [rootRef, html])
}
