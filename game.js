var game = new Phaser.Game(1024, 640, Phaser.AUTO, '', 
    { 
        preload: preload, 
        create: create, 
        update: update,
        render: render
    });

function preload() {
    game.load.image('ground', 'assets/ground.png');
    game.load.image('player1', 'assets/z1.gif');
    game.load.image('player2', 'assets/z2.gif');
}

function Player(fuel, sprite) {
    this.fuel = fuel;
    this.sprite = sprite;
}

var player1, player2;
var collidables;
var ground;

var fuelCounter1, fuelCounter2;

var controlKeys1 = {};
var controlKeys2 = {};

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Enable physics for all objects in group
    collidables = game.add.physicsGroup();

    ground = game.add.sprite(0, game.world.height - 50, 'ground');
    game.physics.enable(ground);
    ground.body.immovable = true;

    player1 = new Player(1000, game.add.sprite(500, 300, 'player1'));
    player2 = new Player(1000, game.add.sprite(300, 300, 'player2'));

    game.physics.enable(player1.sprite);
    game.physics.enable(player2.sprite);

    player1.sprite.body.collideWorldBounds = true;
    player1.sprite.body.gravity.y = 2000;
    player2.sprite.body.collideWorldBounds = true;
    player2.sprite.body.gravity.y = 2000;



    fuelCounter1 = game.add.text(0, 0, 'fuel = ' + player1.fuel, { fontSize: '32px', fill: '#ff0000' });
    fuelCounter2 = game.add.text(800, 0, 'fuel = ' + player2.fuel, { fontSize: '32px', fill: '#ff0000' });


    controlKeys1.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    controlKeys1.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    controlKeys1.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    controlKeys2.up = game.input.keyboard.addKey(Phaser.Keyboard.W);
    controlKeys2.left = game.input.keyboard.addKey(Phaser.Keyboard.A);
    controlKeys2.right = game.input.keyboard.addKey(Phaser.Keyboard.D);
}

function update() {

    updatePlayer(player1, controlKeys1);
    updatePlayer(player2, controlKeys2);

    game.physics.arcade.collide(player1.sprite, player2.sprite);

    fuelCounter1.text = 'fuel = ' + player1.fuel;
    fuelCounter2.text = 'fuel = ' + player2.fuel;
}

function updatePlayer(player, controlKeys) {

    // Movement physics settings
    var upAcceleration = 150;
    var upSpeedLimit = 800;
    var horizontalMoveSpeed = 200;

    var playerSprite = player.sprite;
    var velx = playerSprite.body.velocity.x;
    var vely = playerSprite.body.velocity.y;

    var isOnGround = game.physics.arcade.collide(playerSprite, ground);


    if (controlKeys.up.isDown && player.fuel > 0) {
        // Fire rocket

        horizontalMoveSpeed = 400;
        
        // Cap the upwards velocity
        if (vely - upAcceleration < -upSpeedLimit) {
            playerSprite.body.velocity.y = -upSpeedLimit;
        } else {
            playerSprite.body.velocity.y -= upAcceleration;
        }
        player.fuel--;
    }

    if (controlKeys.left.isDown) {
        playerSprite.body.velocity.x = -horizontalMoveSpeed;
    } else if (controlKeys.right.isDown) {
        playerSprite.body.velocity.x = horizontalMoveSpeed;
    } else if (isOnGround) {
        // Player is on the ground, stop horizontal movement
        playerSprite.body.velocity.x = 0;
    } else {
        // Player is in the air
        // Drag slows horizontal movement
        if (Math.abs(velx) <= 3 ) {
            playerSprite.body.velocity.x = 0;
        } else if (velx > 0) {
            playerSprite.body.velocity.x -= 3;
        } else if (velx < 0) {
            playerSprite.body.velocity.x += 3;
        }
    }

}

function render() {
    // Debugging displays
    game.debug.bodyInfo(player1.sprite, 0, 100);
    game.debug.bodyInfo(player2.sprite, 0, 250);
}
