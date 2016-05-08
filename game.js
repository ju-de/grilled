var game = new Phaser.Game(1024, 640, Phaser.AUTO, '', 
    { 
        preload: preload, 
        create: create, 
        update: update,
        render: render
    });

var assets = {
    player: {w: 108, h: 192},
    lion_run: {w: 102, h: 122},
    lion_jump: {w: 98, h: 130},
    fuel: {w: 28, h: 32},
    goat: {w: 54, h: 60},
    pole: {w: 8, h: 64},
    fire: {w: 108, h: 256},
    meat: {w: 36, h: 18}
}

var fontName = 'Share Tech Mono';

// http://phaser.io/examples/v2/text/google-webfonts
WebFontConfig = {
    active: function() { 
        // Need delay for some reason
        game.time.events.add(200, createScoreCounters, this);
    },
    google: {
        families: [fontName]
    }
};

function preload() {
    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

    game.load.image('empty', 'assets/empty.png');
    game.load.image('bg', 'assets/bg.gif');
    game.load.image('ground_front', 'assets/ground_front.gif');
    game.load.image('ground_back', 'assets/ground_back.gif');
    game.load.spritesheet('player1', 'assets/spritesheets/z1.gif', assets.player.w, assets.player.h);
    game.load.spritesheet('player2', 'assets/spritesheets/z2.gif', assets.player.w, assets.player.h);
    game.load.spritesheet('lion_run', 'assets/spritesheets/l1.gif', assets.lion_run.w, assets.lion_run.h);
    game.load.spritesheet('lion_jump', 'assets/spritesheets/l2.gif', assets.lion_jump.w, assets.lion_jump.h);
    game.load.spritesheet('fuel', 'assets/spritesheets/fuel.gif', assets.fuel.w, assets.fuel.h);
    game.load.spritesheet('goat', 'assets/spritesheets/goat.gif', assets.goat.w, assets.goat.h);
    game.load.image('pole', 'assets/pole.gif');
    game.load.spritesheet('fire1', 'assets/spritesheets/fire1.gif', assets.fire.w, assets.fire.h);
    game.load.spritesheet('fire2', 'assets/spritesheets/fire2.gif', assets.fire.w, assets.fire.h);
    game.load.image('player1_label', 'assets/indicator_ref_1.gif');
    game.load.image('player2_label', 'assets/indicator_ref_2.gif');
    game.load.image('fuel_bar', 'assets/bar.gif');
    game.load.image('player1_gameover', 'assets/z1_icon_grilled.gif');
    game.load.image('player2_gameover', 'assets/z2_icon_grilled.gif');
    game.load.spritesheet('meat', 'assets/meat.gif', assets.meat.w, assets.meat.h);

}

var groundHeight = 64;
var scrollSpeed = 3;
var maxFuelAmount = 500;
var refillFuelAmount = 200;

var player1, player2;
var collidables;
var bg, groundFront, groundBack, groundCollidable;

var gameTimer;
var difficultyLevel = 0;

var lionTimer;
var lionsRunning;
var lionsJumping;

var fuelTimer;
var fuels;

var goat, pole;
var goatTimer;

var fuelBar1, fuelBar2;
var scoreCounter1, scoreCounter2;

var controlKeys1 = {};
var controlKeys2 = {};

var emitter;

var spawnSettings = {
    lionInterval: {
        min: 7000,
        max: 9000
    },
    lionGroupChance: 0,
    lionJumpingSpawn: 2,
    lionJumpingChance: 1,
    goatInterval: {
        min: 20000,
        max: 25000
    }
}

