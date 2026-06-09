const SYNONYMS = {
  "đổi trả":   ["hoàn trả","đổi hàng","trả hàng","bm-09","bm09","hoàn tiền"],
  "bảo hành":  ["warranty","sửa chữa","lỗi sản phẩm","hỏng","pin"],
  "kpi":        ["chỉ tiêu","đánh giá","hiệu quả","target","mục tiêu"],
  "crm":        ["phần mềm bán hàng","quản lý khách hàng","salesforce"],
  "onboarding": ["nhân viên mới","hội nhập","nhập môn","orientation"],
  "bảng giá":   ["giá sản phẩm","price list","báo giá","chiết khấu"],
  "nghỉ phép":  ["xin nghỉ","phép năm","bm-15","đơn nghỉ"],
  "khiếu nại":  ["phàn nàn","complaint","góp ý","phản hồi khách"],
  "hướng dẫn":  ["tutorial","cách dùng","sử dụng","how to"],
}

export function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/**
 * Mở rộng từ khóa tìm kiếm với các từ đồng nghĩa
 */
export function expandQuery(query) {
  const q = removeAccents(query.toLowerCase().trim());
  const terms = new Set([query.toLowerCase().trim()]);
  
  for (const [key, values] of Object.entries(SYNONYMS)) {
    const all = [key, ...values];
    const allNormalized = all.map(t => removeAccents(t.toLowerCase()));
    
    if (allNormalized.some(t => q.includes(t) || t.includes(q))) {
      all.forEach(t => terms.add(t));
      allNormalized.forEach(t => terms.add(t));
    }
  }
  return Array.from(terms);
}

/**
 * Tìm kiếm tài liệu bằng danh sách từ khóa mở rộng
 */
export function searchDocs(docs, query) {
  if (!query.trim()) return docs;
  const terms = expandQuery(query);
  return docs.filter(doc => {
    const searchable = [
      doc.name, doc.department, doc.type, doc.tag, doc.version,
      ...doc.audience
    ].join(' ').toLowerCase();
    
    const searchableNormalized = removeAccents(searchable);
    
    return terms.some(t => searchable.includes(t) || searchableNormalized.includes(removeAccents(t)));
  }).sort((a, b) => b.views - a.views);
}
