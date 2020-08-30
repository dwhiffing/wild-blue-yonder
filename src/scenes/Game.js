import Board from '../gameObjects/Board'
import ui from '../gameObjects/ui'
import {
  SPRITE_SIZE,
  TILE_SIZE,
  BOARD_SIZE,
  Y_BUFFER,
  X_BUFFER,
} from '../constants'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  create() {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
    this.board = new Board(this)
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

    this.input.on('pointerdown', this.pointerDown, this)
    this.input.on('pointermove', this.pointerMove, this)
    this.input.on('pointerup', this.pointerUp, this)
  }

  pointerDown(pointer) {
    this.startY = pointer.y
    this.selectedColumn = Math.floor((pointer.x - X_BUFFER) / TILE_SIZE)
    this.board.sprites.forEach((s) => s.bobTween.pause())
  }

  pointerMove(pointer) {
    if (typeof this.selectedColumn === 'number') {
      const diffY = pointer.y - this.startY
      this.board.sprites
        .filter((s) => s.index % BOARD_SIZE === this.selectedColumn)
        .forEach((s) => {
          let newY =
            diffY + Math.floor(s.index / BOARD_SIZE) * TILE_SIZE + TILE_SIZE / 2
          if (newY < 0) newY += BOARD_SIZE * TILE_SIZE

          s.y = Y_BUFFER + (newY % (BOARD_SIZE * TILE_SIZE))
        })
    }
  }

  pointerUp(pointer) {
    const diffY = pointer.y - this.startY + TILE_SIZE / 2
    this.board.columnMove(
      this.selectedColumn,
      Math.floor(diffY / TILE_SIZE) % BOARD_SIZE,
    )
    this.selectedColumn = false
    this.board.sprites.forEach((s) => s.bobTween.resume())
    this.time.addEvent({
      delay: 300,
      callback: () => this.submit(),
    })
  }

  handleInput(event) {
    if (event.key === 'n') this.board.fillBoard()
  }

  submit() {
    if (!this.canSubmit) return

    // const selected = this.board.sprites.filter((s) => s.isSelected)
    // const frames = selected.map((s) => s.frame.name).filter((f) => f !== 0)
    // const colors = frames.map((f) => f % SPRITE_SIZE)
    // const types = frames.map((f) => Math.floor(f / SPRITE_SIZE))
    // const colorsMatch = colors.every((f) => colors[0] === f)
    // const shapesMatch = types.every((f) => types[0] === f)
    // if ((!colorsMatch && !shapesMatch) || frames.length === 0) return
    // const perfectMatch =
    //   colorsMatch && shapesMatch && selected.length === frames.length
    // this.canSubmit = false

    // this.ui.setScore(20 * frames.length * (perfectMatch ? 5 : 1))

    const selected = this.board.sprites.filter((s) =>
      this.board.isPartOfMatch(s.index),
    )

    // pop matches
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
        // delay: 30 * i,
        onComplete: () => {
          s.setFrame(0)
            .setAngle(0)
            .setAlpha(1)
            .setScale(1.5 * s.direction, 1.5)
          this.emitter.setPosition(s.x, s.y)
          this.emitter.setScale({ start: 0.1, end: 0.5 })
          this.emitter.setLifespan({ min: 500, max: 2000 })
          this.emitter.explode(80)
          s.bobTween.resume()
        },
      })
    })

    if (selected.length > 0) {
      // fill board
      this.time.addEvent({
        delay: 400,
        callback: () => this.board.fillBoard(),
      })
    }
  }

  newPattern() {
    this.hook.newPattern()
  }
}
