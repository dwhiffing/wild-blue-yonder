import {
  BOARD_SIZE,
  TILE_SIZE,
  FISH_COLORS,
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
      const sprite = this.scene.add.sprite(x, y, 'colors', this.getRandomType())
      sprite.direction = i % 8 < 4 ? 1 : -1
      sprite.index = i
      return sprite
    })
  }

  selectSprites() {
    const selected = this.scene.hook.getSelectedIndexes()
    this.sprites.forEach((sprite, spriteIndex) => {
      sprite.isSelected = selected.includes(spriteIndex)
      sprite.setScale(
        selected.includes(spriteIndex)
          ? 1 * sprite.direction
          : 1 * sprite.direction,
        selected.includes(spriteIndex) ? 1 : 1,
      )
    })
  }

  fillBoard() {
    const leftSide = this.sprites.filter((s) => s.index % 8 < 4)
    const rightSide = this.sprites.filter((s) => s.index % 8 >= 4).reverse()
    const sides = [leftSide, rightSide]

    sides.forEach((side, sideIndex) => {
      side.forEach((sprite) => {
        if (sprite.frame.name !== 1) return

        const i = sprite.index
        const rowIndex = i % BOARD_SIZE
        const isEdge = rowIndex === 0 || rowIndex === BOARD_SIZE - 1
        const neighbourIndex = sideIndex === 0 ? i - 1 : i + 1

        if (isEdge) {
          this.newFish(sprite)
        } else {
          this.swapFish(
            sprite,
            side.find((s) => s.index === neighbourIndex && !s.moving),
          )
        }
      })
    })
  }

  newFish(sprite) {
    sprite.setFrame(this.getRandomType())
    let targetX = sprite.x
    sprite.x += sprite.index % BOARD_SIZE === 0 ? -TILE_SIZE : TILE_SIZE
    this.tweenFish(sprite, targetX)
  }

  getRandomType() {
    const type = Phaser.Math.RND.between(0, 2)
    return Phaser.Math.RND.pick(FISH_COLORS) + type * BOARD_SIZE
  }

  swapFish(fishA, fishB) {
    if (!fishA || !fishB) return

    let frame = fishA.frame.name
    fishA.setFrame(fishB.frame.name)
    fishB.setFrame(frame)
    let targetX = fishA.x
    fishA.x = fishB.x
    this.tweenFish(fishA, targetX)
  }

  tweenFish(sprite, targetX) {
    if (!targetX) return

    sprite.moving = true
    this.scene.tweens.add({
      targets: [sprite],
      x: targetX,
      duration: 800,
      delay: 5 * sprite.index,
      ease: 'Cubic.easeOut',
      onComplete: () => (sprite.moving = false),
    })
  }
}
