GrilledGame.Game = function(game) {};

var game;

GrilledGame.Game.prototype = {
    preload: function() {
        game = this;
    },
    create: create,
    update: update
};

var fontName = 'Share Tech Mono';

var fontReady = false;
var textCreated = false;

// http://phaser.io/examples/v2/text/google-webfonts
WebFontConfig = {
    active: function() {
        fontReady = true;
        if (game != null && game.state.created) {
            createText();    
        }
    },
    google: {
        families: [fontName]
    }
};

var groundHeight = 64;
var maxFuelAmount = 500;
var refillFuelAmount = 100;

var player1, player2;
var bg, groundFront, groundBack, groundCollidable;

var gameTimer;
var difficultyLevel = 0;
var scrollSpeed = 3;

var lionTimer;
var lionsRunning;
var lionsJumping;

var fuelTimer;
var fuels;

var goat, pole;
var goatTimer;

var meatTimer;
var meats;

var fuelBar1, fuelBar2;
var scoreCounter1, scoreCounter2;
var grilledText1, grilledText2;
var grilledOverlay1, grilledOverlay2;

var logo;
var title;
var keys1, keys2;

var controlKeys1 = {};
var controlKeys2 = {};
var startKey;

var emitter;

var spawnSettings;

function resetSpawnSettings() {
    spawnSettings = {
        lionInterval: {
            min: 7000,
            max: 9000
        },
        lionGroupSize: {
            min: 1,
            max: 3
        },
        lionJumpingSpawn: 2,
        lionJumpingChance: 1,
        lionJumpingHeight: 800,
        fuelInterval: {
            min: 7000,
            max: 10000
        },
        meatInterval: {
            min: 1000,
            max: 5000
        },
        goatInterval: {
            min: 20000,
            max: 25000
        }
    }
}

function Player(fireSprite, sprite) {
    this.fuel = maxFuelAmount;
    this.score = 0;
    this.goatPower = false;

    this.fireSprite = fireSprite;
    this.fireSprite.scale.setTo(0.6, 0.6);
    this.fireSprite.animations.add('fire');
    this.fireSprite.animations.play('fire', 16, true, false);

    this.sprite = sprite;
    this.sprite.scale.setTo(0.6, 0.6);
    this.sprite.animations.add('idle', [0, 1, 2, 3], 8, true);
    this.sprite.animations.add('goat', [4, 5, 6, 7], 8, true);
    this.sprite.animations.add('goat_up', [6, 8], 8, true);
    this.sprite.animations.add('goat_down', [7, 9], 8, true);
    this.sprite.animations.play('idle');

    game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
    this.sprite.body.gravity.y = 1500;

    this.addFuel = function() {
        this.fuel += refillFuelAmount;
        if (this.fuel > maxFuelAmount) {
            this.fuel = maxFuelAmount;
        }
    }

    this.revive = function(x, y) {
        this.sprite.revive();
        this.fuel = maxFuelAmount;
        this.score = 0;
        this.sprite.body.position.setTo(x, y);
        this.sprite.body.velocity.setTo(0, 0);
    }

    this.startGoatPower = function() {
        this.goatPower = true;
        game.time.events.add(10000, function() {
            this.goatPower = false;
        }, this);
    }
}

function create() {
    console.log("Game created");

    game.physics.startSystem(Phaser.Physics.ARCADE);

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
        game.add.sprite(100, -200, 'fire1'),
        game.add.sprite(100, -200, 'player1'));
    player2 = new Player(
        game.add.sprite(200, -200, 'fire2'),
        game.add.sprite(200, -200, 'player2'));

    // Draw logo
    logo = game.add.sprite(this.world.width / 2, 180, 'logo');
    logo.anchor.setTo(0.5, 0.5);
    logo.scale.setTo(1.5, 1.5);

    // Init other game objects
    resetSpawnSettings();

    gameTimer = game.time.create(this);

    lionsRunning = game.add.physicsGroup();
    lionsJumping = game.add.physicsGroup();
    lionTimer = game.time.create(false);

    fuels = game.add.physicsGroup();
    fuelTimer = game.time.create(false);

    meats = game.add.physicsGroup();
    meatTimer = game.time.create(false);

    goatTimer = game.time.create(false);

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

    startKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    emitter = game.add.emitter(0, 0, 100);

    emitter.makeParticles('meat', 0, 100, true, false);
    emitter.gravity = 1500;
    emitter.bounce.setTo(0.5, 0.5);

    emitter.minRotation = 0;
    emitter.maxRotation = 0;
    emitter.setXSpeed(-350, 350);
    emitter.setYSpeed(-600, -300);

    grilledOverlay1 = game.add.sprite(12, 12, 'player1_gameover');
    grilledOverlay1.visible = false;
    grilledOverlay2 = game.add.sprite(game.world.width - 54 - 12, 12, 'player2_gameover');
    grilledOverlay2.visible = false;

    if (fontReady) {
        createText();
    } else {
        // Add delay to wait for font to load
        game.time.events.add(500, function() {
            // If font could not be retrieved, just use the default font
            if (!textCreated) {
                fontName = '';
                createText();
            }
        }, this);
    }
}

