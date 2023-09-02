/**
 * @param {Uint8ClampedArray} data
 * @returns {number[]}
 */
function monochrome(data) {
  const newData = new Uint8ClampedArray(data.length / 4)
  for (let i = 0; i < data.length; i += 4) {
    newData[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3
  }
  return newData
}

/**
 * @param {HTMLImageElement} img
 * @param {number} [x]
 * @param {number} [y]
 * @param {number} [width]
 * @param {number} [height]
 * @returns {Uint8ClampedArray}
 */
function getData4D(img, x, y, width, height) {
  const sw = width || img.naturalWidth
  const sh = height || img.naturalHeight
  const dw = width || img.width
  const dh = height || img.height
  ctx.drawImage(img, ~~x, ~~y, sw, sh, 0, 0, dw, dh)
  const imgData = ctx.getImageData(0, 0, dw, dh)
  return imgData.data
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
function putData4D(data, x, y, width, height) {
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = width, tmpCanvas.height = height
  const tmpContext = tmpCanvas.getContext('2d')
  tmpContext.putImageData(new ImageData(data, width, height), 0, 0)
  ctx.drawImage(tmpCanvas, x, y)
}

/**
 * @param {number[]} arr
 * @param {number} width
 * @returns {number[][]}
 */
function erect2D(arr, width) {
  if (arr.length % width) throw new Error('Invalid width')
  const mat = Array(arr.length / width)
  for (let i = 0; i < mat.length; ++i) {
    mat[i] = Array(width)
    for (let j = 0; j < width; ++j) {
      mat[i][j] = arr[i * width + j]
    }
  }
  return mat
}