import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { backend } from '@fsd/shared/api/backend.js'
import { upgradePoster } from '@fsd/shared/api/client.js'
import { useAuth } from '@fsd/app/providers/AuthContext.jsx'
import Section from '@fsd/shared/ui/Section.jsx'
import Carousel from '@fsd/shared/ui/Carousel.jsx'

export default function ContinueWatching() {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    backend
      .continueWatching(12)
      .then((r) => setItems(Array.isArray(r) ? r : []))
      .catch(() => setItems([]))
  }, [user])

  if (!user || items.length === 0) return null

  return (
    <Section title="Продолжить просмотр">
      <Carousel>
        {items.map((it) => {
          const pct = it.duration ? Math.min(100, Math.round((it.seconds / it.duration) * 100)) : 0
          return (
            <Link key={it.id} to={`/anime/${it.animeUrl || it.animeId}/watch?ep=${encodeURIComponent(it.episodeNumber)}`} className="card">
              <div className="card-poster">
                {it.animePoster ? (
                  <img src={upgradePoster(it.animePoster, 'medium')} alt={it.animeTitle} loading="lazy" />
                ) : (
                  <div className="skel" style={{ width: '100%', height: '100%' }} />
                )}
                <div className="cw-ep">
                  {it.completed ? 'Серия ' + it.episodeNumber + ' ✓' : 'Серия ' + it.episodeNumber}
                </div>
                <div className="cw-progress">
                  <span style={{ width: `${it.completed ? 100 : pct}%` }} />
                </div>
              </div>
              <div className="card-title">{it.animeTitle || `Аниме #${it.animeId}`}</div>
            </Link>
          )
        })}
      </Carousel>
    </Section>
  )
}
