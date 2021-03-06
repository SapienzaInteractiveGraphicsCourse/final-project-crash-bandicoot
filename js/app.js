
import * as KEYFRAMES from '../js/keyframes.js'
import * as LEVEL from '../js/level.js'
import * as THREE from '../build/three.module.js';

let inputAxis;
let physicsWorld;

let alive = true;
let respawning = false;

import { GLTFLoader } from '../libs/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from '../libs/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../libs/jsm/postprocessing/RenderPass.js';
import { BloomPass } from '../libs/jsm/postprocessing/BloomPass.js';
import { FilmPass } from '../libs/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from '../libs/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from '../libs/jsm/shaders/RGBShiftShader.js';

document.addEventListener("DOMContentLoaded", (event) => {
    Ammo().then(start);
});

let overlayMenuValues = {
    crateType: "wumpa",
    levelTheme: "templeruins",
    postProcessing: true,
    showCurve: false,
    fogAmount: 200,
    color: 0x000000
}

let rigidBodies = [];
let tmpTrans;

let wumpaFruits = []

let cameraPersp;

let isSpinning = false
let spinPressed = false;
let isSliding = false;
let isMoving = false;

let curve;

const STATE = { DISABLE_DEACTIVATION: 4 }

let cbContactResult;

const scene = new THREE.Scene();
const sceneOrtho = new THREE.Scene();

const crateTypes = { akuaku: "akuaku", wumpa: "wumpa", tnt: "tnt", nitro: "nitro", checkpoint: "checkpoint" }

let crateTextures = {};
let levelTextures = {};
let models = {}

const sounds = {}

const gltfLoader = new GLTFLoader();

class GameManager {

    constructor() {
        this.textureReady = false;
        this.audioReady = false;
        this.physicsReady = false;
        this.modelsLoaded = 0;
        this.deathHeight = -2;

        this.gem = null;
    }

    showLoading() {
        new TWEEN.Tween({ opacity: 0 })
            .to({ opacity: 1 }, 1000)
            .onUpdate(function (object) {
                document.getElementById("loadingScreen").style.opacity = object.opacity
            })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    hideLoading() {
        new TWEEN.Tween({ opacity: 1 })
            .to({ opacity: 0 }, 1000)
            .onUpdate(function (object) {
                document.getElementById("loadingScreen").style.opacity = object.opacity
            })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        document.getElementById("overlayMenu").style.zIndex = 3

    }

    showGameOver() {
        document.getElementById("gameOver").style.zIndex = 4
        new TWEEN.Tween({ opacity: 0, transform: 100 })
            .to({ opacity: 1, transform: 0 }, 1000)
            .onUpdate(function (object) {
                document.getElementById("gameOver").style.opacity = object.opacity
                document.getElementById("gameOver").style.transform = `translateY(${object.transform}%)`

            })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    win() {
        if (!alive) { return }
        alive = false;
        document.getElementById("gameWin").style.zIndex = 4

        sounds.music.pause();
        sounds.music.currentTime = 0;

        sounds.warpSound.currentTime = 0;
        sounds.warpSound.play();

        new TWEEN.Tween({ opacity: 0, transform: 100 })
            .to({ opacity: 1, transform: 0 }, 1000)
            .onUpdate(function (object) {
                document.getElementById("gameWin").style.opacity = object.opacity
                document.getElementById("gameWin").style.transform = `translateY(${object.transform}%)`
            })
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
        if (statsUI.crates >= LEVEL.totCrates()) {
            document.getElementById("gem").style.display = "inline"
        }
    }

    gameReady() {
        return (this.textureReady && this.audioReady && this.physicsReady)
    }

    modelsReady() {
        return this.modelsLoaded == 4
    }

    initMaterials() {

        const loader = new THREE.TextureLoader();

        let akuakuTexture = [
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/akuaku.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/akuaku.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/standard.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/akuaku.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/akuaku.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/akuaku.jpg") }),
        ];

        let nitroTexture = [
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro_upper.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/nitro.jpg"), emissive: 0x6f710, emissiveIntensity: 0.4 }),
        ];

        let checkpointTexture = [
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
            new THREE.MeshPhongMaterial({ map: loader.load("./textures/crates/checkpoint.jpg") }),
        ];

        let crateTexture = new THREE.MeshPhongMaterial({
            map: loader.load("./textures/crates/standard.jpg")
        });

        crateTextures =
            { akuaku: akuakuTexture, wumpa: crateTexture, tnt: crateTexture, nitro: nitroTexture, checkpoint: checkpointTexture }


        let ground = new THREE.MeshPhongMaterial({
            depthTest: true,
            map: loader.load("./textures/bricks/color.jpg"),
            normalMap: loader.load("./textures/bricks/normal.png"),
            aoMap: loader.load("./textures/bricks/ao.jpg"),
        })

        let cylinder = new THREE.MeshPhongMaterial({
            depthTest: true,
            map: loader.load("./textures/cylinder/color.jpg"),
            normalMap: loader.load("./textures/cylinder/normal.jpg"),
            aoMap: loader.load("./textures/cylinder/ao.jpg")
        })

        let wall = new THREE.MeshPhongMaterial({
            depthTest: true,
            map: loader.load("./textures/ancient_wall/color.png", function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(35, 35);
            }),
            normalMap: loader.load("./textures/ancient_wall/normal.png", function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(35, 35);
            }),
            aoMap: loader.load("./textures/ancient_wall/ao.png", function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(35, 35);
            }),
            displacementMap: loader.load("./textures/ancient_wall/displacement.png", function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.offset.set(0, 0);
                texture.repeat.set(35, 35);
            })
        })

        levelTextures = {
            ground: ground,
            cylinder: cylinder,
            wall: wall
        }

        this.textureReady = true;
    }

    initModels() {
        gltfLoader.load('./models/crash/crash.glb', function (gltf) {
            console.log("loadingModels")

            gltf.scene.traverse(function (node) {

                if (node.isMesh || node.isLight) node.castShadow = true;
                if (node.isMesh || node.isLight) node.receiveShadow = true;

            });


            let crashModel = gltf.scene.getObjectByName("Crash")
            let bones = crashModel.getObjectByName("TorsoMain")
            console.log("bones loaded")
            crashModel.position.y = -3
            crashModel.castShadow = true;
            crashModel.receiveShadow = true;

            models.crash = crashModel
            models.crashBones = bones


            gameManager.modelsLoaded++
            waitForLoading();

        }, undefined, function (error) {
            console.error(error);
        });


        gltfLoader.load('./models/wumpa/scene.gltf', function (gltf) {

            let wumpaModel = gltf.scene
            wumpaModel.position.set(0, 0, 0)
            wumpaModel.castShadow = false;
            wumpaModel.scale.set(10, 10, 10);

            new TWEEN.Tween({ rotY: 0 })
                .to({ rotY: 2 * Math.PI }, 1000)
                .onUpdate(function (object, elapsed) { wumpaModel.rotation.set(wumpaModel.rotation.x, -object.rotY, wumpaModel.rotation.z); })
                .repeat(Infinity)
                .start();

            wumpaModel.name = "wumpaIcon"

            models.wumpaOrtho = wumpaModel
            gameManager.modelsLoaded++
            waitForLoading();


        }, undefined, function (error) {
            console.log("error")
            console.error(error);

        });

        gltfLoader.load('./models/wumpa/scene.gltf', function (gltf) {

            let wumpaModel = gltf.scene
            wumpaModel.castShadow = true;
            wumpaModel.scale.set(.25, .25, .25);
            models.wumpa = wumpaModel
            gameManager.modelsLoaded++
            waitForLoading();

        }, undefined, function (error) {
            console.error(error);
        });

        gltfLoader.load('./models/gem/scene.gltf', function (gltf) {

            let gemModel = gltf.scene
            gemModel.castShadow = true;
            gemModel.scale.set(2, 2, 2);
            models.gem = gemModel
            gameManager.modelsLoaded++
            waitForLoading();

        }, undefined, function (error) {
            console.error(error);
        });


    }


    setupAudio() {
        sounds.spinSound = new Audio("./sounds/spinSound.wav");
        sounds.spinSound.volume -= 0.5

        sounds.musics = { templeRuins: new Audio("./sounds/templeruins.ogg"), snowGo: new Audio("./sounds/snowgo.ogg") }

        sounds.music = sounds.musics.templeRuins
        sounds.music.volume -= 0.6;

        sounds.wumpaSound = new Audio("./sounds/wumpaIn.wav");
        sounds.wumpaSoundOut = new Audio("./sounds/wumpaOut.wav");

        sounds.createBreakSound = new Audio("./sounds/createBreak.wav");
        sounds.createBreakSound.volume -= 0.2

        sounds.akuakuSound = new Audio("./sounds/akuaku.wav");
        sounds.akuakuDeathSound = new Audio("./sounds/akuaku_vanish.mp3");

        sounds.slideSound = new Audio("./sounds/slide.mp3");
        sounds.slideSound.volume -= 0.4
        sounds.nitroSound = new Audio("./sounds/nitro.wav");
        sounds.woahSound = new Audio("./sounds/woah.wav");

        sounds.warpSound = new Audio("./sounds/warp.mp3");
        sounds.gemSound = new Audio("./sounds/gemSound.wav");



        sounds.checkpointSound = new Audio("./sounds/checkpoint2.wav");
        sounds.checkpointSound.volume -= 0.6

        this.audioReady = true;
    }

    setupPhysicsWorld() {
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);

        physicsWorld.setGravity(new Ammo.btVector3(0, -150, 0));

        this.physicsReady = true;
    }

}

