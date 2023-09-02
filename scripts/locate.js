/**
 * @param {number[][]} source
 * @param {number[][]} sample
 * @returns {number}
 */
function findMinDiff(source, sample) {
  let minDiff = Infinity, minDiffX = 0, minDiffY = 0
  const rows = source.length - sample.length
  const cols = source[0].length - sample[0].length
  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j < cols; ++j) {
      let diff = 0
      for (let k = 0; k < sample.length; ++k) {
        for (let l = 0; l < sample[0].length; ++l) {
          diff += Math.abs(source[i + k][j + l] - sample[k][l])
        }
      }
      if (diff < minDiff) minDiff = diff, minDiffX = j, minDiffY = i
    }
  }
  console.log('Min diff:', minDiff.toLocaleString('en-US'))
  return minDiffY * source[0].length + minDiffX
}

/**
 * @param {HTMLImageElement} scene
 * @param {HTMLImageElement} face
 * @returns {{ faceXEstimated: number, faceYEstimated: number }}
 */
function locateScaled(scene, face) {
  const sceneFiltered = monochrome(getData4D(scene))
  const faceFiltered = monochrome(getData4D(face))
  const sceneFiltered2D = erect2D(sceneFiltered, scene.width)
  const faceFiltered2D = erect2D(faceFiltered, face.width)

  const facePosScaled = findMinDiff(sceneFiltered2D, faceFiltered2D)
  const faceXScaled = facePosScaled % scene.width
  const faceYScaled = facePosScaled / scene.width | 0
  const faceXEstimated = faceXScaled * SCALE
  const faceYEstimated = faceYScaled * SCALE

  return { faceXEstimated, faceYEstimated }
}

/**
 * @param {HTMLImageElement} scene
 * @param {HTMLImageElement} face
 * @param {number} faceXEstimated
 * @param {number} faceYEstimated
 * @returns {{ faceX: number, faceY: number }}
 */
function locateOriginalBySample(scene, face, faceXEstimated, faceYEstimated) {
  const ADJUST_RANGE = SCALE * 2
  const CHECK_WIDTH = face.width / SCALE * 2

  const faceSampleWidth = CHECK_WIDTH
  const faceSampleHeight = face.height / face.width * CHECK_WIDTH
  const sceneSampleWidth = faceSampleWidth + ADJUST_RANGE
  const sceneSampleHeight = faceSampleHeight + ADJUST_RANGE

  const sceneData = getData4D(
    scene,
    faceXEstimated - ADJUST_RANGE / 2,
    faceYEstimated - ADJUST_RANGE / 2,
    sceneSampleWidth,
    sceneSampleHeight
  )
  const faceData = getData4D(face, 0, 0, faceSampleWidth, faceSampleHeight)

  const sceneFiltered = monochrome(sceneData)
  const faceFiltered = monochrome(faceData)
  const sceneFiltered2D = erect2D(sceneFiltered, sceneSampleWidth)
  const faceFiltered2D = erect2D(faceFiltered, faceSampleWidth)

  const faceSamplePos = findMinDiff(sceneFiltered2D, faceFiltered2D)
  const faceSampleX = faceSamplePos % sceneSampleWidth
  const faceSampleY = faceSamplePos / sceneSampleWidth | 0
  const faceX = faceSampleX + faceXEstimated - ADJUST_RANGE / 2
  const faceY = faceSampleY + faceYEstimated - ADJUST_RANGE / 2

  console.group('Locating')
  console.log('Estimated: (', faceXEstimated, faceYEstimated, ')')
  console.log('Adjusted position: (', faceX, faceY, ')')
  console.log('Delta: (', faceX - faceXEstimated, faceY - faceYEstimated, ')')
  console.groupEnd()

  return { faceX, faceY }
}