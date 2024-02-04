let gameRunning = true

class Debug {
    static randomColor() {
        return `#${new Array(6).fill(0).map(n => Math.round(Math.random() * 9)).join('')}`
    }
}
// console.log(Debug.randomColor())

class GameObject {
    /**
     * 
     * @param {float} x 
     * @param {float} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    draw() {

    }
}

class FigureGameObject extends GameObject {
    constructor(x, y, color, width, height) {
        super(x, y)
        this.color = color
        this.width = width
        this.height = height

        this.destroyed = false
    }
}

class Direction {
    static UP = new Direction('UP')
    static DOWN = new Direction('DOWN')
    static LEFT = new Direction('LEFT')
    static RIGHT = new Direction('RIGHT')

    constructor(direction) {
        this.direction = direction;
    }

    /**
     * 
     * @param {Direction} otherDirection 
     */
    equals(otherDirection) {
        return this.direction === otherDirection.direction;
    }
}

class Bullet extends FigureGameObject {
    /**
     * 
     * @param {String} color 
     * @param {int} width
     * @param {int} height
     * @param {GameObject} shooter
     * @param {Direction} direction
     */
    constructor(color, width, height, shooter, direction) {
        super(shooter.x, shooter.y)
        this.shooter = shooter
        this.color = color;
        this.direction = direction
        this.width = width
        this.height = height
    }
}


class Cannon extends FigureGameObject {

    static horizontalVelocity = 20

    static clamp(min, value, max) {
        if (value < min) return min
        if (value > max) return max
        return value
    }
}

class Bunker extends FigureGameObject {
    static color = '#aaa'
    static width = 3
    static height = 3
    static separation = 100
    static yOffset = 400
    static partWidth = 10
    static partHeight = 10
}

class AlienType {
    static WEAK = 'WEAK'
    static STRONG = 'STRONG'
    static BOSS = 'BOSS'
}

class Alien extends FigureGameObject {

    /**
     * 
     * @param {AlienType} alienType 
     */
    constructor(x, y, color, width, height, alienType) {
        super(x, y, color, width, height)
        this.alienType = alienType
    }

    static horizontalSpeed = 0.5
    static xBoundary = 30

}

