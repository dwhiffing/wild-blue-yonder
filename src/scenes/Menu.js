export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' })
  }

  init(opts) {
    this.width = this.cameras.main.width
    this.height = this.cameras.main.height
  }

  create() {
    this.cameras.main.fadeFrom(2500, 20, 57, 162, true)
    this.musicObject = this.sound.add('menuMusic')
    this.musicObject.play({ volume: 0.5, loop: true })

    const tweenBubble = (sprite, i) => {
      sprite.x = Phaser.Math.RND.between(0, this.width)
      sprite.setScale(Phaser.Math.RND.between(5, 20) / 10)
      this.tweens
        .add({
          targets: sprite,
          delay: i * 300 + Phaser.Math.RND.between(0, 300),
          y: { from: this.height + 200, to: -500 },
          duration: Phaser.Math.RND.between(3000, 8000),
          ease: 'Quad.easeOut',
        })
        .on('complete', () => {
          tweenBubble(sprite, i)
        })
    }

    const tweenFish = (sprite, i) => {
      const direction = Phaser.Math.RND.pick([1, -1])
      sprite.setScale(direction === 1 ? 2 : -2, 2)
      sprite.setFrame(Phaser.Math.RND.pick([1, 2, 3, 5, 6, 7, 9, 10, 11]))
      sprite.y = Phaser.Math.RND.between(0, this.height)
      this.tweens
        .add({
          targets: sprite,
          delay: i * 500 + Phaser.Math.RND.between(0, 500),
          x: {
            from: direction === 1 ? -100 : this.width + 100,
            to: direction === 1 ? this.width + 200 : -200,
          },
          duration: Phaser.Math.RND.between(5000, 12000),
          ease: 'Quad.easeInOut',
        })
        .on('complete', () => {
          tweenFish(sprite, i)
        })
    }

    for (let i = 0; i < 30; i++) {
      const bubble = this.add.sprite(-200, this.height + 200, 'bubble')
      tweenBubble(bubble, i)
    }
    for (let i = 0; i < 30; i++) {
      const fish = this.add.sprite(
        -200,
        Phaser.Math.RND.between(0, this.height),
        'colors',
      )
      tweenFish(fish, i)
    }

    const logo = this.add
      .image(this.width / 2, this.height / 3, 'menu')
      .setScale(1.2)
    this.tweens.add({
      targets: logo,
      y: logo.y - 50,
      duration: 2000,
      repeat: -1,
      yoyo: true,
    })

    this.helpGraphics = this.add.graphics()

    this.helpGraphics
      .fillStyle(0x1439a2, 1)
      .fillRect(0, 0, this.width, this.height)
      .setAlpha(0)

    this.helpText = this.add
      .text(this.width / 2, this.height / 2 - 350, INSTRUCTIONS, {
        fontFamily: 'RockSalt',
        fontSize: 50,
        align: 'center',
        color: '#ffffff',
      })
      .setShadow(2, 2, '#333333', 2, false, true)
      .setOrigin(0.5)
      .setAlpha(0)

    this.add
      .image(this.width / 2, this.height / 1.4, 'playButton')
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
      .image(this.width / 2, this.height / 1.15, 'aboutButton')
      .setScale(1.3)
      .setInteractive()
      .on('pointerdown', () => {
        logo.setAlpha(logo.alpha ? 0 : 1)
        this.helpText.setAlpha(this.helpText.alpha ? 0 : 1)
        this.helpGraphics.setAlpha(this.helpGraphics.alpha ? 0 : 1)
      })

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
}

const INSTRUCTIONS = `
Drag the fish columns to make
lines of 3 or more.
        
Fish will swim left or right
after you move them, depending
on the direction they face.

Clear all fish to complete a level. 

Created By: Daniel Whiffing
Music: Purple Planet
`
