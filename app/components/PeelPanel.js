const ROUTE = 'M130 32 C130 72 22 60 22 100'

export default function PeelPanel({ children }) {
  return (
    <div className="peel-panel relative rounded-3xl px-5 pb-8 pt-14 md:px-8 md:pb-10 md:pt-16">
      {children}
      <div aria-hidden="true" className="peel-layer peel-under">
        <div className="peel-scene">
          <svg className="peel-route" width="170" height="132" viewBox="0 0 170 132">
            <path d={ROUTE} />
          </svg>
          <span className="peel-packet" />
          <span className="peel-packet" />
          <span className="peel-packet" />
          <span className="peel-ping" />
          <span className="peel-source">modrinth</span>
          <span className="peel-home">
            <span className="peel-home-logo" />
            modrinth.black
          </span>
        </div>
      </div>
      <div aria-hidden="true" className="peel-layer peel-flap-clip">
        <div className="peel-flap" />
      </div>
      <div aria-hidden="true" className="peel-hot" />
    </div>
  )
}
