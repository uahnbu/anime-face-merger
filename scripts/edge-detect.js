const sceneDataFiltered = filterVertically(getData4D(scene), scene.width);
const faceDataFiltered = filterVertically(getData4D(face), face.width);
const facePos = findMinDiff(sceneDataFiltered, faceDataFiltered);

const faceX = facePos % (scene.width - 2);
const faceY = facePos / (scene.width - 2) | 0;
putData1D(sceneDataFiltered.flat(), scene.width - 2, 0, 0);
putData1D(faceDataFiltered.flat(), face.width - 2, faceX, faceY);

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @returns {number[][]}
 */
function filterVertically(data, width) {
  return applyMesh(
    erect2D(monochrome(data), width),
    // [
    //   [0, 1, -1],
    //   [0, 1, -1],
    //   [0, 1, -1]
    // ]
    [
      [ 0,  0,  0],
      [ 1,  1,  1],
      [-1, -1, -1]
    ]
  );
}

/**
 * @param {number[][]} mat
 * @param {number[][]} mesh
 * @returns {number[][]}
 */
function applyMesh(mat, mesh) {
  if (mat.length < mesh.length) throw new Error('Invalid matrix');
  if (mesh.length !== mesh[0].length) throw new Error('Invalid mesh');
  if (mesh.length & 1 === 0) throw new Error('Invalid mesh');
  const rows = mat.length - mesh.length + 1;
  const cols = mat[0].length - mesh.length + 1;
  const newMat = Array(rows);
  for (let i = 0; i < rows; ++i) {
    newMat[i] = Array(cols).fill(0);
    for (let j = 0; j < cols; ++j) {
      for (let k = 0; k < mesh.length; ++k) {
        for (let l = 0; l < mesh[0].length; ++l) {
          newMat[i][j] += mat[i + k][j + l] * mesh[k][l];
        }
      }
    }
  }
  return newMat;
}