function createText() {
    if (player1 != null) {
        scoreCounter1 = game.add.text(120, 18, 'Score: ' + player1.score);
        scoreCounter1.font = fontName;
        scoreCounter1.fontSize = 16;
        scoreCounter1.fill = '#78686F';
    }

    if (player2 != null) {
        scoreCounter2 = game.add.text(game.world.width - 244, 18, 'Score: ' + player2.score);
        scoreCounter2.font = fontName;
        scoreCounter2.fontSize = 16;
        scoreCounter2.fill = '#78686F';
    }
    
    title = game.add.text(game.world.width / 2, 300, 'Press SPACE to begin!');
    title.anchor.setTo(0.5, 0.5);
    title.font = fontName;
    title.fontSize = 48;
    title.stroke = '#78686F';
    title.strokeThickness = 4;
    title.fill = '#FFFFFF';

    grilledText1 = game.add.text(128, 47, 'GRILLED');
    grilledText1.font = fontName;
    grilledText1.fontSize = 16;
    grilledText1.fill = '#78686F';
    grilledText1.visible = false;
    grilledText2 = game.add.text(game.world.width - 194, 47, 'GRILLED');
    grilledText2.font = fontName;
    grilledText2.fontSize = 16;
    grilledText2.fill = '#78686F';
    grilledText2.visible = false;

    keys1 = game.add.sprite(game.world.width / 3, 400, 'keys1');
    keys1.anchor.setTo(0.5, 0.5);
    keys1.animations.add('keys');
    keys1.animations.play('keys', 2, true, false);
    keys2 = game.add.sprite(game.world.width * 2 / 3, 400, 'keys2');
    keys2.anchor.setTo(0.5, 0.5);
    keys2.animations.add('keys');
    keys2.animations.play('keys', 2, true, false);

    textCreated = true;
}

function update() {
    if (startKey.isDown && !gameTimer.running) {
        startGame();
    }
    
    updateEnvironment();    

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

    if (!player1.sprite.alive && !player2.sprite.alive) {
        gameOver();
    }
}

function startGame() {
    if (!textCreated) return;

    logo.visible = false;
    title.visible = false;
    keys1.visible = false;
    keys2.visible = false;

    renewGameTimer();
    spawnLion();
    spawnFuel();
    spawnMeat();
    spawnGoat();

    // Restarting the game
    if (!player1.sprite.alive && !player2.sprite.alive) {
        player1.revive(100, 0);
        player2.revive(200, 0);

        difficultyLevel = 0;
        scrollSpeed = 3;

        grilledText1.visible = false;
        grilledText2.visible = false;

        grilledOverlay1.visible = false;
        grilledOverlay2.visible = false;

        lionsRunning.forEach(function(lion) {
            lion.kill();
        });
        lionsJumping.forEach(function(lion) {
            lion.kill();
        });
        fuels.forEach(function(fuel) {
            fuel.kill();
        });
        meats.forEach(function(meat) {
            meat.kill();
        });
        if (goat != null) {
            goat.kill();
        }
        if (pole != null) {
            pole.kill();
        }
        if (emitter != null) {
            emitter.forEach(function(particle) {
                particle.kill();
            });
        }
    }
}

