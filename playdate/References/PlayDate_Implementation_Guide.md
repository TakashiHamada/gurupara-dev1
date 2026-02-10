# PlayDate Game Development Guide

Reference documentation for PlayDate game implementation patterns, extracted from official sample projects.

## Core Concepts

### Required Imports

```lua
import 'CoreLibs/sprites'
import 'CoreLibs/graphics'
import 'CoreLibs/object'    -- for class()
import 'CoreLibs/animator'  -- for animations
```

### Standard Shortcuts

```lua
local gfx = playdate.graphics
local geo = playdate.geometry
local snd = playdate.sound
```

---

## Project Structure

### Minimal Structure

```
Source/
  └─ main.lua
```

### Multi-file Structure (Recommended)

```
Source/
  ├─ main.lua           -- Entry point, game state management
  ├─ player.lua         -- Player class
  ├─ enemy.lua          -- Enemy class
  └─ ui/
      └─ score.lua      -- UI components
```

---

## Main Loop Pattern

### Minimal

```lua
import 'CoreLibs/sprites'
import 'CoreLibs/graphics'

local gfx = playdate.graphics

function playdate.update()
    gfx.sprite.update()
end
```

### With State Management

```lua
local STATE = { TITLE = 0, PLAYING = 1, GAME_OVER = 2 }
local gameState = STATE.TITLE
local ticks = 0

function playdate.update()
    ticks = ticks + 1

    if gameState == STATE.TITLE then
        updateTitle()
    elseif gameState == STATE.PLAYING then
        updateGame()
    elseif gameState == STATE.GAME_OVER then
        updateGameOver()
    end

    gfx.sprite.update()
end
```

---

## Sprite System

### Basic Sprite

```lua
local sprite = gfx.sprite.new()
sprite:setImage(gfx.image.new('path/to/image'))
sprite:moveTo(200, 120)
sprite:setZIndex(100)
sprite:add()
```

### Class-based Sprite

```lua
class('Player').extends(gfx.sprite)

function Player:init(x, y)
    Player.super.init(self)
    self:setImage(gfx.image.new('player'))
    self:moveTo(x, y)
    self:add()
end

function Player:update()
    -- Called every frame
end

function Player:draw()
    -- Custom drawing (optional)
end
```

### Z-Order Management

```lua
background:setZIndex(100)
enemies:setZIndex(500)
player:setZIndex(600)
ui:setZIndex(900)
```

---

## Input Handling

### Event-based (Recommended)

```lua
function playdate.leftButtonDown() end
function playdate.leftButtonUp() end
function playdate.rightButtonDown() end
function playdate.rightButtonUp() end
function playdate.upButtonDown() end
function playdate.upButtonUp() end
function playdate.downButtonDown() end
function playdate.downButtonUp() end
function playdate.AButtonDown() end
function playdate.AButtonUp() end
function playdate.BButtonDown() end
function playdate.BButtonUp() end
```

### Polling

```lua
function playdate.update()
    if playdate.buttonIsPressed(playdate.kButtonLeft) then
        player.x = player.x - 2
    end
    if playdate.buttonIsPressed(playdate.kButtonRight) then
        player.x = player.x + 2
    end
end
```

### Crank Input

```lua
function playdate.update()
    local change = playdate.getCrankChange()  -- delta: -180 to 180
    local position = playdate.getCrankPosition()  -- absolute: 0 to 360
end
```

### Accelerometer

```lua
playdate.startAccelerometer()

function playdate.update()
    local gx, gy = playdate.readAccelerometer()  -- range: -2 to 2
end
```

---

## Animation

### Frame-based Animation

```lua
local images = gfx.imagetable.new('sprites/player')
local frame = 1
local frameDelay = 4
local tick = 0

function updateAnimation()
    tick = tick + 1
    if tick >= frameDelay then
        tick = 0
        frame = frame % #images + 1
        sprite:setImage(images[frame])
    end
end
```

### Animator (Path-based)

```lua
import 'CoreLibs/animator'

local line = geo.lineSegment.new(0, 120, 400, 120)
local anim = gfx.animator.new(2000, line)  -- 2000ms duration

function playdate.update()
    local point = anim:currentValue()
    sprite:moveTo(point.x, point.y)
end
```

### Animator (Value-based)

```lua
local anim = gfx.animator.new(1000, 0, 240, playdate.easingFunctions.outBounce)

function playdate.update()
    sprite:moveTo(200, anim:currentValue())
end
```

### Easing Functions

```
linear
inQuad, outQuad, inOutQuad
inCubic, outCubic, inOutCubic
inQuart, outQuart, inOutQuart
inSine, outSine, inOutSine
inExpo, outExpo, inOutExpo
inCirc, outCirc, inOutCirc
inElastic, outElastic, inOutElastic
inBack, outBack, inOutBack
inBounce, outBounce, inOutBounce
```

---

## Collision Detection

### Using overlappingSprites

```lua
function player:update()
    local collisions = self:overlappingSprites()
    for i = 1, #collisions do
        self:handleCollision(collisions[i])
    end
end
```

### Using moveWithCollisions

```lua
function player:update()
    local targetX = self.x + self.dx
    local targetY = self.y + self.dy
    local actualX, actualY, collisions, count = self:moveWithCollisions(targetX, targetY)

    for i = 1, count do
        local col = collisions[i]
        -- col.other: the sprite we collided with
        -- col.normal: collision normal vector
        -- col.type: collision response type
    end
end
```

### Collision Response Types

```lua
function sprite:collisionResponse(other)
    return gfx.sprite.kCollisionTypeSlide    -- slide along surface
    return gfx.sprite.kCollisionTypeFreeze   -- stop at collision point
    return gfx.sprite.kCollisionTypeBounce   -- reflect velocity
    return gfx.sprite.kCollisionTypeOverlap  -- pass through (detect only)
end
```

