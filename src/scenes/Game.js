import Board from '../gameObjects/Board'
import ui from '../gameObjects/ui'
import { Y_BUFFER, X_BUFFER, EXPLOSION_DURATION } from '../constants'

export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' })
  }

  create() {
    this.score = 0
    this.level = 1
    this.moves = 10
    this.canFill = true
    this.canMove = true
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height

    const params = getLevelParams(this.level)
    this.boardSize = params.boardSize
    this.tileSize = 1080 / this.boardSize
    this.tileScale = 14 / this.boardSize
    this.fishColors = getFishColors(params.colors, params.types)

    this.musicIndex = 0
    const MUSIC = Phaser.Math.RND.shuffle([
      'game1Music',
      'game2Music',
      'game3Music',
    ])
    this.musicObject = this.sound.add(MUSIC[this.musicIndex])
    this.musicObject.play({ volume: 0 })
    this.tweens.add({
      targets: this.musicObject,
      duration: 1900,
      volume: { from: 0, to: 0.4 },
    })
    this.musicObject.on('complete', () => {
      this.musicIndex++
      this.musicObject = this.sound.add(MUSIC[this.musicIndex])
      this.musicObject.play({ volume: 0 })
      this.tweens.add({
        targets: this.musicObject,
        duration: 1900,
        volume: { from: 0, to: 0.4 },
      })
    })

    this.board = new Board(this)
    this.ui = new ui(this)

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
    this.cameras.main.fadeFrom(1000, 20, 57, 162, true)
  }

  pointerDown(pointer) {
    if (!this.canMove) return
    this.startY = pointer.y
    this.selectedColumn = Math.floor((pointer.x - X_BUFFER) / this.tileSize)
    this.board.sprites.forEach((s) => s.bobTween && s.bobTween.pause())
  }

  pointerMove(pointer) {
    if (typeof this.selectedColumn === 'number') {
      const diffY = pointer.y - this.startY
      this.selectedSprites = this.board.sprites.filter(
        (s) => s.index % this.boardSize === this.selectedColumn,
      )

      this.selectedSprites.forEach((s) => {
        let newY =
          diffY +
          Math.floor(s.index / this.boardSize) * this.tileSize +
          this.tileSize / 2
        if (newY < 0) newY += this.boardSize * this.tileSize

        s.y = Y_BUFFER + (newY % (this.boardSize * this.tileSize))
      })
    }
  }

  newLevel() {
    this.canMove = false
    this.canFill = false
    const params = getLevelParams(this.level)
    this.cameras.main.fade(1000, 20, 57, 162, true, (c, p) => {
      if (p === 1) {
        this.boardSize = params.boardSize
        this.tileSize = 1080 / this.boardSize
        this.tileScale = 14 / this.boardSize
        this.fishColors = getFishColors(params.colors, params.types)

        this.moves = 10
        this.ui.setMoves(this.moves)
        this.board.generateBoard()
        this.cameras.main.fadeFrom(1000, 20, 57, 162, true)
        this.canMove = true
        this.canFill = true
      }
    })
  }

  pointerUp(pointer) {
    if (
      !this.canMove ||
      typeof this.selectedColumn !== 'number' ||
      this.selectedColumn < 0 ||
      (this.selectedSprites &&
        this.selectedSprites.filter((s) => s.frame.name !== 0).length === 0)
    )
      return

    const diffY = pointer.y - this.startY + this.tileSize / 2
    const moveAmount = Math.floor(diffY / this.tileSize) % this.boardSize
    this.board.columnMove(this.selectedColumn, moveAmount)
    this.selectedColumn = false
    this.board.sprites.forEach((s) => s.bobTween && s.bobTween.resume())
    if (moveAmount !== 0) {
      this.moves -= 1
      this.sound.play('moveSound')
    }

    this.ui.setMoves(this.moves)

    this.time.addEvent({
      delay: 50,
      callback: () => this.submit(moveAmount !== 0),
    })
  }

  submit(forceFill = false) {
    this.canMove = false
    this.canFill = false

    const selected = this.board.sprites.filter((s) =>
      this.board.isPartOfMatch(s.index),
    )

    // pop matches
    if (selected.length > 0) {
      this.score += 100 * (selected.length === 3 ? 1 : selected.length * 2)
      this.ui.setScore(this.score)
      this.sound.play('match1Sound')
    }
    selected.forEach((s, i) => {
      s.bobTween && s.bobTween.pause()
      if (s.frame.name === 0) return
      this.tweens.add({
        targets: s,
        scale: { from: this.tileScale * s.direction, to: this.tileScale * 0.5 },
        alpha: 0,
        angle: 90,
        duration: EXPLOSION_DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => {
          s.setFrame(0)
            .setAngle(0)
            .setAlpha(1)
            .setScale(this.tileScale * s.direction, this.tileScale)
          this.emitter.setPosition(s.x, s.y)
          this.emitter.setScale({ start: 0.1, end: 0.5 })
          this.emitter.setLifespan({ min: 500, max: 2000 })
          this.emitter.explode(80)
          s.bobTween && s.bobTween.resume()
        },
      })
    })

    if (selected.length > 0 || forceFill) {
      this.time.addEvent({
        delay: selected.length > 0 ? EXPLOSION_DURATION + 100 : 0,
        callback: this.board.fillBoard.bind(this.board),
      })
    } else {
      this.canFill = true
      this.canMove = true
    }

    if (this.board.sprites.filter((s) => s.frame.name > 0).length === 0) {
      this.sound.play('winSound')
      this.level++
      this.ui.setLevel(this.level)
      this.newLevel()
    } else {
      if (this.moves < 0) {
        this.sound.play('loseSound')
        this.newLevel()
      }
    }
  }

  newPattern() {
    this.hook.newPattern()
  }
}

const getLevelParams = (level) => {
  if (level < 3)
    return {
      boardSize: 4,
      colors: [0, 1],
      types: [0],
    }

  if (level < 6)
    return {
      boardSize: 6,
      colors: [0, 1],
      types: [0],
    }

  if (level < 10)
    return {
      boardSize: 6,
      colors: [0, 1, 2],
      types: [0],
    }

  if (level < 13)
    return {
      boardSize: 8,
      colors: [0, 1, 2],
      types: [0],
    }
}

const getFishColors = (colors, types) => {
  let result = []
  if (types.includes(0)) {
    result = result.concat(colors.map((n) => n + 1))
  }
  if (types.includes(1)) {
    result = result.concat(colors.map((n) => n + 5))
  }
  if (types.includes(2)) {
    result = result.concat(colors.map((n) => n + 9))
  }
  return result
}
