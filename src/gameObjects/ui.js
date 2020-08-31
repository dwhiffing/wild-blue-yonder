export default class {
  constructor(scene) {
    this.scene = scene

    this.scoreText = this.scene.add
      .text(this.scene.width / 2, 80, '0', {
        fontSize: 60,
        color: '#ffffff',
      })
      .setOrigin(0.5)

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
  setScore(score) {
    this.scene.score += score
    this.scoreText.setText(this.scene.score)
  }
}
