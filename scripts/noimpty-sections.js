'use strict'

const toArray = collection => {
  if (!collection) return []
  if (Array.isArray(collection)) return collection
  if (typeof collection.toArray === 'function') return collection.toArray()
  if (Array.isArray(collection.data)) return collection.data
  return []
}

const taxonomyNames = collection => toArray(collection).map(item => String(item.name || item))

const escapeHtml = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const withRoot = value => {
  const root = hexo.config.root || '/'
  const base = root.endsWith('/') ? root : `${root}/`
  return `${base}${String(value || '').replace(/^\/+/, '')}`.replace(/\/{2,}/g, '/')
}

const normalizeWebPath = value => {
  let path = withRoot(value)
  path = path.replace(/index\.html$/, '').replace(/\.html$/, '/')
  if (!path.endsWith('/')) path += '/'
  return path.replace(/\/{2,}/g, '/')
}

const sectionOf = item => {
  if (item.private_section) return String(item.private_section).toLowerCase()
  const categories = taxonomyNames(item.categories).map(name => name.toLowerCase())
  if (categories.includes('life')) return 'life'
  if (categories.includes('ideas')) return 'ideas'
  return 'ideas'
}

const protectedPosts = () => toArray(hexo.locals.get('posts'))
  .filter(post => String(post.privacy || '').toLowerCase() === 'protected')

hexo.extend.tag.register('section_posts', args => {
  const section = args.join(' ').trim()
  const posts = toArray(hexo.locals.get('posts'))
    .filter(post => taxonomyNames(post.categories).includes(section))
    .sort((left, right) => Number(right.date || 0) - Number(left.date || 0))

  if (posts.length === 0) {
    const messages = {
      Ideas: '这里还没有文章。第一条 idea 出现时，它会被收进这里。',
      UE5: 'UE5 的学习记录还在准备中。',
      '竞赛': '竞赛相关的记录还在准备中。'
    }
    return `<div class="noimpty-empty-state"><span class="noimpty-empty-state__icon" aria-hidden="true">✦</span><h3>内容准备中</h3><p>${escapeHtml(messages[section] || '这个模块还没有文章。')}</p></div>`
  }

  const cards = posts.map(post => {
    const title = escapeHtml(post.title || '未命名文章')
    const href = normalizeWebPath(post.path)
    const cover = post.cover ? withRoot(post.cover) : '/img/cover-blue.svg'
    const date = post.date && typeof post.date.format === 'function' ? post.date.format('YYYY-MM-DD') : ''
    const description = escapeHtml(post.description || '')
    const privateLabel = String(post.privacy || '').toLowerCase() === 'protected'
      ? '<span class="noimpty-post-card__privacy">Private</span>'
      : ''

    return `<article class="noimpty-post-card">
      <a class="noimpty-post-card__cover" href="${escapeHtml(href)}" style="background-image:url('${escapeHtml(cover)}')" aria-label="阅读：${title}"></a>
      <div class="noimpty-post-card__body">
        <div class="noimpty-post-card__meta"><time>${escapeHtml(date)}</time>${privateLabel}</div>
        <h3><a href="${escapeHtml(href)}">${title}</a></h3>
        ${description ? `<p class="noimpty-post-card__description">${description}</p>` : ''}
      </div>
    </article>`
  }).join('')

  return `<div class="noimpty-post-grid" data-section="${escapeHtml(section)}">${cards}</div>`
})

hexo.extend.generator.register('noimpty-privacy-manifest', locals => {
  const entries = new Map()
  const add = (path, section) => entries.set(normalizeWebPath(path), String(section || 'ideas').toLowerCase())

  toArray(locals.posts)
    .concat(toArray(locals.pages))
    .filter(item => String(item.privacy || '').toLowerCase() === 'protected')
    .forEach(item => add(item.path, sectionOf(item)))

  add('ideas/', 'ideas')
  add('life/', 'life')
  add('categories/ideas/', 'ideas')
  add('categories/life/', 'life')
  add('tags/ideas/', 'ideas')
  add('tags/life/', 'life')

  const payload = {
    entries: Array.from(entries, ([path, section]) => ({ path, section }))
  }

  return {
    path: 'js/protected-manifest.js',
    data: `window.NOIMPTY_PRIVACY = Object.freeze(${JSON.stringify(payload)});\n`
  }
})

hexo.extend.filter.register('after_generate', async () => {
  const searchPath = hexo.config.search && hexo.config.search.path
  const stream = searchPath && hexo.route.get(searchPath)
  if (!stream) return

  let xml = ''
  for await (const chunk of stream) xml += chunk.toString()

  const protectedUrls = new Set(protectedPosts().map(post => encodeURI(normalizeWebPath(post.path))))
  if (protectedUrls.size === 0) return

  const filtered = xml.replace(/<entry>[\s\S]*?<\/entry>/g, entry => {
    const match = entry.match(/<url>(.*?)<\/url>/)
    return match && protectedUrls.has(match[1]) ? '' : entry
  })

  hexo.route.set(searchPath, filtered)
})
