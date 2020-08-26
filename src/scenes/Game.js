import Board from '../gameObjects/Board'
import Hook from '../gameObjects/Hook'
import ui from '../gameObjects/ui'
import { SPRITE_SIZE, FISH_COLORS } from '../constants'

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
    this.particles = this.add.particles('bubble')
    this.emitter = this.particles
      .createEmitter({
        x: 0,
        y: 0,
        speed: { min: -250, max: 0 },
        quantity: 300,
        gravityY: -150,
        lifespan: { min: 500, max: 2000 },
        scale: { start: 0.1, end: 0.5 },
        alpha: { start: 1, end: 0 },
      })
      .stop()

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

    const selected = this.board.sprites.filter((s) => s.isSelected)
    if (selected.some((s) => s.frame.name === 0)) return

    this.canSubmit = false

    this.ui.setScore(this.getScore(selected))
    this.hook.clear()

    selected.forEach((s, i) => {
      s.bobTween.pause()
      this.tweens.add({
        targets: s,
        scale: { from: 1 * s.direction, to: 0 },
        angle: 180,
        duration: 300,
        ease: 'Quad.easeOut',
        delay: 50 * i,
        onComplete: () => {
          s.setFrame(0)
            .setAngle(0)
            .setAlpha(1)
            .setScale(1.5 * s.direction, 1.5)
          this.emitter.setPosition(s.x, s.y)
          this.emitter.explode(80)
          s.bobTween.resume()
        },
      })
    })
    this.time.addEvent({
      delay: 500,
      callback: () => {
        this.board.fillBoard()
        this.time.addEvent({
          delay: 300,
          callback: () => {
            this.newPattern()
            this.canSubmit = true
          },
        })
      },
    })
  }

  newPattern() {
    const type = Phaser.Math.RND.between(0, 2)
    const newFrame = Phaser.Math.RND.pick(FISH_COLORS) + type * SPRITE_SIZE
    this.ui.foodSprite.setFrame(newFrame)
    this.hook.newPattern()
  }

  getScore(selected) {
    return selected.reduce((sum, sprite) => {
      const shapeMatches =
        Math.floor(sprite.frame.name / SPRITE_SIZE) ===
        Math.floor(this.ui.getFood() / SPRITE_SIZE)
      const colorMatches =
        (sprite.frame.name % FISH_COLORS.length) + 1 ===
        (this.ui.getFood() % FISH_COLORS.length) + 1
      const isPerfect = colorMatches && shapeMatches
      const isPartial = colorMatches || shapeMatches
      const score = isPerfect ? 50 : isPartial ? 10 : -25
      return sum + score
    }, 0)
  }
}