### Set Collision Rect

```lua
sprite:setCollideRect(0, 0, width, height)
-- or relative to sprite bounds:
sprite:setCollideRect(sprite:getBoundsRect())
```

---

## Sound

### Sample Player

```lua
local sample = snd.sampleplayer.new('sounds/effect')
sample:play()
sample:setRate(1.5)    -- playback speed
sample:setVolume(0.8)  -- volume 0-1
```

### Synthesizer

```lua
local synth = snd.synth.new(snd.kWaveSawtooth)
synth:setADSR(0.1, 0.2, 0.5, 0.3)  -- attack, decay, sustain, release
synth:playNote(440)  -- frequency in Hz
synth:playMIDINote(60)  -- MIDI note number (60 = C4)
synth:noteOff()
```

### Wave Types

```
snd.kWaveSine
snd.kWaveSquare
snd.kWaveSawtooth
snd.kWaveTriangle
snd.kWaveNoise
```

---

## Graphics

### Drawing Primitives

```lua
gfx.drawLine(x1, y1, x2, y2)
gfx.drawRect(x, y, w, h)
gfx.fillRect(x, y, w, h)
gfx.drawCircleAtPoint(x, y, radius)
gfx.fillCircleAtPoint(x, y, radius)
gfx.drawPolygon(polygon)
gfx.fillPolygon(polygon)
```

### Image Operations

```lua
local img = gfx.image.new('path/to/image')
img:draw(x, y)
img:drawScaled(x, y, scale)
img:drawRotated(x, y, angle)

-- Effects
local blurred = img:blurredImage(radius, passes, ditherType)
```

### Draw Mode

```lua
gfx.setImageDrawMode(gfx.kDrawModeCopy)      -- normal
gfx.setImageDrawMode(gfx.kDrawModeInverted)  -- inverted
gfx.setImageDrawMode(gfx.kDrawModeXOR)       -- XOR blend
gfx.setImageDrawMode(gfx.kDrawModeFillWhite) -- white silhouette
gfx.setImageDrawMode(gfx.kDrawModeFillBlack) -- black silhouette
```

---

## System Features

### Display Settings

```lua
playdate.display.setRefreshRate(30)  -- default 50Hz
playdate.display.setScale(2)         -- pixel doubling
playdate.display.setInverted(true)   -- invert screen
```

### Pause Menu

```lua
function playdate.gameWillPause()
    local img = gfx.image.new(400, 240)
    -- draw menu content to img
    playdate.setMenuImage(img)
end
```

### File I/O

```lua
-- Write
local file = playdate.file.open('save.dat', playdate.file.kFileWrite)
file:write('data')
file:close()

-- Read
local file = playdate.file.open('save.dat', playdate.file.kFileRead)
local data = file:read(100)
file:close()
```

### Debug

```lua
playdate.drawFPS(0, 0)
print('debug message')
```

---

## Performance Tips

### Localize Functions

```lua
local sqrt = math.sqrt
local floor = math.floor
local sin, cos = math.sin, math.cos
```

### Optimize Sprite Updates

```lua
-- For many sprites, use always-redraw mode
gfx.sprite.setAlwaysRedraw(true)

-- Disable updates for static sprites
sprite:setUpdatesEnabled(false)
```

### Reduce Frame Rate for Heavy Scenes

```lua
playdate.display.setRefreshRate(30)
```

---

## Common Patterns

### Physics (Gravity + Bounce)

```lua
local gravity = 0.5
local bounce = 0.8
local friction = 0.99

function ball:update()
    self.dy = self.dy + gravity
    self.dx = self.dx * friction

    self.x = self.x + self.dx
    self.y = self.y + self.dy

    -- Floor collision
    if self.y > 220 then
        self.y = 220
        self.dy = -self.dy * bounce
    end

    self:moveTo(self.x, self.y)
end
```

### Scrolling Background

```lua
class('Background').extends(gfx.sprite)

function Background:init()
    Background.super.init(self)
    self.image = gfx.image.new('background')
    self.offset = 0
    self:setZIndex(0)
    self:add()
end

function Background:update()
    self.offset = (self.offset + 2) % 400
end

function Background:draw()
    self.image:draw(-self.offset, 0)
    self.image:draw(400 - self.offset, 0)
end
```

### Screen Shake

```lua
local shakeAmount = 0
local shakeDuration = 0

function shake(amount, duration)
    shakeAmount = amount
    shakeDuration = duration
end

function playdate.update()
    if shakeDuration > 0 then
        shakeDuration = shakeDuration - 1
        local dx = math.random(-shakeAmount, shakeAmount)
        local dy = math.random(-shakeAmount, shakeAmount)
        playdate.display.setOffset(dx, dy)
    else
        playdate.display.setOffset(0, 0)
    end
end
```

---

## Sample Projects Reference

| Project | Description | Key Techniques |
|---------|-------------|----------------|
| Asheteroids | Vector shooter | Polygon sprites, physics |
| FlippyFish | Flappy Bird clone | State machine, scrolling |
| Mode7Driver | Pseudo-3D racing | drawSampled(), perspective |
| Level 1-1 | Platformer | Tilemap, collision |
| DrumMachine | Music app | Sound synthesis |
| AccelerometerTest | Sensor demo | Accelerometer input |

### Single File Examples (Key Files)

- `crank.lua` - Crank input handling
- `balls.lua` - Multi-object physics
- `collisions.lua` - Collision detection patterns
- `animator.lua` - Animation system
- `sndtest.lua` - Audio playback
- `synth.lua` - Synthesizer with accelerometer
- `spritescaling.lua` - Dynamic sprite scaling
- `drawmode.lua` - Image draw modes
