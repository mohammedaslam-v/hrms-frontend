import { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { policiesApi } from '../policies.api'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: number | string
  onFileUploaded?: (attachment: {
    url: string
    key: string
    fileName: string
    fileSize: number
    mimeType: string
  }) => void
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write the policy details here...',
  readOnly = false,
  minHeight = 220,
  onFileUploaded,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInternalChange = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Trigger file attachment picker
  const handleAttachClick = () => {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  // Handle file upload and embed into editor
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setUploadError(null)

      const result = await policiesApi.uploadAttachment(file)
      onFileUploaded?.(result)

      if (quillRef.current) {
        const quill = quillRef.current
        const selection = quill.getSelection()
        const index = selection ? selection.index : Math.max(0, quill.getLength() - 1)

        if (file.type.startsWith('image/')) {
          // Embed image directly
          quill.clipboard.dangerouslyPasteHTML(
            index,
            `<p><img src="${result.url}" alt="${result.fileName}" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" /></p><p><br></p>`,
          )
        } else {
          // Embed interactive document download card
          const isPdf = file.name.toLowerCase().endsWith('.pdf')
          const iconChar = isPdf ? '📄' : '📎'
          const cardHtml = `
            <div class="policy-attachment-card" data-url="${result.url}" data-name="${result.fileName}" data-size="${result.fileSize}" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #3B49A8; border-radius: 10px; padding: 12px 16px; margin: 14px 0; user-select: none;">
              <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                <span style="width: 36px; height: 36px; border-radius: 8px; background: #EEF2FF; color: #3B49A8; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">${iconChar}</span>
                <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                  <strong style="font-size: 13.5px; color: #1E293B; word-break: break-all;">${result.fileName}</strong>
                  <span style="font-size: 11.5px; color: #64748B;">${formatBytes(result.fileSize)} · Attachment</span>
                </div>
              </div>
              <a href="${result.url}" target="_blank" rel="noopener noreferrer" download="${result.fileName}" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 6px; background: #3B49A8; color: #FFFFFF !important; font-size: 12.5px; font-weight: 600; text-decoration: none; flex-shrink: 0;">
                Download ⤓
              </a>
            </div>
            <p><br></p>
          `
          quill.clipboard.dangerouslyPasteHTML(index, cardHtml)
        }

        isInternalChange.current = true
        onChange(quill.root.innerHTML)
        setTimeout(() => {
          isInternalChange.current = false
        }, 0)
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload attachment.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || quillRef.current) return

    const editorHost = document.createElement('div')
    container.appendChild(editorHost)

    const toolbarConfig = readOnly
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ]

    const quill = new Quill(editorHost, {
      theme: 'snow',
      placeholder,
      readOnly,
      modules: {
        toolbar: toolbarConfig,
      },
    })

    if (value) {
      quill.root.innerHTML = value
    }

    quill.on('text-change', () => {
      isInternalChange.current = true
      const html = quill.root.innerHTML
      const isEmpty = quill.getText().trim().length === 0 && !quill.root.querySelector('img') && !quill.root.querySelector('.policy-attachment-card')
      onChange(isEmpty ? '' : html)
      setTimeout(() => {
        isInternalChange.current = false
      }, 0)
    })

    quillRef.current = quill

    return () => {
      quillRef.current = null
      if (container) {
        container.innerHTML = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, readOnly])

  useEffect(() => {
    if (quillRef.current && !isInternalChange.current) {
      const currentHtml = quillRef.current.root.innerHTML
      if (value !== currentHtml) {
        quillRef.current.root.innerHTML = value || ''
      }
    }
  }, [value])

  return (
    <div
      className="rich-text-editor-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Hidden file input for document attachment */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp"
      />

      {/* Editor top helper bar with Attach File button */}
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FAF7F2',
            border: '1px solid var(--border, #E4DDD3)',
            borderBottom: 'none',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            padding: '6px 12px',
            fontSize: 12.5,
          }}
        >
          <span style={{ color: '#78716C', fontWeight: 500 }}>
            Formatting & Content Toolbar
          </span>

          <button
            type="button"
            onClick={handleAttachClick}
            disabled={uploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12,
              fontWeight: 600,
              cursor: uploading ? 'wait' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            title="Attach a PDF, document, or image to embed into policy content"
          >
            <span>📎</span>
            <span>{uploading ? 'Uploading…' : 'Attach File / PDF'}</span>
          </button>
        </div>
      )}

      {/* Uploading progress notification */}
      {uploading && (
        <div
          style={{
            padding: '8px 12px',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⏳</span>
          <span>Uploading and attaching file to policy content…</span>
        </div>
      )}

      {/* Upload error notice */}
      {uploadError && (
        <div
          style={{
            padding: '8px 12px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: 12.5,
          }}
        >
          ⚠️ {uploadError}
        </div>
      )}

      {/* Quill container */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      />

      <style>{`
        .rich-text-editor-container .ql-toolbar.ql-snow {
          border: 1px solid var(--border, #E4DDD3);
          background: #FAF7F2;
          padding: 8px 10px;
          font-family: inherit;
        }
        .rich-text-editor-container .ql-container.ql-snow {
          border: 1px solid var(--border, #E4DDD3);
          border-top: none;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          background: #FFFFFF;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
          min-height: ${typeof minHeight === 'number' ? `${minHeight}px` : minHeight};
        }
        .rich-text-editor-container .ql-editor {
          min-height: ${typeof minHeight === 'number' ? `${minHeight}px` : minHeight};
          padding: 14px 16px;
          font-family: inherit;
          color: var(--ink, #1F1D1A);
        }
        .rich-text-editor-container .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9C9488;
          left: 16px;
        }
        .rich-text-editor-container .ql-snow .ql-picker {
          font-family: inherit;
          font-size: 13px;
        }
        .rich-text-editor-container .ql-snow .ql-stroke {
          stroke: #5C5549;
        }
        .rich-text-editor-container .ql-snow .ql-fill {
          fill: #5C5549;
        }
        .rich-text-editor-container .ql-snow .ql-picker-label:hover,
        .rich-text-editor-container .ql-snow button:hover {
          color: var(--blue, #2563EB);
        }
        .rich-text-editor-container .ql-snow button:hover .ql-stroke {
          stroke: var(--blue, #2563EB);
        }
        .rich-text-editor-container .ql-snow button:hover .ql-fill {
          fill: var(--blue, #2563EB);
        }
      `}</style>
    </div>
  )
}
