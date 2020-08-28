import Board from '../gameObjects/Board'
import Hook from '../gameObjects/Hook'
import ui from '../gameObjects/ui'
import { SPRITE_SIZE, TILE_SIZE } from '../constants'

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
    const frames = selected.map((s) => s.frame.name).filter((f) => f !== 0)
    const colors = frames.map((f) => f % SPRITE_SIZE)
    const types = frames.map((f) => Math.floor(f / SPRITE_SIZE))
    const colorsMatch = colors.every((f) => colors[0] === f)
    const shapesMatch = types.every((f) => types[0] === f)
    if ((!colorsMatch && !shapesMatch) || frames.length === 0) return
    const perfectMatch =
      colorsMatch && shapesMatch && selected.length === frames.length
    this.canSubmit = false

    this.ui.setScore(20 * frames.length * (perfectMatch ? 5 : 1))
    this.hook.clear()

    selected.forEach((s, i) => {
      s.bobTween.pause()
      if (s.frame.name === 0) return
      this.tweens.add({
        targets: s,
        scale: { from: 1 * s.direction, to: 0.4 },
        alpha: 0.2,
        angle: 90,
        duration: 300,
        ease: 'Quad.easeOut',
        delay: 30 * i,
        onComplete: () => {
          s.setFrame(0)
            .setAngle(0)
            .setAlpha(1)
            .setScale(1.5 * s.direction, 1.5)
          this.emitter.setPosition(s.x, s.y)
          this.emitter.setScale(
            perfectMatch ? { start: 0.4, end: 0.8 } : { start: 0.1, end: 0.5 },
          )
          this.emitter.setLifespan(
            perfectMatch ? { min: 750, max: 3000 } : { min: 500, max: 2000 },
          )
          this.emitter.explode(perfectMatch ? 150 : 80)
          s.bobTween.resume()
        },
      })
    })
    this.time.addEvent({
      delay: 1000,
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
    this.hook.newPattern()
  }
}
