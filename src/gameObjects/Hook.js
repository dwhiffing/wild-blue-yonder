import { HOOKS, BOARD_SIZE } from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.hookCoord = 0
    this.rotation = 0
  }

  move(direction) {
    const { width, height } = this.getHookDimensions()
    if (direction === 'left' && this.hookCoord % BOARD_SIZE !== 0) {
      this.hookCoord--
    } else if (
      direction === 'right' &&
      (this.hookCoord + width) % BOARD_SIZE !== 0
    ) {
      this.hookCoord++
    } else if (direction === 'up' && this.hookCoord >= BOARD_SIZE) {
      this.hookCoord -= BOARD_SIZE
    } else if (
      direction === 'down' &&
      this.hookCoord <
        BOARD_SIZE * BOARD_SIZE - BOARD_SIZE - (height - 1) * BOARD_SIZE
    ) {
      this.hookCoord += BOARD_SIZE
    }
    this.scene.board.selectSprites()
  }

  rotate() {
    this.rotation = this.rotation + (1 % 4)
    this.validateHookPosition()
    this.scene.board.selectSprites()
  }

  newHook() {
    this.hookIndex = Phaser.Math.RND.between(0, HOOKS.length - 1)
    this.validateHookPosition()
    this.scene.board.selectSprites()
  }

  validateHookPosition() {
    const { width, height } = this.getHookDimensions()
    const maxY = 56 - (height - 1) * BOARD_SIZE
    while (this.hookCoord - 1 > maxY) {
      this.hookCoord -= BOARD_SIZE
    }
    while ((this.hookCoord % BOARD_SIZE) + width > BOARD_SIZE) {
      this.hookCoord--
    }
  }

  getHook() {
    const hookSet = HOOKS[this.hookIndex]
    return hookSet[this.rotation % hookSet.length]
  }

  getHookDimensions() {
    const hook = this.getHook()
    // TODO: make this not hardcoded

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
