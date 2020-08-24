import { HOOKS, BOARD_SIZE, TILE_SIZE, FISH_COLORS } from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene

    this.data = new Array(BOARD_SIZE * BOARD_SIZE)
      .fill(1)
      .map((i) => (i > -1 ? Phaser.Math.RND.pick(FISH_COLORS) : -1))

    this.sprites = this.data
      .map((n, i) => {
        const x = (i % BOARD_SIZE) * TILE_SIZE + 20
        const y = Math.floor(i / BOARD_SIZE) * TILE_SIZE + 500
        const type = Phaser.Math.RND.between(0, 2)
        const sprite = this.scene.add
          .sprite(x, y, 'colors', n + type * BOARD_SIZE)
          .setScale(1.5)
          .setOrigin(0, 0)
        sprite.index = i
        return sprite
      })
      .filter((s) => !!s)
  }

  newFish(sprite) {
    const type = Phaser.Math.RND.between(0, 2)
    sprite.setFrame(Phaser.Math.RND.pick(FISH_COLORS) + type * BOARD_SIZE)
    let targetX = sprite.x
    sprite.x += sprite.index % BOARD_SIZE === 0 ? -TILE_SIZE : TILE_SIZE
    this.tweenFish(sprite, targetX)
  }

  tweenFish(sprite, targetX) {
    if (!targetX) return

    sprite.moving = true
    this.scene.tweens.add({
      targets: [sprite],
      x: targetX,
      duration: 100,
      onComplete: () => (sprite.moving = false),
    })
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

  selectSprites() {
    this.sprites.forEach((sprite) => sprite.setAlpha(0.5))
    // get the 9 tile box for hook starting from top left using hookCoord
    // TODO: make this not hardcoded
    const hookCoordIndexes = [
      this.scene.hook.hookCoord,
      this.scene.hook.hookCoord + 1,
      this.scene.hook.hookCoord + 2,
      this.scene.hook.hookCoord + 8,
      this.scene.hook.hookCoord + 9,
      this.scene.hook.hookCoord + 10,
      this.scene.hook.hookCoord + 16,
      this.scene.hook.hookCoord + 17,
      this.scene.hook.hookCoord + 18,
    ]
    // get the active tiles within that box
    const hook = this.scene.hook.getHook()
    // highlight those tiles
    const selected = this.sprites.filter((sprite, spriteIndex) =>
      hookCoordIndexes
        .filter((_, hookCoordIndex) => hook[hookCoordIndex] === 1)
        .includes(spriteIndex),
    )
    selected.forEach((s) => s.setAlpha(1))
  }
}
