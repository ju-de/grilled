var game = new Phaser.Game(1024, 640, Phaser.AUTO, '', 
    { 
        preload: preload, 
        create: create, 
        update: update,
        render: render
    });

function preload() {
    game.load.image('bg', 'assets/bg.gif');
    game.load.image('ground_front', 'assets/ground_front.gif');
    game.load.image('ground_back', 'assets/ground_back.gif');
    game.load.image('player1', 'assets/z1.gif');
    game.load.image('player2', 'assets/z2.gif');
    game.load.image('lion', 'assets/lion.png');
}

function Player(fuel, sprite) {
    this.fuel = fuel;
    this.sprite = sprite;

    game.physics.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
    this.sprite.body.gravity.y = 2000;
}

var player1, player2;
var collidables;

var tileHeight = 64;
var bg;
var groundCollidable;
var groundBack;

var lionTimer;
var lions = [];




var fuelCounter1, fuelCounter2;

var controlKeys1 = {};
var controlKeys2 = {};

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Enable physics for all objects in group
    collidables = game.add.physicsGroup();

    // Draw environment
    bg = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'bg');
    groundBack = game.add.tileSprite(0, game.world.height - tileHeight * 2, game.world.width, tileHeight * 2, 'ground_back');
    groundCollidable = game.add.tileSprite(0, game.world.height - tileHeight, game.world.width, tileHeight, 'ground_front');

    game.physics.enable(groundCollidable);
    groundCollidable.body.immovable = true;
    groundCollidable.body.allowGravity = false;

    // Init players
    player1 = new Player(1000, game.add.sprite(500, 300, 'player1'));
    player2 = new Player(1000, game.add.sprite(300, 300, 'player2'));

    // Init other game objects
    lionTimer = game.time.create(false);
    renewLionTimer();

    fuelCounter1 = game.add.text(0, 0, 'fuel = ' + player1.fuel, { fontSize: '32px', fill: '#ff0000' });
    fuelCounter2 = game.add.text(800, 0, 'fuel = ' + player2.fuel, { fontSize: '32px', fill: '#ff0000' });


    controlKeys1.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    controlKeys1.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    controlKeys1.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    controlKeys2.up = game.input.keyboard.addKey(Phaser.Keyboard.W);
    controlKeys2.left = game.input.keyboard.addKey(Phaser.Keyboard.A);
    controlKeys2.right = game.input.keyboard.addKey(Phaser.Keyboard.D);
}

function renewLionTimer() {
    // Only spawn more lions if there are no more pending lions
    if (lionTimer.length <= 1) {
        if (getRandomInt(0, 10) < 3) {
            // Small chance for lions to spawn in tight groups (2-5 including the current lion)
            var groupSize = getRandomInt(1, 4);
            for (var i = 0; i < groupSize; i++) {
                lionTimer.add(500 * (i + 1), renewLionTimer, this);
            }
            // Add a "regular" spawn after the group so groups don't chain together
            lionTimer.add(getRandomInt(3000, 7000), renewLionTimer, this);
        } else {
            // Spawn lion at random intervals
            lionTimer.add(getRandomInt(3000, 7000), renewLionTimer, this);
        }
    }
    
    if (lionTimer.running) {
        // Add new lion
        var lion = game.add.sprite(game.world.width, game.world.height - tileHeight * 2, 'lion');
        game.physics.enable(lion);
        lion.body.allowGravity = false;
        lions.push(lion);
    } else {
        lionTimer.start();
    }
}

function update() {

    // Scroll the environment
    groundCollidable.tilePosition.x -= 3;
    groundBack.tilePosition.x -= 3;

    for (var i = 0; i < lions.length; i++) {
        lions[i].body.position.x -= 3;
    }
    if (lions.length > 0 && lions[0].body.position.x + lions[0].width < 0) {
        lions.splice(0, 1);
        console.log('removed lion');
    }

    // Collision between players; disable for now
    // game.physics.arcade.collide(player1.sprite, player2.sprite);

    updatePlayer(player1, controlKeys1);
    updatePlayer(player2, controlKeys2);

    fuelCounter1.text = 'fuel = ' + player1.fuel;
    fuelCounter2.text = 'fuel = ' + player2.fuel;
}

function updatePlayer(player, controlKeys) {

    // Movement physics settings
    var upAcceleration = 150;
    var upSpeedLimit = 800;
    var horizontalMoveSpeed = 200;

    var playerSprite = player.sprite;
    var velocity = playerSprite.body.velocity;

    // Check collision between player and ground
    game.physics.arcade.collide(playerSprite, groundCollidable);

    // Fire rocket
    // Don't allow flying if something is on top of the player
    if (controlKeys.up.isDown && player.fuel > 0 && !playerSprite.body.touching.up) {

        // Horizontal movement is faster with rocket
        horizontalMoveSpeed = 400;
        
        // Cap the upwards velocity
        if (velocity.y - upAcceleration < -upSpeedLimit) {
            velocity.y = -upSpeedLimit;
        } else {
            velocity.y -= upAcceleration;
        }
        player.fuel--;
    }

    // Don't allow movement if something is blocking player
    if (controlKeys.left.isDown && !playerSprite.body.touching.left) {
        velocity.x = -horizontalMoveSpeed;
    } else if (controlKeys.right.isDown && !playerSprite.body.touching.right) {
        velocity.x = horizontalMoveSpeed;
    } else if (playerSprite.body.touching.down || playerSprite.body.blocked.down) {
        // Player is standing on top of something solid, stop horizontal sliding
        velocity.x = 0;
    } else {
        // Player is in the air
        // Drag slows horizontal movement
        if (Math.abs(velocity.x) <= 3 ) {
            velocity.x = 0;
        } else if (velocity.x > 0) {
            velocity.x -= 3;
        } else if (velocity.x < 0) {
            velocity.x += 3;
        }
    }

    var position = playerSprite.body.position;

    // Make sure player doesn't fall through the ground
    if (position.y + playerSprite.height > game.world.height - tileHeight) {
        position.set(position.x, game.world.height - tileHeight - playerSprite.height);
        velocity.y = 0;
    }
}

function render() {
    // Debugging displays
    // game.debug.bodyInfo(player1.sprite, 0, 100);
    // game.debug.bodyInfo(player2.sprite, 0, 250);
    game.debug.text('next lion in: ' + lionTimer.duration.toFixed(0), 16, 100);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}