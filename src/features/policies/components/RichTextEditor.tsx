import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  minHeight?: number | string
}

const TOOLBAR_CONFIG = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write the policy details here...',
  readOnly = false,
  minHeight = 220,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const isInternalChange = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || quillRef.current) return

    const editorHost = document.createElement('div')
    container.appendChild(editorHost)

    const quill = new Quill(editorHost, {
      theme: 'snow',
      placeholder,
      readOnly,
      modules: {
        toolbar: readOnly ? false : TOOLBAR_CONFIG,
      },
    })

    if (value) {
      quill.root.innerHTML = value
    }

    quill.on('text-change', () => {
      isInternalChange.current = true
      const html = quill.root.innerHTML
      const isEmpty = quill.getText().trim().length === 0 && !quill.root.querySelector('img')
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
      }}
    >
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
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
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
