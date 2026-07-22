(() => {
  const privacy = window.NOIMPTY_PRIVACY || { entries: [] }
  const expectedHash = '5a1eee3bcf723aea5c87c85ee62696443505c86e9f0add455c85252d3412d591'
  const sessionKey = 'noimpty-private-unlocked'

  const normalizePath = value => {
    let path = value || '/'
    try { path = decodeURI(path) } catch (_) {}
    path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '/')
    if (!path.startsWith('/')) path = `/${path}`
    if (!path.endsWith('/')) path += '/'
    return path.replace(/\/{2,}/g, '/')
  }

  const entries = Array.isArray(privacy.entries) ? privacy.entries : []
  const protectedMap = new Map(entries.map(entry => [normalizePath(entry.path), entry.section || 'ideas']))

  const isUnlocked = () => {
    try { return window.sessionStorage.getItem(sessionKey) === 'true' } catch (_) { return false }
  }

  const rememberUnlock = () => {
    try { window.sessionStorage.setItem(sessionKey, 'true') } catch (_) {}
  }

  const scrubProtectedCards = () => {
    document.querySelectorAll('a[href]').forEach(anchor => {
      let targetPath
      try { targetPath = normalizePath(new URL(anchor.href, window.location.origin).pathname) } catch (_) { return }
      if (!protectedMap.has(targetPath)) return
      const item = anchor.closest('.recent-post-item, .article-sort-item, .aside-list-item')
      if (item) item.remove()
    })
  }

  const digest = async value => {
    const bytes = new TextEncoder().encode(value)
    const result = await window.crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('')
  }

  const mountGate = () => {
    document.querySelector('.noimpty-gate')?.remove()
    scrubProtectedCards()

    const currentPath = normalizePath(window.location.pathname)
    const currentSection = protectedMap.get(currentPath)

    if (!currentSection || isUnlocked()) {
      document.documentElement.classList.remove('noimpty-private-locked')
      return
    }

    document.documentElement.classList.add('noimpty-private-locked')

    const gate = document.createElement('div')
    gate.className = 'noimpty-gate'
    gate.dataset.section = currentSection.toLowerCase()
    gate.innerHTML = `
      <div class="noimpty-gate__panel" role="dialog" aria-modal="true" aria-labelledby="noimpty-gate-title">
        <p class="noimpty-gate__eyebrow">Private · ${currentSection}</p>
        <h1 id="noimpty-gate-title">请输入暗号(*^▽^*)</h1>
        <p class="noimpty-gate__hint">输入正确后，本次浏览期间可以访问 Ideas 与 Life。</p>
        <form class="noimpty-gate__form" novalidate>
          <input class="noimpty-gate__input" type="password" name="passphrase" autocomplete="current-password" aria-label="暗号" placeholder="在这里输入暗号" required>
          <button class="noimpty-gate__button" type="submit">确认暗号</button>
          <p class="noimpty-gate__error" role="status" aria-live="polite"></p>
        </form>
        <a class="noimpty-gate__back" href="/">← 返回首页</a>
      </div>`

    document.body.appendChild(gate)
    const panel = gate.querySelector('.noimpty-gate__panel')
    const form = gate.querySelector('.noimpty-gate__form')
    const input = gate.querySelector('.noimpty-gate__input')
    const button = gate.querySelector('.noimpty-gate__button')
    const error = gate.querySelector('.noimpty-gate__error')
    input.focus()

    form.addEventListener('submit', async event => {
      event.preventDefault()
      button.disabled = true
      error.textContent = ''

      try {
        const inputHash = await digest(input.value.trim())
        if (inputHash === expectedHash) {
          rememberUnlock()
          gate.classList.add('is-leaving')
          document.documentElement.classList.remove('noimpty-private-locked')
          window.setTimeout(() => gate.remove(), 300)
          return
        }

        error.textContent = '输入错误┭┮﹏┭┮'
        panel.classList.remove('is-error')
        void panel.offsetWidth
        panel.classList.add('is-error')
        input.select()
      } catch (_) {
        error.textContent = '暂时无法校验，请刷新页面后重试。'
      } finally {
        button.disabled = false
      }
    })
  }

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]')
    if (!anchor || isUnlocked()) return

    let targetPath
    try { targetPath = normalizePath(new URL(anchor.href, window.location.origin).pathname) } catch (_) { return }
    if (protectedMap.has(targetPath)) document.documentElement.classList.add('noimpty-private-locked')
  })

  if (protectedMap.has(normalizePath(window.location.pathname)) && !isUnlocked()) {
    document.documentElement.classList.add('noimpty-private-locked')
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGate, { once: true })
  } else {
    mountGate()
  }

  window.addEventListener('pjax:complete', () => window.setTimeout(mountGate, 0))
})()
