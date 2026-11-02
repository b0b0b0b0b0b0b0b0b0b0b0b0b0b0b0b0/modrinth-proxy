const COLORS = {
  O: '#0c3b3a',
  W: '#e6fffd',
  L: '#a8fff8',
  M: '#4fe3dc',
  S: '#2fc9c2',
  D: '#1c9a95',
}

const ROWS = [
  '..............',
  '...OOOOOOOO...',
  '..OLLWWWWLLO..',
  '.OLMLWWWWLMSO.',
  'OLMMMLLLLMMMSO',
  'OMMMMMMMMMMSSO',
  'OWLLLLLLSSSSDO',
  'OMLMMMMMMMMSDO',
  '.OMLMMMMMMSDO.',
  '..OMLMMMMSDO..',
  '...OMLMSSDO...',
  '....OMLSDO....',
  '.....OOOO.....',
  '..............',
]

export const PIXEL_DIAMOND_SIZE = ROWS[0].length

const RECTS = ROWS.flatMap((row, y) => {
  const out = []
  let x = 0
  while (x < row.length) {
    const color = row[x]
    let end = x
    while (end < row.length && row[end] === color) end += 1
    if (color !== '.') out.push({ x, y, width: end - x, fill: COLORS[color] })
    x = end
  }
  return out
})

export function PixelDiamondPixels({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} shapeRendering="crispEdges">
      {RECTS.map((rect) => (
        <rect key={`${rect.x}-${rect.y}`} x={rect.x} y={rect.y} width={rect.width} height="1" fill={rect.fill} />
      ))}
    </g>
  )
}

export default function PixelDiamond({ className }) {
  return (
    <svg viewBox={`0 0 ${PIXEL_DIAMOND_SIZE} ${PIXEL_DIAMOND_SIZE}`} className={className} aria-hidden>
      <PixelDiamondPixels />
    </svg>
  )
}
