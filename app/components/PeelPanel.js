const ROUTE = 'M130 32 C130 72 22 60 22 100'

const K = ({ children }) => <span className="pc-k">{children}</span>
const F = ({ children }) => <span className="pc-f">{children}</span>
const S = ({ children }) => <span className="pc-s">{children}</span>
const N = ({ children }) => <span className="pc-n">{children}</span>
const P = ({ children }) => <span className="pc-p">{children}</span>

function Code() {
  return (
    <pre className="peel-code">
      <K>import</K> {'{ '}<F>cache</F>{' }'} <K>from</K> <S>'react'</S>
      {'\n\n'}
      <K>export const</K> <F>getMod</F> = <F>cache</F>(<K>async</K> (<P>slug</P>) =&gt; {'{'}
      {'\n  '}<K>const</K> <P>url</P> = <S>{'`${API}/project/${slug}`'}</S>
      {'\n  '}<K>const</K> <P>res</P> = <K>await</K> <F>fetch</F>(<P>url</P>, {'{'}
      {'\n    '}<P>next</P>: {'{ '}<P>revalidate</P>: <N>1800</N>{' }'},
      {'\n  '}{'})'}
      {'\n  '}<K>if</K> (!<P>res</P>.<P>ok</P>) <K>throw new</K> <F>HttpError</F>(<P>res</P>)
      {'\n  '}<K>return</K> <F>normalize</F>(<K>await</K> <P>res</P>.<F>json</F>())
      {'\n'}{'})'}
      {'\n\n'}
      <K>export async function</K> <F>getVersions</F>(<P>slug</P>) {'{'}
      {'\n  '}<K>const</K> <P>mod</P> = <K>await</K> <F>getMod</F>(<P>slug</P>)
      {'\n  '}<K>const</K> <P>v</P> = <F>stamp</F>(<P>mod</P>)
      {'\n  '}<K>return</K> <F>fetchList</F>(<S>{'`${url(slug)}?v=${v}`'}</S>)
      {'\n'}{'}'}
    </pre>
  )
}

export default function PeelPanel({ className = '', children }) {
  return (
    <div className={`peel-panel relative ${className}`}>
      {children}
      <div aria-hidden="true" className="peel-layer peel-under">
        <Code />
        <div className="peel-scene">
          <svg className="peel-route" width="170" height="132" viewBox="0 0 170 132">
            <path d={ROUTE} />
          </svg>
          <span className="peel-packet" />
          <span className="peel-packet" />
          <span className="peel-packet" />
          <span className="peel-ping" />
          <span className="peel-source">
            Modrinth
            <svg className="peel-verified" viewBox="0 0 16 16">
              <path d="M8 .9l1.9 1.4 2.3-.1.7 2.2 1.9 1.4-.8 2.2.8 2.2-1.9 1.4-.7 2.2-2.3-.1L8 15.1l-1.9-1.4-2.3.1-.7-2.2L1.2 10.2 2 8l-.8-2.2 1.9-1.4.7-2.2 2.3.1z" />
              <path className="peel-verified-tick" d="M5.2 8.2l1.9 1.9 3.8-3.9" />
            </svg>
          </span>
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
