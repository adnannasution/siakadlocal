// ============================================================
// NILAI.JS — Penilaian akademik
// ============================================================
const NilaiModule = (() => {

  let state = {
    list: [], meta: null, semesters: [],
    page: 1, search: '', semester_akademik: '', nilai_huruf: '',
  }

  const HURUF = ['A', 'B+', 'B', 'C+', 'C', 'D', 'E']

  const fetchSemesters = async () => {
    if (state.semesters.length) return
    const res = await API.get('/nilai/semesters')
    state.semesters = res.data || []
    if (!state.semester_akademik && state.semesters.length) {
      state.semester_akademik = state.semesters[0]
    }
  }

  const fetchList = async () => {
    const res = await API.get('/nilai', {
      page: state.page, per_page: 20,
      search: state.search,
      semester_akademik: state.semester_akademik,
      nilai_huruf: state.nilai_huruf,
    })
    state.list = res.data
    state.meta = res.meta
    renderTable()
    renderPagination()
  }

  const render = async () => {
    Router.setPageMeta('Penilaian', 'Input dan kelola nilai mahasiswa')
    await fetchSemesters()

    document.getElementById('page-content').innerHTML = `
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="nlai-search" type="text" placeholder="Cari mata kuliah atau dosen..."
              value="${state.search}"
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              oninput="NilaiModule.onSearch(this.value)" />
          </div>
        </div>
        <select id="nlai-sem" onchange="NilaiModule.onFilter('semester_akademik', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Semester</option>
          ${state.semesters.map(s => `<option value="${s}" ${state.semester_akademik===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select id="nlai-huruf" onchange="NilaiModule.onFilter('nilai_huruf', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Nilai</option>
          ${HURUF.map(h => `<option value="${h}" ${state.nilai_huruf===h?'selected':''}>Nilai ${h}</option>`).join('')}
        </select>
      </div>
      ${UI.card(`
        <div id="nlai-table-wrap"></div>
        <div id="nlai-pagination"></div>
      `)}
    `
    await fetchList()
  }

  const nilaiColor = (huruf) => {
    const map = {
      'A':  'bg-green-100 text-green-700',
      'B+': 'bg-teal-100 text-teal-700',
      'B':  'bg-blue-100 text-blue-700',
      'C+': 'bg-indigo-100 text-indigo-700',
      'C':  'bg-yellow-100 text-yellow-700',
      'D':  'bg-orange-100 text-orange-700',
      'E':  'bg-red-100 text-red-700',
    }
    return map[huruf] || 'bg-slate-100 text-slate-600'
  }

  const renderTable = () => {
    document.getElementById('nlai-table-wrap').innerHTML = UI.renderTable({
      headers: ['Mata Kuliah', 'Semester', 'UTS', 'UAS', 'Tugas', 'Akhir', 'Nilai', 'Status'],
      emptyText: 'Tidak ada data nilai',
      rows: state.list.map(n => {
        const akhir = typeof n.nilai_akhir === 'number' ? n.nilai_akhir.toFixed(1) : '—'
        const uts   = typeof n.nilai_uts === 'number' ? n.nilai_uts.toFixed(1) : '—'
        const uas   = typeof n.nilai_uas === 'number' ? n.nilai_uas.toFixed(1) : '—'
        const tugas = typeof n.nilai_tugas === 'number' ? n.nilai_tugas.toFixed(1) : '—'
        return `
          <td class="px-4 py-3">
            <div class="text-sm font-medium text-slate-800">${n.mata_kuliah_nama}</div>
            <div class="text-xs text-slate-400">${n.input_oleh_nama || ''}</div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">${n.semester_akademik}</td>
          <td class="px-4 py-3 text-sm text-center text-slate-600">${uts}</td>
          <td class="px-4 py-3 text-sm text-center text-slate-600">${uas}</td>
          <td class="px-4 py-3 text-sm text-center text-slate-600">${tugas}</td>
          <td class="px-4 py-3 text-sm text-center font-semibold text-slate-800">${akhir}</td>
          <td class="px-4 py-3 text-center">
            <span class="badge ${nilaiColor(n.nilai_huruf)}">${n.nilai_huruf || '—'}</span>
          </td>
          <td class="px-4 py-3 text-center">
            ${n.locked
              ? `<span class="badge bg-slate-100 text-slate-500">Terkunci</span>`
              : `<span class="badge bg-yellow-50 text-yellow-600">Draft</span>`}
          </td>`
      })
    })
  }

  const renderPagination = () => {
    document.getElementById('nlai-pagination').innerHTML =
      UI.renderPagination(state.meta, 'NilaiModule.goPage')
  }

  let searchTimer = null
  const onSearch = (val) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { state.search = val; state.page = 1; fetchList() }, 400)
  }
  const onFilter = (key, val) => { state[key] = val; state.page = 1; fetchList() }
  const goPage = (p) => { state.page = p; fetchList() }

  return { render, onSearch, onFilter, goPage }
})()
