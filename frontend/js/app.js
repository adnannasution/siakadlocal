// ============================================================
// APP.JS — Entry point
// DEV_MODE = true → skip login, langsung dashboard
// ============================================================
const App = (() => {

  const updateSidebarUser = () => {
    const user = Auth.getUser()
    if (!user) return
    const name = user.nama || user.email?.split('@')[0] || 'User'
    document.getElementById('sidebar-avatar').textContent = name.charAt(0).toUpperCase()
    document.getElementById('sidebar-name').textContent = name
    document.getElementById('sidebar-role').textContent = formatRole(user.role)
  }

  const formatRole = (role) => {
    const map = {
      super_admin: 'Super Admin', admin_akademik: 'Admin Akademik',
      admin_keuangan: 'Admin Keuangan', kaprodi: 'Kaprodi',
      dosen: 'Dosen', mahasiswa: 'Mahasiswa', staf: 'Staf', lppm: 'LPPM',
    }
    return map[role] || role
  }

  const updateDatetime = () => {
    const now = new Date()
    const el = document.getElementById('topbar-datetime')
    if (el) el.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const showApp = () => {
    document.getElementById('login-page').classList.add('hidden')
    document.getElementById('app').classList.remove('hidden')
    updateSidebarUser()
    updateDatetime()
    setInterval(updateDatetime, 60000)
    Router.resolve()
  }

  const showLogin = () => {
    document.getElementById('login-page').classList.remove('hidden')
    document.getElementById('app').classList.add('hidden')
  }

  const logout = () => {
    if (DEV_MODE) {
      UI.toast('Dev mode aktif — logout dinonaktifkan', 'info')
      return
    }
    Auth.logout()
    showLogin()
    window.location.hash = ''
  }

  const init = () => {
    // Register routes
    Router.register('dashboard',  () => DashboardModule.render())
    Router.register('mahasiswa',  () => MahasiswaModule.render())
    Router.register('dosen',      () => placeholderPage('Dosen', 'Manajemen data dosen'))
    Router.register('krs',        () => placeholderPage('KRS', 'Kartu Rencana Studi'))
    Router.register('nilai',      () => placeholderPage('Penilaian', 'Input dan kelola nilai'))
    Router.register('presensi',   () => placeholderPage('Presensi', 'Kelola kehadiran'))
    Router.register('keuangan',   () => placeholderPage('Keuangan', 'Tagihan dan pembayaran'))
    Router.register('pengaturan', () => placeholderPage('Pengaturan', 'Konfigurasi sistem'))

    if (DEV_MODE) {
      // Langsung masuk app tanpa login
      showApp()
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/dashboard'
      }
    } else {
      if (Auth.isLoggedIn()) {
        showApp()
      } else {
        showLogin()
      }

      // Login form
      document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        const email = document.getElementById('login-email').value
        const password = document.getElementById('login-password').value
        const btn = document.getElementById('login-btn')
        const errEl = document.getElementById('login-error')

        btn.disabled = true
        btn.textContent = 'Memproses...'
        errEl.classList.add('hidden')

        try {
          await Auth.login(email, password)
          showApp()
          window.location.hash = '#/dashboard'
        } catch (err) {
          errEl.textContent = err.message || 'Login gagal'
          errEl.classList.remove('hidden')
          btn.disabled = false
          btn.textContent = 'Masuk'
        }
      })
    }
  }

  const placeholderPage = (title, subtitle) => {
    Router.setPageMeta(title, subtitle)
    document.getElementById('page-content').innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-slate-400">
        <svg class="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="text-base font-medium text-slate-500">${title}</p>
        <p class="text-sm mt-1">Modul ini sedang dalam pengembangan</p>
        ${DEV_MODE ? '<p class="text-xs mt-3 text-primary-400 bg-primary-50 px-3 py-1 rounded-full">DEV MODE AKTIF</p>' : ''}
      </div>`
  }

  return { init, logout, showApp, showLogin }
})()

document.addEventListener('DOMContentLoaded', () => App.init())
