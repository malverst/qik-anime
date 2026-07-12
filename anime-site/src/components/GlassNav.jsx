import { useRef, useEffect, useState } from 'react'
import { animate } from 'motion/react'
import GlassSurface from './GlassSurface.jsx'

// ---- droplet ---------------------------------------------------------------

function Droplet({ navRef, activeKey }) {
  const dropletRef = useRef(null)
  const prevKey = useRef(activeKey)

  useEffect(() => {
    if (!navRef.current || !activeKey) return
    const el = navRef.current.querySelector(`[data-nav-key="${activeKey}"]`)
    if (!el) return
    const navRect = navRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const targetLeft = elRect.left - navRect.left
    const targetWidth = elRect.width

    const drop = dropletRef.current
    if (!drop) return

    const isJump = prevKey.current && prevKey.current !== activeKey
    prevKey.current = activeKey

    if (isJump) {
      animate(drop,
        { left: targetLeft, width: targetWidth },
        { duration: 0.35, ease: [0.25, 0, 0.35, 1] }
      )
    } else {
      drop.style.left = `${targetLeft}px`
      drop.style.width = `${targetWidth}px`
    }

  }, [activeKey, navRef])

  return <div ref={dropletRef} className="glass-droplet" />
}

// ---- item ------------------------------------------------------------------

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      data-nav-key={item.key}
      className={`glass-nav-item${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={item.label}
    >
      <Icon width={19} height={19} />
      <span className="glass-nav-label">{item.label}</span>
    </button>
  )
}

// ---- bar -------------------------------------------------------------------

/**
 * GlassNav — Apple Liquid Glass bottom navigation bar.
 *
 * Props:
 *   items   – [{ key, label, icon: Component, onClick }]
 *   activeKey – string, the currently active item key
 */
export default function GlassNav({ items, activeKey, iconOnly }) {
  const navRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay rendering the droplet until after mount so layout is stable
    requestAnimationFrame(() => setMounted(true))
  }, [])

  return (
    <GlassSurface
      width="auto"
      height={62}
      borderRadius={28}
      borderWidth={0.06}
      brightness={50}
      opacity={0.75}
      blur={14}
      displace={3}
      backgroundOpacity={0.1}
      saturation={1.5}
      distortionScale={-140}
      redOffset={0}
      greenOffset={8}
      blueOffset={16}
      mixBlendMode="screen"
      className="glass-nav-surface"
    >
      <nav className={`glass-nav${iconOnly ? ' icon-only' : ''}`} ref={navRef}>
        {mounted && <Droplet navRef={navRef} activeKey={activeKey} />}
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onClick={item.onClick}
          />
        ))}
      </nav>
    </GlassSurface>
  )
}
