'use client';
import { useId } from 'react';
import KittenCrown from './KittenCrown';
const EARS = [
    { outer: 'M5.7 5.6 5 0.9 10.1 3.2', inner: 'M6.6 5 6.3 2.6 8.8 3.7Z' },
    { outer: 'M18.3 5.6 19 0.9 13.9 3.2', inner: 'M17.4 5 17.7 2.6 15.2 3.7Z' },
];
export function GrumpyKittenFace({ size }) {
    return (<svg className="fk-face fk-face--grumpy" style={size ? { width: size, height: size } : undefined} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
      {EARS.map((ear, index) => (<g key={ear.outer} className={`fk-ear fk-ear--${index ? 'right' : 'left'}`}>
          <path d={ear.outer} strokeLinejoin="round" className="fk-fill"/>
          <path d={ear.inner} stroke="none" className="fk-inner"/>
        </g>))}
      <circle cx="12" cy="12" r="9" className="fk-fill"/>
      <path d="M7.6 9.2l2.6.8M16.4 9.2l-2.6.8" strokeWidth="1.2"/>
      <path d="M8.2 11h2.2M13.6 11h2.2"/>
      <path d="M11.4 12.5h1.2l-.6.7Z" fill="currentColor" strokeWidth="1" strokeLinejoin="round"/>
      <path d="M10.7 14.9q1.3-1.1 2.6 0"/>
      <path d="M3.6 12.2 6.4 12.8M3.9 14.6l2.6-.7M20.4 12.2l-2.8.6M20.1 14.6l-2.6-.7" strokeWidth="1"/>
    </svg>);
}
const HEART_PATH = 'M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.4 5 6.9 5c2 0 3.5 1.1 5.1 3 1.6-1.9 3.1-3 5.1-3 3.5 0 5.7 3.6 4.4 6.8C19.5 16.4 12 21 12 21z';
const STAR_PATH = 'M0-1.6.42-.42 1.6 0 .42.42 0 1.6-.42.42-1.6 0-.42-.42Z';
const RAINBOW = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa'];
const SPARKLES = [
    { x: 1.6, y: 6.6, size: 0.8, delay: '0s' },
    { x: 23.4, y: 21.6, size: 0.7, delay: '0.7s' },
    { x: 17.8, y: -1.4, size: 0.6, delay: '1.3s' },
    { x: 0.6, y: 15.4, size: 0.55, delay: '1.9s' },
];
const FLOATING_HEARTS = [
    { x: -1.6, y: 11, delay: '0s' },
    { x: 25, y: 6.4, delay: '1.1s' },
    { x: 17.2, y: 24.4, delay: '2.2s' },
];
export const KITTEN_WEAR = { blush: 5, yarn: 15, star: 19, crown: 20, tail: 22, hearts: 30, bell: 33, bow: 38, sparkles: 42, gold: 50, daisy: 60, glasses: 80, wings: 100, halo: 150, love: 175, aurora: 200 };
function Wings() {
    const lobes = ['M4.6 9.2C1.4 4.6-1.8 5.4-1 8.4-.5 10.2 2 10.6 4.4 10.4Z', 'M4.4 11.2C1.6 11.4-.2 13.4.9 14.8 1.9 16 3.9 14.2 4.8 12.4Z'];
    return (<g className="fk-wings" stroke="#7dd3fc" strokeWidth="0.5" strokeLinejoin="round">
      {[false, true].map((mirror) => (<g key={String(mirror)} transform={mirror ? 'matrix(-1 0 0 1 24 0)' : undefined} className={`fk-wing fk-wing--${mirror ? 'right' : 'left'}`}>
          {lobes.map((d) => <path key={d} d={d} fill="#7dd3fc" fillOpacity="0.5"/>)}
          <path d="M3.6 9.6Q1.4 8.4.4 7.6M3.6 12.4Q2.2 13.2 1.6 14" stroke="#bae6fd" strokeWidth="0.35"/>
        </g>))}
    </g>);
}
function Daisy() {
    return (<g transform="translate(17.6 4.6)" stroke="none">
      {[0, 60, 120, 180, 240, 300].map((angle) => (<ellipse key={angle} cx="0" cy="-0.85" rx="0.48" ry="0.8" fill="#fff" transform={`rotate(${angle})`}/>))}
      <circle r="0.55" fill="#facc15"/>
    </g>);
}
function Glasses() {
    return (<g stroke="#b45309" strokeWidth="0.45">
      <circle cx="9.2" cy="10" r="2.15" fill="#fff" fillOpacity="0.12"/>
      <circle cx="14.8" cy="10" r="2.15" fill="#fff" fillOpacity="0.12"/>
      <path d="M11.35 9.8Q12 9.2 12.65 9.8M7.05 9.6 5.4 9M16.95 9.6 18.6 9"/>
      <path d="M7.9 9.1Q8.3 8.5 8.9 8.4M13.5 9.1Q13.9 8.5 14.5 8.4" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.35"/>
    </g>);
}
function Halo() {
    return <ellipse className="fk-halo" cx="12" cy="-3.9" rx="3.6" ry="0.95" stroke="#fde68a" strokeWidth="0.8"/>;
}
function FloatingHeart({ x, y, delay }) {
    return (<g transform={`translate(${x} ${y})`}>
      <path d={HEART_PATH} className="fk-float-heart" style={{ animationDelay: delay }} stroke="none" fill="#f472b6" transform="scale(0.09) translate(-12 -13)"/>
    </g>);
}
function Sparkle({ x, y, size, delay, className = 'fk-sparkle' }) {
    return (<g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d={STAR_PATH} className={className} style={{ animationDelay: delay }} stroke="none"/>
    </g>);
}
function RainbowTail({ id }) {
    return (<g className="fk-tail">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0.4" y2="0">
          {RAINBOW.map((color, index) => (<stop key={color} offset={index / (RAINBOW.length - 1)} stopColor={color}/>))}
        </linearGradient>
      </defs>
      <path d="M18.4 18.6C22.6 19 24.6 14.4 23.4 11.2 22.9 9.9 21.7 9.7 21.3 10.6" stroke={`url(#${id})`} strokeWidth="2.2"/>
    </g>);
}
function YarnBall() {
    return (<g strokeLinecap="round">
      <path d="M5.2 22Q8.4 24.2 10.6 21.6" stroke="#f472b6" strokeWidth="0.55"/>
      <circle cx="3.2" cy="20.4" r="2.5" fill="#f9a8d4" stroke="#db2777" strokeWidth="0.6"/>
      <path d="M1.2 19.4Q3.2 18.4 5 21.4M1.6 21.6Q3.4 19.2 5.6 19.6M2.6 18Q3.2 20.4 2.4 22.8" stroke="#fff" strokeOpacity="0.75" strokeWidth="0.45"/>
    </g>);
}
function Bell({ gold }) {
    return (<g>
      <path d="M5.4 18.2Q12 22.8 18.6 18.2" stroke={gold ? '#f59e0b' : '#f43f5e'} strokeWidth="1.5"/>
      <circle cx="12" cy="21.1" r="1.2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5"/>
      <path d="M11.4 21.4h1.2" stroke="#b45309" strokeWidth="0.4"/>
      <circle cx="11.6" cy="20.6" r="0.28" fill="#fff" stroke="none"/>
    </g>);
}
function Bow() {
    return (<g strokeWidth="0.45" stroke="#db2777" strokeLinejoin="round" transform="rotate(-18 5.4 4.2)">
      <path d="M5.4 4.2 3.2 2.9 3.3 5.6Z" fill="#f9a8d4"/>
      <path d="M5.4 4.2 7.6 2.9 7.5 5.6Z" fill="#f9a8d4"/>
      <circle cx="5.4" cy="4.2" r="0.65" fill="#f472b6"/>
    </g>);
}
function EyeShine({ x, y, hearts }) {
    if (!hearts)
        return <circle cx={x} cy={y} r="0.42" fill="white"/>;
    return <path d={HEART_PATH} fill="white" transform={`translate(${x} ${y}) scale(0.06) translate(-12 -13)`}/>;
}
export function PixelFace({ mood = 'look', look = { x: 0, y: 0 }, paws = null, level = 0, size }) {
    const tailId = `fk-tail-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const has = (item) => level >= KITTEN_WEAR[item];
    const gold = has('gold');
    const glow = has('aurora') ? ' fk-face--aurora' : gold ? ' fk-face--gold' : '';
    const cheek = mood === 'happy' ? ' fk-cheek--blush' : has('blush') ? ' fk-cheek--love' : '';
    return (<svg className={`fk-face${glow}`} style={size ? { width: size, height: size } : undefined} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
      {has('wings') ? <Wings /> : null}
      {has('tail') ? <RainbowTail id={tailId}/> : null}
      {EARS.map((ear, index) => (<g key={ear.outer} className={`fk-ear fk-ear--${index ? 'right' : 'left'}`}>
          <path d={ear.outer} strokeLinejoin="round" className="fk-fill"/>
          <path d={ear.inner} stroke="none" className="fk-inner"/>
          {index === 0 && has('bow') ? <Bow /> : null}
          {index === 1 && has('daisy') ? <Daisy /> : null}
        </g>))}
      <circle cx="12" cy="12" r="9" className="fk-fill"/>
      <ellipse cx="7.6" cy="13.4" rx="1.5" ry="0.9" stroke="none" className={`fk-cheek${cheek}`}/>
      <ellipse cx="16.4" cy="13.4" rx="1.5" ry="0.9" stroke="none" className={`fk-cheek${cheek}`}/>
      {mood === 'happy' ? (<path d="M7.9 10.6q1.3-1.8 2.6 0M13.5 10.6q1.3-1.8 2.6 0"/>) : mood === 'blink' ? (<path d="M8 10.2h2.4M13.6 10.2h2.4"/>) : (<g stroke="none">
          {[9.2, 14.8].map((cx) => (<g key={cx}>
              <circle cx={cx + look.x * 0.7} cy={10 + look.y * 0.6} r="1.35" fill="currentColor"/>
              <EyeShine x={cx + look.x * 0.7 - 0.45} y={10 + look.y * 0.6 - 0.45} hearts={has('hearts')}/>
            </g>))}
        </g>)}
      {has('glasses') ? <Glasses /> : null}
      <g className={`fk-paws${paws ? ` fk-paws--${paws}` : ''}`} stroke="none">
        {[9.2, 14.8].map((cx, index) => (
          <g key={cx} className={`fk-paw fk-paw--${index ? 'right' : 'left'}`}>
            <ellipse cx={cx} cy="10.6" rx="2.7" ry="2.3" fill="currentColor" />
            <ellipse cx={cx} cy="11.2" rx="1" ry="0.75" fill="white" fillOpacity="0.45" />
            {[-1.2, 0, 1.2].map((dx) => (
              <circle key={dx} cx={cx + dx} cy={dx ? 9.3 : 9} r="0.42" fill="white" fillOpacity="0.45" />
            ))}
          </g>
        ))}
      </g>
      <path d="M11.4 12.5h1.2l-.6.7Z" fill="currentColor" strokeWidth="1" strokeLinejoin="round"/>
      {mood === 'happy' ? (<path d="M10.6 13.4q1.4 1.8 2.8 0"/>) : (<path d="M12 13.3q-.4 1.4-1.6 1.1M12 13.3q.4 1.4 1.6 1.1"/>)}
      <path d="M3.6 12.2 6.4 12.8M3.9 14.6l2.6-.7M20.4 12.2l-2.8.6M20.1 14.6l-2.6-.7" strokeWidth="1"/>
      {has('bell') ? <Bell gold={gold}/> : null}
      {has('halo') ? <Halo /> : null}
      {has('crown') ? <KittenCrown shine={gold}/> : null}
      {has('yarn') ? <YarnBall /> : null}
      {has('star') ? <Sparkle x={21.4} y={3.4} size={1} delay="0.4s" className="fk-sparkle fk-sparkle--star"/> : null}
      {has('sparkles') ? SPARKLES.map((sparkle) => <Sparkle key={`${sparkle.x}-${sparkle.y}`} {...sparkle}/>) : null}
      {has('love') ? FLOATING_HEARTS.map((heart) => <FloatingHeart key={`${heart.x}-${heart.y}`} {...heart}/>) : null}
    </svg>);
}