class StatsUI {
    constructor() {
        this.wumpas = 0
        this.crates = 0
        this.lives = 4
    }

    instantiate(canvas) {

        // Orthographic Scene
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 0, 10);

        sceneOrtho.add(light);


        // Wumpa
        const wumpaContainer = new THREE.Object3D();
        wumpaContainer.position.set(-canvas.clientWidth * 0.4, canvas.clientHeight * 0.4, 0)
        wumpaContainer.name = "wumpaContainer"
        sceneOrtho.add(wumpaContainer)

        sceneOrtho.getObjectByName("wumpaContainer").add(models.wumpaOrtho)
        document.getElementById('wumpaCounter').innerHTML = 0;


        // Crate
        const crateContainer = new THREE.Object3D();
        crateContainer.name = "crateContainer"
        sceneOrtho.add(crateContainer)


        let crateMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), crateTextures.wumpa);

        crateMesh.scale.set(50, 50, 50);
        crateMesh.name = "crateIcon";

        new TWEEN.Tween({ rotY: 0 })
            .to({ rotY: 2 * Math.PI }, 1500)
            .onUpdate(function (object, elapsed) { crateMesh.rotation.set(crateMesh.rotation.x, -object.rotY, crateMesh.rotation.z); })
            .repeat(Infinity)
            .start();

        crateContainer.add(crateMesh)


        const livesContainer = new THREE.Object3D();
        livesContainer.name = "livesContainer"
        sceneOrtho.add(livesContainer);


        const loader = new THREE.TextureLoader();
        loader.load("./textures/crashFace.png", function (texture) {
            const livesMaterial = new THREE.SpriteMaterial({ map: texture });
            const livesSprite = new THREE.Sprite(livesMaterial);
            livesSprite.scale.set(texture.image.width * 0.5, texture.image.height * 0.5, 1);
            sceneOrtho.getObjectByName("livesContainer").add(livesSprite);
        });

        document.getElementById('crateCounter').innerHTML = `0/${LEVEL.totCrates()}`
        document.getElementById('livesCounter').innerHTML = this.lives;

        this.updatePosition(canvas.clientWidth, canvas.clientHeight)
    }


    updatePosition(width, height) {

        sceneOrtho.getObjectByName("wumpaContainer").position.set(-width * 0.4, height * 0.4, 0);
        sceneOrtho.getObjectByName("crateContainer").position.set(-width * 0.04, height * 0.4, 0);
        sceneOrtho.getObjectByName("livesContainer").position.set(width * 0.32, height * 0.4, 0);


        const verticalNormalized = (height * 0.4 * 2 + height) / height - 1;
        const leftSidePosNormalized = (-width * 0.4 * 2 + width) / width - 1;
        const centerPosNormalized = (-width * 0.04 * 2 + width) / width - 1;
        const rightSidePosNormalized = (-width * 0.32 * 2 + width) / width - 1;

        // convert the normalized position to CSS coordinates
        const leftSideX = (leftSidePosNormalized * .5 + .5) * width + 96;
        const centerX = (centerPosNormalized * .5 + .5) * width;
        const rightSideX = (rightSidePosNormalized * .5 + .5) * width - 96;

        //const x = (tempV.x *  .5 + .5) * width;
        const y = (verticalNormalized * -.5 + .5) * height;

        // move the elem to that position
        document.getElementById('wumpaCounter').style.transform = `translate(-50%, -50%) translate(${leftSideX}px,${y}px)`;
        document.getElementById('crateCounter').style.transform = `translate(-50%, -50%) translate(${width - centerX}px,${y}px)`;
        document.getElementById('livesCounter').style.transform = `translate(-50%, -50%) translate(${width - rightSideX}px,${y}px)`;

    }

    updateWumpaCounter() {
        this.wumpas++;
        if (this.wumpas == 100) {
            this.wumpas = 0;
            this.updateLivesCounter(false);
        }
        document.getElementById('wumpaCounter').innerHTML = this.wumpas;
    }
    updateCrateCounter() {
        this.crates++;
        document.getElementById('crateCounter').innerHTML = `${this.crates}/${LEVEL.totCrates()}`
    }
    updateLivesCounter(decrement) {
        if (decrement) {
            this.lives--;
        } else {
            this.lives++;
        }


        document.getElementById('livesCounter').innerHTML = this.lives;



    }
}


class PlayerController {

    constructor() {

        this.akuaku = false;
        this.invincibility = false;
        this.threeCrash = null;
        this.threeAkuaku = null;
        this.checkpoint = new THREE.Vector3(0, 20, 0);

        this.bones = null;

        this.jumpSpeed = 5;

        this.modelsLoaded = 0
    }


    isReady() {
        return (this.bones != null)
    }

    instantiate() {

        let pos = { x: 0, y: 10, z: 0 };
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 55;

        let scale = { x: 2, y: 6, z: 1 }

        const player = new THREE.Object3D();
        player.position.set(pos.x, pos.y, pos.z);

        player.name = "player"

        scene.add(player);

        const playerMesh = new THREE.Object3D();
        player.add(playerMesh);
        playerMesh.name = "playerMesh"

        cameraPersp.name = "playerCamera"
        scene.add(cameraPersp);

        playerMesh.add(models.crash)
        this.bones = models.crashBones

        
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));

        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);

        let body = new Ammo.btRigidBody(rbInfo);
        body.threeObject = player;

        body.setActivationState(STATE.DISABLE_DEACTIVATION);
        body.setFriction(0);

        physicsWorld.addRigidBody(body);

        let pivot = new Ammo.btTransform();
        pivot.setIdentity();
        let localPivot = body.getCenterOfMassTransform().inverse();
        pivot.setOrigin(localPivot)

        let rotConstraint = new Ammo.btGeneric6DofConstraint(body, pivot, false);

        let higherSliderLimit = new Ammo.btVector3(1, 1, 1);
        let upperSliderLimit = new Ammo.btVector3(0, 0, 0);

        // lower > upper : axis free
        rotConstraint.setLinearLowerLimit(higherSliderLimit);
        rotConstraint.setLinearUpperLimit(upperSliderLimit);

        // lower = upper : axis locked
        rotConstraint.setAngularLowerLimit(upperSliderLimit);
        rotConstraint.setAngularUpperLimit(upperSliderLimit);

        physicsWorld.addConstraint(rotConstraint, false);

        player.userData.physicsBody = body;
        player.userData.tag = "player";

        rigidBodies.push(player);

        this.threeCrash = player;

        this.initAkuaku()
    }


    initAkuaku() {

        const akuAku = new THREE.Object3D();

        gltfLoader.load('./models/akuaku/scene.gltf', function (gltf) {

            let akuakuModel = gltf.scene
            //crashModel.position.y = -3
            akuakuModel.rotation.y = - Math.PI
            akuakuModel.position.set(-2, 1, -2)
            akuakuModel.castShadow = true;

            akuakuModel.scale.set(.0025, .0025, .0025);

            akuAku.add(akuakuModel)

        }, undefined, function (error) {

            console.error(error);

        });


        akuAku.name = "akuaku"
        akuAku.visible = false;

        this.threeCrash.add(akuAku)
        this.threeAkuaku = akuAku
    }



    die() {
        if (!alive) { return }
        alive = false;
        animator.death(true)
        sounds.woahSound.play();
        //isMoving = false;
        this.akuaku = false
        this.threeAkuaku.visible = false;

        this.threeCrash.userData.physicsBody.getLinearVelocity().setX(0)
        this.threeCrash.userData.physicsBody.getLinearVelocity().setY(0)
        this.threeCrash.userData.physicsBody.getLinearVelocity().setZ(0)

        if (statsUI.lives == 0) {
            sounds.music.pause();
            sounds.music.currentTime = 0;
            gameManager.showGameOver();
        }

        setTimeout(function () {
            if (statsUI.lives >= 0)
                respawning = true;
        }, 2500);
    }


    respawn() {
        this.threeCrash.position.set(this.checkpoint.x, this.checkpoint.y, this.checkpoint.z)

        isGrounded = false;
        animator.animPlaying.jump = false
        animator.jump(true)

        sounds.warpSound.currentTime = 0;
        sounds.warpSound.play();

        this.threeCrash.userData.physicsBody.getLinearVelocity().setX(0)
        this.threeCrash.userData.physicsBody.getLinearVelocity().setY(0)
        this.threeCrash.userData.physicsBody.getLinearVelocity().setZ(0)

        let transform = new Ammo.btTransform();
        transform.setOrigin(new Ammo.btVector3(this.checkpoint.x, this.checkpoint.y, this.checkpoint.z))
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        let motionState = new Ammo.btDefaultMotionState(transform);
        this.threeCrash.userData.physicsBody.setMotionState(motionState)

        this.threeCrash.getObjectByName("playerMesh").rotation.y = -Math.PI

        alive = true;
    }


    killAkuaku() {
        playerController.invincibility = true;
        sounds.akuakuDeathSound.currentTime = 0
        sounds.akuakuDeathSound.play();
        playerController.akuaku = false
        playerController.threeAkuaku.visible = false;
        this.setImpulse(playerController.threeCrash.userData.physicsBody, 5)

        setTimeout(function () { playerController.invincibility = false }, 2000);
    }

    assignAkuAku() {
        playerController.akuaku = true
        scene.getObjectByName("player").getObjectByName("akuaku").visible = true;
    }


    jump() {
        let physicsBody = this.threeCrash.userData.physicsBody;

        if (isGrounded) {
            canJump = true;
        }

        if (canJump) {
            if (!onTimeout) {
                onTimeout = true;
                setTimeout(function () { canJump = false; onTimeout = false; }, 62);
            }
            this.setImpulse(physicsBody, this.jumpSpeed)
            isGrounded = false;
        }

    }


    slide() {

        if (isSpinning) return;

        if (sounds.slideSound.paused) {
            sounds.slideSound.currentTime = 0;
            sounds.slideSound.play()
        }
        let physicsBody = this.threeCrash.userData.physicsBody;
        let playerMesh = this.threeCrash.getObjectByName("playerMesh")

        let impulseVector = new THREE.Vector3(0, 0, 3000);
        impulseVector.applyQuaternion(playerMesh.quaternion)

        physicsBody.applyImpulse(new Ammo.btVector3(impulseVector.x, impulseVector.y, impulseVector.z));
        setTimeout(function () {
            isSliding = false;
        }, 600);

    }


    spin() {
        if (isSpinning && spinPressed) { return }

        spinPressed = false
        sounds.spinSound.currentTime = 0
        sounds.spinSound.play();
        isSpinning = true
        setTimeout(function () { isSpinning = false; }, 450);
    }

    move(movement, speed) {

        let physicsBody = this.threeCrash.userData.physicsBody;

        isMoving = (movement.x != 0 || movement.z != 0)

        if ((!isMoving && !isSliding) || (!isMoving && isSliding) || playerController.threeCrash.position.y <= gameManager.deathHeight) {
            physicsBody.getLinearVelocity().setX(0)
            physicsBody.getLinearVelocity().setZ(0)
            return
        }

        const posUpdateX = this.threeCrash.position.x;
        const posUpdateZ = this.threeCrash.position.z;
        const posY = this.threeCrash.position.y;

        if (!isSpinning) {
            this.threeCrash.getObjectByName("playerMesh").lookAt(posUpdateX + movement.x, posY, posUpdateZ + movement.z);
        } else {
            this.threeCrash.rotation.x = 0;
            this.threeCrash.rotation.z = 0;

        }
        movement.multiplyScalar(speed);

        physicsBody.getLinearVelocity().setX(movement.x)
        physicsBody.getLinearVelocity().setZ(movement.z)

    }


    setImpulse(physicsBody, jumpSpeed) {
        if (!alive) { return }
        physicsBody.getLinearVelocity().setY(0)
        const impulseVector = new Ammo.btVector3(0, jumpSpeed * 550, 0);
        physicsBody.applyImpulse(impulseVector);
    }

}