function gameOver() {
    logo.visible = true;
    title.text = 'Game Over! Press SPACE to restart'
    title.visible = true;
    keys1.visible = true;
    keys2.visible = true;

    resetSpawnSettings();
    gameTimer.stop();
    lionTimer.stop();
    fuelTimer.stop();
    meatTimer.stop();
    goatTimer.stop();
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
        if (spawnSettings.lionGroupSize.max < 7) {
            spawnSettings.lionGroupSize.max++;
        }

        // Update every 20s
        if (difficultyLevel % 2 == 0) {
            if (spawnSettings.lionJumpingSpawn < 5) {
                spawnSettings.lionJumpingSpawn++;
            }
            if (spawnSettings.fuelInterval.min > 3000) {
                spawnSettings.fuelInterval.min -= 1000;
                spawnSettings.fuelInterval.max -= 1000;
            }
        } else {
            if (spawnSettings.lionInterval.min > 2000) {
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
            if (spawnSettings.lionJumpingHeight < 1200) {
                spawnSettings.lionJumpingHeight += 100;
            }
        }
    } else {
        gameTimer.start();
    }
}

function spawnLion() {
    lionTimer.add(game.rnd.integerInRange(spawnSettings.lionInterval.min, spawnSettings.lionInterval.max), spawnLion, this);
    
    if (lionTimer.running) {
        // Spawn clusters
        for (var i = 0, groupSize = game.rnd.integerInRange(spawnSettings.lionGroupSize.min, spawnSettings.lionGroupSize.max); i < groupSize; i++) {
            if (game.rnd.integerInRange(0, 10) > spawnSettings.lionJumpingSpawn) {
                var lion = lionsRunning.create(game.world.width + i * 100, game.world.height - groundHeight - assets.lion_run.h - 10, 'lion_run');
                lion.body.allowGravity = false;
                lion.animations.add('run');
                lion.animations.play('run', 8, true, false);
            } else {
                var lion = lionsJumping.create(game.world.width + i * 100, game.world.height - groundHeight - assets.lion_jump.h - 10, 'lion_jump');
                lion.body.gravity.y = 1500;
                lion.animations.add('jump');
                lion.animations.play('jump', 8, true, false);
            }
        }
    } else {
        lionTimer.start();
    }
}

function spawnFuel() {
    fuelTimer.add(game.rnd.integerInRange(spawnSettings.fuelInterval.min, spawnSettings.fuelInterval.max), spawnFuel, this);

    if (fuelTimer.running) {
        var fuelBox = fuels.create(game.world.width, game.rnd.integerInRange(0, 400), 'fuel');
        fuelBox.body.allowGravity = false;
        fuelBox.animations.add('idle');
        fuelBox.animations.play('idle', 8, true, false);
    } else {
        fuelTimer.start();
    }
}

function spawnMeat() {
    meatTimer.add(game.rnd.integerInRange(spawnSettings.meatInterval.min, spawnSettings.meatInterval.max), spawnMeat, this);

    if (meatTimer.running) {
        // Spawn cluster of 2-8
        var bottom = game.world.height - groundHeight - assets.meat.h;
        for (var i = 0, 
            groupSize = game.rnd.integerInRange(2, 8), 
            height = game.rnd.integerInRange(0, bottom),
            direction = game.rnd.integerInRange(-1, 1); 
            i < groupSize; i++) {
            var realHeight = height + direction * i * 20;
            if (realHeight < 0) {
                realHeight = 0;
            } else if (realHeight > bottom) {
                realHeight = bottom;
            }
            var meat = meats.create(game.world.width + i * 50, realHeight, 'meat');
            meat.body.allowGravity = false;
            meat.animations.add('idle');
            meat.animations.play('idle', 8, true, false);
        }
    } else {
        meatTimer.start();
    }
}

