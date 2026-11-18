/*
 * Live numbers the 3D scene writes every frame and the status bar reads
 * on its own timer. Kept out of React state so the scene never re-renders for them.
 */
export const stats = {
  fps: 0,
  x: null, // pointer position on the board, in mm
  y: null,
  hover: '',
};
