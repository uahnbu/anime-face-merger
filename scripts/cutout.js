const RDP_EPSILON = 16

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} thickness
 */
function softenEdges(data, width, thickness) {
  console.log('Softening edges', thickness)
  const alpha = data.filter((_, i) => i % 4 === 3)
  const alpha2D = erect2D(alpha, width)
  for (let j = 0; j < thickness; ++j) {
    const alphaValue = 255 / thickness * j
    for (let i = 0; i < alpha2D.length; ++i) {
      alpha2D[i][j] = alpha2D[i][width - 1 - j] = alphaValue
    }
  }
  for (let j = 0; j < thickness; ++j) {
    const alphaValue = 255 / thickness * j
    for (let i = 0; i < width; ++i) {
      if (j >= Math.min(i, width - i)) continue
      alpha2D[j][i] = alphaValue
      alpha2D[alpha2D.length - 1 - j][i] = alphaValue
    }
  }
  alpha2D.flat().forEach((v, i) => data[i * 4 + 3] = v)
}

const LINE_WIDTH = 128
const SOFTNESS_STEP = 16

/**
 * @param {Uint8ClampedArray} data
 * @returns {Uint8ClampedArray}
 */
function getDataWithEraserPaths(data) {
  const tmpCanvas = document.createElement('canvas')
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCanvas.width = face.width, tmpCanvas.height = face.height
  tmpCtx.lineCap = tmpCtx.lineJoin = 'round'
  const { x: dx, y: dy } = faceEdited
  paths.forEach(path => {
    const shiftedPath = path.map(([x, y]) => [x - dx, y - dy])
    drawPath(tmpCtx, shiftedPath)
  })

  const alphaData = tmpCtx.getImageData(0, 0, face.width, face.height).data
  const clone = new Uint8ClampedArray(data)
  for (let i = 3; i < data.length; i += 4) {
    if (alphaData[i] === 0) continue
    clone[i] = Math.min(clone[i], 255 - alphaData[i])
  }
  return clone
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {[x: number, y: number][]} path
 */
function drawPath(ctx, path) {
  for (let i = LINE_WIDTH - 1; i >= 0; i -= SOFTNESS_STEP) {
    const alpha = Math.min(1, (LINE_WIDTH - i) / LINE_WIDTH / 2)
    ctx.lineWidth = i
    ctx.strokeStyle = `rgba(255,0,0,${alpha})`
    ctx.beginPath()
    ctx.moveTo(...path[0])
    for (let j = 1; j < path.length; ++j) {
      ctx.lineTo(...path[j])
    }
    ctx.stroke()
  }
}

/**
 * @param {[x: number, y: number][]} points
 * @param {number} epsilon
 * @returns {[x: number, y: number][]}
 */
function rdp(points, epsilon) {
  const optimizedIndices = new Set([0, points.length - 1])
  dfs(0, points.length - 1)
  return points.filter((_, i) => optimizedIndices.has(i))

  function dfs(start, end) {
    let furthest = 0, furthestIndex
    for (let i = start + 1; i < end; ++i) {
      const dist = perpDist(points[i], points[start], points[end])
      if (dist > furthest) furthest = dist, furthestIndex = i
    }
    if (furthest < epsilon) return
    optimizedIndices.add(furthestIndex)
    dfs(start, furthestIndex)
    dfs(furthestIndex, end)
  }
}

/**
 * @param {[x: number, y: number]} point
 * @param {[x: number, y: number]} lineStart
 * @param {[x: number, y: number]} lineEnd
 * @returns {number}
 */
function perpDist(point, lineStart, lineEnd) {
  const [x0, y0] = point, [x1, y1] = lineStart, [x2, y2] = lineEnd
  const a = y2 - y1, b = x1 - x2, c = a * x1 + b * y1
  return Math.abs(a * x0 + b * y0 - c) / Math.sqrt(a * a + b * b)
}