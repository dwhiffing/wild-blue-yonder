import Board from '../gameObjects/Board'
import ui from '../gameObjects/ui'
import {
  TILE_SIZE,
  BOARD_SIZE,
  Y_BUFFER,
  X_BUFFER,
  TILE_SCALE,
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
    this.canFill = true
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
    this.canMove = true
    this.submit()
  }

  pointerDown(pointer) {
    if (!this.canMove) return
    this.startY = pointer.y
    this.selectedColumn = Math.floor((pointer.x - X_BUFFER) / TILE_SIZE)
    this.board.sprites.forEach((s) => s.bobTween && s.bobTween.pause())
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
    if (
      !this.canMove ||
      typeof this.selectedColumn !== 'number' ||
      this.selectedColumn < 0
    )
      return
    const diffY = pointer.y - this.startY + TILE_SIZE / 2
    const moveAmount = Math.floor(diffY / TILE_SIZE) % BOARD_SIZE
    this.board.columnMove(this.selectedColumn, moveAmount)
    this.selectedColumn = false
    this.board.sprites.forEach((s) => s.bobTween && s.bobTween.resume())
    this.time.addEvent({
      delay: 300,
      callback: () => this.submit(moveAmount !== 0),
    })
  }

  handleInput(event) {
    if (event.key === 'n') this.canFill && this.board.fillBoard()
  }

  submit(forceFill = false) {
    if (!this.canSubmit) return
    this.canMove = false
    this.canFill = false

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
      s.bobTween && s.bobTween.pause()
      if (s.frame.name === 0) return
      this.tweens.add({
        targets: s,
        scale: { from: TILE_SCALE * s.direction, to: TILE_SCALE * 0.5 },
        alpha: 0,
        angle: 90,
        duration: 600,
        // ease: 'Quad.easeOut',
        // delay: 30 * i,
        onComplete: () => {
          s.setFrame(0)
            .setAngle(0)
            .setAlpha(1)
            .setScale(TILE_SCALE * s.direction, TILE_SCALE)
          this.emitter.setPosition(s.x, s.y)
          this.emitter.setScale({ start: 0.1, end: 0.5 })
          this.emitter.setLifespan({ min: 500, max: 2000 })
          this.emitter.explode(80)
          s.bobTween && s.bobTween.resume()
        },
      })
    })

    if (selected.length > 0 || forceFill) {
      // fill board
      this.time.addEvent({
        delay: 660,
        callback: () => this.board.fillBoard(),
      })
    } else {
      this.canFill = true
      this.canMove = true
      const types = this.board.sprites.map((s) => s.frame.name)
      if (
        [1, 2, 3, 5, 6, 7, 9, 10, 11].every(
          (i) => types.filter((t) => t === i).length < 3,
        )
      ) {
        this.board.sprites
          .filter((s) => s.frame.name > 0)
          .forEach((s) => s.setFrame(0))
      }
    }
  }

  newPattern() {
    this.hook.newPattern()
  }
}
