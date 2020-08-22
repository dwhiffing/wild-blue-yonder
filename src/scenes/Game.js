const FISH_COLORS = [2, 4, 5, 6]

const HOOKS = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1], // BOX
  [0, 1, 0, 1, 0, 1, 0, 1, 0], // CROSS
  [1, 0, 1, 0, 0, 0, 1, 0, 1], // CORNERS
  [1, 1, 1, 0, 0, 0, 0, 0, 0], // TOP ROW
  [0, 0, 0, 0, 0, 0, 1, 1, 1], // BOT ROW
  [1, 0, 0, 1, 0, 0, 1, 0, 0], // LEFT COL
  [0, 0, 1, 0, 0, 1, 0, 0, 1], // RIGHT COL
]

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
    this.data = new Array(8 * 8)
      .fill(1)
      .map((i) => (i > -1 ? Phaser.Math.RND.pick(FISH_COLORS) : -1))

    this.sprites = this.data
      .map((n, i) => {
        const x = (i % 8) * 130 + 20
        const y = Math.floor(i / 8) * 130 + 500
        const type = Phaser.Math.RND.between(0, 2)
        return this.add
          .sprite(x, y, 'colors', n + type * 8)
          .setScale(1.5)
          .setOrigin(0, 0)
      })
      .filter((s) => !!s)

    this.food = this.add.sprite(this.width / 2, 250, 'colors', 0).setScale(3)
    this.newHook()
  }

  newHook() {
    const foodType = Phaser.Math.RND.between(0, 2)
    this.food.setFrame(Phaser.Math.RND.pick(FISH_COLORS) + foodType * 8)
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.selectSprites()
  }

  handleInput(event) {
    if (event.key === 'ArrowLeft' && this.hookCoord % 8 !== 0) {
      this.hookCoord--
      this.selectSprites()
    }
    if (event.key === 'ArrowRight' && (this.hookCoord + 3) % 8 !== 0) {
      this.hookCoord++
      this.selectSprites()
    }
    if (event.key === 'ArrowUp' && this.hookCoord > 8) {
      this.hookCoord -= 8
      this.selectSprites()
    }
    if (event.key === 'ArrowDown' && this.hookCoord < 40) {
      this.hookCoord += 8
      this.selectSprites()
    }
    if (event.key === ' ') {
      this.submit()
    }
  }

  submit() {
    const selected = this.sprites.filter((s) => s.alpha === 1)
    const score = selected.reduce((sum, val) => {
      const shapeMatches =
        Math.floor(val.frame.name / 8) === Math.floor(this.food.frame.name / 8)
      const colorMatches = val.frame.name % 8 === this.food.frame.name % 8
      const score =
        colorMatches && shapeMatches
          ? 50
          : colorMatches || shapeMatches
          ? 10
          : -10
      return sum + score
    }, 0)
    this.score += score
    this.scoreText.setText(this.score)
    this.newHook()
    selected.forEach((s) => {
      const type = Phaser.Math.RND.between(0, 2)

      s.setFrame(Phaser.Math.RND.pick(FISH_COLORS) + type * 8)
    })
  }

  selectSprites() {
    this.sprites.forEach((sprite) => sprite.setAlpha(0.3))
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
    const hookPatternIndexes = HOOKS[this.hookIndex]
    const selected = this.sprites.filter((sprite, spriteIndex) =>
      hookCoordIndexes
        .filter((_, hookCoordIndex) => hookPatternIndexes[hookCoordIndex] === 1)
        .includes(spriteIndex),
    )
    selected.forEach((s) => s.setAlpha(1))
  }
}
// 00 01 02 03 04 05 06 07
// 08 09 10 11 12 13 14 15
// 16 17 18 19 20 21 22 23
// 24 25 26 27 28 29 31 32
