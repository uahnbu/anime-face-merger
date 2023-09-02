class HSL {
  /**
   * @param {Uint8ClampedArray} data
   * @returns {[h: number, s: number, l: number]}
   */
  static getAverage(data) {
    const total = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      const [h, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2])
      total[0] += h, total[1] += s, total[2] += l
    }
    return total.map(v => v / data.length * 4)
  }

  /**
   * @param {Uint8ClampedArray} sceneData
   * @param {Uint8ClampedArray} faceData
   * @returns {[h: number, s: number, l: number]}
   */
  static getAverageDiff(sceneData, faceData) {
    const faceAverage = HSL.getAverage(faceData)
    const sceneAverage = HSL.getAverage(sceneData)
    const diff = sceneAverage.map((v, i) => v - faceAverage[i])
    console.group('HSL')
    console.log('Face average:', faceAverage.map(v => +v.toFixed(2)))
    console.log('Scene average:', sceneAverage.map(v => +v.toFixed(2)))
    console.log('Delta:', diff.map(v => +v.toFixed(2)))
    console.groupEnd()
    return diff
  }

  /**
   * @param {Uint8ClampedArray} data
   * @param {[h: number, s: number, l: number]} diff
   */
  static shiftData(data, diff) {
    const [hDiff, sDiff, lDiff] = diff
    for (let i = 0; i < data.length; i += 4) {
      const [h, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2])
      const [r, g, b] = hsl2rgb(h + hDiff, s + sDiff, l + lDiff)
      data[i] = r, data[i + 1] = g, data[i + 2] = b
    }
  }
}

class RGB {
  /**
   * @param {Uint8ClampedArray} data
   * @returns {[r: number, g: number, b: number]]}
   */
  static getAverage(data) {
    const total = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      total.forEach((_, j) => total[j] += data[i + j])
    }
    return total.map(v => v / data.length * 4)
  }

  /**
   * @param {Uint8ClampedArray} sceneData
   * @param {Uint8ClampedArray} faceData
   * @returns {[r: number, g: number, b: number]}
   */
  static getAverageDiff(sceneData, faceData) {
    const faceAverage = RGB.getAverage(faceData)
    const sceneAverage = RGB.getAverage(sceneData)
    const diff = sceneAverage.map((v, i) => v - faceAverage[i])
    console.group('RGB')
    console.log('Face average:', faceAverage.map(v => +v.toFixed(2)))
    console.log('Scene average:', sceneAverage.map(v => +v.toFixed(2)))
    console.log('Delta:', diff.map(v => +v.toFixed(2)))
    console.groupEnd()
    return diff
  }

  /**
   * @param {Uint8ClampedArray} data
   * @param {[r: number, g: number, b: number]} diff
   */
  static shiftData(data, diff) {
    for (let i = 0; i < data.length; i += 4) {
      diff.forEach((_, j) => data[i + j] += diff[j])
    }
  }
}

/**
 * @param {number} r - [0, 255]
 * @param {number} g - [0, 255]
 * @param {number} b - [0, 255]
 * @returns {[h: number, s: number, l: number]}
 * @link https://en.wikipedia.org/wiki/HSL_and_HSV#General_approach
 */
function rgb2hsl(r, g, b) {
  r /= 255, g /= 255, b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const chroma = max - min
  const l = (max + min) / 2
  if (chroma === 0) return [0, 0, l]
  const s = chroma / (l > .5 ? 2 - max - min : max + min)
  const h = (
    max === r ? (g - b) / chroma + (g < b) * 6 :
    max === g ? (b - r) / chroma + 2 :
    max === b && (r - g) / chroma + 4
  ) * 60
  return [h, s, l]
}

/**
 * @param {number} h - [0, 360]
 * @param {number} s - [0, 1]
 * @param {number} l - [0, 1]
 * @returns {[r: number, g: number, b: number]}
 * @link https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB_alternative
 */
function hsl2rgb(h, s, l) {
  return [0, 8, 4].map(fn)

  function fn(n) {
    const k = (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const t = Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return (l - a * t) * 255
  }
}