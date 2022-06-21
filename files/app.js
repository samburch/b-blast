const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

let x = canvas.width / 2
let y = canvas.height / 2

const d = new Date()

const scoreTotal = document.getElementById('score')
const highestScore = document.getElementById('highScore')
const newHighScore = document.getElementById('newHighScore')
const pointsTotal = document.getElementById('pointsTotal')
const startGame = document.getElementById('startGameBtn')
const modal = document.getElementById('modal')

// Game settings
let settings = {
    bulletSpeed: 5,
    difficulty: null
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(
            this.x, 
            this.y, 
            this.radius, 
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(
            this.x, 
            this.y, 
            this.radius, 
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        // Move the project in the direction of the click event
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }

}

class Enemy {
    constructor(x, y, radius, color, velocity, id) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.id = id
    }

    draw() {
        c.beginPath()
        c.arc(
            this.x, 
            this.y, 
            this.radius, 
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        // Move the project in the direction of the click event
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }

}

const friction = 0.98
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(
            this.x, 
            this.y, 
            this.radius, 
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }

}

let player = new Player(x, y, 10, 'white')
let projectiles = []
let enemies = []
let particles = []

// Initialise game and reset all arrays and initial values
const init = () => {

    player = new Player(x, y, 10, 'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreTotal.innerHTML = score
    pointsTotal.innerHTML = score
    newHighScore.innerHTML = ''
    settings.difficulty = 1000

}

// Create enemies
const spawnEnemies = () => {

    setInterval(() => {

        // Setup new randomised enemy attributtes
        const radius = Math.random() * (50 - 5) + 5
        let x
        let y

        // Get a random spawn position for X and Y based on flip of a coin
        if (Math.random() < 0.5) {
            // Set X randomly to start left or right of screen
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            // Randomise height based on canvas
            y = Math.random() * canvas.height
        }

        // Do the same but for Y
        else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        // Get the angle (radian) TO the centre of the screen
        const angle = Math.atan2(
            // Start from the centre then subtract X & Y pos of enemy in order to move toward player in the centre
            canvas.height / 2 - y, 
            canvas.width / 2 - x
        )

        // Get the inverse sides of the angle in order to calculate projectile velocity
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        let id
        id = 1

        enemies.push(
            new Enemy(x, y, radius, color, velocity, id)
        )
    }, settings.difficulty)
}

/* GAME ANMIATION / LOOP */

let animationId
// Player score
let score = 0
// High score
let highScore = 0

const animate = () => {
    // Get next frame in loop
    animationId = requestAnimationFrame(animate)
    // Redraw the canvas after every frame to update animation
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    // Draw the objects in the canvas
    player.draw()

    // Draw particles if enemy hit
    particles.forEach((particle, index) => {
        // Remove particles if they're faded
        if (particle.alpha <= 0) {
            setTimeout(() => {
                particles.splice(index, 1)
            }, 0)
        } else {
            particle.update()
        }

    })

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update()

        // Remove projectiles if they float offscreen
        if (projectile.x + projectile.radius < 0 
            || projectile.x - projectile.radius > canvas.width
            || projectile.y + projectile.radius < 0
            || projectile.y - projectile.radius > canvas.width) {

            setTimeout(() => {
                projectiles.splice(projectileIndex, 1)
            }, 0)

        }

    })

    enemies.forEach((enemy, enemyIndex) => {
        console.log(enemy.id)
        enemy.update()

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        
        // Game over
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modal.style.display = 'flex'
            pointsTotal.innerHTML = score
            if (highScore < score) { 
                highScore = score
                newHighScore.innerHTML = 'New high score!'
            }
            highestScore.innerHTML = highScore
        }

        // Start checking distance between enemies and projectiles for collisions
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            // Check if a projectile has hit an enemy 
            if (dist - enemy.radius - projectile.radius < 1) {
                
                // Add particle effect where the hit took place
                for(let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 2,
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 8),
                            y: (Math.random() - 0.5) * (Math.random() * 8)
                        }
                    ))
                }

                // Reduce size of enemy if its big
                if (enemy.radius - 10 > 5) {
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    enemy.radius -= 5
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)

                        // Increase score by 10 on hit
                        score += 10
                        scoreTotal.innerHTML = score

                    }, 0)
                }

                else {

                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1)
                        projectiles.splice(projectileIndex, 1)

                        // Increase score by 100 on kill
                        score += 100
                        scoreTotal.innerHTML = score

                    }, 0)

                }
            }
        })

    })

}

/* EVENT LISTENERS */

window.addEventListener('click', (e) => {
    // Get the angle (radian) from the centre of the screen (player) and the client X click and Y click coordinates
    const angle = Math.atan2(
        e.clientY - canvas.height / 2, 
        e.clientX - canvas.width / 2
    )

    // Get the inverse sides of the angle in order to calculate projectile velocity
    const velocity = {
        x: Math.cos(angle) * settings.bulletSpeed,
        y: Math.sin(angle) * settings.bulletSpeed
    }

    projectiles.push(
        new Projectile(
            canvas.width / 2, 
            canvas.height / 2, 
            5, 
            'white', 
            velocity
        )
    )
})

startGame.addEventListener('click', () => {
    init()
    spawnEnemies()
    animate()
    modal.style.display = 'none'
    console.log(spawnEnemies)
});
