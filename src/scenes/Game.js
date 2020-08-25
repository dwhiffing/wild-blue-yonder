import Board from '../gameObjects/Board'
import Hook from '../gameObjects/Hook'
import ui from '../gameObjects/ui'
import { BOARD_SIZE, FISH_COLORS } from '../constants'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  create() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.board = new Board(this)
    this.hook = new Hook(this)
    this.ui = new ui(this)
    this.score = 0
    this.canSubmit = true
    this.input.keyboard.on('keydown', this.handleInput.bind(this))

    this.newPattern()
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

  submit() {
    if (!this.canSubmit) return

    const selected = this.board.sprites.filter((s) => s.alpha === 1)
    if (selected.some((s) => s.frame.name === 1)) return

    this.canSubmit = false
    this.time.addEvent({ delay: 300, callback: () => (this.canSubmit = true) })

    this.ui.setScore(this.getScore(selected))
    selected.forEach((s) => s.setFrame(1))
    this.newPattern()
    this.board.fillBoard()
  }

  newPattern() {
    const foodType = Phaser.Math.RND.between(0, 2)
    const newFrame = Phaser.Math.RND.pick(FISH_COLORS) + foodType * BOARD_SIZE
    this.ui.foodSprite.setFrame(newFrame)
    this.hook.newPattern()
  }

  getScore(selected) {
    return selected.reduce((sum, sprite) => {
      const shapeMatches =
        Math.floor(sprite.frame.name / BOARD_SIZE) ===
        Math.floor(this.ui.getFood() / BOARD_SIZE)
      const colorMatches =
        sprite.frame.name % BOARD_SIZE === this.ui.getFood() % BOARD_SIZE
      const isPerfect = colorMatches && shapeMatches
      const isPartial = colorMatches || shapeMatches
      const score = isPerfect ? 50 : isPartial ? 10 : -25
      return sum + score
    }, 0)
  }
}