document.addEventListener('DOMContentLoaded', function (e) {
    window.requestAnimationFrame(gameLoop);

    let canvas;

    /**
     * @type {CanvasRenderingContext2d}
     */
    let context;

    let bunkers =
        new Array(4).fill(null).map(
            (bunker, i) => new Array(3).fill(null).map(
                (bunkerRow, j) => new Array(3).fill(null).map(
                    (bunkerPart, k) => new Bunker(i * Bunker.separation + (Bunker.partWidth * j), Bunker.yOffset + k * Bunker.partHeight, Bunker.color, Bunker.partWidth, Bunker.partHeight)
                )
            )
        );


    /**
     * @type {Bullet[]}
     */
    let bullets = []

    let aliens = [
        ...new Array(2).fill(0).map((_, i) => new Array(11).fill(0).map((_, j) => new Alien(j * 30, i * 30, '#ff0000', 20, 20, AlienType.STRONG))),
        ...new Array(3).fill(0).map((_, i) => new Array(11).fill(0).map((_, j) => new Alien(j * 30, i * 30 + 60, '#00ff00', 20, 20, AlienType.WEAK)))
    ]

    // console.table(aliens)

    let keyPressed = null;
    let player = null
    let alienAttackInterval = null
    let alienDirection = Direction.RIGHT


    window.onload = init;
    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 37) keyPressed = 'LEFT'
        if (e.keyCode === 39) keyPressed = 'RIGHT'
        if (e.keyCode === 32) keyPressed = 'SPACEBAR'
        if (e.keyCode === 13) keyPressed = 'ENTER'
    })

    function init() {
        canvas = document.getElementById('canvas')
        context = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        player = new Cannon(0, canvas.height - 300, '#666666', 20, 20);
        // console.log(canvas)

        // alienAttackInterval = setInterval(alienAttack, 1000)

        window.requestAnimationFrame(gameLoop);
    }

    function gameLoop(event) {
        // console.log(keyPressed)

        // console.log(Math.sin(event / 3))

        if (!gameRunning) return

        moveAliens()

        processInput();

        checkCollision()

        draw();

        clearObjectsOffScreen();

        requestAnimationFrame(gameLoop);
    }

    function alienAttack() {
        console.log('attack')

        for (let i = 0; i < aliens.length; i++) {
            const alienRow = aliens[4];

            if (i != 4) continue

            let randomAlien = alienRow[Math.round(Math.random() * (alienRow.length - 1
            ))]

            let b = new Bullet('#123456', 1, 6, randomAlien, Direction.DOWN)
            bullets.push(b)
        }
    }

    function moveAliens() {
        let leftmostAlienX = null, rightmostAlienX = null

        for (let i = 0; i < aliens.length; i++) {
            const alienRow = aliens[i];

            for (let j = 0; j < alienRow.length; j++) {
                const alien = alienRow[j];


                if (j === 0) leftmostAlienX = alien.x
                if (j === alienRow.length - 1) rightmostAlienX = alien.x

                if (rightmostAlienX > canvas.width - Alien.xBoundary) {
                    alienDirection = Direction.LEFT
                }

                if (leftmostAlienX < Alien.xBoundary) {
                    alienDirection = Direction.RIGHT
                }

                if (alienDirection.equals(Direction.RIGHT)) {
                    alien.x += Alien.horizontalSpeed;


                } else {
                    alien.x -= Alien.horizontalSpeed


                }
            }
        }
    }


    function checkCollision() {
        if (bullets.length === 0) return


        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (bullet.destroyed) continue;
            for (let i = 0; i < bunkers.length; i++) {
                const bunker = bunkers[i];
                for (let j = 0; j < bunker.length; j++) {
                    const bunkerRow = bunker[j];
                    for (let k = 0; k < bunkerRow.length; k++) {
                        const bunkerPart = bunkerRow[k];

                        if (bunkerPart.destroyed) continue

                        if ((bullet.x + bullet.width >= bunkerPart.x && bunkerPart.x >= bullet.x)) {


                            if (bullet.direction.equals(Direction.UP)) {

                                if (bullet.y <= bunkerPart.y) {
                                    bunkerPart.destroyed = true
                                    bullet.destroyed = true
                                    bullets.splice(i, 1)
                                    return
                                }
                            }

                            if (bullet.direction.equals(Direction.DOWN)) {

                                if (bullet.y >= bunkerPart.y) {

                                    bunkerPart.destroyed = true
                                    bullet.destroyed = true
                                    bullets.splice(i, 1)
                                    return
                                }
                            }
                        }
                    }
                }
            }

            for (let i = 0; i < aliens.length; i++) {
                const alienRow = aliens[i];
                for (let j = 0; j < alienRow.length; j++) {
                    const alien = alienRow[j];

                    if (alien.destroyed) continue
                    if (!bullet.direction.equals(Direction.UP)) continue

                    if ((bullet.x + bullet.width >= alien.x && alien.x >= bullet.x)) {

                        if (bullet.y <= alien.y) {

                            alien.destroyed = true
                            bullet.destroyed = true
                            bullets.splice(i, 1)
                            return
                        }
                    }

                    // TODO: la bala no se destruye al instante
                }
            }
        }

    }

    function clearObjectsOffScreen() {

        if (bullets.length === 0) return

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            if (bullet.y < 0) {
                bullets.splice(i, 1)
            }

            if (bullet.y > canvas.height) {
                bullets.splice(i, 1)
            }
        }
    }

    function processInput() {
        if (!keyPressed) return;

        switch (keyPressed) {
            case 'LEFT':
                player.x += -Cannon.horizontalVelocity;
                break;
            case 'RIGHT':
                player.x += +Cannon.horizontalVelocity;
                break;
            case 'SPACEBAR':
                let b = new Bullet('#000000', 2, 5, player, Direction.UP);
                bullets.push(b);
                break;
            case 'ENTER':
                gameRunning = !gameRunning
                break;
            default:
                break;
        }

        keyPressed = null;
    }

    function draw() {

        // resizeCanvas();
        // let randomColor = Math.random() > .5 ? '#8080ff' : '#923382'
        // context.fillStyle = randomColor;
        // context.fillRect(100, 50, 200, 175);

        // draw invaders
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#ff0000'
        let columnSpace = 30;
        let rowSpace = 30;

        for (let i = 0; i < aliens.length; i++) {
            const alienRow = aliens[i];

            for (let j = 0; j < alienRow.length; j++) {
                const alien = alienRow[j];

                let alienStyle = null

                switch (alien.alienType) {
                    case AlienType.WEAK:
                        alienStyle = '#ff0000'
                        break;
                    case AlienType.STRONG:
                        alienStyle = '#00ff00'
                        break;
                    case AlienType.BOSS:
                        alienStyle = '#0000ff'
                        break;

                    default:
                        break;
                }

                context.fillStyle = alienStyle

                // if (!alien.destroyed) context.fillRect(j * columnSpace, i * rowSpace, alien.width, alien.height);

                if (!alien.destroyed) context.fillRect(alien.x, alien.y, alien.width, alien.height);
            }
        }

        // draw bunkers
        context.fillStyle = '#aaaaaa'
        for (let i = 0; i < bunkers.length; i++) {
            const bunker = bunkers[i];

            for (let j = 0; j < bunker.length; j++) {
                const bunkerParts = bunker[j];
                for (let k = 0; k < bunkerParts.length; k++) {
                    const bunkerPart = bunkerParts[k];

                    context.fillStyle = bunkerPart.color
                    // if (bunkerPart) context.fillRect(i * 100  + (10 * j), 400 + k*10, 10, 10);

                    if (!bunkerPart.destroyed) context.fillRect(bunkerPart.x, bunkerPart.y, bunkerPart.width, bunkerPart.height);
                }
            }

        }

        // draw player
        context.fillStyle = player.color
        context.fillRect(player.x, player.y, player.width, player.height);


        // draw bullets
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];

            if (bullet.destroyed) continue

            let speed = 0

            if (bullet.direction.equals(Direction.UP)) {
                speed = -1
            } else {
                speed = 1
            }

            bullet.y += speed

            context.fillStyle = bullet.color
            context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
        }
    }
});

