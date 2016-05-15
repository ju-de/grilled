window.onload = function() {
    var game = new Phaser.Game(1024, 640, Phaser.AUTO, '');

    game.state.add('Boot', GrilledGame.Boot);
    game.state.add('Preloader', GrilledGame.Preloader);
    game.state.add('Game', GrilledGame.Game);

    game.state.start('Boot');

    console.log("Starting game");
};

var GrilledGame = {};

GrilledGame.Boot = function(game) {};

GrilledGame.Boot.prototype = {
    init: function() {
        this.input.maxPointers = 1;
    },
    preload: function() {
        this.load.image('logo', 'assets/logo.gif');
    },
    create: function () {
        this.state.start('Preloader');
    }
};