class Animator {

    constructor() {
        this.bones = null;

        this.defaultPos = {};
        this.defaultQuaternions = {};
        this.idleTweenLeftArm = null;
        this.idleTweenRightArm = null;
        this.idleTweenNec = null;

        this.walkingAnimation = null;
        this.jumpAnimation = null;
        this.groundAnimation = null;
        this.spinAnimation = null;
        this.idleAnimation = null;
        this.slideAnimation = null;
        this.deathAnimation = null;
        this.winAnimation = null;

        this.animPlaying = {
            idle: false,
            spin: false,
            jump: false,
            walk: false,
            ground: true,
            slide: false
        };
    }

    initAnimations() {
        // Tween Update Function
        const updateSkeletonQuaternions = function (object) {

            animator.bones.getObjectByName("TorsoMain").position.set(
                animator.defaultPos["TorsoMain"].x + object.torsoMainPosX,
                animator.defaultPos["TorsoMain"].y + object.torsoMainPosY,
                animator.defaultPos["TorsoMain"].z + object.torsoMainPosZ,
            );

            animator.bones.getObjectByName("UpperArmRight").quaternion.copy(
                animator.defaultQuaternions["UpperArmRight"].clone().multiply(new THREE.Quaternion(object.upperArmRightX, object.upperArmRightY, object.upperArmRightZ, object.upperArmRightW))
            );
            animator.bones.getObjectByName("UpperArmLeft").quaternion.copy(
                animator.defaultQuaternions["UpperArmLeft"].clone().multiply(new THREE.Quaternion(object.upperArmLeftX, object.upperArmLeftY, object.upperArmLeftZ, object.upperArmLeftW))
            );
            animator.bones.getObjectByName("LowerArmLeft").quaternion.copy(
                animator.defaultQuaternions["LowerArmLeft"].clone().multiply(new THREE.Quaternion(object.lowerArmLeftX, object.lowerArmLeftY, object.lowerArmLeftZ, object.lowerArmLeftW))
            );
            animator.bones.getObjectByName("LowerArmRight").quaternion.copy(
                animator.defaultQuaternions["LowerArmRight"].clone().multiply(new THREE.Quaternion(object.lowerArmRightX, object.lowerArmRightY, object.lowerArmRightZ, object.lowerArmRightW))
            );
            animator.bones.getObjectByName("UpperLegLeft").quaternion.copy(
                animator.defaultQuaternions["UpperLegLeft"].clone().multiply(new THREE.Quaternion(object.upperLegLeftX, object.upperLegLeftY, object.upperLegLeftZ, object.upperLegLeftW))
            );
            animator.bones.getObjectByName("UpperLegRight").quaternion.copy(
                animator.defaultQuaternions["UpperLegRight"].clone().multiply(new THREE.Quaternion(object.upperLegRightX, object.upperLegRightY, object.upperLegRightZ, object.upperLegRightW))
            );
            animator.bones.getObjectByName("LowerLegLeft").quaternion.copy(
                animator.defaultQuaternions["LowerLegLeft"].clone().multiply(new THREE.Quaternion(object.lowerLegLeftX, object.lowerLegLeftY, object.lowerLegLeftZ, object.lowerLegLeftW))
            );
            animator.bones.getObjectByName("LowerLegRight").quaternion.copy(
                animator.defaultQuaternions["LowerLegRight"].clone().multiply(new THREE.Quaternion(object.lowerLegRightX, object.lowerLegRightY, object.lowerLegRightZ, object.lowerLegRightW))
            );
            animator.bones.getObjectByName("HandLeft").quaternion.copy(
                animator.defaultQuaternions["HandLeft"].clone().multiply(new THREE.Quaternion(object.handLeftX, object.handLeftY, object.handLeftZ, object.handLeftW))
            );
            animator.bones.getObjectByName("HandRight").quaternion.copy(
                animator.defaultQuaternions["HandRight"].clone().multiply(new THREE.Quaternion(object.handRightX, object.handRightY, object.handRightZ, object.handRightW))
            );
            animator.bones.getObjectByName("FootLeft").quaternion.copy(
                animator.defaultQuaternions["FootLeft"].clone().multiply(new THREE.Quaternion(object.footLeftX, object.footLeftY, object.footLeftZ, object.footLeftW))
            );
            animator.bones.getObjectByName("FootRight").quaternion.copy(
                animator.defaultQuaternions["FootRight"].clone().multiply(new THREE.Quaternion(object.footRightX, object.footRightY, object.footRightZ, object.footRightW))
            );
            animator.bones.getObjectByName("TorsoMain").quaternion.copy(
                animator.defaultQuaternions["TorsoMain"].clone().multiply(new THREE.Quaternion(object.torsoMainX, object.torsoMainY, object.torsoMainZ, object.torsoMainW))
            );
            animator.bones.getObjectByName("TorsoUpper").quaternion.copy(
                animator.defaultQuaternions["TorsoUpper"].clone().multiply(new THREE.Quaternion(object.torsoUpperX, object.torsoUpperY, object.torsoUpperZ, object.torsoUpperW))
            );
            animator.bones.getObjectByName("EarLeft").quaternion.copy(
                animator.defaultQuaternions["EarLeft"].clone().multiply(new THREE.Quaternion(object.earLeftX, object.earLeftY, object.earLeftZ, object.earLeftW))
            );
            animator.bones.getObjectByName("EarRight").quaternion.copy(
                animator.defaultQuaternions["EarRight"].clone().multiply(new THREE.Quaternion(object.earRightX, object.earRightY, object.earRightZ, object.earRightW))
            );
            animator.bones.getObjectByName("Nec").quaternion.copy(
                animator.defaultQuaternions["Nec"].clone().multiply(new THREE.Quaternion(object.necX, object.necY, object.necZ, object.necW))
            );
            animator.bones.getObjectByName("Head").quaternion.copy(
                animator.defaultQuaternions["Head"].clone().multiply(new THREE.Quaternion(object.headX, object.headY, object.headZ, object.headW))
            );
            animator.bones.getObjectByName("Nose").quaternion.copy(
                animator.defaultQuaternions["Nose"].clone().multiply(new THREE.Quaternion(object.noseX, object.noseY, object.noseZ, object.noseW))
            );
        };

        // Idle
        let startingFrame = { ...KEYFRAMES.idle.lookLeft }
        let idleLeft = new TWEEN.Tween(startingFrame).to(KEYFRAMES.idle.middle, 200)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.idle.middle }
        let idleMiddle = new TWEEN.Tween(startingFrame).to(KEYFRAMES.idle.lookRight, 200)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.idle.lookRight }
        let idleRight = new TWEEN.Tween(startingFrame).to(KEYFRAMES.idle.middle, 200)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.idle.middle }
        let idleMiddleReverse = new TWEEN.Tween(startingFrame).to(KEYFRAMES.idle.lookLeft, 200)
            .onUpdate(updateSkeletonQuaternions)

        idleLeft.chain(idleMiddle);
        idleMiddle.chain(idleRight);
        idleRight.chain(idleMiddleReverse);
        idleMiddleReverse.chain(idleLeft);


        this.idleAnimation = idleLeft;

        // Walking Animation
        startingFrame = { ...KEYFRAMES.walk.contact }
        let walkContact = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.recoil, 120 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.recoil }
        let walkRecoil = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.passing, 90 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.passing }
        let walkPassing = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.highPoint, 90 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.highPoint }
        let walkHighPoint = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.contactMirror, 120 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.contactMirror }
        let walkContactMirror = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.recoilMirror, 120 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.recoilMirror }
        let walkRecoilMirror = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.passingMirror, 90 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.passingMirror }
        let walkPassingMirror = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.highPointMirror, 90 - 35)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.walk.highPointMirror }
        let walkHighPointMirror = new TWEEN.Tween(startingFrame).to(KEYFRAMES.walk.contact, 120 - 35)
            .onUpdate(updateSkeletonQuaternions)

        walkContact.chain(walkRecoil)
        walkRecoil.chain(walkPassing)
        walkPassing.chain(walkHighPoint)
        walkHighPoint.chain(walkContactMirror)
        walkContactMirror.chain(walkRecoilMirror)
        walkRecoilMirror.chain(walkPassingMirror)
        walkPassingMirror.chain(walkHighPointMirror)
        walkHighPointMirror.chain(walkContact)

        this.walkingAnimation = walkContact

        // Jump animation
        startingFrame = { ...KEYFRAMES.defaults }
        this.jumpAnimation = new TWEEN.Tween(startingFrame).to(KEYFRAMES.jump.up, 200)
            .onUpdate(updateSkeletonQuaternions)

        // Ground animation
        startingFrame = { ...KEYFRAMES.jump.up }
        let jumpToGround = new TWEEN.Tween(startingFrame).to(KEYFRAMES.jump.ground, 200)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.jump.ground }
        let groundToDefault = new TWEEN.Tween(startingFrame).to(KEYFRAMES.defaults, 100)
            .onUpdate(updateSkeletonQuaternions)
        jumpToGround.chain(groundToDefault)

        this.groundAnimation = jumpToGround;


        // Spin animation
        startingFrame = { ...KEYFRAMES.defaults }
        let spinTweenArms = new TWEEN.Tween(startingFrame).to(KEYFRAMES.spin.armsWide, 60)
            .onUpdate(updateSkeletonQuaternions)

        let spinTween = new TWEEN.Tween({ rotY: 0 })
            .to({ rotY: 2 * Math.PI }, 100)
            .onUpdate(function (object, elapsed) {

                playerController.threeCrash.getObjectByName("playerMesh").quaternion.copy(
                    animator.defaultQuaternions["Player"].clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, object.rotY, 0)))
                )

            })
            .repeat(3)

        startingFrame = { ...KEYFRAMES.spin.armsWide }
        let spinTweenArmsReverse = new TWEEN.Tween(startingFrame).to(KEYFRAMES.defaults, 90)
            .onUpdate(updateSkeletonQuaternions).easing(TWEEN.Easing.Quadratic.In)
            .onComplete(function () {
                animator.animPlaying.spin = false
            });

        spinTweenArms.chain(spinTween)
        spinTween.chain(spinTweenArmsReverse)

        this.spinAnimation = spinTweenArms;


        // Slide animation
        startingFrame = { ...KEYFRAMES.defaults }
        this.slideAnimation = new TWEEN.Tween(startingFrame).to(KEYFRAMES.slide, 160)
            .onUpdate(updateSkeletonQuaternions)

        // Death animation
        startingFrame = { ...KEYFRAMES.defaults }
        let deathFalling = new TWEEN.Tween(startingFrame).to(KEYFRAMES.death.falling, 300)
            .onUpdate(updateSkeletonQuaternions)

        startingFrame = { ...KEYFRAMES.death.falling }
        let deathGround = new TWEEN.Tween(startingFrame).to(KEYFRAMES.death.ground, 300)
            .onUpdate(updateSkeletonQuaternions)

        deathFalling.chain(deathGround);
        this.deathAnimation = deathFalling;

        // Win animation
        startingFrame = { scaleX: playerController.threeCrash.scale.x, scaleY: playerController.threeCrash.scale.y, scaleZ: playerController.threeCrash.scale.z }
        let middleFrame = { scaleX: startingFrame.scaleX + .5, scaleY: startingFrame.scaleY + .5, scaleZ: startingFrame.scaleZ + .5 }

        let winAnimationStart = new TWEEN.Tween(startingFrame).to(middleFrame, 100)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(function (object) {
                playerController.threeCrash.scale.set(object.scaleX, object.scaleY, object.scaleZ)
            })

        let winAnimationEnd = new TWEEN.Tween(middleFrame).to({ scaleX: 0, scaleY: 0, scaleZ: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .onUpdate(function (object) {
                playerController.threeCrash.scale.set(object.scaleX, object.scaleY, object.scaleZ)
            })
        winAnimationStart.chain(winAnimationEnd)

        this.winAnimation = winAnimationStart

    }


    setBones(bones) {
        this.bones = bones

        this.defaultPos["TorsoMain"] = bones.getObjectByName("TorsoMain").position.clone()

        this.defaultQuaternions["UpperArmRight"] = bones.getObjectByName("UpperArmRight").quaternion.clone()
        this.defaultQuaternions["UpperArmLeft"] = bones.getObjectByName("UpperArmLeft").quaternion.clone()

        this.defaultQuaternions["LowerArmLeft"] = bones.getObjectByName("LowerArmLeft").quaternion.clone()
        this.defaultQuaternions["LowerArmRight"] = bones.getObjectByName("LowerArmRight").quaternion.clone()

        this.defaultQuaternions["UpperLegLeft"] = bones.getObjectByName("UpperLegLeft").quaternion.clone()
        this.defaultQuaternions["UpperLegRight"] = bones.getObjectByName("UpperLegRight").quaternion.clone()

        this.defaultQuaternions["LowerLegLeft"] = bones.getObjectByName("LowerLegLeft").quaternion.clone()
        this.defaultQuaternions["LowerLegRight"] = bones.getObjectByName("LowerLegRight").quaternion.clone()

        this.defaultQuaternions["HandLeft"] = bones.getObjectByName("HandLeft").quaternion.clone()
        this.defaultQuaternions["HandRight"] = bones.getObjectByName("HandRight").quaternion.clone()

        this.defaultQuaternions["FootLeft"] = bones.getObjectByName("FootLeft").quaternion.clone()
        this.defaultQuaternions["FootRight"] = bones.getObjectByName("FootRight").quaternion.clone()

        this.defaultQuaternions["TorsoMain"] = bones.getObjectByName("TorsoMain").quaternion.clone()
        this.defaultQuaternions["TorsoUpper"] = bones.getObjectByName("TorsoUpper").quaternion.clone()

        this.defaultQuaternions["EarLeft"] = bones.getObjectByName("EarLeft").quaternion.clone()
        this.defaultQuaternions["EarRight"] = bones.getObjectByName("EarRight").quaternion.clone()

        this.defaultQuaternions["Nec"] = bones.getObjectByName("Nec").quaternion.clone()
        this.defaultQuaternions["Head"] = bones.getObjectByName("Head").quaternion.clone()
        this.defaultQuaternions["Nose"] = bones.getObjectByName("Nose").quaternion.clone()

        this.defaultQuaternions["Player"] = playerController.threeCrash.getObjectByName("playerMesh").quaternion.clone()

    }

    walk(play) {
        if (play && this.animPlaying.walk == false) {
            this.walkingAnimation.start()
            this.animPlaying.walk = true

        }
        else if (!play) {
            this.walkingAnimation.stop()
            this.animPlaying.walk = false
        }
    }

    idle(play) {
        if (play && this.animPlaying.idle == false) {
            //  this.idleTweenLeftArm.start()
            //   this.idleTweenRightArm.start()
            this.idleAnimation.start();
            this.animPlaying.idle = true

        } else if (!play) {
            this.animPlaying.idle = false
            //      this.idleTweenLeftArm.stop()
            //      this.idleTweenRightArm.stop()
            this.idleAnimation.stop()
        }
    }


    spin(play) {
        if (play && this.animPlaying.spin == false) {
            this.idle(false);

            this.groundAnimation.stop()
            this.spinAnimation.start()
            this.animPlaying.spin = true

        } else if (!play) {
            this.animPlaying.spin = false
        }
    }


    jump(play) {
        if (play && this.animPlaying.jump == false) {
            this.groundAnimation.stop()
            this.jumpAnimation.start()
            this.animPlaying.jump = true
            this.animPlaying.ground = false
        } else if (!play) {

            this.animPlaying.jump = false
            this.jumpAnimation.stop()

            if (!this.animPlaying.ground) {
                this.animPlaying.ground = true
                if (isSpinning || isMoving) { return }
                this.groundAnimation.start()
            }
        }
    }

    slide(play) {
        if (play && this.animPlaying.slide == false) {
            this.idle(false);
            this.groundAnimation.stop()
            this.slideAnimation.start()
            this.animPlaying.slide = true;

        } else if (!play) {
            this.animPlaying.slide = false;
        }
    }

    death(play) {
        this.walkingAnimation.stop();
        this.jumpAnimation.stop();
        this.groundAnimation.stop();
        this.spinAnimation.stop();
        this.idleAnimation.stop();
        this.slideAnimation.stop();

        if (play) this.deathAnimation.start();
        else this.deathAnimation.stop();
    }

    win() {
        this.walkingAnimation.stop();
        this.jumpAnimation.stop();
        this.groundAnimation.stop();
        this.spinAnimation.stop();
        this.idleAnimation.stop();
        this.slideAnimation.stop();
        if (alive)
            this.winAnimation.start();
    }

}




