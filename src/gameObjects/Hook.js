import { HOOKS, BOARD_SIZE, TILE_SIZE, X_BUFFER, Y_BUFFER } from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.position = 0
    this.rotation = 0
    this.bubbles = []
    Array.from({ length: 9 }).forEach(() => {
      this.bubbles.push(
        scene.add.sprite(0, 0, 'bubble').setScale(1.5).setAlpha(0),
      )
    })
  }

  move(direction) {
    const { width, height } = this.getHookDimensions()
    if (direction === 'left' && this.position % BOARD_SIZE !== 0) {
      this.position--
    } else if (
      direction === 'right' &&
      (this.position + width) % BOARD_SIZE !== 0
    ) {
      this.position++
    } else if (direction === 'up' && this.position >= BOARD_SIZE) {
      this.position -= BOARD_SIZE
    } else if (
      direction === 'down' &&
      this.position <
        BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 1) * BOARD_SIZE
    ) {
      this.position += BOARD_SIZE
    }

    this.drawBubbles()
    this.scene.board.selectSprites()
  }

  rotate() {
    this.rotation = this.rotation + (1 % 4)
    this.enforceBounds()
    this.drawBubbles()
    this.scene.board.selectSprites()
  }

  drawBubbles() {
    const pattern = this.getPattern()
    const basePosition = {
      x: (this.position % BOARD_SIZE) * TILE_SIZE + X_BUFFER + TILE_SIZE / 2,
      y:
        Math.floor(this.position / BOARD_SIZE) * TILE_SIZE +
        Y_BUFFER +
        TILE_SIZE / 2,
    }
    this.bubbles.forEach((b) => b.setAlpha(0))
    pattern.forEach((n, i) => {
      const bubble = this.bubbles[i]
      if (n === 1) {
        bubble.setAlpha(1)
        bubble.setPosition(
          basePosition.x + (i % 3) * TILE_SIZE,
          basePosition.y + Math.floor(i / 3) * TILE_SIZE,
        )
      }
    })
  }

  newPattern() {
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.enforceBounds()
    this.drawBubbles()
    this.scene.board.selectSprites()
  }

  getPattern() {
    const patternSet = HOOKS[this.hookIndex]
    return patternSet[this.rotation % patternSet.length]
  }

  getSelectedIndexes() {
    const hook = this.scene.hook.getPattern()

    return new Array(9)
      .fill(1)
      .map(
        (_, index) =>
          this.position + (index % 3) + BOARD_SIZE * Math.floor(index / 3),
      )
      .filter((_, index) => hook[index] === 1)
  }

  enforceBounds() {
    const { width, height } = this.getHookDimensions()
    const maxY =
      BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 2) * BOARD_SIZE
    while (this.position - 1 > maxY) {
      this.position -= BOARD_SIZE
    }
    while ((this.position % BOARD_SIZE) + width > BOARD_SIZE) {
      this.position--
    }
  }

  getHookDimensions() {
    const hook = this.getPattern()

    const cols = [
      [hook[2], hook[5], hook[8]],
      [hook[1], hook[4], hook[7]],
      [hook[0], hook[3], hook[6]],
    ]
    const rows = [
      [hook[6], hook[7], hook[8]],
      [hook[3], hook[4], hook[5]],
      [hook[0], hook[1], hook[2]],
    ]
    return {
      width: 3 - cols.findIndex((col) => col.includes(1)),
      height: 3 - rows.findIndex((row) => row.includes(1)),
    }
  }
}
