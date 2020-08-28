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
      sprite.direction = 1
      sprite.index = i
      return sprite
    })
  }

  selectSprites() {
    const selected = this.scene.hook.getSelectedIndexes()
    this.sprites.forEach((sprite, spriteIndex) => {
      sprite.isSelected = selected.includes(spriteIndex)
      sprite.setScale(1.5 * sprite.direction, 1.5)
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
    const rows = this.chunk(this.sprites, BOARD_SIZE)
    const movement = []
    rows.forEach((row) => {
      row
        .sort((a, b) => b.x - a.x)
        .forEach((sprite, index, row) => {
          const emptySpaces = row.reduce(
            (sum, { index, frame }) =>
              index > sprite.index && frame.name === 0 ? sum + 1 : sum,
            0,
          )
          let neighbour = row[index - emptySpaces]
          this.swapFish(sprite, neighbour)
          movement.push({ sprite, targetX: neighbour.x })

          // this is an even because it needs to wait for callstack to clear
          let targetX = neighbour.x
          this.scene.time.addEvent({
            delay: 0,
            callback: () => {
              if (sprite.frame.name === 0) {
                sprite.x = -100 - emptySpaces * TILE_SIZE
                sprite.setFrame(this.getRandomType())
                this.tweenFish(sprite, targetX)
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

  swapFish(fishA, fishB) {
    if (!fishA || !fishB) return

    let frame = fishA.frame.name
    fishA.setFrame(fishB.frame.name)
    fishB.setFrame(frame)
    let targetX = fishA.x
    fishA.x = fishB.x
    fishB.x = targetX
  }

  tweenFish(sprite, targetX) {
    sprite.bobTween.pause()
    sprite.moveTween = this.scene.tweens.add({
      targets: sprite,
      x: targetX,
      duration: 1000,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        sprite.bobTween.resume()
      },
    })
  }

  chunk(array, size) {
    var result = []
    for (var i = 0; i < array.length; i += size)
      result.push(array.slice(i, i + size))
    return result
  }
}
