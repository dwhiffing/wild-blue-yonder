export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' })
  }

  init(opts) {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height

    this.mute = this.add.image(this.width - 130, this.height - 180, 'icon')
    this.mute.setOrigin(0)
    this.mute.setFrame(window.isMuted ? 2 : 1)
    this.mute.setInteractive().on('pointerdown', () => {
      window.isMuted = !window.isMuted
      this.sound.mute = window.isMuted
      localStorage.setItem('mute', window.isMuted ? 1 : 0)
      this.mute.setFrame(window.isMuted ? 2 : 1)
    })
  }

  create() {
    this.musicObject = this.sound.add('menuMusic')
    this.musicObject.play({ volume: 0.5, loop: true })
    const logo = this.add
      .image(this.width / 2, this.height / 3, 'menu')
      .setScale(1.2)
    this.tweens.add({
      targets: logo,
      y: logo.y - 50,
      duration: 2000,
      ease: 'Quad.easeInOut',
      repeat: -1,
      yoyo: true,
    })
    this.add
      .image(this.width / 2, this.height / 1.55, 'playButton')
      .setScale(1.3)
      .setInteractive()
      .on('pointerdown', () => {
        if (this.started) return
        this.sound.play('match1Sound')
        this.tweens.add({
          targets: this.musicObject,
          duration: 1900,
          volume: 0,
        })
        this.started = true
        this.cameras.main.fade(2000, 20, 57, 162, true, (c, p) => {
          if (p === 1) {
            this.musicObject.destroy()
            this.scene.start('Game')
          }
        })
      })
    this.add
      .image(this.width / 2, this.height / 1.25, 'aboutButton')
      .setScale(1.3)
      .setInteractive()
      .on('pointerdown', () => {
        logo.setAlpha(logo.alpha ? 0 : 1)
      })
  }
}
