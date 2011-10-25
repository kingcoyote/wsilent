EntityBase = function() {};

EntityBase.prototype = {

  /**
   *  Initializes the EntityBase class.
   */
  EntityBase_init: function(type) {
    this.type = type;
    this.destroyed = false;
  },

  /**
   *  Playerholder for the on_before_init event
   */
  on_before_init: function() {},

  /**
   *  Playerholder for the on_after_init event
   */
  on_after_init: function() {},

  /**
   *  Called by World on each update
   */
  world_update: function(t, dt) {
    this.move(t, dt);
    this.update(t, dt);
  },

  /**
   *  Placeholder for the move method
   */
  move: function(t, dt) { },

  /**
   *  Placeholder for the update method
   */
  update: function(t, dt) { },

  /**
   *  Tells the entity that it's being destroyed.
   */
  destroy: function() {
    this.destroyed = true;
  }

};