class CrateManager {

    static instantiate(scene, physicsWorld, pos, crateType) {


        let scale = { x: 3.5, y: 3.5, z: 3.5 };
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 300;

        
        let crate = new THREE.Object3D();

        let mat;
        if (crateType === crateTypes.wumpa) {
            mat = crateTextures.wumpa
        }
        else if (crateType === crateTypes.akuaku) {
            mat = crateTextures.akuaku
        }
        else if (crateType === crateTypes.nitro) {
            mat = crateTextures.nitro
        } else if (crateType === crateTypes.checkpoint) {
            mat = crateTextures.checkpoint
        }


        let crateMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), mat);

        crate.position.set(pos.x, pos.y, pos.z);
        crateMesh.scale.set(scale.x, scale.y, scale.z);
        crateMesh.name = "crateMesh";

        if (crateType !== crateTypes.nitro)
            crateMesh.castShadow = true;
        crateMesh.receiveShadow = true;

        scene.add(crate);
        crate.add(crateMesh);

        
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.setFriction(0);

        let pivot = new Ammo.btTransform();
        pivot.setIdentity();
        let localPivot = body.getCenterOfMassTransform().inverse();
        pivot.setOrigin(localPivot)

        let rotConstraint = new Ammo.btGeneric6DofConstraint(body, pivot, false);

        let lowerSliderLimit = new Ammo.btVector3(0, 1, 0);
        let upperSliderLimit = new Ammo.btVector3(0, 0, 0);

        // lower > upper : axis free
        rotConstraint.setLinearLowerLimit(lowerSliderLimit);
        rotConstraint.setLinearUpperLimit(upperSliderLimit);

        // lower = upper : axis locked
        rotConstraint.setAngularLowerLimit(upperSliderLimit);
        rotConstraint.setAngularUpperLimit(upperSliderLimit);

        physicsWorld.addConstraint(rotConstraint, false);

        body.threeObject = crate;

        crate.userData.tag = "crate";
        crate.userData.crateType = crateType;
        crate.userData.broken = false


        crate.userData.physicsBody = body;
        physicsWorld.addRigidBody(body);


        if (crateType === crateTypes.nitro) {
            const light = new THREE.PointLight(0x00FF00, 2.5, 100);
            light.castShadow = true;
            crate.userData.pointLight = light;
            light.position.set(pos.x, pos.y, pos.z);
            scene.add(light);
        }

        return crate
    }


    static break(scene, crate) {
        if (crate.userData.broken) return
        crate.userData.broken = true


        let objAmmo = crate.userData.physicsBody;

        if (objAmmo != null) {
            let ms = objAmmo.getMotionState();
            if (ms) {
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(100, 100, 100));
                transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
                objAmmo.setWorldTransform(ms)
            }
            crate.userData.physicsBody = null;
        }

        let crateMesh = crate.getObjectByName("crateMesh");

        if (crateMesh != null) {
            crate.remove(crateMesh);

            if (crate.userData.crateType === crateTypes.wumpa) {
                sounds.createBreakSound.play();
                wumpaFruits.push(WumpaCollectable.instantiate(scene, physicsWorld, { x: crate.position.x, y: crate.position.y, z: crate.position.z }))
                statsUI.updateCrateCounter()
            } else if (crate.userData.crateType === crateTypes.akuaku) {
                sounds.createBreakSound.play();
                let akuAku = AkuAkuCollectable.instantiate(scene, physicsWorld, { x: crate.position.x, y: crate.position.y, z: crate.position.z })
                statsUI.updateCrateCounter()
                AkuAkuCollectable.collect(akuAku);
            } else if (crate.userData.crateType === crateTypes.nitro) {
                new TWEEN.Tween({ intensity: 100 })
                    .to({ intensity: 0 }, 350)
                    .onUpdate(function (object, elapsed) { crate.userData.pointLight.intensity = object.intensity })
                    .easing(TWEEN.Easing.Quadratic.InOut).start()

                sounds.nitroSound.currentTime = 0.14
                sounds.nitroSound.play();
            } else if (crate.userData.crateType === crateTypes.checkpoint) {
                sounds.checkpointSound.play()
                playerController.checkpoint = new THREE.Vector3(crate.position.x, crate.position.y + 20, crate.position.z);
                statsUI.updateCrateCounter()
            }
        }

        if (statsUI.crates >= LEVEL.totCrates()) { GemCollectable.fall(gameManager.gem) }
    }
}



