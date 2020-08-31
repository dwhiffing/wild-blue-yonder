export const X_BUFFER = 0
export const Y_BUFFER = 500
const COLORS = [0, 1]
const BIG = COLORS.map((n) => n + 1)
const SMALL = COLORS.map((n) => n + 5)
const MEDIUM = COLORS.map((n) => n + 9)
export const FISH_COLORS = [...BIG, ...SMALL]
export const SPRITE_SIZE = 4
export const BOARD_SIZE = 5
export const TILE_SIZE = 1080 / BOARD_SIZE
export const TILE_SCALE = 16 / BOARD_SIZE
export const EXPLOSION_DURATION = 500
export const MOVE_DURATION = 500
