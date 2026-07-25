// ============================================================
// DASHBOARD.JS — Halaman dashboard
// ============================================================
const DashboardModule = (() => {
  const render = async () => {
    Router.setPageMeta('Dashboard', 'Ringkasan sistem akademik')
    const user = Auth.getUser()

    document.getElementById('page-content').innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('Total Mahasiswa', '—', 'bg-blue-50 text-blue-600', iconUsers())}
        ${statCard('Mahasiswa Aktif', '—', 'bg-green-50 text-green-600', iconCheck())}
        ${statCard('Total Dosen', '—', 'bg-purple-50 text-purple-600', iconUser())}
        ${statCard('Program Studi', '—', 'bg-orange-50 text-orange-600', iconBook())}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${UI.card(`
          <div class="p-4 border-b border-slate-200">
            <h3 class="font-semibold text-slate-700 text-sm">Aktivitas Terbaru</h3>
          </div>
          <div class="p-4 text-sm text-slate-400 text-center py-8">Belum ada data</div>
        `)}
        ${UI.card(`
          <div class="p-4 border-b border-slate-200">
            <h3 class="font-semibold text-slate-700 text-sm">Kalender Akademik</h3>
          </div>
          <div class="p-4 text-sm text-slate-400 text-center py-8">Belum ada jadwal</div>
        `)}
      </div>
    `
  }

  const statCard = (label, value, colorClass, icon) => `
    <div class="bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">${label}</p>
        <div class="w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center">${icon}</div>
      </div>
      <p class="text-2xl font-bold text-slate-800">${value}</p>
    </div>
  `

  const iconUsers = () => `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
  const iconCheck = () => `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  const iconUser = () => `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`
  const iconBook = () => `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`

  return { render }
})()
