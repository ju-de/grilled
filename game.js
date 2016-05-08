var game = new Phaser.Game(1024, 640, Phaser.AUTO, '', 
    { 
        preload: preload, 
        create: create, 
        update: update,
        render: render
    });

var assets = {
    player: { w: 108, h: 192 },
    lion_run: { w: 102, h: 122 },
    lion_jump: { w: 98, h: 130 },
    fuel: { w: 28, h: 32}    
}

function preload() {
    game.load.image('empty', 'assets/empty.png');
    game.load.image('bg', 'assets/bg.gif');
    game.load.image('ground_front', 'assets/ground_front.gif');
    game.load.image('ground_back', 'assets/ground_back.gif');
    game.load.spritesheet('player1', 'assets/spritesheets/z1.gif', assets.player.w, assets.player.h);
    game.load.spritesheet('player2', 'assets/spritesheets/z2.gif', assets.player.w, assets.player.h);
    game.load.spritesheet('lion_run', 'assets/spritesheets/l1.gif', assets.lion_run.w, assets.lion_run.h);
    game.load.spritesheet('lion_jump', 'assets/spritesheets/l2.gif', assets.lion_jump.w, assets.lion_jump.h);
    game.load.spritesheet('fuel', 'assets/spritesheets/fuel.gif', assets.fuel.w, assets.fuel.h);
}

var groundHeight = 64;
var scrollSpeed = 3;
var maxFuelAmount = 500;
var refillFuelAmount = 200;

var player1, player2;
var collidables;
var bg, groundFront, groundBack, groundCollidable;

var lionTimer;
var lionsRunning;
var lionsJumping;

var fuelTimer;
var fuels;




var fuelCounter1, fuelCounter2;

var controlKeys1 = {};
var controlKeys2 = {};

function Player(fuel, sprite) {
    this.fuel = fuel;
    this.sprite = sprite;

    game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
    this.sprite.body.gravity.y = 1500;

    this.addFuel = function() {
        this.fuel += refillFuelAmount;
        if (this.fuel > maxFuelAmount) {
            this.fuel = maxFuelAmount;
        }
    }
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Enable physics for all objects in group
    collidables = game.add.physicsGroup();

    // Draw environment
    bg = game.add.tileSprite(0, 0, game.world.width, game.world.height, 'bg');
    groundCollidable = game.add.tileSprite(0, game.world.height - groundHeight, game.world.width, groundHeight, 'empty');
    groundBack = game.add.tileSprite(0, game.world.height - groundHeight * 2, game.world.width, groundHeight * 2, 'ground_back');
    groundFront = game.add.tileSprite(0, game.world.height - groundHeight * 2, game.world.width, groundHeight * 2, 'ground_front');

    game.physics.arcade.enable(groundCollidable);
    groundCollidable.body.immovable = true;
    groundCollidable.body.allowGravity = false;

    // Init players
    player1 = new Player(maxFuelAmount, game.add.sprite(100, game.world.height - groundHeight - assets.player.h, 'player1'));
    player1.sprite.scale.setTo(0.6, 0.6);
    player1.sprite.animations.add('idle');
    player1.sprite.animations.play('idle', 8, true, false);

    player2 = new Player(maxFuelAmount, game.add.sprite(200, game.world.height - groundHeight - assets.player.h, 'player2'));
    player2.sprite.scale.setTo(0.6, 0.6);
    player2.sprite.animations.add('idle');
    player2.sprite.animations.play('idle', 8, true, false);

    // Init other game objects
    lionsRunning = game.add.physicsGroup();
    lionsJumping = game.add.physicsGroup();
    lionTimer = game.time.create(false);
    renewLionTimer();

    fuels = game.add.physicsGroup();
    fuelTimer = game.time.create(false);
    renewFuelTimer();


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
        if (game.rnd.integerInRange(0, 10) < 3) {
            // Small chance for lions to spawn in tight groups (2-5 including the current lion)
            for (var i = 0, groupSize = game.rnd.integerInRange(1, 4); i < groupSize; i++) {
                lionTimer.add(500 * (i + 1), renewLionTimer, this);
            }
            // Add a "regular" spawn after the group so groups don't chain together
            lionTimer.add(game.rnd.integerInRange(3000 + groupSize * 500, 7000 + groupSize * 500), renewLionTimer, this);
        } else {
            // Spawn lion at random intervals
            lionTimer.add(game.rnd.integerInRange(3000, 7000), renewLionTimer, this);
        }
    }
    
    if (lionTimer.running) {
        // Add new lion
        if (game.rnd.integerInRange(0, 3) != 0) {
            var lion = lionsRunning.create(game.world.width, game.world.height - groundHeight - assets.lion_run.h, 'lion_run');
            lion.body.allowGravity = false;
            lion.animations.add('run');
            lion.animations.play('run', 8, true, false);
        } else {
            var lion = lionsJumping.create(game.world.width, game.world.height - groundHeight - assets.lion_jump.h, 'lion_jump');
            lion.body.gravity.y = 1500;
            lion.animations.add('jump');
            lion.animations.play('jump', 8, true, false);
        }
        
    } else {
        lionTimer.start();
    }
}

