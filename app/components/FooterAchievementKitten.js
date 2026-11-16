'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GrumpyKittenFace, PixelFace } from './PixelOutfit';
import { useMessage, useT } from './I18nProvider';
import StyledTooltip from './StyledTooltip';
import { playMew } from './softSounds';
import { KITTEN_GOALS } from '@/lib/kittenLevels';
import { useKittenShy } from './kittenShy';
const FLUSH_MS = 700;
const MAX_BATCH = 5;
const GOALS = KITTEN_GOALS;
export default function FooterAchievementKitten() {
    const t = useT();
    const shy = useKittenShy();
    const list = useMessage('footer.kitten.list');
    const sulks = useMessage('footer.kitten.grumpy.sulks');
    const [grumpy, setGrumpy] = useState(false);
    const [sulk, setSulk] = useState(-1);
    const [dodge, setDodge] = useState(false);
    const ACHIEVEMENTS = useMemo(() => GOALS.map((count, index) => ({ count, title: list?.[index]?.title || '', text: list?.[index]?.text || '' })), [list]);
    const ref = useRef(null);
    const [look, setLook] = useState({ x: 0, y: 0 });
    const [mood, setMood] = useState('look');
    const [hop, setHop] = useState(false);
    const [hearts, setHearts] = useState([]);
    const [pets, setPets] = useState(null);
    const [signedIn, setSignedIn] = useState(null);
    const [loginHref, setLoginHref] = useState('/login');
    const [toast, setToast] = useState(null);
    const moodTimer = useRef(undefined);
    const toastTimer = useRef(undefined);
    const flushTimer = useRef(undefined);
    const pending = useRef(0);
    const sending = useRef(false);
    const heartId = useRef(0);
    const calm = useRef(false);
    useEffect(() => {
        setLoginHref(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        fetch('/api/account/kitten', { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            const value = typeof data?.pets === 'number' ? data.pets : null;
            setSignedIn(value !== null);
            setGrumpy(data?.grumpy === true);
            setPets(value);
        })
            .catch(() => setSignedIn(false));
    }, []);
    useEffect(() => {
        calm.current = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
        if (calm.current)
            return undefined;
        const onMove = (event) => {
            const rect = ref.current?.getBoundingClientRect();
            if (!rect)
                return;
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            const length = Math.hypot(dx, dy) || 1;
            const reach = Math.min(1, length / 220);
            setLook({ x: (dx / length) * reach, y: (dy / length) * reach });
        };
        let blinkTimer;
        const blink = () => {
            blinkTimer = setTimeout(() => {
                setMood((current) => {
                    if (current !== 'look')
                        return current;
                    clearTimeout(moodTimer.current);
                    moodTimer.current = setTimeout(() => setMood('look'), 150);
                    return 'blink';
                });
                blink();
            }, 2400 + Math.random() * 3200);
        };
        blink();
        window.addEventListener('pointermove', onMove);
        return () => {
            window.removeEventListener('pointermove', onMove);
            clearTimeout(blinkTimer);
            clearTimeout(moodTimer.current);
            clearTimeout(toastTimer.current);
            clearTimeout(flushTimer.current);
        };
    }, []);
    const flush = useCallback(() => {
        if (sending.current || pending.current <= 0)
            return;
        const add = Math.min(MAX_BATCH, pending.current);
        pending.current -= add;
        sending.current = true;
        fetch('/api/account/kitten', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ add }),
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (typeof data?.pets === 'number')
                setPets(data.pets + pending.current);
        })
            .catch(() => { })
            .finally(() => {
            sending.current = false;
            if (pending.current > 0)
                flushTimer.current = setTimeout(flush, FLUSH_MS);
        });
    }, []);
    const pet = useCallback(() => {
        if (grumpy) {
            setSulk((current) => current + 1);
            if (calm.current)
                return;
            setDodge(false);
            requestAnimationFrame(() => setDodge(true));
            return;
        }
        clearTimeout(moodTimer.current);
        setMood('happy');
        moodTimer.current = setTimeout(() => setMood('look'), 1300);
        playMew();
        if (signedIn) {
            setPets((current) => {
                const next = (current ?? 0) + 1;
                const unlocked = ACHIEVEMENTS.find((item) => item.count === next);
                if (unlocked) {
                    clearTimeout(toastTimer.current);
                    setToast(unlocked);
                    toastTimer.current = setTimeout(() => setToast(null), 4200);
                }
                return next;
            });
            pending.current += 1;
            clearTimeout(flushTimer.current);
            if (pending.current >= MAX_BATCH)
                flush();
            else
                flushTimer.current = setTimeout(flush, FLUSH_MS);
        }
        if (calm.current)
            return;
        setHop(false);
        requestAnimationFrame(() => setHop(true));
        const fresh = Array.from({ length: 5 }, (_, index) => ({
            id: ++heartId.current,
            x: (Math.random() - 0.5) * 70,
            rise: 46 + Math.random() * 34,
            sway: (Math.random() - 0.5) * 24,
            delay: index * 55,
        }));
        setHearts((current) => [...current, ...fresh]);
        setTimeout(() => setHearts((current) => current.filter((heart) => !fresh.includes(heart))), 1500);
    }, [grumpy, signedIn, flush, ACHIEVEMENTS]);
    if (grumpy) {
        const phrases = Array.isArray(sulks) ? sulks : [];
        const phrase = sulk >= 0 && phrases.length ? phrases[sulk % phrases.length] : t('footer.kitten.grumpy.text');
        return (<div className="fk">
          <div className="fk-stage">
            <button type="button" className={`fk-button fk-button--grumpy${dodge ? ' fk-button--dodge' : ''}`} onClick={pet} onAnimationEnd={() => setDodge(false)} aria-label={t('footer.kitten.grumpy.aria')}>
              <GrumpyKittenFace />
            </button>
          </div>
          <div className="fk-info">
            <p className="fk-say">{t('footer.kitten.grumpy.title')}</p>
            <p className="fk-count" aria-live="polite">{phrase}</p>
          </div>
        </div>);
    }
    const count = pets ?? 0;
    const nextGoal = ACHIEVEMENTS.find((item) => item.count > count);
    const unlockedCount = ACHIEVEMENTS.filter((item) => item.count <= count).length;
    const current = unlockedCount > 0 ? ACHIEVEMENTS[unlockedCount - 1] : null;
    return (<div className="fk">
      <div className="fk-stage">
        <StyledTooltip label={t('pixel.footer')}>
          <button ref={ref} type="button" className={`fk-button${hop ? ' fk-button--hop' : ''}`} onClick={pet} onAnimationEnd={() => setHop(false)} aria-label={t('footer.kitten.aria')}>
            <PixelFace mood={shy ? 'look' : mood} look={look} paws={shy} level={signedIn ? unlockedCount : 0}/>
          </button>
        </StyledTooltip>
        {hearts.map((heart) => (<span key={heart.id} className="fk-heart" style={{
                '--fk-x': `${heart.x}px`,
                '--fk-rise': `${-heart.rise}px`,
                '--fk-sway': `${heart.sway}px`,
                animationDelay: `${heart.delay}ms`,
            }} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.4 5 6.9 5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.5 0 5.7 3.6 4.4 6.8C19.5 16.4 12 21 12 21z"/>
            </svg>
          </span>))}
      </div>

      <div className="fk-info">
        {signedIn ? (<>
            <p className={`fk-say${current ? ' fk-say--rank' : ''}`}>{current ? current.title : t('footer.kitten.pet')}</p>
            <p className="fk-count">
              {count ? t('footer.kitten.petted', { count }) : t('footer.kitten.waiting')}
              {nextGoal && count > 0 ? ` · ${t('footer.kitten.toNext', { count: nextGoal.count - count })}` : ''}
            </p>
            {unlockedCount > 0 && (<p className="fk-count">{t('footer.kitten.unlocked', { count: unlockedCount, total: ACHIEVEMENTS.length })}</p>)}
          </>) : (<>
            <p className="fk-say">{t('footer.kitten.pet')}</p>
            <p className="fk-count">
              {signedIn === false ? (<a href={loginHref} className="fk-login">{t('footer.kitten.signIn')}</a>) : (t('footer.kitten.waking'))}
            </p>
          </>)}
      </div>

      {toast && (<div className="fk-toast glass-pop" role="status" aria-live="polite">
          <span className="fk-toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>
            </svg>
          </span>
          <span className="fk-toast-text">
            <span className="fk-toast-kicker">{t('footer.kitten.toastKicker')}</span>
            <span className="fk-toast-title">{toast.title}</span>
            <span className="fk-toast-desc">{toast.text}</span>
          </span>
        </div>)}
    </div>);
}
