export default class {
  constructor(scene) {
    this.scene = scene

    this.scoreText = this.scene.add
      .text(this.scene.width / 2, this.scene.height - 160, ' 0', {
        fontSize: 60,
        fontFamily: 'RockSalt',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.levelText = this.scene.add
      .text(20, 80, `Level ${this.scene.level}`, {
        fontSize: 60,
        fontFamily: 'RockSalt',
        align: 'left',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)

    this.movesText = this.scene.add
      .text(this.scene.width - 20, 80, `Moves ${this.scene.moves}`, {
        fontSize: 60,
        fontFamily: 'RockSalt',
        align: 'right',
        color: '#ffffff',
      })
      .setOrigin(1, 0.5)

    this.mute = this.scene.add.image(
      this.scene.width - 130,
      this.scene.height - 180,
      'icon',
    )
    this.mute.setOrigin(0)
    this.mute.setFrame(window.isMuted ? 2 : 1)
    this.mute.setInteractive().on('pointerdown', () => {
      window.isMuted = !window.isMuted
      this.scene.sound.mute = window.isMuted
      localStorage.setItem('mute', window.isMuted ? 1 : 0)
      this.mute.setFrame(window.isMuted ? 2 : 1)
    })
  }
  setLevel(level) {
    this.levelText.setText(`Level ${level}`)
  }
  setScore(score) {
    this.scoreText.setText(score)
  }
  setMoves(amount) {
    this.movesText.setText(`Moves ${amount}`)
  }
}