function renewFuelTimer() {

    fuelTimer.add(game.rnd.integerInRange(10000, 15000), renewFuelTimer, this);

    if (fuelTimer.running) {
        var fuelBox = fuels.create(game.world.width, game.rnd.integerInRange(0, 400), 'fuel');
        fuelBox.body.allowGravity = false;
        fuelBox.animations.add('idle');
        fuelBox.animations.play('idle', 8, true, false);
    } else {
        fuelTimer.start();
    }
}

function update() {

    // Scroll the environment
    groundFront.tilePosition.x -= scrollSpeed;
    groundBack.tilePosition.x -= scrollSpeed;

    // Check collisions between jumping lions and the ground
    game.physics.arcade.collide(groundCollidable, lionsJumping);

    lionsRunning.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed + 3;
    });
    lionsJumping.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed;

        // Small chance to jump up every sprite loop
        var currentAnim = lion.animations.currentAnim;
        if (currentAnim.frame == 3 && !currentAnim.paused && game.rnd.integerInRange(0, 10) == 0) {
            currentAnim.paused = true;
            lion.body.velocity.y = -game.rnd.integerInRange(600, 1000);
        } else if (currentAnim.paused && lion.body.touching.down) {
            currentAnim.paused = false;
        }
    });

    // Remove lion once it leaves the screen
    if (lionsRunning.children.length > 0) {
        var firstChild = lionsRunning.getChildAt(0);
        if (firstChild.body.position.x + firstChild.width < 0) {
            firstChild.kill();
            lionsRunning.removeChild(firstChild);
        }
    }
    if (lionsJumping.children.length > 0) {
        var firstChild = lionsJumping.getChildAt(0);
        if (firstChild.body.position.x + firstChild.width < 0) {
            firstChild.kill();
            lionsJumping.removeChild(firstChild);
        }
    }

    fuels.forEach(function(fuel) {
        fuel.body.position.x -= scrollSpeed;
    });
    if (fuels.children.length > 0) {
        // Kill fuel once it leaves the screen
        var firstChild = fuels.getChildAt(0);
        if (firstChild.body.position.x + firstChild.width < 0) {
            firstChild.kill();
            fuels.removeChild(firstChild);
        }
    }
    

    // Collision integerInRange players; disable for now
    // game.physics.arcade.collide(player1.sprite, player2.sprite);

    if (player1.sprite.alive) {
        updatePlayer(player1, controlKeys1);
    }
    if (player2.sprite.alive) {
        updatePlayer(player2, controlKeys2);
    }

    fuelCounter1.text = 'fuel = ' + player1.fuel;
    fuelCounter2.text = 'fuel = ' + player2.fuel;
}

