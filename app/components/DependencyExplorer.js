'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force'
import { resolveCanonicalProjectHref } from '@/lib/projectType'

const EDGE_COLORS = {
  required: '#4ade80',
  optional: '#888888',
  embedded: '#60a5fa',
}

const LEGEND = [
  { type: 'required', color: EDGE_COLORS.required, label: 'Обязательная' },
  { type: 'optional', color: EDGE_COLORS.optional, label: 'Опциональная' },
  { type: 'embedded', color: EDGE_COLORS.embedded, label: 'Встроенная' },
]

function nodeR(node) {
  return node.isRoot ? 28 : 22
}

function escId(id) {
  return id.replace(/[^a-zA-Z0-9]/g, '_')
}

function clampLabel(text, max) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function projectPath(project) {
  return resolveCanonicalProjectHref(project) || '/'
}

async function loadDependencies(slug, versionNumber) {
  const params = new URLSearchParams({ slug })
  if (versionNumber) params.set('version', versionNumber)
  const response = await fetch(`/api/dependencies?${params.toString()}`)
  if (!response.ok) return []
  return response.json()
}

function DependencyGraph({ projectSlug, versionNumber, onNavigate }) {
  const svgRef = useRef(null)
  const nodesRef = useRef([])
  const edgesRef = useRef([])
  const graphEpochRef = useRef(0)
  const simulationRef = useRef(null)
  const fitOnSettleRef = useRef(false)
  const draggingRef = useRef(null)
  const dragStartMouseRef = useRef({ x: 0, y: 0 })
  const dragStartNodeRef = useRef({ x: 0, y: 0 })
  const dragMovedRef = useRef(false)
  const panningRef = useRef(false)
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  const [renderTick, setRenderTick] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [pan, setPan] = useState({ x: 480, y: 290 })
  const [zoom, setZoom] = useState(1)

  const getD3Links = useCallback(() => {
    return edgesRef.current.map((edge) => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
    }))
  }, [])

  const zoomToFit = useCallback((padding = 80) => {
    const nodes = nodesRef.current
    const svgEl = svgRef.current
    if (!nodes.length || !svgEl) return

    const w = svgEl.clientWidth
    const h = svgEl.clientHeight
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      const r = nodeR(node) + 14
      minX = Math.min(minX, node.x - r)
      maxX = Math.max(maxX, node.x + r)
      minY = Math.min(minY, node.y - r)
      maxY = Math.max(maxY, node.y + r)
    }

    const graphW = maxX - minX || 1
    const graphH = maxY - minY || 1
    const scale = Math.min((w - padding * 2) / graphW, (h - padding * 2) / graphH, 1.2)

    setZoom(scale)
    setPan({
      x: (w - graphW * scale) / 2 - minX * scale,
      y: (h - graphH * scale) / 2 - minY * scale,
    })
  }, [])

  const startSimulation = useCallback(() => {
    simulationRef.current?.stop()

    simulationRef.current = forceSimulation(nodesRef.current)
      .force('charge', forceManyBody().strength(-1200))
      .force(
        'link',
        forceLink(getD3Links())
          .id((node) => node.id)
          .distance(10)
          .strength(0.25),
      )
      .force(
        'collide',
        forceCollide()
          .radius((node) => nodeR(node) + 14)
          .strength(0.9),
      )
      .force('center', forceCenter(0, 0).strength(0.02))
      .alphaDecay(0.04)
      .velocityDecay(0.8)
      .on('tick', () => {
        setRenderTick((tick) => tick + 1)
      })
      .on('end', () => {
        if (fitOnSettleRef.current) {
          fitOnSettleRef.current = false
          zoomToFit()
        }
      })
  }, [getD3Links, zoomToFit])

  const kickSimulation = useCallback(
    (hasNewNodes = true) => {
      const simulation = simulationRef.current
      if (!simulation) return
      simulation.nodes(nodesRef.current)
      simulation.force('link').links(getD3Links())
      const kickAlpha = hasNewNodes ? 0.4 : 0.08
      simulation.alpha(Math.max(simulation.alpha(), kickAlpha)).restart()
    },
    [getD3Links],
  )

  const addDepsToGraph = useCallback((sourceId, sourceProjectId, deps, depth) => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    const source = nodes.find((node) => node.id === sourceId)
    const sx = source?.x ?? 0
    const sy = source?.y ?? 0

    const resolveNodeId = (projectId) => {
      const existing = nodes.find(
        (node) => node.id === projectId || node.project?.id === projectId,
      )
      return existing?.id ?? projectId
    }

    const relevant = (deps || []).filter((dep) => {
      if (!dep.project_id) return Boolean(dep.version_id)
      return dep.project_id !== sourceProjectId
    })

    let created = 0
    relevant.forEach((dep, index) => {
      const projectId = dep.project_id
      const nodeId = projectId
        ? resolveNodeId(projectId)
        : `version:${dep.version_id}`

      const nodeExists = nodes.some((node) => node.id === nodeId)
      if (!nodeExists) {
        const angle = (index / Math.max(relevant.length, 1)) * 2 * Math.PI
        const radius = 80 + 30 * Math.floor(index / 8)
        nodes.push({
          id: nodeId,
          x: sx + radius * Math.cos(angle),
          y: sy + radius * Math.sin(angle),
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          project: dep.project,
          loaded: false,
          loading: false,
          isRoot: false,
          depth,
        })
        created += 1
      }

      const hasEdge = edges.some(
        (edge) =>
          edge.source === sourceId &&
          edge.target === nodeId &&
          edge.type === dep.dependency_type,
      )
      if (!hasEdge) {
        edges.push({
          source: sourceId,
          target: nodeId,
          type: dep.dependency_type,
        })
      }
    })

    return created > 0
  }, [])

  const expandNode = useCallback(
    async (node) => {
      if (node.loaded || node.loading) return

      node.loading = true
      setRenderTick((tick) => tick + 1)

      try {
        const slug = node.project?.slug ?? node.id
        const rootProjectId = nodesRef.current[0]?.project?.id
        const isRootProject = node.project?.id === rootProjectId
        const deps = isRootProject && versionNumber
          ? await loadDependencies(slug, versionNumber)
          : await loadDependencies(slug)

        const hasNewNodes = addDepsToGraph(
          node.id,
          node.project?.id ?? node.id,
          deps,
          node.depth + 1,
        )
        node.loaded = true
        kickSimulation(hasNewNodes)
      } finally {
        node.loading = false
        setRenderTick((tick) => tick + 1)
      }
    },
    [addDepsToGraph, kickSimulation, versionNumber],
  )

  const initGraph = useCallback(async () => {
    const epoch = graphEpochRef.current + 1
    graphEpochRef.current = epoch
    const isStale = () => graphEpochRef.current !== epoch

    nodesRef.current = []
    edgesRef.current = []
    simulationRef.current?.stop()
    setInitialLoading(true)
    setZoom(1)

    let rootProject = null
    try {
      const params = new URLSearchParams({ slug: projectSlug })
      const response = await fetch(`/api/dependencies/project?${params.toString()}`)
      if (response.ok) rootProject = await response.json()
    } catch {
      rootProject = null
    }

    if (isStale()) return

    const rootId = rootProject?.id ?? projectSlug
    const rootProjectId = rootProject?.id ?? rootId
    nodesRef.current.push({
      id: rootId,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
      project: rootProject,
      loaded: false,
      loading: false,
      isRoot: true,
      depth: 0,
    })

    try {
      const deps = versionNumber
        ? await loadDependencies(projectSlug, versionNumber)
        : await loadDependencies(projectSlug)

      if (isStale()) return

      if (deps.length > 0) {
        addDepsToGraph(rootId, rootProjectId, deps, 1)
      }
      if (nodesRef.current[0]) {
        nodesRef.current[0].loaded = true
      }
    } finally {
      if (!isStale()) {
        setInitialLoading(false)
        fitOnSettleRef.current = true
        startSimulation()
        setRenderTick((tick) => tick + 1)
      }
    }
  }, [addDepsToGraph, projectSlug, startSimulation, versionNumber])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const w = svgEl.clientWidth || 960
    const h = svgEl.clientHeight || 580
    setPan({ x: w / 2, y: h / 2 })
    initGraph()

    return () => {
      graphEpochRef.current += 1
      simulationRef.current?.stop()
    }
  }, [initGraph])

  const nodePos = useCallback((id) => {
    return nodesRef.current.find((node) => node.id === id) ?? { x: 0, y: 0 }
  }, [])

  const edgesWithCurvature = useMemo(() => {
    void renderTick
    const edges = edgesRef.current
    const counts = new Map()

    for (const edge of edges) {
      const key = [edge.source, edge.target].sort().join('|||')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const groupIdx = new Map()
    return edges.map((edge) => {
      const key = [edge.source, edge.target].sort().join('|||')
      const count = counts.get(key) ?? 1
      const idx = groupIdx.get(key) ?? 0
      groupIdx.set(key, idx + 1)
      const curvature = count > 1 ? (idx - (count - 1) / 2) * 28 : 0
      return { ...edge, curvature }
    })
  }, [renderTick])

  const edgePath = useCallback(
    (edge, curvature) => {
      const src = nodePos(edge.source)
      const tgt = nodePos(edge.target)
      const dx = tgt.x - src.x
      const dy = tgt.y - src.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const ux = dx / dist
      const uy = dy / dist
      const srcNode = nodesRef.current.find((node) => node.id === edge.source)
      const tgtNode = nodesRef.current.find((node) => node.id === edge.target)
      const r1 = srcNode ? nodeR(srcNode) : 22
      const r2 = tgtNode ? nodeR(tgtNode) : 22
      const x1 = src.x + ux * r1
      const y1 = src.y + uy * r1
      const x2 = tgt.x - ux * r2
      const y2 = tgt.y - uy * r2

      if (Math.abs(curvature) < 0.5) {
        return `M ${x1} ${y1} L ${x2} ${y2}`
      }

      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const [canonA, canonB] = [edge.source, edge.target].sort()
      const posA = nodePos(canonA)
      const posB = nodePos(canonB)
      const cdx = posB.x - posA.x
      const cdy = posB.y - posA.y
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy) || 1
      const cx = mx + (-cdy / cdist) * curvature
      const cy = my + (cdx / cdist) * curvature
      return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
    },
    [nodePos],
  )

  const onNodeMouseDown = (event, node) => {
    event.preventDefault()
    draggingRef.current = node
    dragStartMouseRef.current = { x: event.clientX, y: event.clientY }
    dragStartNodeRef.current = { x: node.x, y: node.y }
    dragMovedRef.current = false
    node.fx = node.x
    node.fy = node.y
    simulationRef.current?.alphaTarget(0.3).restart()
  }

  const onBgMouseDown = (event) => {
    panningRef.current = true
    panStartRef.current = {
      mx: event.clientX,
      my: event.clientY,
      px: pan.x,
      py: pan.y,
    }
  }

  const onMouseMove = (event) => {
    const draggingNode = draggingRef.current
    if (draggingNode) {
      const dx = event.clientX - dragStartMouseRef.current.x
      const dy = event.clientY - dragStartMouseRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMovedRef.current = true
      draggingNode.fx = dragStartNodeRef.current.x + dx / zoom
      draggingNode.fy = dragStartNodeRef.current.y + dy / zoom
      draggingNode.x = draggingNode.fx
      draggingNode.y = draggingNode.fy
      setRenderTick((tick) => tick + 1)
    } else if (panningRef.current) {
      setPan({
        x: panStartRef.current.px + (event.clientX - panStartRef.current.mx),
        y: panStartRef.current.py + (event.clientY - panStartRef.current.my),
      })
    }
  }

  const onMouseUp = () => {
    const draggingNode = draggingRef.current
    if (draggingNode) {
      draggingNode.fx = null
      draggingNode.fy = null
      simulationRef.current?.alphaTarget(0)
      draggingRef.current = null
    }
    panningRef.current = false
  }

  const onNodeClick = (node) => {
    if (dragMovedRef.current) return

    if (!node.loaded && !node.loading) {
      expandNode(node)
      return
    }

    if (node.project && !node.isRoot) {
      onNavigate(projectPath(node.project))
    }
  }

  const onWheel = (event) => {
    event.preventDefault()
    const el = svgRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = event.clientX - rect.left
    const my = event.clientY - rect.top
    const factor = event.deltaY > 0 ? 0.85 : 1 / 0.85
    const newZoom = Math.max(0.15, Math.min(4, zoom * factor))
    setPan({
      x: mx - (mx - pan.x) * (newZoom / zoom),
      y: my - (my - pan.y) * (newZoom / zoom),
    })
    setZoom(newZoom)
  }

  const nodes = nodesRef.current
  void renderTick

  return (
    <div
      className="dependency-explorer-canvas relative overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        ref={svgRef}
        className="block h-full w-full"
        style={{ cursor: panningRef.current ? 'grabbing' : 'grab' }}
        onWheel={onWheel}
      >
        <defs>
          <pattern id="dependency-explorer-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="0.7" fill="rgba(255,255,255,0.055)" />
          </pattern>
          {['required', 'optional', 'embedded'].map((type) => (
            <marker
              key={type}
              id={`dependency-arrow-${type}`}
              markerWidth="12"
              markerHeight="10"
              refX="11"
              refY="5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 12 5 L 0 10 Z" fill={EDGE_COLORS[type]} />
            </marker>
          ))}
          {nodes.map((node) => (
            <clipPath key={`clip-${node.id}`} id={`dependency-clip-${escId(node.id)}`}>
              <circle r={nodeR(node)} />
            </clipPath>
          ))}
        </defs>

        <rect width="100%" height="100%" fill="url(#dependency-explorer-grid)" onMouseDown={onBgMouseDown} />

        {!initialLoading && (
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            <g style={{ pointerEvents: 'none' }}>
              {edgesWithCurvature.map((edge) => (
                <path
                  key={`${edge.source}-${edge.target}-${edge.type}`}
                  d={edgePath(edge, edge.curvature)}
                  stroke={EDGE_COLORS[edge.type]}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                  markerEnd={`url(#dependency-arrow-${edge.type})`}
                />
              ))}
            </g>

            {nodes.map((node) => {
              const radius = nodeR(node)
              const title = node.project?.title ?? node.id
              return (
                <g
                  key={node.id}
                  className="dependency-explorer-node"
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: draggingRef.current?.id === node.id ? 'grabbing' : 'pointer' }}
                  onMouseDown={(event) => onNodeMouseDown(event, node)}
                  onClick={(event) => {
                    event.stopPropagation()
                    onNodeClick(node)
                  }}
                >
                  {node.isRoot && (
                    <circle
                      r={radius + 9}
                      fill="none"
                      stroke="#1bd96a"
                      strokeWidth="1.5"
                      className="dependency-explorer-pulse"
                    />
                  )}
                  {!node.loading && (
                    <circle
                      className="dependency-explorer-hover-ring"
                      r={radius + 5}
                      fill="none"
                      stroke="#cccccc"
                      strokeWidth="1.5"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  <circle
                    r={radius}
                    fill={node.isRoot ? '#1bd96a' : '#262626'}
                    stroke={node.isRoot ? '#1bd96a' : '#3f3f3f'}
                    strokeWidth="1.5"
                  />
                  {!node.project?.icon_url && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={node.isRoot ? '17' : '13'}
                      fontWeight="bold"
                      fill={node.isRoot ? '#ffffff' : '#888888'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {title[0]?.toUpperCase()}
                    </text>
                  )}
                  {node.project?.icon_url && (
                    <image
                      href={node.project.icon_url}
                      x={-radius}
                      y={-radius}
                      width={radius * 2}
                      height={radius * 2}
                      clipPath={`url(#dependency-clip-${escId(node.id)})`}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {node.loading && (
                    <circle
                      className="dependency-explorer-spinner"
                      r={radius + 4}
                      fill="none"
                      stroke="#1bd96a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${(radius + 4) * Math.PI * 0.5} ${(radius + 4) * Math.PI * 1.5}`}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  {!node.isRoot && !node.loaded && !node.loading && (
                    <g style={{ pointerEvents: 'none' }}>
                      <circle
                        cx={radius - 5}
                        cy={-(radius - 5)}
                        r="8"
                        fill="#1a1a1a"
                        stroke="#1bd96a"
                        strokeWidth="1.5"
                      />
                      <text
                        x={radius - 5}
                        y={-(radius - 5)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="11"
                        fontWeight="bold"
                        fill="#1bd96a"
                        style={{ userSelect: 'none' }}
                      >
                        +
                      </text>
                    </g>
                  )}
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    fontSize={node.isRoot ? '12' : '10'}
                    fontWeight={node.isRoot ? '600' : '400'}
                    fill="#cccccc"
                    className={node.loaded && node.project && !node.isRoot ? 'dependency-explorer-nav-label' : undefined}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {clampLabel(title, 22)}
                  </text>
                </g>
              )
            })}
          </g>
        )}

        {!initialLoading && nodes.length === 0 && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#666666" fontSize="14">
            У этого проекта нет зависимостей
          </text>
        )}
      </svg>

      {initialLoading && (
        <div className="dependency-explorer-loading absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-500">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Загрузка…
        </div>
      )}

      <div className="dependency-explorer-legend absolute bottom-3 left-3 flex flex-col gap-2 rounded-lg p-3">
        {LEGEND.map((item) => (
          <div key={item.type} className="flex items-center gap-2.5 text-xs">
            <svg width="40" height="14" className="shrink-0">
              <line x1="1" y1="7" x2="29" y2="7" stroke={item.color} strokeWidth="1.5" />
              <polygon points="22,3 38,7 22,11" fill={item.color} />
            </svg>
            <span className="text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 right-3 text-[11px] text-gray-600 pointer-events-none">
        колесо — масштаб · перетаскивание — пан · клик — раскрыть
      </div>
    </div>
  )
}

export default function DependencyExplorer({
  projectSlug,
  projectTitle,
  versionNumber,
  defaultOpen = false,
  hideTrigger = false,
  onClose,
  overlayClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [portalTarget, setPortalTarget] = useState(null)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const closeModal = () => {
    setIsOpen(false)
    onClose?.()
  }

  const modal = isOpen && portalTarget
    ? createPortal(
        <div
          className={`dependency-explorer-overlay fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm ${overlayClassName}`}
          onClick={closeModal}
        >
          <div
            className="dependency-explorer-modal w-full max-w-[1400px] overflow-hidden rounded-2xl border border-gray-800 bg-modrinth-darker shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">Граф зависимостей</h2>
                {projectTitle && <p className="text-sm text-gray-400">{projectTitle}</p>}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                aria-label="Закрыть"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DependencyGraph
              projectSlug={projectSlug}
              versionNumber={versionNumber}
              onNavigate={(path) => {
                window.open(path, '_blank', 'noopener,noreferrer')
              }}
            />
          </div>
        </div>,
        portalTarget,
      )
    : null

  if (hideTrigger) {
    return modal
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-modrinth-dark px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-modrinth-green/40 hover:text-modrinth-green"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <circle cx="6" cy="6" r="2.5" strokeWidth="2" />
          <circle cx="18" cy="18" r="2.5" strokeWidth="2" />
          <circle cx="18" cy="6" r="2.5" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 7.5l7 0M8.5 7.5l0 7M15.5 7.5l-5 5" />
        </svg>
        Зависимости
      </button>
      {modal}
    </>
  )
}
