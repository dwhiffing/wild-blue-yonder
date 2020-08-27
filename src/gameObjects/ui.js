export default class {
  constructor(scene) {
    this.scene = scene

    this.scoreText = this.scene.add
      .text(this.scene.width / 2, 80, '0', {
        fontSize: 60,
        color: '#ffffff',
      })
      .setOrigin(0.5)
  }
  setScore(score) {
    this.scene.score += score
    this.scoreText.setText(this.scene.score)
  }
}
