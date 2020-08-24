import { HOOKS, BOARD_SIZE } from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.position = 0
    this.rotation = 0
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
    this.scene.board.selectSprites()
  }

  rotate() {
    this.rotation = this.rotation + (1 % 4)
    this.enforceBounds()
    this.scene.board.selectSprites()
  }

  newPattern() {
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.enforceBounds()
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
      BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 1) * BOARD_SIZE
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
