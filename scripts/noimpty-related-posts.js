'use strict'

const { postDesc } = require('hexo-theme-butterfly/scripts/common/postDesc')

const STRUCTURAL_TAGS = new Set(['study', 'ideas', 'life'])

const toArray = collection => {
  if (!collection) return []
  if (Array.isArray(collection)) return collection
  if (typeof collection.toArray === 'function') return collection.toArray()
  if (Array.isArray(collection.data)) return collection.data
  return []
}

const tagName = tag => String(tag && tag.name != null ? tag.name : tag || '').trim()
const isProtected = post => String(post && post.privacy || '').toLowerCase() === 'protected'
const privateSection = post => String(post && post.private_section || '').toLowerCase()

const canRecommend = (currentPost, candidate) => {
  if (!candidate || currentPost.path === candidate.path) return false

  const currentIsProtected = isProtected(currentPost)
  const candidateIsProtected = isProtected(candidate)

  if (!currentIsProtected) return !candidateIsProtected
  return candidateIsProtected && privateSection(currentPost) === privateSection(candidate)
}

const registerRelatedPostsHelper = () => {
  hexo.extend.helper.register('related_posts', function (currentPost) {
    const currentTags = toArray(currentPost.tags)
      .filter(tag => !STRUCTURAL_TAGS.has(tagName(tag).toLowerCase()))

    if (currentTags.length === 0) return ''

    const allPosts = toArray(hexo.locals.get('posts'))
    const visiblePool = allPosts.filter(post => canRecommend(currentPost, post))
    const relatedPosts = new Map()

    currentTags.forEach(tag => {
      const name = tagName(tag)
      if (!name) return

      const candidates = toArray(tag.posts).filter(post => canRecommend(currentPost, post))
      if (candidates.length === 0) return

      // Rare, more specific shared tags carry more weight than broad tags.
      const weight = 1 + Math.log((visiblePool.length + 1) / (candidates.length + 1))

      candidates.forEach(post => {
        let item = relatedPosts.get(post.path)
        if (!item) {
          item = {
            title: post.title,
            path: post.path,
            cover: post.cover,
            cover_type: post.cover_type,
            updated: post.updated,
            created: post.date,
            postDesc: post.postDesc || postDesc(post, hexo),
            score: 0,
            sharedTags: []
          }
          relatedPosts.set(post.path, item)
        }

        item.score += weight
        item.sharedTags.push({ name, weight })
      })
    })

    if (relatedPosts.size === 0) return ''

    const config = hexo.theme.config
    const limitNum = config.related_post.limit || 6
    const dateType = config.related_post.date_type || 'created'
    const headlineLang = this._p('post.recommend')

    const relatedPostsList = Array.from(relatedPosts.values())
      .map(item => {
        item.sharedTags.sort((left, right) => right.weight - left.weight || left.name.localeCompare(right.name, 'zh-CN'))
        return item
      })
      .sort((left, right) => {
        if (Math.abs(right.score - left.score) > 1e-9) return right.score - left.score
        if (right.sharedTags.length !== left.sharedTags.length) return right.sharedTags.length - left.sharedTags.length

        const dateDiff = Number(right.created || 0) - Number(left.created || 0)
        if (dateDiff !== 0) return dateDiff
        return String(left.title).localeCompare(String(right.title), 'zh-CN')
      })

    let result = '<div class="relatedPosts" data-recommendation-rule="shared-tags">'
    result += `<div class="headline"><i class="fas fa-thumbs-up fa-fw"></i><span>${headlineLang}</span></div>`
    result += '<div class="relatedPosts-list">'

    for (let i = 0; i < Math.min(relatedPostsList.length, limitNum); i++) {
      let { cover, title, path, cover_type: coverType, created, updated, postDesc: description, score, sharedTags } = relatedPostsList[i]
      const { escape_html: escapeHtml, url_for: urlFor, date } = this
      const sharedTagNames = sharedTags.map(tag => tag.name)
      const tagLabel = escapeHtml(sharedTagNames.join(' · '))

      cover = cover || 'var(--default-bg-color)'
      title = escapeHtml(title)
      const className = description ? 'pagination-related' : 'pagination-related no-desc'
      result += `<a class="${className}" href="${urlFor(path)}" title="推荐依据：共同标签 ${tagLabel}" data-related-score="${score.toFixed(6)}" data-shared-tags="${tagLabel}">`

      if (coverType === 'img') {
        result += `<img class="cover" src="${urlFor(cover)}" alt="cover">`
      } else {
        result += `<div class="cover" style="background: ${cover}"></div>`
      }

      const shownDate = dateType === 'created' ? created : updated
      result += `<div class="info text-center"><div class="info-1"><div class="info-item-1"><i class="fas fa-tags fa-fw"></i> 共同标签：${tagLabel}</div>`
      result += `<div class="info-item-2">${title}</div><div class="noimpty-related-date">${date(shownDate, hexo.config.date_format)}</div></div>`

      if (description) {
        result += `<div class="info-2"><div class="info-item-1">${description}</div></div>`
      }

      result += '</div></a>'
    }

    result += '</div></div>'
    return result
  })
}

// Theme and project scripts may load in parallel. Registering immediately before
// generation guarantees that this deterministic helper replaces the theme default.
hexo.extend.filter.register('before_generate', registerRelatedPostsHelper)
