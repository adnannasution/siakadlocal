// ============================================================
// KRS.JS — Kartu Rencana Studi
// ============================================================
const KRSModule = (() => {

  let state = {
    list: [], meta: null, semesters: [],
    page: 1, search: '', status: '', semester_akademik: '',
  }

  const fetchSemesters = async () => {
    if (state.semesters.length) return
    const res = await API.get('/krs/semesters')
    state.semesters = res.data || []
    if (!state.semester_akademik && state.semesters.length) {
      state.semester_akademik = state.semesters[0]
    }
  }

  const fetchList = async () => {
    const res = await API.get('/krs', {
      page: state.page, per_page: 20,
      search: state.search, status: state.status,
      semester_akademik: state.semester_akademik,
    })
    state.list = res.data
    state.meta = res.meta
    renderTable()
    renderPagination()
  }

  const render = async () => {
    Router.setPageMeta('KRS', 'Kartu Rencana Studi')
    await fetchSemesters()

    document.getElementById('page-content').innerHTML = `
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="krs-search" type="text" placeholder="Cari mahasiswa atau mata kuliah..."
              value="${state.search}"
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              oninput="KRSModule.onSearch(this.value)" />
          </div>
        </div>
        <select id="krs-sem" onchange="KRSModule.onFilter('semester_akademik', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Semester</option>
          ${state.semesters.map(s => `<option value="${s}" ${state.semester_akademik===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select id="krs-status" onchange="KRSModule.onFilter('status', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Status</option>
          <option value="disetujui" ${state.status==='disetujui'?'selected':''}>Disetujui</option>
          <option value="pending" ${state.status==='pending'?'selected':''}>Pending</option>
          <option value="ditolak" ${state.status==='ditolak'?'selected':''}>Ditolak</option>
        </select>
      </div>
      ${UI.card(`
        <div id="krs-table-wrap"></div>
        <div id="krs-pagination"></div>
      `)}
    `
    await fetchList()
  }

  const statusBadge = (s) => {
    const map = {
      disetujui: 'bg-green-100 text-green-700',
      pending:   'bg-yellow-100 text-yellow-700',
      ditolak:   'bg-red-100 text-red-700',
    }
    return `<span class="badge ${map[s] || 'bg-slate-100 text-slate-600'}">${s}</span>`
  }

  const renderTable = () => {
    document.getElementById('krs-table-wrap').innerHTML = UI.renderTable({
      headers: ['Mahasiswa', 'Mata Kuliah', 'SKS', 'Semester', 'Dosen Wali', 'Status'],
      emptyText: 'Tidak ada data KRS',
      rows: state.list.map(k => `
        <td class="px-4 py-3">
          <div class="font-medium text-slate-800 text-sm">${k.mahasiswa_nama}</div>
          <div class="text-xs text-slate-400 font-mono">${k.mahasiswa_nim}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm text-slate-800">${k.mata_kuliah_nama}</div>
          <div class="text-xs text-slate-400">${k.mata_kuliah_kode}</div>
        </td>
        <td class="px-4 py-3 text-center text-sm font-medium text-slate-700">${k.sks}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${k.semester_akademik}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${k.dosen_wali_nama || '—'}</td>
        <td class="px-4 py-3">${statusBadge(k.status)}</td>
      `)
    })
  }

  const renderPagination = () => {
    document.getElementById('krs-pagination').innerHTML =
      UI.renderPagination(state.meta, 'KRSModule.goPage')
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
