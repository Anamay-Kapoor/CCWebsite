/* Shared, non-React motion switch read inside useFrame loops. */
export const motion = { on: true };
export const step = (dt) => (motion.on ? dt : 0);
