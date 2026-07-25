// ============================================================
// KEUANGAN.JS — Tagihan dan pembayaran
// ============================================================
const KeuanganModule = (() => {

  let state = {
    list: [], meta: null, semesters: [],
    page: 1, search: '', status: '', semester_akademik: '',
    tab: 'tagihan',
  }

  const fetchSemesters = async () => {
    if (state.semesters.length) return
    const res = await API.get('/keuangan/tagihan/semesters')
    state.semesters = res.data || []
    if (!state.semester_akademik && state.semesters.length) {
      state.semester_akademik = state.semesters[0]
    }
  }

  const fetchList = async () => {
    const res = await API.get('/keuangan/tagihan', {
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
    Router.setPageMeta('Keuangan', 'Tagihan dan pembayaran SPP')
    await fetchSemesters()

    let ringkasan = null
    try {
      const r = await API.get('/keuangan/ringkasan')
      ringkasan = r.data
    } catch (_) {}

    document.getElementById('page-content').innerHTML = `
      ${ringkasan ? renderRingkasan(ringkasan) : ''}
      <div class="flex flex-wrap items-center gap-3 mb-4 mt-4">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="keu-search" type="text" placeholder="Cari nama atau NIM mahasiswa..."
              value="${state.search}"
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              oninput="KeuanganModule.onSearch(this.value)" />
          </div>
        </div>
        <select id="keu-sem" onchange="KeuanganModule.onFilter('semester_akademik', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Semester</option>
          ${state.semesters.map(s => `<option value="${s}" ${state.semester_akademik===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <select id="keu-status" onchange="KeuanganModule.onFilter('status', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Status</option>
          <option value="lunas" ${state.status==='lunas'?'selected':''}>Lunas</option>
          <option value="belum_lunas" ${state.status==='belum_lunas'?'selected':''}>Belum Lunas</option>
          <option value="cicilan" ${state.status==='cicilan'?'selected':''}>Cicilan</option>
        </select>
      </div>
      ${UI.card(`
        <div id="keu-table-wrap"></div>
        <div id="keu-pagination"></div>
      `)}
    `
    await fetchList()
  }

  const renderRingkasan = (r) => {
    const fmt = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID')
    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Tagihan</p>
          <p class="text-xl font-bold text-slate-800">${r.total_tagihan}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-green-600 uppercase tracking-wider mb-2">Lunas</p>
          <p class="text-xl font-bold text-green-700">${r.tagihan_lunas}</p>
          <p class="text-xs text-slate-400">${fmt(r.nominal_lunas)}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-yellow-600 uppercase tracking-wider mb-2">Cicilan</p>
          <p class="text-xl font-bold text-yellow-700">${r.tagihan_cicilan}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-4">
          <p class="text-xs text-red-500 uppercase tracking-wider mb-2">Belum Lunas</p>
          <p class="text-xl font-bold text-red-700">${r.tagihan_belum_lunas}</p>
          <p class="text-xs text-slate-400">${fmt(r.nominal_belum)}</p>
        </div>
      </div>`
  }

  const statusBadge = (s) => {
    const map = {
      lunas:       'bg-green-100 text-green-700',
      belum_lunas: 'bg-red-100 text-red-700',
      cicilan:     'bg-yellow-100 text-yellow-700',
    }
    const label = { lunas: 'Lunas', belum_lunas: 'Belum Lunas', cicilan: 'Cicilan' }
    return `<span class="badge ${map[s] || 'bg-slate-100 text-slate-600'}">${label[s] || s}</span>`
  }

  const renderTable = () => {
    document.getElementById('keu-table-wrap').innerHTML = UI.renderTable({
      headers: ['Mahasiswa', 'Semester', 'Jenis', 'Jumlah', 'Jatuh Tempo', 'Status'],
      emptyText: 'Tidak ada data tagihan',
      rows: state.list.map(t => `
        <td class="px-4 py-3">
          <div class="font-medium text-slate-800 text-sm">${t.mahasiswa_nama}</div>
          <div class="text-xs text-slate-400 font-mono">${t.mahasiswa_nim}</div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600">${t.semester_akademik}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${t.jenis}</td>
        <td class="px-4 py-3 text-sm font-medium text-slate-800">Rp ${(t.jumlah||0).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${t.jatuh_tempo || '—'}</td>
        <td class="px-4 py-3">${statusBadge(t.status)}</td>
      `)
    })
  }

  const renderPagination = () => {
    document.getElementById('keu-pagination').innerHTML =
      UI.renderPagination(state.meta, 'KeuanganModule.goPage')
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
