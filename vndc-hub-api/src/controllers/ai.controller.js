import { query } from '../config/db.js'
import { config } from '../config/env.js'

// POST /api/ai/chat
export async function chat(req, res, next) {
  try {
    console.log('=== AI CHAT START ===')
    console.log('User:', req.user?.email)
    console.log('Message:', req.body?.message)
    console.log('GROQ_API_KEY exists:', !!config.GROQ_API_KEY)
    console.log('GROQ_API_KEY prefix:', config.GROQ_API_KEY?.substring(0,10))

    const { message, history = [] } = req.body

    if (!message?.trim())
      return res.status(400).json({ error: 'Message là bắt buộc' })

    if (!config.GROQ_API_KEY)
      return res.status(503).json({
        error: 'AI chưa được cấu hình. Thêm GROQ_API_KEY vào .env'
      })

    console.log('Step 1: Query docs...')
    const { rows: docs } = await query(`
      SELECT id, name, type, department, version, views
      FROM documents WHERE is_active = true
      ORDER BY views DESC LIMIT 30
    `)
    console.log('Docs count:', docs.length)

    console.log('Step 2: Query modules...')
    const { rows: modules } = await query(`
      SELECT m.title, m.level,
             COALESCE(lp.progress, 0) as progress,
             m.locked
      FROM modules m
      LEFT JOIN learning_progress lp
        ON lp.module_id = m.id AND lp.user_id = $1
      ORDER BY m.order_index
    `, [req.user.id])
    console.log('Modules count:', modules.length)

    const systemPrompt = buildSystemPrompt(req.user, docs, modules)
    console.log('Step 3: System prompt length:', systemPrompt.length)

    console.log('Step 4: Calling Groq API...')
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    )

    console.log('Step 5: Groq response status:', groqRes.status)
    
    if (!groqRes.ok) {
      const errBody = await groqRes.text()
      console.log('Groq error body:', errBody)
      return res.status(500).json({ error: 'Groq API error: ' + errBody })
    }

    const data = await groqRes.json()
    console.log('Step 6: Response received, choices:', data.choices?.length)
    
    const responseText = data.choices?.[0]?.message?.content
    console.log('Step 7: Response text length:', responseText?.length)

    if (!responseText)
      throw new Error('Empty response from Groq')

    console.log('=== AI CHAT SUCCESS ===')
    res.json({
      text: responseText,
      docs: [],
      model: 'llama-3.3-70b-versatile',
    })
  } catch (err) {
    console.log('=== AI CHAT ERROR ===')
    console.log('Error name:', err.name)
    console.log('Error message:', err.message)
    console.log('Error stack:', err.stack)
    next(err)
  }
}

function buildSystemPrompt(user, documents, modules) {
  return `
Bạn là Trợ lý AI nội bộ của VNDC HUB — hệ thống quản lý tri thức và đào tạo.

## Thông tin người dùng
- Tên: ${user.name}
- Phòng ban: ${user.department}
- Vai trò: ${user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}

## Tài liệu trong hệ thống (${documents.length} tài liệu)
${documents.map(d =>
  `- [${d.id}] ${d.name} | ${d.type} | ${d.department} | ${d.version}`
).join('\n')}

## Module đào tạo
${modules.map(m =>
  `- ${m.title} | ${m.level} | Tiến độ: ${m.progress}% | ${m.locked?'KHOÁ':'Mở'}`
).join('\n')}

## Nguyên tắc
1. Trả lời bằng tiếng Việt, ngắn gọn 2-4 câu
2. Khi nhắc tài liệu, dùng đúng tên từ danh sách trên
3. Không bịa thông tin
4. Nếu không có tài liệu phù hợp, gợi ý Admin bổ sung

## Từ đồng nghĩa
- "đổi trả/hoàn trả/trả hàng" → BM-09
- "bảo hành/sửa chữa" → Hướng dẫn bảo hành
- "nghỉ phép/xin nghỉ" → BM-15
- "KPI/chỉ tiêu" → Chính sách KPI
`.trim()
}
