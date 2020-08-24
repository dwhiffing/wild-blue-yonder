export const FISH_COLORS = [2, 5, 6]
export const TILE_SIZE = 130
export const BOARD_SIZE = 8
export const HOOKS = [
  // [[1, 1, 1, 0, 1, 0, 0, 1, 0]], // T
  // [[1, 1, 1, 1, 1, 1, 1, 1, 1]], // BOX
  // [[1, 0, 1, 0, 1, 0, 1, 0, 1]], // CORNERS

  [
    // SMALL BOX
    [1, 1, 0, 1, 1, 0, 0, 0, 0],
  ],
  [
    // SMALL CORNER
    [1, 1, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 1, 1, 0, 0, 0],
  ],
  [
    // SNAKE S
    [0, 1, 1, 1, 1, 0, 0, 0, 0],
    [1, 0, 0, 1, 1, 0, 0, 1, 0],
  ],
  [
    // SNAKE Z
    [1, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0, 0],
  ],
  [
    // LINE
    [1, 0, 0, 1, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0],
  ],
  [
    // DIAGONAL
    [0, 0, 1, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 0, 0, 1],
  ],
  [
    // J BEND
    [1, 0, 0, 1, 1, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 1, 1],
  ],
  [
    // L BEND
    [1, 0, 0, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 1, 0, 0, 1],
    [0, 0, 1, 1, 1, 1, 0, 0, 0],
  ],
]

export default class {
  constructor(scene) {
    this.scene = scene
    this.hookCoord = 0
    this.rotation = 0

    this.data = new Array(BOARD_SIZE * BOARD_SIZE)
      .fill(1)
      .map((i) => (i > -1 ? Phaser.Math.RND.pick(FISH_COLORS) : -1))

    this.sprites = this.data
      .map((n, i) => {
        const x = (i % BOARD_SIZE) * TILE_SIZE + 20
        const y = Math.floor(i / BOARD_SIZE) * TILE_SIZE + 500
        const type = Phaser.Math.RND.between(0, 2)
        const sprite = this.scene.add
          .sprite(x, y, 'colors', n + type * BOARD_SIZE)
          .setScale(1.5)
          .setOrigin(0, 0)
        sprite.index = i
        return sprite
      })
      .filter((s) => !!s)
  }

  move(direction) {
    const { width, height } = this.getHookDimensions()
    if (direction === 'left' && this.hookCoord % BOARD_SIZE !== 0) {
      this.hookCoord--
      this.selectSprites()
    } else if (
      direction === 'right' &&
      (this.hookCoord + width) % BOARD_SIZE !== 0
    ) {
      this.hookCoord++
      this.selectSprites()
    } else if (direction === 'up' && this.hookCoord >= BOARD_SIZE) {
      this.hookCoord -= BOARD_SIZE
      this.selectSprites()
    } else if (
      direction === 'down' &&
      this.hookCoord <
        BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 1) * BOARD_SIZE
    ) {
      this.hookCoord += BOARD_SIZE
      this.selectSprites()
    }
  }

  rotate() {
    this.rotation = this.rotation + (1 % 4)
    this.selectSprites()
  }

  newHook() {
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.selectSprites()
    this.validateHookPosition()
  }

  validateHookPosition() {
    const { width, height } = this.getHookDimensions()
    const maxY = 56 - (height - 1) * BOARD_SIZE
    while (this.hookCoord - 1 > maxY) {
      this.hookCoord -= BOARD_SIZE
      this.selectSprites()
    }
    while ((this.hookCoord % BOARD_SIZE) + width > BOARD_SIZE) {
      this.hookCoord--
      this.selectSprites()
    }
  }

  newFish(sprite) {
    const type = Phaser.Math.RND.between(0, 2)
    sprite.setFrame(Phaser.Math.RND.pick(FISH_COLORS) + type * BOARD_SIZE)
    let targetX = sprite.x
    sprite.x += sprite.index % BOARD_SIZE === 0 ? -TILE_SIZE : TILE_SIZE
    this.tweenFish(sprite, targetX)
  }

  tweenFish(sprite, targetX) {
    if (!targetX) return

    sprite.moving = true
    this.scene.tweens.add({
      targets: [sprite],
      x: targetX,
      duration: 100,
      onComplete: () => (sprite.moving = false),
    })
  }

  swapFish(fishA, fishB) {
    if (!fishA || !fishB) return

    let frame = fishA.frame.name
    fishA.setFrame(fishB.frame.name)
    fishB.setFrame(frame)
    let targetX = fishA.x
    fishA.x = fishB.x
    this.tweenFish(fishA, targetX)
  }

  fillBoard() {
    const leftSide = this.sprites.filter((s) => s.index % 8 < 4)
    const rightSide = this.sprites.filter((s) => s.index % 8 >= 4).reverse()
    const sides = [leftSide, rightSide]

    sides.forEach((side, sideIndex) => {
      side.forEach((sprite) => {
        if (sprite.frame.name !== 1) return

        const i = sprite.index
        const rowIndex = i % BOARD_SIZE
        const isEdge = rowIndex === 0 || rowIndex === BOARD_SIZE - 1
        const neighbourIndex = sideIndex === 0 ? i - 1 : i + 1

        if (isEdge) {
          this.newFish(sprite)
        } else {
          this.swapFish(
            sprite,
            side.find((s) => s.index === neighbourIndex && !s.moving),
          )
        }
      })
    })
  }

  selectSprites() {
    this.sprites.forEach((sprite) => sprite.setAlpha(0.5))
    // get the 9 tile box for hook starting from top left using hookCoord
    // TODO: make this not hardcoded
    const hookCoordIndexes = [
      this.hookCoord,
      this.hookCoord + 1,
      this.hookCoord + 2,
      this.hookCoord + 8,
      this.hookCoord + 9,
      this.hookCoord + 10,
      this.hookCoord + 16,
      this.hookCoord + 17,
      this.hookCoord + 18,
    ]
    // get the active tiles within that box
    const hookSet = HOOKS[this.hookIndex]
    const hook = hookSet[this.rotation % hookSet.length]
    // highlight those tiles
    const selected = this.sprites.filter((sprite, spriteIndex) =>
      hookCoordIndexes
        .filter((_, hookCoordIndex) => hook[hookCoordIndex] === 1)
        .includes(spriteIndex),
    )
    selected.forEach((s) => s.setAlpha(1))
  }

  getHookDimensions() {
    const hookSet = HOOKS[this.hookIndex]
    const hook = hookSet[this.rotation % hookSet.length]
    // TODO: make this not hardcoded

    const cols = [
      [hook[2], hook[5], hook[8]],
      [hook[1], hook[4], hook[7]],
      [hook[0], hook[3], hook[6]],
    ]
    const rows = [
      [hook[6], hook[7], hook[8]],
      [hook[3], hook[4], hook[5]],
      [hook[0], hook[1], hook[2]],
    ]
    return {
      width: 3 - cols.findIndex((col) => col.includes(1)),
      height: 3 - rows.findIndex((row) => row.includes(1)),
    }
  }
}
