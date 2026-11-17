const COLORS = {
  O: '#07401f',
  W: '#e9fff1',
  L: '#9ef5bb',
  H: '#62e693',
  M: '#2fc66a',
  S: '#1fa055',
  D: '#127a3e',
}

const ROWS = [
  '................',
  '.......OO.......',
  '......OWLO......',
  '.....OWLLSO.....',
  '....OWLMHMSO....',
  '...OWLMHHMSDO...',
  '...OLLMHHMSDO...',
  '...OLLMHHMSDO...',
  '...OLLMHHMSDO...',
  '...OLLMHHMSDO...',
  '...OLMMHHMSDO...',
  '....OLMMMSDO....',
  '.....OMMSDO.....',
  '......OSDO......',
  '.......OO.......',
  '................',
]

const SIZE = ROWS[0].length

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

export default function PixelEmerald({ className }) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} aria-hidden>
      <g shapeRendering="crispEdges">
        {RECTS.map((rect) => (
          <rect key={`${rect.x}-${rect.y}`} x={rect.x} y={rect.y} width={rect.width} height="1" fill={rect.fill} />
        ))}
      </g>
    </svg>
  )
}
