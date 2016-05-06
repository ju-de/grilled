var game = new Phaser.Game(1024, 640, Phaser.AUTO, '', 
    { 
        preload: preload, 
        create: create, 
        update: update 
    });

function preload() {
   game.load.image('player', 'assets/player.png');
}

var player;

var flyButton;
var cursors;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    player = game.add.sprite(300, 300, 'player');

    game.physics.enable(player);

    player.body.collideWorldBounds = true;
    player.body.gravity.y = 1500;

    flyButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    cursors = game.input.keyboard.createCursorKeys();
}

function update() {

    // Horizontal drag
    if (player.body.velocity.x > 0) {
        player.body.velocity.x -= 50;
    } else if (player.body.velocity.x < 0) {
        player.body.velocity.x += 50;
    }

    if (flyButton.isDown) {
        if (player.body.velocity.y > -500) {
            player.body.velocity.y -= 100;
        }
    }
    if (cursors.left.isDown) {
        player.body.velocity.x = -200;
    } else if (cursors.right.isDown) {
        player.body.velocity.x = 200;
    }
}