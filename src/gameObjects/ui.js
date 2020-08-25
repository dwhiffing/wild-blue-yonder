export default class {
  constructor(scene) {
    this.scene = scene

    this.scoreText = this.scene.add
      .text(this.scene.width / 2, 80, '0', {
        fontSize: 60,
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.foodSprite = this.scene.add
      .sprite(this.scene.width / 2, 250, 'colors', 0)
      .setScale(3)
  }
  setScore(score) {
    this.scene.score += score
    this.scoreText.setText(this.scene.score)
  }
  getFood() {
    return this.foodSprite.frame.name
  }
}