function updatePlayer(player, controlKeys) {

    // Movement physics settings
    var upAcceleration = 100;
    var upSpeedLimit = 500;
    var horizontalMoveSpeed = 200;

    var playerSprite = player.sprite;
    var velocity = playerSprite.body.velocity;

    var isRocketFired = false;

    // Check collision integerInRange player and ground
    game.physics.arcade.collide(playerSprite, groundCollidable);

    var currentAnim = playerSprite.animations.currentAnim;

    // Fire rocket
    // Don't allow flying if something is on top of the player
    if (controlKeys.up.isDown && player.fuel > 0 && !playerSprite.body.touching.up) {
        isRocketFired = true;

        // Horizontal movement is faster with rocket
        horizontalMoveSpeed = 400;
        
        // Cap the upwards velocity
        if (velocity.y - upAcceleration < -upSpeedLimit) {
            velocity.y = -upSpeedLimit;
        } else {
            velocity.y -= upAcceleration;
        }
        player.fuel--;

        // Pause animation when accelerating upwards
        if (!currentAnim.isFinished) {
            playerSprite.animations.stop();
        }
        playerSprite.frame = 2;

    }

    // Player is on the ground/standing on something else
    if (playerSprite.body.touching.down) {
        if (currentAnim.isFinished) {
            playerSprite.animations.play('idle', 8, true, false);
        }
    }

    // Reset sprite rotation
    playerSprite.rotation = 0;

    // Don't allow movement if something is blocking player
    if (controlKeys.left.isDown && !playerSprite.body.touching.left) {
        velocity.x = -horizontalMoveSpeed;
        if (isRocketFired) {
            playerSprite.rotation = -0.2;
        }
    } else if (controlKeys.right.isDown && !playerSprite.body.touching.right) {
        velocity.x = horizontalMoveSpeed;
        if (isRocketFired) {
            playerSprite.rotation = 0.2;
        }
    } else if (playerSprite.body.touching.down) {
        // Player is standing on top of something solid & not actively moving horizontally, so stop horizontal sliding
        velocity.x = 0;
    } else {
        // Player is in the air & not actively moving horizontally, so simulate drag and slow horizontal movement
        if (Math.abs(velocity.x) <= 3 ) {
            velocity.x = 0;
        } else if (velocity.x > 0) {
            velocity.x -= 3;
        } else if (velocity.x < 0) {
            velocity.x += 3;
        }

        // Pause animation when free falling
        if (!isRocketFired) {
            if (!currentAnim.isFinished) {
                playerSprite.animations.stop();
            }
            playerSprite.frame = 3;
        }

    }

    var position = playerSprite.body.position;

    // Make sure player doesn't fall through the ground
    if (position.y + playerSprite.height > game.world.height - groundHeight) {
        position.set(position.x, game.world.height - groundHeight - playerSprite.height);
        velocity.y = 0;
    }

    // Check if player is in contact with a lion
    game.physics.arcade.overlap(playerSprite, lionsRunning, playerDeath, null, this);
    game.physics.arcade.overlap(playerSprite, lionsJumping, playerDeath, null, this);

    // Check if player is in contact with a fuel box
    game.physics.arcade.overlap(playerSprite, fuels, 
        function(playerSprite, fuel) {
            fuel.kill();
            player.addFuel();
        }, 
        null, this);
}

function playerDeath(playerSprite, lion) {
    playerSprite.kill();
}

function render() {
    // Debugging displays
    // game.debug.bodyInfo(player1.sprite, 0, 100);
    // game.debug.bodyInfo(player2.sprite, 0, 250);
    game.debug.text('next lion in: ' + lionTimer.duration.toFixed(0), 16, 100);
    game.debug.text('next fuel box in: ' + fuelTimer.duration.toFixed(0), 16, 150);
    
}