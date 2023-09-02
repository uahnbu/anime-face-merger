const SCALE = 8 // TODO: Width and height might not be disivible by SCALE.

let /** @type {HTMLCanvasElement} */ canvas
let /** @type {CanvasRenderingContext2D} */ ctx
let /** @type {HTMLImageElement} */ scene
let /** @type {HTMLImageElement} */ face

/**
 * @typedef FaceEdited
 * @property {Uint8ClampedArray} data
 * @property {number} x
 * @property {number} y
 */

const /** @type {FaceEdited} */ faceEdited = {}

/**
 * @typedef DrawEraserPathsEnum
 * @property {0} TRANSPARENT
 * @property {1} NONE
 * @property {2} COLORED
 */

const /** @type {DrawEraserPathsEnum} */ DrawEraserPaths = {
  TRANSPARENT: 0,
  NONE: 1,
  COLORED: 2
}

function render() {
  console.log('Images loaded.')

  canvas = document.querySelector('canvas')
  ctx = canvas.getContext('2d', { willReadFrequently: true })
  scene = document.querySelector('#img-scene')
  face = document.querySelector('#img-face')
}

new Promise(res => addEventListener('load', () => res(render()))).then(() => {
  // LOCATE FACE - START
  face.width /= SCALE, face.height /= SCALE
  scene.width /= SCALE, scene.height /= SCALE
  canvas.width = scene.width, canvas.height = scene.height

  const { faceXEstimated, faceYEstimated } = locateScaled(scene, face)

  scene.width *= SCALE, scene.height *= SCALE
  face.width *= SCALE, face.height *= SCALE
  canvas.width = scene.width, canvas.height = scene.height

  const { faceX, faceY } = locateOriginalBySample(
    scene,
    face,
    faceXEstimated,
    faceYEstimated
  )
  
  // ctx.drawImage(scene, 0, 0)
  // ctx.drawImage(face, faceX, faceY)
  // return
  // LOCATE FACE - END
  // canvas.width = scene.width, canvas.height = scene.height
  // const faceX = 500, faceY = 356

  faceEdited.x = faceX
  faceEdited.y = faceY
  faceEdited.data = getData4D(face)

  // ADJUST COLOR - START
  const sceneData = getData4D(scene, faceX, faceY, face.width, face.height)
  const rgbDiff = RGB.getAverageDiff(sceneData, faceEdited.data)
  RGB.shiftData(faceEdited.data, rgbDiff)
  const hslDiff = HSL.getAverageDiff(sceneData, faceEdited.data)
  HSL.shiftData(faceEdited.data, [0, 0, hslDiff[2]])

  softenEdges(faceEdited.data, face.width, 32)
  // ADJUST COLOR - END
  // RGB.shiftData(faceEdited.data, [-11.6, -18.06, -29.84])
  // HSL.shiftData(faceEdited.data, [0, 0, 0])
  // softenEdges(faceEdited.data, face.width, 32)

  updateDraw()

  console.log('Completed.')
  
  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mouseup', handleMouseUp)

  document.addEventListener('keydown', event => {
    if (event.code === 'KeyZ') paths.pop(), updateDraw()
    if (event.code === 'KeyX') updateDraw(DrawEraserPaths.NONE)
  })
  document.addEventListener('keyup', event => {
    if (event.code === 'KeyX') updateDraw()
  })
})

const paths = []
let pathTrackTimer = null
let pathIsTrackable = false
let mouseIsDown = false

/**
 * @param {MouseEvent} event
 */
function handleMouseDown(event) {
  pathIsTrackable = mouseIsDown = true
  const x = event.clientX / canvas.offsetWidth * canvas.width
  const y = event.clientY / canvas.offsetHeight * canvas.height
  paths.push([[x, y]])
}

function handleMouseUp() {
  pathIsTrackable = mouseIsDown = false
  clearTimeout(pathTrackTimer)
  paths[paths.length - 1] = rdp(paths[paths.length - 1], RDP_EPSILON)
  updateDraw()
}

/**
 * @param {MouseEvent} event
 */
function handleMouseMove(event) {
  if (!mouseIsDown || !pathIsTrackable) return;
  const x = event.clientX / canvas.offsetWidth * canvas.width
  const y = event.clientY / canvas.offsetHeight * canvas.height
  paths[paths.length - 1].push([x, y])
  updateDraw(DrawEraserPaths.COLORED)
  pathTrackTimer = setTimeout(() => pathIsTrackable = true, 100)
}

/**
 * @param {number} willShowErasePaths
 */
function updateDraw(willShowErasePaths) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(scene, 0, 0)
  const { data, x, y } = faceEdited
  switch (willShowErasePaths) {
    case DrawEraserPaths.COLORED:
      putData4D(data, x, y, face.width, face.height)
      ctx.lineCap = ctx.lineJoin = 'round'
      paths.forEach(path => drawPath(ctx, path))
      break
    case DrawEraserPaths.NONE:
      putData4D(data, x, y, face.width, face.height)
      break
    case DrawEraserPaths.TRANSPARENT:
    default:
      const dataWithEraserPaths = getDataWithEraserPaths(data)
      putData4D(dataWithEraserPaths, x, y, face.width, face.height)
  }
}