function Player(fuel, fireSprite, sprite) {
    this.fuel = fuel;
    this.score = 0;

    this.fireSprite = fireSprite;
    this.fireSprite.scale.setTo(0.6, 0.6);
    this.fireSprite.animations.add('fire');
    this.fireSprite.animations.play('fire', 16, true, false);

    this.sprite = sprite;
    this.sprite.scale.setTo(0.6, 0.6);
    this.sprite.animations.add('idle');
    this.sprite.animations.play('idle', 8, true, false);

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

function createScoreCounters() {
    scoreCounter1 = game.add.text(120, 18, 'Score: ' + player1.score);
    scoreCounter1.font = fontName;
    scoreCounter1.fontSize = 16;
    scoreCounter1.fill = '#78686F';

    scoreCounter2 = game.add.text(game.world.width - 244, 18, 'Score: ' + player2.score);
    scoreCounter2.font = fontName;
    scoreCounter2.fontSize = 16;
    scoreCounter2.fill = '#78686F';
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
    player1 = new Player(
        maxFuelAmount,
        game.add.sprite(100, game.world.height - groundHeight - assets.player.h, 'fire1'),
        game.add.sprite(100, game.world.height - groundHeight - assets.player.h, 'player1'));
    player2 = new Player(
        maxFuelAmount, 
        game.add.sprite(200, game.world.height - groundHeight - assets.player.h, 'fire2'),
        game.add.sprite(200, game.world.height - groundHeight - assets.player.h, 'player2'));

    // Init other game objects
    gameTimer = game.time.create(this);
    renewGameTimer();

    lionsRunning = game.add.physicsGroup();
    lionsJumping = game.add.physicsGroup();
    lionTimer = game.time.create(false);
    renewLionTimer();

    fuels = game.add.physicsGroup();
    fuelTimer = game.time.create(false);
    renewFuelTimer();

    goatTimer = game.time.create(false);
    renewGopTimer();

    game.add.sprite(0, 5, 'player1_label');
    game.add.sprite(game.world.width - 256, 5, 'player2_label');

    fuelBar1 = game.add.sprite(81, 50, 'fuel_bar');
    fuelBar1.scale.setTo(160, 1);
    fuelBar2 = game.add.sprite(game.world.width - 85, 50, 'fuel_bar');
    fuelBar2.scale.setTo(-160, 1);


    controlKeys1.up = game.input.keyboard.addKey(Phaser.Keyboard.W);
    controlKeys1.left = game.input.keyboard.addKey(Phaser.Keyboard.A);
    controlKeys1.right = game.input.keyboard.addKey(Phaser.Keyboard.D);

    controlKeys2.up = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    controlKeys2.left = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    controlKeys2.right = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    emitter = game.add.emitter(0, 0, 100);

    emitter.makeParticles('meat', 0, 100, true, false);
    emitter.gravity = 500;
    emitter.bounce.setTo(0.5, 0.5);

}

function renewGameTimer() {
    difficultyLevel++;
    gameTimer.add(10000, renewGameTimer, this);
    if (gameTimer.running) {
        // Update every 10s
        scrollSpeed += 0.4;
        if (scrollSpeed > 10) {
            scrollSpeed = 10;
        }
        if (spawnSettings.lionGroupChance < 7) {
            spawnSettings.lionGroupChance++;
        }

        // Update every 20s
        if (difficultyLevel % 2 == 0) {
            if (spawnSettings.lionJumpingSpawn < 5) {
                spawnSettings.lionJumpingSpawn++;
            }
        } else {
            if (spawnSettings.lionInterval.min > 1000) {
                spawnSettings.lionInterval.min -= 1000;
                spawnSettings.lionInterval.max -= 1000;
            }
            if (spawnSettings.goatInterval.min > 15000) {
                spawnSettings.goatInterval.min -= 1000;
                spawnSettings.goatInterval.max -= 1000;
            }
        }

        // Update every 40s
        if (difficultyLevel % 4 == 0) {
            if (spawnSettings.lionJumpingChance < 5) {
                spawnSettings.lionJumpingChance++;
            }
        }
    } else {
        gameTimer.start();
    }
}

function renewLionTimer() {
    // Only spawn more lions if there are no more pending lions
    if (lionTimer.length <= 1) {
        if (game.rnd.integerInRange(0, 10) < spawnSettings.lionGroupChance) {
            // Small chance for lions to spawn in tight groups (2-5 including the current lion)
            for (var i = 0, groupSize = game.rnd.integerInRange(1, 4); i < groupSize; i++) {
                lionTimer.add(500 * (i + 1), renewLionTimer, this);
            }
            // Add a "regular" spawn after the group so groups don't chain together
            lionTimer.add(game.rnd.integerInRange(
                spawnSettings.lionInterval.min + groupSize * 500, 
                spawnSettings.lionInterval.max + groupSize * 500), 
                renewLionTimer, this);
        } else {
            // Spawn lion at random intervals
            lionTimer.add(game.rnd.integerInRange(spawnSettings.lionInterval.min, spawnSettings.lionInterval.max), renewLionTimer, this);
        }
    }
    
    if (lionTimer.running) {
        // Add new lion
        if (game.rnd.integerInRange(0, 10) > spawnSettings.lionJumpingSpawn) {
            var lion = lionsRunning.create(game.world.width, game.world.height - groundHeight - assets.lion_run.h - 10, 'lion_run');
            lion.body.allowGravity = false;
            lion.animations.add('run');
            lion.animations.play('run', 8, true, false);
        } else {
            var lion = lionsJumping.create(game.world.width, game.world.height - groundHeight - assets.lion_jump.h - 10, 'lion_jump');
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

function renewGopTimer() {
    goatTimer.add(game.rnd.integerInRange(spawnSettings.goatInterval.min, spawnSettings.goatInterval.max), renewGopTimer, this);

    if (goatTimer.running) {
        goat = game.add.sprite(game.world.width, game.world.height - groundHeight - assets.pole.h - assets.goat.h, 'goat');
        pole = game.add.sprite(game.world.width + 23, game.world.height - groundHeight - assets.pole.h, 'pole');
        game.physics.arcade.enable(goat);
        game.physics.arcade.enable(pole);
        goat.body.allowGravity = false;
        pole.body.allowGravity = false;
        goat.animations.add('idle');
        goat.animations.play('idle', 8, true, false);
    } else {
        goatTimer.start();
    }
}

function updateMeat(meat, ground) {

    // meat.frame++;
    // meat.x -= scrollSpeed;

    // if ( meat.y + meat.height > game.world.height - groundHeight )
    //     meat.y = groundHeight - meat.height;
    

}

function update() {

    // Scroll the environment
    groundFront.tilePosition.x -= scrollSpeed;
    groundBack.tilePosition.x -= scrollSpeed;

    // Check collisions between jumping lions and the ground
    game.physics.arcade.collide(groundCollidable, lionsJumping);
    game.physics.arcade.collide(emitter, groundCollidable, updateMeat, null, this);

    lionsRunning.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed + 3;
    });
    lionsJumping.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed;

        // Small chance to jump up every sprite loop
        var currentAnim = lion.animations.currentAnim;
        if (currentAnim.frame == 3 && !currentAnim.paused && game.rnd.integerInRange(0, 10) < spawnSettings.lionJumpingChance) {
            currentAnim.paused = true;
            lion.body.velocity.y = -game.rnd.integerInRange(500, 900);
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

    if (goat != null && goat.alive) {
        goat.body.position.x -= scrollSpeed;
        if (goat.body.position.x + goat.width < 0) {
            goat.kill();
        }
    }
    
    if (pole != null && pole.alive) {
        pole.body.position.x -= scrollSpeed;
        if (pole.body.position.x + pole.width < 0) {
            pole.kill();
        }
    }


    // Collision integerInRange players; disable for now
    game.physics.arcade.collide(player1.sprite, player2.sprite);

    if (player1.sprite.alive) {
        updatePlayer(player1, controlKeys1);
        fuelBar1.scale.setTo(player1.fuel * 160 / maxFuelAmount, 1);
        if (scoreCounter1 != null) {
            scoreCounter1.text = 'Score: ' + Math.floor(player1.score);
        }
    }
    if (player2.sprite.alive) {
        updatePlayer(player2, controlKeys2);
        fuelBar2.scale.setTo(- player2.fuel * 160 / maxFuelAmount, 1);
        if (scoreCounter2 != null) {
            scoreCounter2.text = 'Score: ' + Math.floor(player2.score);    
        }
    }
}

function updatePlayer(player, controlKeys) {

    player.score += scrollSpeed / 100;

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

    player.fireSprite.visible = false;

    // Fire rocket
    // Don't allow flying if something is on top of the player
    if (controlKeys.up.isDown && player.fuel > 0 && !playerSprite.body.touching.up) {
        isRocketFired = true;

        player.fireSprite.visible = true;

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

    player.fireSprite.position = position;
    player.fireSprite.rotation = playerSprite.rotation;

    // Check if player is in contact with a lion
    game.physics.arcade.overlap(playerSprite, lionsRunning, playerDeath, null, this);
    game.physics.arcade.overlap(playerSprite, lionsJumping, playerDeath, null, this);

    // Fuel collection
    game.physics.arcade.overlap(playerSprite, fuels, collectFuel, null, this);

    // Goat collection
    game.physics.arcade.overlap(playerSprite, goat, collectGoat, null, this);

    // Meat collection
    game.physics.arcade.collide(playerSprite, emitter, collectMeat, null, this);

    function playerDeath(playerSprite, lion) {

        playerSprite.kill();
        player.fireSprite.kill();

        emitter.x = playerSprite.x;
        emitter.y = playerSprite.y;

        emitter.start(true, 8000, 0, 8, 20);

        if ( playerSprite === player1.sprite ){
            // game.add.text(120, 18, 'GRILLED');
            game.add.sprite(12, 12, 'player2_gameover');
        }

        if ( playerSprite === player2.sprite ){
            // game.add.text(120, 18, 'GRILLED');
            game.add.sprite(game.world.width - 54 - 12, 12, 'player1_gameover');
        }

    }

    function collectFuel(playerSprite, fuel) {
        fuel.kill();
        player.addFuel();
        player.score += 10;
    }

    function collectGoat(playerSprite, goat) {
        goat.kill();
        player.score += 50;
    }

    function collectMeat(playerSprite, meat) {
        meat.kill();
        player.score += 10;
    }
}

function render() {
    // Debugging displays
    // game.debug.bodyInfo(player1.sprite, 0, 100);
    // game.debug.bodyInfo(player2.sprite, 0, 250);
    game.debug.text('next lion in: ' + lionTimer.duration.toFixed(0), 16, 100);
    game.debug.text('next fuel box in: ' + fuelTimer.duration.toFixed(0), 16, 150);
    game.debug.text('next goat in: ' + goatTimer.duration.toFixed(0), 16, 200);
    game.debug.text('next difficulty in: ' + gameTimer.duration.toFixed(0), 16, 250);
}