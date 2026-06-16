import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

export default function DocumentViewer({ doc }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!doc?.file_url) {
      setContent(null)
      return
    }
    loadDocument()
  }, [doc?.id])

  const getFileExt = (url) => {
    if (!url) return ''
    return url.split('.').pop().toLowerCase().split('?')[0]
  }

  const loadDocument = async () => {
    setLoading(true)
    setError(null)
    setContent(null)

    const ext = getFileExt(doc.file_url)
    const url = `${API_URL}${doc.file_url}`

    try {
      // ── ẢNH ──
      if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) {
        setContent({ type: 'image', url })
        setLoading(false)
        return
      }

      // ── PDF ──
      if (ext === 'pdf') {
        setContent({ type: 'pdf', url })
        setLoading(false)
        return
      }

      // ── VIDEO ──
      if (['mp4','webm','mov','avi'].includes(ext)) {
        setContent({ type: 'video', url: url.replace('.mp4','.stream') })
        setLoading(false)
        return
      }

      // ── EXCEL ──
      if (['xlsx','xls','csv'].includes(ext)) {
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const html = XLSX.utils.sheet_to_html(sheet, {
          id: 'excel-table',
          editable: false,
        })
        setContent({ type: 'excel', html })
        setLoading(false)
        return
      }

      // ── WORD ──
      if (['doc','docx'].includes(ext)) {
        const mammoth = await import('mammoth')
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setContent({ type: 'word', html: result.value })
        setLoading(false)
        return
      }

      // ── Không hỗ trợ ──
      setContent({ type: 'unsupported', ext })
      setLoading(false)

    } catch (err) {
      setError('Không thể tải tài liệu: ' + err.message)
      setLoading(false)
    }
  }

  // ── RENDER ──
  if (!doc?.file_url) return (
    <div className="flex flex-col items-center justify-center
                    h-64 gap-3 text-slate-400">
      <span className="text-4xl">📄</span>
      <p className="text-sm">Tài liệu này chưa có file đính kèm</p>
    </div>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500
                      border-t-transparent rounded-full mr-3" />
      Đang tải tài liệu...
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center
                    h-64 gap-3 text-red-400">
      <span className="text-3xl">⚠️</span>
      <p className="text-sm">{error}</p>
      <button onClick={loadDocument}
        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl
                   text-sm hover:bg-red-100 transition">
        Thử lại
      </button>
    </div>
  )

  if (!content) return null

  return (
    <div className="w-full h-full min-h-64">
      {/* ẢNH */}
      {content.type === 'image' && (
        <div className="flex items-center justify-center
                        bg-slate-50 rounded-xl p-4
                        overflow-auto"
             style={{ maxHeight: '65vh' }}>
          <img
            src={content.url}
            alt={doc.name}
            className="max-w-full object-contain rounded-lg shadow"
            style={{ maxHeight: '60vh' }}
          />
        </div>
      )}

      {/* PDF */}
      {content.type === 'pdf' && (
        <div className="w-full rounded-xl overflow-hidden border border-slate-200"
             style={{ height: '70vh' }}>
          <embed
            src={content.url}
            type="application/pdf"
            width="100%"
            height="100%"
          />
          <object
            data={content.url}
            type="application/pdf"
            width="100%"
            height="100%"
            className="hidden"
          >
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-slate-50">
              <p className="text-slate-500 text-sm">
                Trình duyệt không hỗ trợ xem PDF trực tiếp.
              </p>
              <a href={content.url} target="_blank"
                 className="px-4 py-2 bg-primary-50 text-primary-600
                            rounded-xl text-sm font-500 hover:bg-primary-100">
                Mở PDF trong tab mới
              </a>
            </div>
          </object>
        </div>
      )}

      {/* VIDEO */}
      {content.type === 'video' && (
        <video
          controls
          className="w-full rounded-xl"
          style={{ maxHeight: '65vh' }}
        >
          <source src={content.url} type="video/mp4" />
        </video>
      )}

      {/* EXCEL */}
      {content.type === 'excel' && (
        <>
          {isLocalhost && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200
                            rounded-xl text-amber-700 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Xem trước cơ bản (localhost). Sau khi deploy lên domain thật,
                file sẽ hiển thị đúng định dạng Office.
              </span>
            </div>
          )}
          {!isLocalhost ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + doc.file_url)}`}
              className="w-full rounded-xl border border-slate-200"
              style={{ height: '70vh' }}
              title={doc.name}
            />
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-200 bg-white"
                 style={{ maxHeight: '65vh' }}>
              <style>{`
                #excel-table {
                  border-collapse: collapse;
                  width: 100%;
                  font-size: 13px;
                }
                #excel-table td, #excel-table th {
                  border: 1px solid #e2e8f0;
                  padding: 6px 10px;
                  white-space: nowrap;
                }
                #excel-table tr:nth-child(even) { background: #f8fafc; }
                #excel-table tr:first-child {
                  background: #f1f5f9;
                  font-weight: 600;
                  position: sticky;
                  top: 0;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: content.html }} />
            </div>
          )}
        </>
      )}

      {/* WORD */}
      {content.type === 'word' && (
        <>
          {isLocalhost && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200
                            rounded-xl text-amber-700 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Xem trước cơ bản (localhost). Sau khi deploy lên domain thật,
                file sẽ hiển thị đúng định dạng Office.
              </span>
            </div>
          )}
          {!isLocalhost ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + doc.file_url)}`}
              className="w-full rounded-xl border border-slate-200"
              style={{ height: '70vh' }}
              title={doc.name}
            />
          ) : (
            <div className="prose prose-sm max-w-none p-6 bg-white
                            rounded-xl border border-slate-200
                            overflow-auto"
                 style={{ maxHeight: '65vh' }}
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          )}
        </>
      )}

      {/* KHÔNG HỖ TRỢ */}
      {content.type === 'unsupported' && (
        <div className="flex flex-col items-center justify-center
                        h-64 gap-3 text-slate-400">
          <span className="text-4xl">📎</span>
          <p className="text-sm font-500">
            Định dạng .{content.ext} chưa hỗ trợ xem trước
          </p>
          <p className="text-xs">Vui lòng tải xuống để xem</p>
        </div>
      )}
    </div>
  )
}
