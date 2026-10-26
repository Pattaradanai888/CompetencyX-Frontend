const cancel = Animation.prototype.cancel

Animation.prototype.cancel = function (this: Animation) {
  this.finished.catch(() => {})
  cancel.call(this)
}
