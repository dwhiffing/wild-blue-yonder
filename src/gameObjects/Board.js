import { X_BUFFER, Y_BUFFER, MOVE_DURATION } from '../constants'

export default class {
  constructor(scene) {
    this.scene = scene
    this.tempSprites = new Array(50)
      .fill(1)
      .map((n, i) => this.scene.add.sprite(0, 0, 'colors', 0).setAlpha(0))

    this.generateBoard()
  }

  generateBoard() {
    this.sprites = this.sprites || []
    this.sprites.forEach((s) => s.destroy())
    this.sprites = new Array(this.scene.boardSize * this.scene.boardSize)
      .fill(1)
      .map((n, i) => {
        const x =
          (i % this.scene.boardSize) * this.scene.tileSize +
          X_BUFFER +
          this.scene.tileSize / 2
        const y =
          Math.floor(i / this.scene.boardSize) * this.scene.tileSize +
          Y_BUFFER +
          this.scene.tileSize / 2
        const sprite = this.scene.add.sprite(x + 2, y + 5, 'colors')
        sprite.direction =
          Math.floor(i / this.scene.boardSize) % 2 === 0 ? 1 : -1
        sprite.setScale(
          this.scene.tileScale * sprite.direction,
          this.scene.tileScale,
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

        sprite.index = i
        return sprite
      })
    do {
      let types = this.getRandomType()
      this.sprites.forEach((s, i) => s.setFrame(types[i]))
    } while (this.sprites.some((s) => this.isPartOfMatch(s.index)))
  }

  getXY(sprite) {
    return {
      x: sprite.index % this.scene.boardSize,
      y: Math.floor(sprite.index / this.scene.boardSize),
      frame: sprite.frame.name,
    }
  }

  fillBoard() {
    this.moveDirection = this.moveDirection === 0 ? 1 : 0
    this.scene.canFill = false
    this.scene.sound.play('swimSound', { volume: 0.3, rate: 1.4 })
    // swim inner fish
    const rows = this.chunk(this.sprites, this.scene.boardSize)
    const movement = []
    rows.forEach((row, index) => {
      // swim fish off screen
      if (index % 2 !== this.moveDirection) return
      const edgeFish =
        row[0].direction === 1 ? row[this.scene.boardSize - 1] : row[0]
      const toX =
        edgeFish.direction === 1
          ? edgeFish.x + this.scene.tileSize
          : edgeFish.x - this.scene.tileSize
      const tempSprite = this.tempSprites.find((s) => s.alpha === 0)
      tempSprite
        .setAlpha(1)
        .setFrame(edgeFish.frame.name)
        .setScale(
          this.scene.tileScale * edgeFish.direction,
          this.scene.tileScale,
        )
        .setPosition(edgeFish.x, edgeFish.y)
      edgeFish.setFrame(0)
      this.tweenFish(tempSprite, toX, { alpha: 0 })

      row
        .sort((a, b) => (a.direction === 1 ? b.x - a.x : a.x - b.x))
        .forEach((sprite, index, row) => {
          const moveAmount =
            row.reduce(
              (sum, { index, frame }) =>
                (sprite.direction === 1
                  ? index > sprite.index
                  : index < sprite.index) && frame.name === 0
                  ? sum + 1
                  : sum,
              0,
            ) > 0
              ? 1
              : 0
          const neighbour = row[index - moveAmount]
          if (neighbour) {
            this.swapFish(sprite, neighbour)
            movement.push({ sprite, targetX: neighbour.x })

            // this is an event because it needs to wait for callstack to clear
            let targetX = neighbour.x
            this.scene.time.addEvent({
              delay: 0,
              callback: () =>
                this.newFish(sprite, tempSprite.frame.name, targetX),
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
        const types = this.sprites.map((s) => s.frame.name)
        const leftOvers = [1, 2, 3, 5, 6, 7, 9, 10, 11].map((i) => {
          const count = types.filter((t) => t === i).length
          return [i, count]
        })

        const empty = Phaser.Math.RND.shuffle(
          this.sprites.filter(
            (s) =>
              s.frame.name === 0 &&
              (s.index % this.scene.boardSize === 0 ||
                s.index % this.scene.boardSize === this.scene.boardSize - 1),
          ),
        )
        let spawnIndex = 0
        leftOvers.forEach(([type, n]) => {
          if (n === 1) {
            this.newFish(empty[spawnIndex], type, empty[spawnIndex].x)
            spawnIndex++
            this.newFish(empty[spawnIndex], type, empty[spawnIndex].x)
            spawnIndex++
          }
          if (n === 2) {
            this.newFish(empty[spawnIndex], type, empty[spawnIndex].x)
            spawnIndex++
          }
        })
        this.scene.canFill = true
        this.scene.submit()
      },
    })
  }

  newFish(sprite, frame, targetX) {
    if (
      sprite.frame.name !== 0 ||
      (sprite.direction === 1 && sprite.index % this.scene.boardSize !== 0) ||
      (sprite.direction === -1 &&
        sprite.index % this.scene.boardSize !== this.scene.boardSize - 1)
    )
      return

    sprite.setAlpha(0)
    sprite.x =
      sprite.direction === 1
        ? 220 - 2 * this.scene.tileSize
        : this.scene.width - 100 + this.scene.tileSize
    sprite.setFrame(frame)

    this.tweenFish(sprite, targetX, { alpha: 1 })
  }

  getRandomType() {
    return Phaser.Math.RND.shuffle(
      new Array(this.scene.boardSize * this.scene.boardSize)
        .fill(1)
        .map((_, i) => this.scene.fishColors[i % this.scene.fishColors.length]),
    )
  }

  columnMove(columnIndex, numMove) {
    const column = this.chunk(this.sprites, this.scene.boardSize).map(
      (r) => r[columnIndex],
    )
    const move = this.wrap(numMove, this.scene.boardSize)
    let end = column.slice(this.scene.boardSize - move)
    let start = column.slice(0, this.scene.boardSize - move)
    const newArr = [...end, ...start].map((f) => f.frame.name)
    for (let i = 0; i < this.scene.boardSize; i++) {
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
      (this.valueAt(index) === this.valueAt(index - this.scene.boardSize) &&
        this.valueAt(index) ===
          this.valueAt(index - this.scene.boardSize * 2)) ||
      (this.valueAt(index) === this.valueAt(index + this.scene.boardSize) &&
        this.valueAt(index) ===
          this.valueAt(index + this.scene.boardSize * 2)) ||
      (this.valueAt(index) === this.valueAt(index - this.scene.boardSize) &&
        this.valueAt(index) === this.valueAt(index + this.scene.boardSize))
    )
  }

  isPartOfHorizontalMatch(index) {
    // BUG: accepts 2 in top right corner as match
    const result =
      (index % this.scene.boardSize >= 2 &&
        this.valueAt(index) === this.valueAt(index - 1) &&
        this.valueAt(index) === this.valueAt(index - 2)) ||
      (index % this.scene.boardSize < this.scene.boardSize - 2 &&
        this.valueAt(index) === this.valueAt(index + 1) &&
        this.valueAt(index) === this.valueAt(index + 2)) ||
      (index % this.scene.boardSize >= 1 &&
        index % this.scene.boardSize < this.scene.boardSize - 1 &&
        this.valueAt(index) === this.valueAt(index - 1) &&
        this.valueAt(index) === this.valueAt(index + 1))

    return result
  }
}
