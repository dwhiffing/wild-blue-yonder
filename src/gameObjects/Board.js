import {
  BOARD_SIZE,
  TILE_SIZE,
  FISH_COLORS,
  SPRITE_SIZE,
  X_BUFFER,
  Y_BUFFER,
} from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.tempSprites = new Array(BOARD_SIZE)
      .fill(1)
      .map((n, i) => this.scene.add.sprite(0, 0, 'colors', 0).setAlpha(0))
    this.sprites = new Array(BOARD_SIZE * BOARD_SIZE).fill(1).map((n, i) => {
      const x = (i % BOARD_SIZE) * TILE_SIZE + X_BUFFER + TILE_SIZE / 2
      const y =
        Math.floor(i / BOARD_SIZE) * TILE_SIZE + Y_BUFFER + TILE_SIZE / 2
      const sprite = this.scene.add.sprite(
        x + 2,
        y + 5,
        'colors',
        this.getRandomType(),
      )
      sprite.direction = Math.floor(i / BOARD_SIZE) % 2 === 0 ? 1 : -1
      sprite.setScale(1.5 * sprite.direction, 1.5)
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
  }

  getXY(sprite) {
    return {
      x: sprite.index % BOARD_SIZE,
      y: Math.floor(sprite.index / BOARD_SIZE),
      frame: sprite.frame.name,
    }
  }

  fillBoard() {
    // swim fish off screen
    this.sprites
      .filter(
        (s) =>
          // (s.direction === 1 && s.index % 8 === 7) ||
          s.direction === -1 && s.index % 8 === 0,
      )
      .forEach((sprite) => {
        const toX =
          sprite.direction === 1 ? sprite.x + TILE_SIZE : sprite.x - TILE_SIZE
        const tempSprite = this.tempSprites.find((s) => s.alpha === 0)
        tempSprite
          .setAlpha(1)
          .setFrame(sprite.frame.name)
          .setScale(1.5 * sprite.direction, 1.5)
          .setPosition(sprite.x, sprite.y)
        sprite.setFrame(0)
        this.tweenFish(tempSprite, toX, { alpha: 0 })
      })

    // swim inner fish
    const rows = this.chunk(this.sprites, BOARD_SIZE)
    const movement = []
    rows.forEach((row) => {
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
          let neighbour =
            row[
              sprite.direction === 1 ? index - emptySpaces : index - emptySpaces
            ]

          if (neighbour) {
            this.swapFish(sprite, neighbour)
            movement.push({ sprite, targetX: neighbour.x })
          }

          // add new fish
          // this is an event because it needs to wait for callstack to clear
          let targetX = neighbour.x
          this.scene.time.addEvent({
            delay: 0,
            callback: () => {
              if (sprite.frame.name === 0) {
                sprite.setAlpha(0)
                sprite.x =
                  sprite.direction === 1
                    ? 220 - (emptySpaces + 1) * TILE_SIZE
                    : this.scene.width - 100 + emptySpaces * TILE_SIZE
                sprite.setFrame(this.getRandomType())
                this.tweenFish(sprite, targetX, { alpha: 1 })
              }
            },
          })
        })
    })

    movement.forEach(({ sprite, targetX }, i) => {
      this.tweenFish(sprite, targetX)
    })
  }

  getRandomType() {
    const type = Phaser.Math.RND.between(0, 2)
    return Phaser.Math.RND.pick(FISH_COLORS) + type * SPRITE_SIZE
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
      duration: 1200,
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
}
