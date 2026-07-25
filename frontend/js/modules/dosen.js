// ============================================================
// DOSEN.JS — Modul manajemen dosen
// ============================================================
const DosenModule = (() => {

  let state = {
    list: [], meta: null,
    page: 1, search: '', prodi_id: '', jabatan: '',
  }

  const JABATAN_LIST = [
    'Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Guru Besar', 'Tenaga Pengajar',
  ]

  const fetchList = async () => {
    const res = await API.get('/dosen', {
      page: state.page, per_page: 20,
      search: state.search, prodi_id: state.prodi_id, jabatan: state.jabatan,
    })
    state.list = res.data
    state.meta = res.meta
    renderTable()
    renderPagination()
  }

  const render = async () => {
    Router.setPageMeta('Dosen', 'Manajemen data dosen')

    document.getElementById('page-content').innerHTML = `
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="flex-1 min-w-48">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input id="dsn-search" type="text" placeholder="Cari nama atau NIDN..."
              value="${state.search}"
              class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              oninput="DosenModule.onSearch(this.value)" />
          </div>
        </div>
        <select id="dsn-jabatan" onchange="DosenModule.onFilter('jabatan', this.value)"
          class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
          <option value="">Semua Jabatan</option>
          ${JABATAN_LIST.map(j => `<option value="${j}" ${state.jabatan===j?'selected':''}>${j}</option>`).join('')}
        </select>
      </div>
      ${UI.card(`
        <div id="dsn-table-wrap"></div>
        <div id="dsn-pagination"></div>
      `)}
    `
    await fetchList()
  }

  const renderTable = () => {
    document.getElementById('dsn-table-wrap').innerHTML = UI.renderTable({
      headers: ['NIDN', 'Nama Dosen', 'Jabatan Fungsional', 'Bidang Keahlian', 'Kelas', 'Aksi'],
      emptyText: 'Tidak ada data dosen',
      rows: state.list.map(d => `
        <td class="px-4 py-3 font-mono text-xs text-slate-600">${d.nidn}</td>
        <td class="px-4 py-3">
          <div class="font-medium text-slate-800 text-sm">${d.nama_lengkap}</div>
          <div class="text-xs text-slate-400">${d.email || ''}</div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600">${jabatanBadge(d.jabatan_fungsional)}</td>
        <td class="px-4 py-3 text-sm text-slate-600">
          <div class="flex flex-wrap gap-1">
            ${(d.bidang_keahlian || []).map(k => `<span class="badge bg-slate-100 text-slate-600">${k}</span>`).join('') || '—'}
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600 text-center">
          <span class="badge bg-blue-50 text-blue-600">${d.jumlah_kelas} kelas</span>
        </td>
        <td class="px-4 py-3">
          <button onclick="DosenModule.openDetail('${d.id}')" title="Detail"
            class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
        </td>
      `)
    })
  }

  const renderPagination = () => {
    document.getElementById('dsn-pagination').innerHTML =
      UI.renderPagination(state.meta, 'DosenModule.goPage')
  }

  const jabatanBadge = (j) => {
    const map = {
      'Guru Besar':    'bg-yellow-100 text-yellow-700',
      'Lektor Kepala': 'bg-orange-100 text-orange-700',
      'Lektor':        'bg-blue-100 text-blue-700',
      'Asisten Ahli':  'bg-green-100 text-green-700',
      'Tenaga Pengajar': 'bg-slate-100 text-slate-600',
    }
    return `<span class="badge ${map[j] || 'bg-slate-100 text-slate-600'}">${j || '—'}</span>`
  }

  let searchTimer = null
  const onSearch = (val) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => { state.search = val; state.page = 1; fetchList() }, 400)
  }
  const onFilter = (key, val) => { state[key] = val; state.page = 1; fetchList() }
  const goPage = (p) => { state.page = p; fetchList() }

  const openDetail = async (id) => {
    try {
      const res = await API.get(`/dosen/${id}`)
      const d = res.data
      UI.openModal(`
        <div class="p-5 border-b border-slate-200 flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
            ${d.nama_lengkap.charAt(0)}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-800">${d.nama_lengkap}</h3>
            <p class="text-sm text-slate-500">NIDN: ${d.nidn}</p>
          </div>
          <div>${jabatanBadge(d.jabatan_fungsional)}</div>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg text-center">
            <div>
              <p class="text-xl font-bold text-primary-600">${d.jumlah_kelas}</p>
              <p class="text-xs text-slate-500">Kelas Aktif</p>
            </div>
            <div>
              <p class="text-xl font-bold text-slate-800">${d.max_sks_mengajar || '—'}</p>
              <p class="text-xs text-slate-500">Maks SKS</p>
            </div>
            <div>
              <p class="text-xl font-bold text-slate-800">${d.pendidikan_terakhir || '—'}</p>
              <p class="text-xs text-slate-500">Pendidikan</p>
            </div>
          </div>
          <table class="w-full text-sm">
            ${dRow('Email', d.email || '—')}
            ${dRow('No. HP', d.no_hp || '—')}
            ${dRow('Program Studi', d.program_studi?.nama || '—')}
            ${dRow('Bidang Keahlian', (d.bidang_keahlian || []).join(', ') || '—')}
          </table>
          <div class="flex justify-end">
            <button onclick="UI.closeModal()" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50">Tutup</button>
          </div>
        </div>
      `)
    } catch (e) { UI.toast(e.message, 'error') }
  }

  const dRow = (label, value) => `
    <tr class="border-b border-slate-100">
      <td class="py-2 pr-4 text-slate-500 font-medium w-40">${label}</td>
      <td class="py-2 text-slate-800">${value}</td>
    </tr>`

  return { render, onSearch, onFilter, goPage, openDetail }
})()