class Collectable {

    static collect(element, sound) {
        sound.play()
        let objAmmo = element.userData.physicsBody;
        element.position.set(-100, -100, -100)

        let transform = new Ammo.btTransform();
        transform.setIdentity();

        transform.setOrigin(new Ammo.btVector3(-100, -100, -100));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        let motionState = new Ammo.btDefaultMotionState(transform);
        objAmmo.setMotionState(motionState)

    }

}

class WumpaCollectable extends Collectable {

    static animate(fruit) {

        new TWEEN.Tween({ rotY: 0 })
            .to({ rotY: 2 * Math.PI }, 1000)
            .onUpdate(function (object) { fruit.rotation.set(fruit.rotation.x, object.rotY, fruit.rotation.z); })
            .repeat(Infinity)
            .start();

        const wumpaBounce = new TWEEN.Tween({ posY: 1.2 })
            .to({ posY: -1.2 }, 500)
            .onUpdate(function (object) { fruit.position.set(fruit.position.x, object.posY, fruit.position.z); })
            .easing(TWEEN.Easing.Quadratic.InOut);

        const wumpaBounceReverse = new TWEEN.Tween({ posY: -1.2 })
            .to({ posY: 1.2 }, 500)
            .onUpdate(function (object) { fruit.position.set(fruit.position.x, object.posY, fruit.position.z); })
            .easing(TWEEN.Easing.Quadratic.InOut);


        wumpaBounce.chain(wumpaBounceReverse);
        wumpaBounceReverse.chain(wumpaBounce);

        wumpaBounce.start();

    }


    static collect(wumpa) {

        if (wumpa.userData.collected) return

        sounds.wumpaSound.currentTime = 0.04;
        super.collect(wumpa, sounds.wumpaSound);

        let wumpaMesh = wumpa.getObjectByName("wumpaMesh");

        if (wumpaMesh != null) {

            wumpa.remove(wumpaMesh);
            wumpaMesh = undefined;
        }

        setTimeout(function () {
            sounds.wumpaSoundOut.currentTime = 0;
            sounds.wumpaSoundOut.play()
            statsUI.updateWumpaCounter()
        }, 500);

        wumpa.userData.collected = true;

    }

    static instantiate(scene, physicsWorld, pos) {
        let radius = .5 * 2.5;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;

        const wumpaObject = new THREE.Object3D();
        const wumpaMesh = new THREE.Object3D();


        wumpaMesh.name = "wumpaMesh";

        let wumpaModel = models.wumpa.clone()
        WumpaCollectable.animate(wumpaModel)
        wumpaMesh.add(wumpaModel);
        wumpaObject.add(wumpaMesh);
        scene.add(wumpaObject);

        
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.threeObject = wumpaObject;

        physicsWorld.addRigidBody(body);

        wumpaObject.userData.tag = "wumpa";
        wumpaObject.userData.physicsBody = body;


        rigidBodies.push(wumpaObject);
        wumpaFruits.push(wumpaObject);

        wumpaObject.userData.collected = false

        return wumpaObject
    }
}


