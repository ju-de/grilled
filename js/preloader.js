GrilledGame.Preloader = function(game) {
    this.logo = null;
};

var assets = {
    player: {w: 108, h: 192},
    lion_run: {w: 102, h: 122},
    lion_jump: {w: 98, h: 130},
    fuel: {w: 28, h: 32},
    goat: {w: 54, h: 60},
    pole: {w: 8, h: 64},
    fire: {w: 108, h: 256},
    meat: {w: 36, h: 24},
    keys: {w: 144, h: 102}
}

GrilledGame.Preloader.prototype = {
    preload: function() {
        this.stage.setBackgroundColor(0xffaa9b);
        this.logo = this.add.sprite(this.world.width / 2, 180, 'logo');
        this.logo.anchor.setTo(0.5, 0.5);
        this.logo.scale.setTo(1.5, 1.5);

        console.log("Preloading");
        this.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

        this.load.image('empty', 'assets/empty.png');
        this.load.image('bg', 'assets/bg.gif');
        this.load.image('ground_front', 'assets/ground_front.gif');
        this.load.image('ground_back', 'assets/ground_back.gif');
        this.load.spritesheet('player1', 'assets/spritesheets/z1.gif', assets.player.w, assets.player.h);
        this.load.spritesheet('player2', 'assets/spritesheets/z2.gif', assets.player.w, assets.player.h);
        this.load.spritesheet('lion_run', 'assets/spritesheets/l1.gif', assets.lion_run.w, assets.lion_run.h);
        this.load.spritesheet('lion_jump', 'assets/spritesheets/l2.gif', assets.lion_jump.w, assets.lion_jump.h);
        this.load.spritesheet('fuel', 'assets/spritesheets/fuel.gif', assets.fuel.w, assets.fuel.h);
        this.load.spritesheet('goat', 'assets/spritesheets/goat.gif', assets.goat.w, assets.goat.h);
        this.load.image('pole', 'assets/pole.gif');
        this.load.spritesheet('fire1', 'assets/spritesheets/fire1.gif', assets.fire.w, assets.fire.h);
        this.load.spritesheet('fire2', 'assets/spritesheets/fire2.gif', assets.fire.w, assets.fire.h);
        this.load.image('player1_label', 'assets/indicator_ref_1.gif');
        this.load.image('player2_label', 'assets/indicator_ref_2.gif');
        this.load.image('fuel_bar', 'assets/bar.gif');
        this.load.image('player1_gameover', 'assets/z1_icon_grilled.gif');
        this.load.image('player2_gameover', 'assets/z2_icon_grilled.gif');
        this.load.spritesheet('meat', 'assets/spritesheets/meat.gif', assets.meat.w, assets.meat.h);
        this.load.spritesheet('keys1', 'assets/spritesheets/keys1.gif', assets.keys.w, assets.keys.h);
        this.load.spritesheet('keys2', 'assets/spritesheets/keys2.gif', assets.keys.w, assets.keys.h);
    },
    create: function() {
        this.state.start('Game');
    },
    update: function() {

    }
};