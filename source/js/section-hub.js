(() => {
  const normalizePath = value => {
    let path = value || '/'
    try { path = decodeURI(path) } catch (_) {}
    path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '/')
    if (!path.startsWith('/')) path = `/${path}`
    if (!path.endsWith('/')) path += '/'
    return path.replace(/\/{2,}/g, '/')
  }

  const renderHub = () => {
    const isHome = normalizePath(window.location.pathname) === '/'
    document.documentElement.classList.toggle('noimpty-home-hub', isHome)
    if (!isHome) return

    const recentPosts = document.getElementById('recent-posts')
    if (!recentPosts || recentPosts.querySelector('.noimpty-home-sections')) return

    const hub = document.createElement('section')
    hub.className = 'noimpty-home-sections'
    hub.setAttribute('aria-label', '博客内容分区')
    hub.innerHTML = `
      <header class="noimpty-home-sections__intro">
        <p class="noimpty-home-sections__eyebrow">Explore the blog</p>
        <h2>从这里进入不同的记录</h2>
        <p>学习、想法和生活各自拥有一块空间。向下浏览，选择你想进入的部分。</p>
      </header>
      <a class="noimpty-section-card noimpty-section-card--study" href="/study/" aria-label="进入 Study">
        <span class="noimpty-section-card__image" style="--section-image:url('/img/sections/study.webp')" aria-hidden="true"></span>
        <span class="noimpty-section-card__content">
          <span class="noimpty-section-card__meta">Learning trail</span>
          <span class="noimpty-section-card__title">study</span>
          <span class="noimpty-section-card__description">图形学、GAMES101、UE5 与竞赛相关的学习过程、作业实践和问题复盘。</span>
          <span class="noimpty-section-card__action">进入 Study</span>
        </span>
      </a>
      <a class="noimpty-section-card noimpty-section-card--ideas" href="/ideas/" aria-label="进入 Ideas，需要暗号">
        <span class="noimpty-section-card__image" style="--section-image:url('/img/sections/ideas.webp')" aria-hidden="true"></span>
        <span class="noimpty-section-card__content">
          <span class="noimpty-section-card__meta">Thought archive <span class="noimpty-section-card__lock">Private</span></span>
          <span class="noimpty-section-card__title">ideas</span>
          <span class="noimpty-section-card__description">留给灵感、猜想和还没有完全成形的小计划，暂时等待第一篇内容。</span>
          <span class="noimpty-section-card__action">输入暗号后进入</span>
        </span>
      </a>
      <a class="noimpty-section-card noimpty-section-card--life" href="/life/" aria-label="进入 Life，需要暗号">
        <span class="noimpty-section-card__image" style="--section-image:url('/img/sections/life.webp')" aria-hidden="true"></span>
        <span class="noimpty-section-card__content">
          <span class="noimpty-section-card__meta">Daily fragments <span class="noimpty-section-card__lock">Private</span></span>
          <span class="noimpty-section-card__title">life</span>
          <span class="noimpty-section-card__description">生活中的琐事、片段和碎碎念。这里不公开展示，需要暗号才能进入。</span>
          <span class="noimpty-section-card__action">输入暗号后进入</span>
        </span>
      </a>`

    recentPosts.prepend(hub)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHub, { once: true })
  } else {
    renderHub()
  }

  window.addEventListener('pjax:complete', () => window.setTimeout(renderHub, 0))
})()