function spawnGoat() {
    goatTimer.add(game.rnd.integerInRange(spawnSettings.goatInterval.min, spawnSettings.goatInterval.max), spawnGoat, this);

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

function updateEnvironment() {
    // Scroll the environment
    groundFront.tilePosition.x -= scrollSpeed;
    groundBack.tilePosition.x -= scrollSpeed;

    // Ground collision for game objects
    game.physics.arcade.collide(groundCollidable, lionsJumping);
    game.physics.arcade.collide(emitter, groundCollidable);

    lionsRunning.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed + 3;
    });
    lionsJumping.forEach(function(lion) {
        lion.body.position.x -= scrollSpeed;

        // Small chance to jump up every sprite loop
        var currentAnim = lion.animations.currentAnim;
        if (currentAnim.frame == 3 && !currentAnim.paused && game.rnd.integerInRange(0, 10) < spawnSettings.lionJumpingChance) {
            currentAnim.paused = true;
            lion.body.velocity.y = -game.rnd.integerInRange(500, spawnSettings.lionJumpingHeight);
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

    meats.forEach(function(meat) {
        meat.body.position.x -= scrollSpeed;
    });

    if (meats.children.length > 0) {
        var firstChild = meats.getChildAt(0);
        if (firstChild.body.position.x + firstChild.width < 0) {
            firstChild.kill();
            meats.removeChild(firstChild);
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
}

function updatePlayer(player, controlKeys) {
    if (gameTimer.running) {
        player.score += scrollSpeed / 50;
    }

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

        if (gameTimer.running) {
            player.fuel--;    
        }

        // Pause animation when accelerating upwards
        if (player.goatPower) {
            if (currentAnim.name != 'goat_up' || currentAnim.isFinished) {
                playerSprite.animations.stop();
                playerSprite.animations.play('goat_up');
            }
        } else {    
            if (!currentAnim.isFinished) {
                playerSprite.animations.stop();
            }
            playerSprite.frame = 2;
        }
        
    }

    // Player is on the ground/standing on something else
    if (playerSprite.body.touching.down) {
        playerSprite.animations.play(player.goatPower ? 'goat' : 'idle');
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
            if (player.goatPower) {
                if (currentAnim.name != 'goat_down' || currentAnim.isFinished) {
                    playerSprite.animations.stop();
                    playerSprite.animations.play('goat_down');
                }
            } else {
                if (!currentAnim.isFinished) {
                    playerSprite.animations.stop();
                }
                playerSprite.frame = 3;
            }
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
    game.physics.arcade.overlap(playerSprite, lionsRunning, hitLion, null, this);
    game.physics.arcade.overlap(playerSprite, lionsJumping, hitLion, null, this);

    // Fuel collection
    game.physics.arcade.overlap(playerSprite, fuels, collectFuel, null, this);

    // Goat collection
    game.physics.arcade.overlap(playerSprite, goat, collectGoat, null, this);

    // Meat collection
    game.physics.arcade.overlap(playerSprite, meats, collectMeat, null, this);
    game.physics.arcade.overlap(playerSprite, emitter, collectMeat, null, this);

    function hitLion(playerSprite, lion) {
        if (player.goatPower) {
            lion.kill();

            emitter.x = lion.x;
            emitter.y = lion.y;
            emitter.start(true, 8000, 3, 3);

            emitter.forEach(function(meat) {
                meat.animations.add('spin');
                meat.animations.play('spin', 8, true, false);
            });
        } else {
            playerDeath(playerSprite, lion);
        }
    }

    function playerDeath(playerSprite, lion) {

        playerSprite.kill();
        player.fireSprite.kill();

        emitter.x = playerSprite.x;
        emitter.y = playerSprite.y;

        emitter.start(true, 8000, 8, 8);

        emitter.forEach(function(meat) {
            meat.animations.add('spin');
            meat.animations.play('spin', 8, true, false);

        });

        if (playerSprite === player1.sprite) {
            grilledText1.visible = true;
            grilledOverlay1.visible = true;
        }

        if (playerSprite === player2.sprite) {
            grilledText2.visible = true;
            grilledOverlay2.visible = true;
        }

    }

    function collectFuel(playerSprite, fuel) {
        fuel.kill();
        player.addFuel();
        player.score += 20;
    }

    function collectGoat(playerSprite, goat) {
        goat.kill();
        player.score += 50;
        player.startGoatPower();
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
    // game.debug.text('next lion in: ' + lionTimer.duration.toFixed(0), 16, 100);
    // game.debug.text('next fuel box in: ' + fuelTimer.duration.toFixed(0), 16, 150);
    // game.debug.text('next goat in: ' + goatTimer.duration.toFixed(0), 16, 200);
    // game.debug.text('next meat in: ' + meatTimer.duration.toFixed(0), 16, 250)
    // game.debug.text('next difficulty in: ' + gameTimer.duration.toFixed(0), 16, 300);
}