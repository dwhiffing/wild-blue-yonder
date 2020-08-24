import Board from '../gameObjects/Board'
import Hook from '../gameObjects/Hook'
import { BOARD_SIZE, FISH_COLORS } from '../constants'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  init() {}

  create() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.board = new Board(this)
    this.hook = new Hook(this)
    this.score = 0
    this.canSubmit = true

    this.scoreText = this.add
      .text(this.width / 2, 80, '0', {
        fontSize: 60,
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.food = this.add.sprite(this.width / 2, 250, 'colors', 0).setScale(3)
    this.newHook()

    this.input.keyboard.on('keydown', this.handleInput.bind(this))
  }

  handleInput(event) {
    if (event.key === 'ArrowLeft') this.hook.move('left')
    if (event.key === 'ArrowRight') this.hook.move('right')
    if (event.key === 'ArrowUp') this.hook.move('up')
    if (event.key === 'ArrowDown') this.hook.move('down')
    if (event.key === 'z') this.hook.rotate()
    if (event.key === ' ') this.submit()
    if (event.key === 'n') this.board.fillBoard()
  }

  newHook() {
    const foodType = Phaser.Math.RND.between(0, 2)
    this.food.setFrame(
      Phaser.Math.RND.pick(FISH_COLORS) + foodType * BOARD_SIZE,
    )
    this.hook.newHook()
  }

  getScore(selected) {
    return selected.reduce((sum, val) => {
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
  }

  submit() {
    if (!this.canSubmit) return

    this.canSubmit = false
    this.time.addEvent({ delay: 100, callback: () => (this.canSubmit = true) })

    const selected = this.board.sprites.filter((s) => s.alpha === 1)
    if (selected.some((s) => s.frame.name === 1)) return

    this.score += this.getScore(selected)
    this.scoreText.setText(this.score)
    selected.forEach((s) => s.setFrame(1))

    this.newHook()
    this.board.fillBoard()
  }
}