class GemCollectable extends Collectable {
    static instantiate(scene, physicsWorld, pos) {
        let radius = .5 * 2.5;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;

        const gemObject = new THREE.Object3D();
        const gemMesh = new THREE.Object3D();

        gemMesh.name = "gemMesh";

        let gemModel = models.gem.clone()
        GemCollectable.animate(gemModel)
        gemMesh.add(gemModel);
        gemObject.add(gemMesh);
        scene.add(gemObject);

        
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y + 100, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.threeObject = gemObject;

        physicsWorld.addRigidBody(body);

        gemObject.userData.tag = "gem";
        gemObject.userData.physicsBody = body;


        rigidBodies.push(gemObject);

        gemObject.userData.collected = false

        const light = new THREE.PointLight(0xFF0000, 0, 150, 20);
        light.position.set(0, 0, 0);
        light.name = "light"
        gemObject.add(light);

        this.animate(gemObject)
        return gemObject
    }

    static fall(gem) {

        const gemLight = gem.getObjectByName("light");

        new TWEEN.Tween({ intensity: 0 })
            .to({ intensity: 5 }, 1500)
            .onUpdate(function (object) { gemLight.intensity = object.intensity })
            .easing(TWEEN.Easing.Quadratic.Out).start()


        const pos = gem.position.y
        new TWEEN.Tween({ posY: pos })
            .to({ posY: pos - 100 }, 1500)
            .easing(TWEEN.Easing.Bounce.Out)
            .onUpdate(function (object) {

                let transform = new Ammo.btTransform();
                transform.setIdentity();

                transform.setOrigin(new Ammo.btVector3(gem.position.x, object.posY, gem.position.z));
                transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

                let motionState = new Ammo.btDefaultMotionState(transform);
                gem.userData.physicsBody.setMotionState(motionState);

                gem.position.set(gem.position.x, object.posY, gem.position.z);
            }).onComplete(function () { gemLight.castShadow = true })
            .start();
    }

    static collect(gem) {
        if (gem.userData.collected) return
        super.collect(gem, sounds.gemSound);
        let gemMesh = gem.getObjectByName("gemMesh");
        if (gemMesh != null) {
            gem.remove(gemMesh);
            gemMesh = undefined;
        }

        gem.userData.collected = true;
    }

    static animate(gem) {

        new TWEEN.Tween({ rotY: 0 })
            .to({ rotY: 2 * Math.PI }, 3500)
            .onUpdate(function (object) { gem.rotation.set(gem.rotation.x, object.rotY, gem.rotation.z); })
            .repeat(Infinity)
            .start();
    }
}



class AkuAkuCollectable extends Collectable {

    static collect(wumpa) {

        sounds.akuakuSound.currentTime = 0.14

        super.collect(wumpa, sounds.akuakuSound)

        let wumpaMesh = wumpa.getObjectByName("akuakuMesh");

        if (wumpaMesh != null) {

            wumpa.remove(wumpaMesh);
            wumpaMesh.geometry.dispose();
            wumpaMesh.material.dispose();
            wumpaMesh = undefined;
            wumpa = undefined;
        }

        playerController.assignAkuAku()
    }

    static instantiate(scene, physicsWorld, pos) {
        let radius = .8;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;

        const targetGeometry = new THREE.BoxGeometry(.5, 1, .5);
        const targetMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
        const targetOrbit = new THREE.Object3D();
        targetMesh.castShadow = true;
        targetMesh.name = "akuakuMesh";
        scene.add(targetOrbit);
        targetOrbit.add(targetMesh);
        targetOrbit.position.z = 4 * 2;
        targetOrbit.position.y = 8;


        
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        let motionState = new Ammo.btDefaultMotionState(transform);

        let colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);

        body.threeObject = targetOrbit;

        physicsWorld.addRigidBody(body);

        targetOrbit.userData.tag = "akuaku";
        targetOrbit.userData.physicsBody = body;


        rigidBodies.push(targetOrbit);

        return targetOrbit
    }
}

/**
 * End of classes definitions
 */

const playerController = new PlayerController()
const animator = new Animator()
const statsUI = new StatsUI();
const gameManager = new GameManager();


function start() {

    tmpTrans = new Ammo.btTransform();
    gameManager.initMaterials();
    gameManager.setupAudio();
    gameManager.setupPhysicsWorld();

    gameManager.initModels()
    CollisionManager.setupContactResultCallback();

}

function waitForLoading() {
    if (gameManager.gameReady() && gameManager.modelsReady()) {
        gameManager.hideLoading();
        main();
    }
}

