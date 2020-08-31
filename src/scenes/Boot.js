export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' })
  }

  preload() {
    const progress = this.add.graphics()

    window.isMuted = !!Number(localStorage.getItem('mute'))
    this.sound.mute = window.isMuted

    this.load.on('progress', (value) => {
      progress.clear()
      progress.fillStyle(0xffffff, 1)
      progress.fillRect(
        0,
        this.sys.game.config.height / 2,
        this.sys.game.config.width * value,
        60,
      )
    })

    this.load.image('playButton', 'assets/images/button.png')
    this.load.image('aboutButton', 'assets/images/about.png')
    this.load.audio('menuMusic', 'assets/menu.mp3')
    this.load.audio('match1Sound', 'assets/pop.mp3', { instances: 4 })
    this.load.audio('swimSound', 'assets/wave.mp3', { instances: 4 })
    this.load.audio('moveSound', 'assets/move2.wav', { instances: 4 })
    this.load.audio('game1Music', 'assets/game-1.mp3')
    this.load.image('menu', 'assets/images/wildblueyonder.png')
    this.load.image('bubble', 'assets/images/bubble2.png')
    this.load.spritesheet('icon', 'assets/images/icons.png', {
      frameWidth: 100,
      frameHeight: 100,
    })
    this.load.spritesheet('colors', 'assets/images/colors.png', {
      frameWidth: 64,
      frameHeight: 64,
    })

    this.load.on('complete', () => {
      progress.destroy()
      this.scene.start('Menu')
    })
  }
}
