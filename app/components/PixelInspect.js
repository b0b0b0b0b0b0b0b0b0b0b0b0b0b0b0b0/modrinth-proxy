'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PixelFace } from './PixelOutfit';
const MAX_TILT = 22;
const CLOSE_PATH = 'M6 6l12 12M18 6 6 18';
const PRESS_MS = 500;
const PRESS_SLOP = 10;
const PRESS_GUARD_MS = 800;
export function useCoarsePointer() {
    const [coarse, setCoarse] = useState(false);
    useEffect(() => {
        const query = window.matchMedia?.('(hover: none) and (pointer: coarse)');
        if (!query)
            return undefined;
        const update = () => setCoarse(query.matches);
        update();
        query.addEventListener?.('change', update);
        return () => query.removeEventListener?.('change', update);
    }, []);
    return coarse;
}
export function useInspectPress(onInspect) {
    const timer = useRef(0);
    const firedAt = useRef(0);
    const origin = useRef(null);
    const inspectRef = useRef(onInspect);
    inspectRef.current = onInspect;
    useEffect(() => () => clearTimeout(timer.current), []);
    const open = () => {
        if (!inspectRef.current || Date.now() - firedAt.current < PRESS_GUARD_MS)
            return;
        firedAt.current = Date.now();
        inspectRef.current();
    };
    const cancel = () => clearTimeout(timer.current);
    return {
        onContextMenu: (event) => {
            if (!inspectRef.current)
                return;
            event.preventDefault();
            open();
        },
        onTouchStart: (event) => {
            const touch = event.touches[0];
            origin.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
            clearTimeout(timer.current);
            timer.current = setTimeout(open, PRESS_MS);
        },
        onTouchMove: (event) => {
            const touch = event.touches[0];
            if (touch && origin.current && Math.hypot(touch.clientX - origin.current.x, touch.clientY - origin.current.y) > PRESS_SLOP)
                cancel();
        },
        onTouchEnd: cancel,
        onTouchCancel: cancel,
        onClickCapture: (event) => {
            if (Date.now() - firedAt.current < PRESS_GUARD_MS) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
    };
}
function prefersCalm() {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
export default function PixelInspect(props) {
    const { level, title, subtitle = '', hint = '', closeLabel = '', onClose } = props;
    const cardRef = useRef(null);
    const frame = useRef(0);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    const [pose, setPose] = useState({ x: 0, y: 0, gx: 50, gy: 30, active: false });
    const [shown, setShown] = useState(false);
    const openedAt = useRef(Date.now());
    const dismiss = () => {
        if (Date.now() - openedAt.current > 600)
            closeRef.current();
    };
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape')
                closeRef.current();
        };
        window.addEventListener('keydown', onKey);
        const raf = requestAnimationFrame(() => setShown(true));
        return () => {
            window.removeEventListener('keydown', onKey);
            cancelAnimationFrame(raf);
            cancelAnimationFrame(frame.current);
        };
    }, []);
    const follow = (event) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        const calm = prefersCalm();
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => setPose({
            x: calm ? 0 : (0.5 - py) * MAX_TILT * 2,
            y: calm ? 0 : (px - 0.5) * MAX_TILT * 2,
            gx: px * 100,
            gy: py * 100,
            active: true,
        }));
    };
    const rest = () => {
        cancelAnimationFrame(frame.current);
        setPose((current) => ({ ...current, x: 0, y: 0, active: false }));
    };
    const stop = (event) => event.stopPropagation();
    const band = pose.gx * 0.4;
    if (typeof document === 'undefined')
        return null;
    return createPortal(<div role="dialog" aria-modal="true" aria-label={title} className={`pixel-inspect${shown ? ' pixel-inspect--shown' : ''}`} onClick={dismiss} onContextMenu={(event) => {
            event.preventDefault();
            dismiss();
        }}>
      <div className="pixel-inspect-stage" onClick={stop}>
        <div ref={cardRef} className="pixel-inspect-card" onPointerMove={follow} onPointerDown={follow} onPointerLeave={rest} style={{
            transform: `rotateX(${pose.x}deg) rotateY(${pose.y}deg) scale(${shown ? 1 : 0.9})`,
            transition: pose.active ? 'transform 0.08s linear' : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          <div className="pixel-inspect-glow" aria-hidden="true"/>
          <div className="pixel-inspect-face">
            <PixelFace level={level} size={176}/>
          </div>
          <div className="pixel-inspect-light" aria-hidden="true" style={{
            opacity: pose.active ? 1 : 0.35,
            background: `radial-gradient(circle at ${pose.gx}% ${pose.gy}%, rgba(255,255,255,0.75), rgba(255,255,255,0.15) 28%, transparent 55%)`,
        }}/>
          <div className="pixel-inspect-foil" aria-hidden="true" style={{
            opacity: pose.active ? 0.35 : 0,
            background: `linear-gradient(${115 + (pose.gx - 50) * 0.6}deg, transparent ${band + 10}%, rgba(255,255,255,0.55) ${band + 22}%, rgba(167,139,250,0.35) ${band + 30}%, rgba(56,189,248,0.3) ${band + 38}%, transparent ${band + 52}%)`,
        }}/>
        </div>
      </div>
      <div className="pixel-inspect-caption" onClick={stop}>
        <div className="pixel-inspect-title">{title}</div>
        {subtitle ? <div className="pixel-inspect-subtitle">{subtitle}</div> : null}
        {hint ? <div className="pixel-inspect-hint">{hint}</div> : null}
      </div>
      <button type="button" className="pixel-inspect-close" onClick={() => closeRef.current()} aria-label={closeLabel}>
        <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d={CLOSE_PATH}/>
        </svg>
      </button>
    </div>, document.body);
}