function main() {

    const canvas = document.querySelector('#three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.autoClear = false;
    const clock = new THREE.Clock();

    renderer.setClearColor(0x000000);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.gammaFactor = 1.5
    renderer.outputEncoding = THREE.GammaEncoding
    function makeCamera(fov = 40) {
        const aspect = 2;  
        const zNear = 0.1;
        const zFar = 1000;
        return new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);
    }

    const cameraPerspFov = 50
    cameraPersp = makeCamera(cameraPerspFov);
    cameraPersp.position.y = 16;
    cameraPersp.position.z = -34;
    cameraPersp.rotation.y = Math.PI;
    cameraPersp.rotation.x = .2;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, cameraPersp));

    const bloomPass = new BloomPass(0.5, 25, 4, 256);
    composer.addPass(bloomPass);

    const filmPass = new FilmPass(0.55, 0.5, 2*canvas.clientHeight, false);
    filmPass.renderToScreen = true;
    composer.addPass(filmPass);

    const rgbShift = new ShaderPass(RGBShiftShader);
    rgbShift.uniforms['amount'].value = 0.0010;
    composer.addPass(rgbShift);

    {
        const color = 0x000000;
        const near = 20;
        const far = overlayMenuValues.fogAmount;
        scene.fog = new THREE.Fog(color, near, far);
    }

    {
        const light = new THREE.DirectionalLight(0xFAFAFA, .8);
        light.position.set(15, 20, -10);
        light.castShadow = false;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = -1;
        light.shadow.camera.far = 200;

        scene.add(light);
        light.name = "directionalLight"
    }

    {
        const light = new THREE.AmbientLight(0x404040)
        light.intensity = 1.2;
        scene.add(light);
    }

    playerController.instantiate()

    for (let i = 0; i < 10; i++) {
        let pos = { x: -5, y: 5, z: 10 + 4 * i };
        WumpaCollectable.instantiate(scene, physicsWorld, pos);
    }
    for (let i = 0; i < 10; i++) {
        let pos = { x: -25, y: 25, z: 582 + 4 * i };
        WumpaCollectable.instantiate(scene, physicsWorld, pos);
    }
    gameManager.gem = GemCollectable.instantiate(scene, physicsWorld, LEVEL.gem);

    for (let i = 0; i < LEVEL.crates.length; i++) {
        let crate = LEVEL.crates[i]
        let pos = { x: crate.x, y: crate.y, z: crate.z };

        rigidBodies.push(CrateManager.instantiate(scene, physicsWorld, pos, crate.type));
    }


    function makeOrtographicCamera() {

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const left = -width * 0.5;
        const right = width * 0.5;
        const top = height * 0.5;
        const bottom = -height * 0.5;
        const near = -35;
        const far = 100;

        return new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    }
    cameraOrtho = makeOrtographicCamera();
    cameraOrtho.position.z = 10;

    statsUI.instantiate(canvas);


    for (let i = 0; i < 100; i++) {
        let pos = { x: -4 * i - Math.sin(2 * Math.PI * i * 5), y: 7 + Math.cos(2 * Math.PI * i * 0.1), z: 300 };
        //    WumpaCollectable.instantiate(scene, physicsWorld, pos);
    }

    rigidBodies.push(CrateManager.instantiate(scene, physicsWorld, { x: 5, y: 4, z: 300 }, crateTypes.checkpoint))

    const targetCamera = makeCamera();
    const targetCameraPivot = new THREE.Object3D();
    targetCamera.position.y = 1;
    targetCamera.position.z = -2;
    targetCamera.rotation.y = Math.PI;
    targetCameraPivot.add(targetCamera);

    let curvesCoords = [] // TODO poi sposta in una funzione
    for (let i = 0; i < LEVEL.cameraCurve.length; i++) {
        let pos = LEVEL.cameraCurve[i]
        curvesCoords.push(new THREE.Vector3(pos.x, pos.y, pos.z))
    }
    curve = new THREE.CatmullRomCurve3(curvesCoords);

    const points = curve.getPoints(LEVEL.cameraCurve.length);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // Create the final object to add to the scene
    const curveObject = new THREE.Line(geometry, material);
    curveObject.visible = false;
    curveObject.name = "curve";
    scene.add(curveObject);

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);

            cameraOrtho.left = -width * 0.5
            cameraOrtho.right = width * 0.5
            cameraOrtho.top = height * 0.5
            cameraOrtho.bottom = -height * 0.5
            statsUI.updatePosition(width, height);

            cameraOrtho.updateProjectionMatrix();
        }
        return needResize;
    }


    // Load level
    for (let i = 0; i < LEVEL.ground.length; i++) {
        createGround(LEVEL.ground[i]);
    }

    // Create win platform
    createGround(LEVEL.winPlatform).userData.tag = "win"

    for (let i = 0; i < LEVEL.fallingCylinders.length; i++) {
        createFallingCylinder(LEVEL.fallingCylinders[i]);
    }

    for (let i = 0; i < LEVEL.movingPlaftorms.length; i++) {
        createMovingPlatform(LEVEL.movingPlaftorms[i]);
    }

    const wallGeometry = new THREE.BoxBufferGeometry(400, 400, 1, 25, 25, 2);
    const wallMesh = new THREE.Mesh(wallGeometry, levelTextures.wall);
    wallMesh.receiveShadow = true;
    wallMesh.position.set(-125, 300, 735)
    scene.add(wallMesh);

    // Listeners for the settings
    document.getElementById("levelTheme").onchange = function () {

        if (this.options[this.selectedIndex].value !== "templeruins" && this.options[this.selectedIndex].value !== "snowgo") { return; }

        sounds.music.pause()
        sounds.music.currentTime = 0

        if (this.options[this.selectedIndex].value === "templeruins") {
            overlayMenuValues.color = 0x000000;
            document.getElementById("overlayMenu").style.backgroundColor = "white"
            document.getElementById("overlayMenu").style.color = "black"
            sounds.music = sounds.musics.templeRuins
        } else if (this.options[this.selectedIndex].value === "snowgo") {
            overlayMenuValues.color = 0xFAFAFA;
            document.getElementById("overlayMenu").style.backgroundColor = "black"
            document.getElementById("overlayMenu").style.color = "white"
            sounds.music = sounds.musics.snowGo
        }

        sounds.music.play()

        const near = 20;
        const far = overlayMenuValues.fogAmount;
        scene.fog = new THREE.Fog(overlayMenuValues.color, near, far);
        renderer.setClearColor(overlayMenuValues.color);
        console.log(scene.fog)
    };

    document.getElementById("fogValue").oninput = function (event) {
        overlayMenuValues.fogAmount = parseFloat(event.target.value);
        document.getElementById("fogValLabel").innerHTML = overlayMenuValues.fogAmount;

        const near = 20;
        const far = overlayMenuValues.fogAmount;
        scene.fog = new THREE.Fog(overlayMenuValues.color, near, far);
        renderer.setClearColor(overlayMenuValues.color);
        console.log(scene.fog)

    };

    document.getElementById("cameraCurveToggle").onclick = function () {
        overlayMenuValues.showCurve = this.checked;
        scene.getObjectByName("curve").visible = this.checked
    };
    document.getElementById("postProcessingToggle").onclick = function () {
        overlayMenuValues.postProcessing = this.checked;
        if (!this.checked) {
            composer.passes[0].renderToScreen = true
            for (let i = 1; i < composer.passes.length; i++) {
                composer.passes[i].enabled = false
            }
            composer.passes[3].renderToScreen = false

        } else {
            composer.passes[0].renderToScreen = false
            for (let i = 1; i < composer.passes.length; i++) {
                composer.passes[i].enabled = true
            }
            composer.passes[3].renderToScreen = false
        }
    };



    function render() {
        const deltaTime = clock.getDelta();
        const time = clock.getElapsedTime();
        TWEEN.update();

        if (playerController.bones != null && animator.bones == null) {
            animator.setBones(playerController.bones)
            animator.initAnimations()
            animator.idle(true)
            requestAnimationFrame(render)
        }

        // Animations 
        if (animator.bones && inputAxis != null && alive) {

            if (isSpinning) {
                animator.idle(false)
                animator.slide(false)
                animator.walk(false)
                animator.jump(false)
                animator.spin(true)
            } else if (isSliding) {
                animator.idle(false)
                animator.walk(false)
                animator.jump(false)
                animator.spin(false)
                animator.slide(true)
            } else if (!isGrounded) {
                animator.idle(false)
                animator.slide(false)
                animator.walk(false)
                animator.spin(false)
                animator.jump(true)
            } else if (isMoving) {
                animator.slide(false)
                animator.idle(false)
                animator.spin(false)
                animator.jump(false)
                animator.walk(true)
            } else {
                animator.slide(false)
                animator.walk(false)
                animator.jump(false)
                animator.walk(false)
                animator.idle(true)
            }
        }


        let speed = 20;
        if (inputAxis != null && alive) {
            let movement = new THREE.Vector3((inputAxis.moveHorizontal + inputAxis.moveNegHorizontal), 0, (inputAxis.moveVertical + inputAxis.moveNegVertical)).normalize();

            playerController.move(movement, 2.1 * speed, time)

            if (inputAxis.jump) {
                playerController.jump()
            }
        }
        CollisionManager.checkContact(playerController.threeCrash.userData.physicsBody)

        if (spinPressed && alive) {
            playerController.spin();
        } else { spinPressed = false }

        if (isSliding && isMoving && alive) {
            playerController.slide()
        } else {
            isSliding = false
        }

        playerController.threeAkuaku.position.y = Math.sin(time * 2) / 1.5;
        playerController.threeAkuaku.rotation.y = time * 5;


        if (respawning) {
            respawning = false;
            animator.death(false)
            statsUI.updateLivesCounter(true)
            playerController.respawn()
        }

        if ((playerController.threeCrash.position.y < gameManager.deathHeight) && alive) {
            playerController.die();
        }

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            composer.setSize(canvas.width, canvas.height)
            composer.passes[2].uniforms.sCount.value = 2*canvas.height

            const camera = cameraPersp;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        updateCamera();
        updatePhysics(deltaTime)

        renderer.clear();                     // clear buffers
        composer.render(scene, cameraPersp.cam);     // render scene 1
        renderer.clearDepth();                // clear depth buffer
        renderer.render(sceneOrtho, cameraOrtho)

        requestAnimationFrame(render);
    }

    sounds.music.play();
    requestAnimationFrame(render);
}


document.addEventListener('keydown', (e) => {
    inputAxis = handleInput(e, inputAxis);
});

document.addEventListener('keyup', (e) => {
    inputAxis = handleInput(e, inputAxis);
});


function createFallingCylinder(pos) {
    let scale = { x: 4.5, y: 20, z: 4.5 }; //prev 50, 2, 50
    let quat = { x: 0, y: 0, z: 0, w: 1 }
    let mass = 0;

    let geometry = new THREE.CylinderGeometry(scale.x, scale.z, scale.y, 16);
    let cylinder = new THREE.Mesh(geometry, levelTextures.cylinder);

    cylinder.position.set(pos.x, pos.y, pos.z);

    cylinder.castShadow = true;
    cylinder.receiveShadow = true;

    scene.add(cylinder);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btCylinderShape(new Ammo.btVector3(scale.x, scale.y * 0.5, scale.z));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    cylinder.userData.tag = "fallingCylinder";

    body.threeObject = cylinder;

    physicsWorld.addRigidBody(body);

    const startY = pos.y
    const tween1 = new TWEEN.Tween({ y: startY })
        .to({ y: startY - 2 }, 500)
        .easing(TWEEN.Easing.Bounce.InOut);

    const tween2 = new TWEEN.Tween({ y: startY })
        .to({ y: -100 }, 1500)
        .easing(TWEEN.Easing.Quadratic.In);

    const tween3 = new TWEEN.Tween({ y: -100 })
        .to({ y: startY }, 4500)
        .easing(TWEEN.Easing.Quadratic.In).delay(200);

    tween1.chain(tween2)
    tween2.chain(tween3)

    const tweenUpdate = function (object, elapsed) {

        let transform = new Ammo.btTransform();
        transform.setIdentity();

        transform.setOrigin(new Ammo.btVector3(pos.x, object.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        let motionState = new Ammo.btDefaultMotionState(transform);

        body.setMotionState(motionState)

        cylinder.position.set(pos.x, object.y, pos.z)

    }
    cylinder.userData.fallingAnimation = tween1

    tween1.onUpdate(tweenUpdate)
    tween2.onUpdate(tweenUpdate)
    tween3.onUpdate(tweenUpdate)

}

function createGround(info) {

    let pos = info.pos;
    let scale = info.scale; 
    let quat = info.quat;
    let mass = 0;

    let groundBlock = new THREE.Mesh(new THREE.BoxBufferGeometry(
        scale.x, scale.y, scale.z, 35, 35, 35), levelTextures.ground);

    groundBlock.position.set(pos.x, pos.y, pos.z);
    groundBlock.quaternion.set(quat.x, quat.y, quat.z, quat.w);

    groundBlock.receiveShadow = true;
    groundBlock.castShadow = true;

    scene.add(groundBlock);
    
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    groundBlock.userData.tag = "ground";

    body.threeObject = groundBlock;

    physicsWorld.addRigidBody(body);

    return groundBlock
}


function createMovingPlatform(pos) {

    let scale = { x: 12, y: 3, z: 12 }; //prev 50, 2, 50
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;
    
    let platform = new THREE.Mesh(new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({ color: 0xDC143C }));

        platform.position.set(pos.x, pos.y, pos.z);
        platform.scale.set(scale.x, scale.y, scale.z);

        platform.castShadow = true;
        platform.receiveShadow = true;

    scene.add(platform);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.75, scale.y * 0.5, scale.z * 0.75));
    colShape.setMargin(1);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    platform.userData.tag = "movingPlatform";
    platform.userData.playerGrounded = false;

    body.threeObject = platform;

    physicsWorld.addRigidBody(body);

    const startY = pos.y
    const tween1 = new TWEEN.Tween({ y: startY })
        .to({ y: pos.to }, 4000)
        .easing(TWEEN.Easing.Quadratic.InOut);

    const tween2 = new TWEEN.Tween({ y: pos.to })
        .to({ y: startY }, 4000)
        .easing(TWEEN.Easing.Quadratic.InOut);

    body.setFriction(100)


    tween1.chain(tween2)
    tween2.chain(tween1)

    const tweenUpdate = function (object, elapsed) {

        let transform = new Ammo.btTransform();
        transform.setIdentity();

        transform.setOrigin(new Ammo.btVector3(pos.x, object.y, pos.z));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        let motionState = new Ammo.btDefaultMotionState(transform);

        body.setMotionState(motionState)

        platform.position.set(pos.x, object.y, pos.z)

        if (!isGrounded) {
            platform.userData.playerGrounded = false;
            playerController.threeCrash.userData.physicsBody.setFriction(0)
        }

    }

    tween1.onUpdate(tweenUpdate)
    tween2.onUpdate(tweenUpdate)

    tween1.start()
}


