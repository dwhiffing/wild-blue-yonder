const FISH_COLORS = [2, 5, 6]

const HOOKS = [
  //  [1, 1, 1, 1, 1, 1, 1, 1, 1], // BOX
  [1, 0, 0, 1, 0, 0, 1, 0, 0], // COL
  [0, 0, 1, 0, 1, 0, 1, 0, 0], // CORNERS
  [1, 0, 0, 0, 1, 0, 0, 0, 1], // CORNERS
  [1, 1, 1, 0, 0, 0, 0, 0, 0], // ROW
]

const TILE_SIZE = 130
const BOARD_SIZE = 8

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {}

  create() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.score = 0
    this.hookIndex = 0
    this.hookCoord = 0

    this.scoreText = this.add
      .text(this.width / 2, 80, '0', {
        fontSize: 60,
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.createBoard()

    this.input.keyboard.on('keydown', this.handleInput.bind(this))
  }
  update() {}

  createBoard() {
    // generate fish
    this.data = new Array(BOARD_SIZE * BOARD_SIZE)
      .fill(1)
      .map((i) => (i > -1 ? Phaser.Math.RND.pick(FISH_COLORS) : -1))

    this.sprites = this.data
      .map((n, i) => {
        const x = (i % BOARD_SIZE) * TILE_SIZE + 20
        const y = Math.floor(i / BOARD_SIZE) * TILE_SIZE + 500
        const type = Phaser.Math.RND.between(0, 2)
        return this.add
          .sprite(x, y, 'colors', n + type * BOARD_SIZE)
          .setScale(1.5)
          .setOrigin(0, 0)
      })
      .filter((s) => !!s)

    this.food = this.add.sprite(this.width / 2, 250, 'colors', 0).setScale(3)
    this.newHook()
    this.canSubmit = true
  }

  newHook() {
    const foodType = Phaser.Math.RND.between(0, 2)
    this.food.setFrame(
      Phaser.Math.RND.pick(FISH_COLORS) + foodType * BOARD_SIZE,
    )
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.selectSprites()
    this.validateHookPosition()
  }

  handleInput(event) {
    const { width, height } = this.getHookDimensions()
    if (event.key === 'ArrowLeft' && this.hookCoord % BOARD_SIZE !== 0) {
      this.hookCoord--
      this.selectSprites()
    }
    if (
      event.key === 'ArrowRight' &&
      (this.hookCoord + width) % BOARD_SIZE !== 0
    ) {
      this.hookCoord++
      this.selectSprites()
    }
    if (event.key === 'ArrowUp' && this.hookCoord >= BOARD_SIZE) {
      this.hookCoord -= BOARD_SIZE
      this.selectSprites()
    }
    if (
      event.key === 'ArrowDown' &&
      this.hookCoord <
        BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 1) * BOARD_SIZE
    ) {
      this.hookCoord += BOARD_SIZE
      this.selectSprites()
    }
    if (event.key === ' ' || event.key === '/') {
      this.submit()
    }
    if (event.key === 'n') {
      this.fillBoard()
    }
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

  fillBoard() {
    this.sprites.forEach((s, index) => {
      s.index = index
    })
    const leftSide = this.sprites.filter((s) => s.index % 8 < 4)
    const rightSide = this.sprites.filter((s) => s.index % 8 >= 4).reverse()
    const sides = [leftSide, rightSide]
    // TODO: reduce duplication
    sides.forEach((side, sideIndex) => {
      side.forEach((s) => {
        const i = s.index
        if (s.frame.name !== 1) return
        // if left or right edge
        if (i % BOARD_SIZE === 0 || i % BOARD_SIZE === BOARD_SIZE - 1) {
          // create new fish and slide in
          const type = Phaser.Math.RND.between(0, 2)
          s.setFrame(Phaser.Math.RND.pick(FISH_COLORS) + type * BOARD_SIZE)
          const targetX = s.x
          const offset = i % BOARD_SIZE === 0 ? -TILE_SIZE : TILE_SIZE
          s.x += offset
          s.moving = true
          this.tweens.add({
            targets: [s],
            x: targetX,
            duration: 100,
            onComplete: () => (s.moving = false),
          })
        } else {
          // check if left or right side and get cooresponding neighbour
          const neighbour = side.find(
            (sprite) => sprite.index === (sideIndex === 0 ? i - 1 : i + 1),
          )
          if (neighbour && !neighbour.moving) {
            s.setFrame(neighbour.frame.name)
            neighbour.setFrame(1)
            const targetX = s.x
            s.x = neighbour.x
            s.moving = true
            this.tweens.add({
              targets: [s],
              x: targetX,
              duration: 100,
              onComplete: () => (s.moving = false),
            })
          }
        }
      })
    })
  }

  submit() {
    if (!this.canSubmit) return
    this.canSubmit = false
    this.time.addEvent({
      delay: 100,
      callback: () => (this.canSubmit = true),
    })
    const selected = this.sprites.filter((s) => s.alpha === 1)
    if (!selected.every((s) => s.frame.name !== 1)) return
    const score = selected.reduce((sum, val) => {
      const shapeMatches =
        Math.floor(val.frame.name / BOARD_SIZE) ===
        Math.floor(this.food.frame.name / BOARD_SIZE)
      const colorMatches =
        val.frame.name % BOARD_SIZE === this.food.frame.name % BOARD_SIZE
      const score =
        colorMatches && shapeMatches
          ? 50
          : colorMatches || shapeMatches
          ? 10
          : -25
      return sum + score
    }, 0)
    this.score += score
    this.scoreText.setText(this.score)
    this.newHook()
    selected.forEach((s) => {
      s.setFrame(1)
    })
    this.fillBoard()
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
    const hookPatternIndexes = HOOKS[this.hookIndex]
    // highlight those tiles
    const selected = this.sprites.filter((sprite, spriteIndex) =>
      hookCoordIndexes
        .filter((_, hookCoordIndex) => hookPatternIndexes[hookCoordIndex] === 1)
        .includes(spriteIndex),
    )
    selected.forEach((s) => s.setAlpha(1))
  }

  getHookDimensions() {
    const hook = HOOKS[this.hookIndex]
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
