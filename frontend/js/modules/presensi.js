// ============================================================
// PRESENSI.JS — Data kehadiran mahasiswa
// ============================================================
const PresensiModule = (() => {

  let state = {
    list: [], meta: null,
    page: 1, search: '', status: '', kelas_id: '',
    rekap: null,
  }

  const fetchRekap = async () => {
    const res = await API.get('/presensi/rekap')
    state.rekap = res.data
  }

  const fetchList = async () => {
    const res = await API.get('/presensi', {
      page: state.page, per_page: 20,
      search: state.search, status: state.status, kelas_id: state.kelas_id,
    })
    state.list = res.data
    state.meta = res.meta
    renderTable()
    renderPagination()
  }

  const render = async () => {
    Router.setPageMeta('Presensi', 'Data kehadiran mahasiswa')
    await fetchRekap()

    const rekap = state.rekap || {}

    document.getElementById('page-content').innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        ${rekapCard('Total Presensi', rekap.total || 0, 'bg-slate-50 text-slate-600')}
        ${rekapCard('Hadir', rekap.distribusi_status?.hadir || 0, 'bg-green-50 text-green-600')}
        ${rekapCard('Izin / Sakit', (rekap.distribusi_status?.izin || 0) + (rekap.distribusi_status?.sakit || 0), 'bg-yellow-50 text-yellow-600')}
        ${rekapCard('Alpha', rekap.distribusi_status?.alpha || 0, 'bg-red-50 text-red-600')}
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="prs-search" type="text" placeholder="Cari nama atau NIM mahasiswa..."
              value="${state.search}"
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              oninput="PresensiModule.onSearch(this.value)" />
          </div>
        </div>
        <select id="prs-status" onchange="PresensiModule.onFilter('status', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Status</option>
          <option value="hadir"  ${state.status==='hadir'?'selected':''}>Hadir</option>
          <option value="izin"   ${state.status==='izin'?'selected':''}>Izin</option>
          <option value="sakit"  ${state.status==='sakit'?'selected':''}>Sakit</option>
          <option value="alpha"  ${state.status==='alpha'?'selected':''}>Alpha</option>
        </select>
      </div>
      ${UI.card(`
        <div id="prs-table-wrap"></div>
        <div id="prs-pagination"></div>
      `)}
    `
    await fetchList()
  }

  const rekapCard = (label, value, cls) => `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">${label}</p>
        <div class="w-7 h-7 rounded-lg ${cls} flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
      <p class="text-2xl font-bold text-slate-800">${value}</p>
    </div>`

  const statusBadge = (s) => {
    const map = {
      hadir: 'bg-green-100 text-green-700',
      izin:  'bg-blue-100 text-blue-700',
      sakit: 'bg-yellow-100 text-yellow-700',
      alpha: 'bg-red-100 text-red-700',
    }
    return `<span class="badge ${map[s] || 'bg-slate-100 text-slate-600'}">${s}</span>`
  }

  const renderTable = () => {
    document.getElementById('prs-table-wrap').innerHTML = UI.renderTable({
      headers: ['Mahasiswa', 'Kelas', 'Status', 'Waktu Scan', 'Keterangan'],
      emptyText: 'Tidak ada data presensi',
      rows: state.list.map(p => `
        <td class="px-4 py-3">
          <div class="font-medium text-slate-800 text-sm">${p.mahasiswa_nama}</div>
          <div class="text-xs text-slate-400 font-mono">${p.mahasiswa_nim}</div>
        </td>
        <td class="px-4 py-3 text-xs text-slate-500 font-mono">${p.kelas_id?.substring(0,8) || '—'}…</td>
        <td class="px-4 py-3">${statusBadge(p.status)}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${p.waktu_scan ? new Date(p.waktu_scan).toLocaleString('id-ID', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}</td>
        <td class="px-4 py-3 text-sm text-slate-500">${p.keterangan || '—'}</td>
      `)
    })
  }

  const renderPagination = () => {
    document.getElementById('prs-pagination').innerHTML =
      UI.renderPagination(state.meta, 'PresensiModule.goPage')
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
