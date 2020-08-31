import {
  BOARD_SIZE,
  TILE_SIZE,
  X_BUFFER,
  Y_BUFFER,
  FISH_COLORS,
  TILE_SCALE,
  MOVE_DURATION,
} from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.tempSprites = new Array(50)
      .fill(1)
      .map((n, i) => this.scene.add.sprite(0, 0, 'colors', 0).setAlpha(0))
    this.sprites = new Array(BOARD_SIZE * BOARD_SIZE).fill(1).map((n, i) => {
      const x = (i % BOARD_SIZE) * TILE_SIZE + X_BUFFER + TILE_SIZE / 2
      const y =
        Math.floor(i / BOARD_SIZE) * TILE_SIZE + Y_BUFFER + TILE_SIZE / 2
      const sprite = this.scene.add.sprite(x + 2, y + 5, 'colors')
      sprite.direction = Math.floor(i / BOARD_SIZE) % 2 === 0 ? 1 : -1
      sprite.setScale(TILE_SCALE * sprite.direction, TILE_SCALE)
      sprite.bobTween = this.scene.tweens.add({
        targets: sprite,
        y: { from: y + 5, to: y - 5 },
        x: { from: x + 2, to: x - 2 },
        yoyo: true,
        repeat: -1,
        delay: i * 50,
        ease: 'Quad.easeInOut',
        duration: 2000,
      })

      sprite.index = i
      return sprite
    })
    this.generateBoard()
  }

  generateBoard() {
    do {
      let types = this.getRandomType()
      this.sprites.forEach((s, i) => s.setFrame(types[i]))
    } while (this.sprites.some((s) => this.isPartOfMatch(s.index)))
  }

  getXY(sprite) {
    return {
      x: sprite.index % BOARD_SIZE,
      y: Math.floor(sprite.index / BOARD_SIZE),
      frame: sprite.frame.name,
    }
  }

  fillBoard() {
    this.moveDirection = this.moveDirection === 0 ? 1 : 0
    this.scene.canFill = false
    this.scene.sound.play('swimSound', { volume: 0.3, rate: 1.4 })
    // swim inner fish
    const rows = this.chunk(this.sprites, BOARD_SIZE)
    const movement = []
    rows.forEach((row, index) => {
      // swim fish off screen
      if (index % 2 !== this.moveDirection) return
      const edgeFish = row[0].direction === 1 ? row[BOARD_SIZE - 1] : row[0]
      const toX =
        edgeFish.direction === 1
          ? edgeFish.x + TILE_SIZE
          : edgeFish.x - TILE_SIZE
      const tempSprite = this.tempSprites.find((s) => s.alpha === 0)
      tempSprite
        .setAlpha(1)
        .setFrame(edgeFish.frame.name)
        .setScale(TILE_SCALE * edgeFish.direction, TILE_SCALE)
        .setPosition(edgeFish.x, edgeFish.y)
      edgeFish.setFrame(0)
      this.tweenFish(tempSprite, toX, { alpha: 0 })

      row
        .sort((a, b) => (a.direction === 1 ? b.x - a.x : a.x - b.x))
        .forEach((sprite, index, row) => {
          const emptySpaces = row.reduce(
            (sum, { index, frame }) =>
              (sprite.direction === 1
                ? index > sprite.index
                : index < sprite.index) && frame.name === 0
                ? sum + 1
                : sum,
            0,
          )
          const moveAmount = emptySpaces > 0 ? 1 : 0
          const nextFish = row[index - (emptySpaces + 1)]
          const neighbour =
            row[
              index -
                (nextFish &&
                nextFish.frame.name === sprite.frame.name &&
                sprite.frame.name > 0
                  ? emptySpaces
                  : moveAmount)
            ]
          if (neighbour) {
            this.swapFish(sprite, neighbour)
            movement.push({ sprite, targetX: neighbour.x })

            // this is an event because it needs to wait for callstack to clear
            let targetX = neighbour.x
            this.scene.time.addEvent({
              delay: 0,
              callback: () => {
                if (
                  sprite.frame.name !== 0 ||
                  (sprite.direction === 1 && sprite.index % BOARD_SIZE !== 0) ||
                  (sprite.direction === -1 &&
                    sprite.index % BOARD_SIZE !== BOARD_SIZE - 1)
                )
                  return

                sprite.setAlpha(0)
                sprite.x =
                  sprite.direction === 1
                    ? 220 - (moveAmount + 1) * TILE_SIZE
                    : this.scene.width - 100 + moveAmount * TILE_SIZE
                sprite.setFrame(tempSprite.frame.name)
                this.tweenFish(sprite, targetX, { alpha: 1 })
              },
            })
          }
        })
    })

    movement.forEach(({ sprite, targetX }, i) => {
      this.tweenFish(sprite, targetX)
    })

    this.scene.time.addEvent({
      delay: MOVE_DURATION,
      callback: () => {
        this.scene.canFill = true
        this.scene.submit()
      },
    })
  }

  getRandomType() {
    return Phaser.Math.RND.shuffle(
      new Array(BOARD_SIZE * BOARD_SIZE)
        .fill(1)
        .map((_, i) => FISH_COLORS[i % FISH_COLORS.length]),
    )
  }

  columnMove(columnIndex, numMove) {
    const column = this.chunk(this.sprites, BOARD_SIZE).map(
      (r) => r[columnIndex],
    )
    const move = this.wrap(numMove, BOARD_SIZE)
    let end = column.slice(BOARD_SIZE - move)
    let start = column.slice(0, BOARD_SIZE - move)
    const newArr = [...end, ...start].map((f) => f.frame.name)
    for (let i = 0; i < BOARD_SIZE; i++) {
      const fishA = column[i]
      fishA.setFrame(newArr[i])
    }
  }

  swapFish(fishA, fishB) {
    if (!fishA || !fishB) return

    let frame = fishA.frame.name
    fishA.setFrame(fishB.frame.name)
    fishB.setFrame(frame)
    let targetX = fishA.x
    fishA.x = fishB.x
    fishB.x = targetX
  }

  tweenFish(sprite, targetX, props = {}) {
    sprite.bobTween && sprite.bobTween.pause()
    sprite.moveTween = this.scene.tweens.add({
      targets: sprite,
      x: targetX,
      ...props,
      duration: MOVE_DURATION,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        sprite.bobTween && sprite.bobTween.resume()
      },
    })
  }

  wrap(n, m) {
    return n >= 0 ? n % m : ((n % m) + m) % m
  }

  chunk(array, size) {
    var result = []
    for (var i = 0; i < array.length; i += size)
      result.push(array.slice(i, i + size))
    return result
  }

  valueAt(index) {
    if (this.sprites[index]) {
      const frame = this.sprites[index].frame.name
      return frame === 0 ? index * 999 : frame
    }
    return null
  }

  isPartOfMatch(index) {
    return (
      this.isPartOfHorizontalMatch(index) || this.isPartOfVerticalMatch(index)
    )
  }

  isPartOfVerticalMatch(index) {
    return (
      (this.valueAt(index) === this.valueAt(index - BOARD_SIZE) &&
        this.valueAt(index) === this.valueAt(index - BOARD_SIZE * 2)) ||
      (this.valueAt(index) === this.valueAt(index + BOARD_SIZE) &&
        this.valueAt(index) === this.valueAt(index + BOARD_SIZE * 2)) ||
      (this.valueAt(index) === this.valueAt(index - BOARD_SIZE) &&
        this.valueAt(index) === this.valueAt(index + BOARD_SIZE))
    )
  }

  isPartOfHorizontalMatch(index) {
    // BUG: accepts 2 in top right corner as match
    return (
      (index % BOARD_SIZE >= 2 &&
        this.valueAt(index) === this.valueAt(index - 1) &&
        this.valueAt(index) === this.valueAt(index - 2)) ||
      (index % BOARD_SIZE <= BOARD_SIZE - 2 &&
        this.valueAt(index) === this.valueAt(index + 1) &&
        this.valueAt(index) === this.valueAt(index + 2)) ||
      (index % BOARD_SIZE >= 1 &&
        index % BOARD_SIZE <= BOARD_SIZE - 1 &&
        this.valueAt(index) === this.valueAt(index - 1) &&
        this.valueAt(index) === this.valueAt(index + 1))
    )
  }
}