function updatePhysics(deltaTime) {

    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
        let objThree = rigidBodies[i];

        let objAmmo = objThree.userData.physicsBody;

        if (objAmmo != null) {

            if (objThree.name === "player" && objThree.position.y < gameManager.deathHeight + 3 && !alive) {
                // Prevent the player to accelerate down to infinity to avoid double deaths
                objAmmo.getLinearVelocity().setX(0)
                objAmmo.getLinearVelocity().setY(0)
                objAmmo.getLinearVelocity().setZ(0)

                let transform = new Ammo.btTransform();
                transform.setOrigin(new Ammo.btVector3(objThree.position.x, gameManager.deathHeight + 2, objThree.position.z))
                transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

                let motionState = new Ammo.btDefaultMotionState(transform);
                objAmmo.setMotionState(motionState)

            } else {
                let ms = objAmmo.getMotionState();
                if (ms) {
                    ms.getWorldTransform(tmpTrans);
                    let p = tmpTrans.getOrigin();
                    let q = tmpTrans.getRotation();

                    objThree.position.set(p.x(), p.y(), p.z());
                    objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }
            }
        }
    }
}


function updateCamera() {
    const camera = scene.getObjectByName("playerCamera")
    const player = scene.getObjectByName("player")

    const curvePos = getCurvePosAtPlayer(player)

    if (player.position.y < 150) {
        camera.lookAt(getForwardVector(player))
        camera.rotation.y = -camera.rotation.y
        camera.position.x = curvePos.x
        camera.position.y = curvePos.y;
        camera.position.z = player.position.z - 34;
    } else {
        camera.position.x = player.position.x - 15
        camera.position.y = 315
        camera.position.z = player.position.z - 48
    }
}


class CollisionManager {

    static setupContactResultCallback() {

        cbContactResult = new Ammo.ConcreteContactResultCallback();
        cbContactResult.addSingleResult = function (cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1) {

            let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);

            const distance = contactPoint.getDistance();
            if (distance > 0) { return };

            let colWrapper0 = Ammo.wrapPointer(colObj0Wrap, Ammo.btCollisionObjectWrapper);
            let rb0 = Ammo.castObject(colWrapper0.getCollisionObject(), Ammo.btRigidBody);

            let colWrapper1 = Ammo.wrapPointer(colObj1Wrap, Ammo.btCollisionObjectWrapper);
            let rb1 = Ammo.castObject(colWrapper1.getCollisionObject(), Ammo.btRigidBody);

            let threeObject0 = rb0.threeObject;
            let threeObject1 = rb1.threeObject;
            let tag, localPos, worldPos

            if (threeObject1 != null) {
                if (threeObject0.userData.tag != "player") {

                    tag = threeObject0.userData.tag;
                    localPos = contactPoint.get_m_localPointA();
                    worldPos = contactPoint.get_m_positionWorldOnA();

                }
                else {
                    let tag = threeObject1.userData.tag;
                    if (tag === "win") {
                        animator.win();
                        gameManager.win();
                    }

                    if (tag === "ground") {
                        isGrounded = true;
                    }
                    else if (tag === "fallingCylinder") {
                        isGrounded = true;
                        if (!threeObject1.userData.fallingAnimation.isPlaying())
                            threeObject1.userData.fallingAnimation.start()
                    }
                    else if (tag === "movingPlatform") {
                        isGrounded = true;
                        threeObject1.userData.playerGrounded = true;
                    }
                    else if (tag === "gem") {
                        GemCollectable.collect(threeObject1);
                    }
                    else if (tag === "wumpa") {
                        WumpaCollectable.collect(threeObject1);
                    }
                    else if (tag === "crate") {
                        localPos = contactPoint.get_m_localPointA();
                        worldPos = contactPoint.get_m_positionWorldOnA();

                        if (threeObject1.userData.crateType === crateTypes.nitro) {
                            CrateManager.break(scene, threeObject1)

                            if (!playerController.akuaku && !playerController.invincibility) {
                                playerController.die()
                            } else {
                                playerController.killAkuaku()
                            }
                            return
                        }

                        if ((localPos.y() < -3) || isSpinning || isSliding) {
                            CrateManager.break(scene, threeObject1)
                        }

                        if (localPos.y() < -3) {
                            playerController.setImpulse(rb0, 5)
                        }

                    } else if (tag === "akuaku") {
                        AkuAkuCollectable.collect(threeObject1);
                    }


                    localPos = contactPoint.get_m_localPointB();
                    worldPos = contactPoint.get_m_positionWorldOnB();
                }

            }
        }
    }

    static checkContact(physicsBody) {
        physicsWorld.contactTest(physicsBody, cbContactResult);
    }

}


let isGrounded = true;
let canJump = true;
let onTimeout = false;
let cameraOrtho;


function handleInput(inputCode, inputKeys) {

    if (inputKeys == null) {
        inputKeys =
        {
            moveHorizontal: 0,
            moveNegHorizontal: 0,
            moveVertical: 0,
            moveNegVertical: 0,
            jump: false
        };
    }

    if (inputCode.type === "keydown") {
        if (inputCode.code === "KeyW") {
            inputKeys.moveVertical = 1;
        }
        else if (inputCode.code === "KeyS") {
            inputKeys.moveNegVertical = -1;
        }
        else if (inputCode.code === "KeyD") {
            inputKeys.moveNegHorizontal = -1;
        }
        else if (inputCode.code === "KeyA") {
            inputKeys.moveHorizontal = 1;
        }
        else if (inputCode.code === "Space") {
            inputKeys.jump = true;
        }
        else if (inputCode.code === "KeyK") {
            spinPressed = true;
        }
        else if (inputCode.code === "KeyL") {
            if (isGrounded) {
                isSliding = true
            }
        }
        else if (inputCode.code === "KeyC") {
            crateEditor()
        }
    }

    else if (inputCode.type === "keyup") {
        if (inputCode.code === "KeyW") {
            inputKeys.moveVertical = 0;
        }
        else if (inputCode.code === "KeyS") {
            inputKeys.moveNegVertical = 0;
        }
        else if (inputCode.code === "KeyD") {
            inputKeys.moveNegHorizontal = 0;
        }
        else if (inputCode.code === "KeyA") {
            inputKeys.moveHorizontal = 0;
        }
        else if (inputCode.code === "Space") {
            inputKeys.jump = false;
        }
    }

    return inputKeys;
}


function getCurvePosAtPlayer() {
    const startZ = curve.getPointAt(0).z
    const playerZ = playerController.threeCrash.position.z
    const length = curve.getLength();

    const currentLength = (playerZ - startZ) / length;
    const currentY = curve.getPointAt(currentLength).y
    const currentX = curve.getPointAt(currentLength).x;

    return { x: currentX, y: currentY };
}

function getForwardVector(player) {
    const startZ = curve.getPointAt(0).z
    const playerZ = player.position.z - 10
    const length = curve.getLength();
    const currentHeigth = (playerZ - startZ) / length;

    return curve.getPointAt(currentHeigth);
}

function crateEditor() {
    const playerPos = playerController.threeCrash.position;
    const pos = { x: playerPos.x, y: playerPos.y, z: playerPos.z - 5 }
    CrateManager.instantiate(scene, physicsWorld, pos, overlayMenuValues.crateType)
    console.log(pos)
}