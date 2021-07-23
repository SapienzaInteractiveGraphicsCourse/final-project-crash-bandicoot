


import * as THREE from '../build/three.module.js';

export const crateTypes = { akuaku: "akuaku", wumpa: "wumpa", tnt: "tnt", nitro: "nitro", checkpoint: "checkpoint" }
export let stats = { wumpas: 0, crates: 0, lives: 5, akuaku: false, invincibility: false }
export let crateTextures = {};

export let wumpaFruits = []


export const sounds = {}


function initTextures() {

    const loader = new THREE.TextureLoader();


    let akuakuTexture = [
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/akuaku.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/akuaku.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/standard.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/akuaku.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/akuaku.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/akuaku.jpg") }),
    ];

    let nitroTexture = [
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro_upper.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/nitro.jpg") }),
    ];

    let checkpointTexture = [
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
        new THREE.MeshBasicMaterial({ map: loader.load("../textures/crates/checkpoint.jpg") }),
    ];


    let crateTexture = new THREE.MeshBasicMaterial({
        map: loader.load("../textures/crates/standard.jpg")
    });

    crateTextures =
        { akuaku: akuakuTexture, wumpa: crateTexture, tnt: crateTexture, nitro: nitroTexture, checkpoint: checkpointTexture }

}


function setupAudio() {
    sounds.spinSound = new Audio("../sounds/spinSound.wav");
    sounds.spinSound.volume -= 0.5

    //console.log(sounds.spinSound)
    let music = new Audio("./sounds/music3.ogg");
    music.volume -= 0.6;

    music.play();
    sounds.wumpaSound = new Audio("../sounds/wumpa.wav");

    sounds.createBreakSound = new Audio("../sounds/createBreak.wav");
    sounds.createBreakSound.volume -= 0.2

    sounds.akuakuSound = new Audio("../sounds/akuaku.wav");
    sounds.akuakuDeathSound = new Audio("../sounds/akuaku_vanish.wav");

    sounds.slideSound = new Audio("../sounds/slide.wav");
    sounds.slideSound.volume -= 0.5
    sounds.nitroSound = new Audio("../sounds/nitro.wav");
    sounds.woahSound = new Audio("../sounds/woah.wav");
    sounds.checkpointSound = new Audio("../sounds/checkpoint2.wav");
    sounds.checkpointSound.volume -=0.6
}



export function initGame(){
    initTextures();
    setupAudio();
}





export class CrateManager  {

     static instantiate(scene, physicsWorld, pos, crateType) {
        let scale = { x: 3, y: 3, z: 3 };
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 100;

        //threeJS Section
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

        crate.castShadow = true;
        crate.receiveShadow = true;

        scene.add(crate);
        crate.add(crateMesh);


        //Ammojs Section
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

        //  crateMesh.name = "crateMesh";
        crate.userData.tag = "crate";
        crate.userData.crateType = crateType;

        crate.userData.physicsBody = body;
        //  crate.userData.wumpa = createWumpa(scene, pos, id) //TODO trasforma in lista
        physicsWorld.addRigidBody(body);

        return crate
    }




    static break(scene, crate) {

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
 
            if (crate.userData.crateType === "wumpa") {
                sounds.createBreakSound.play();
                wumpaFruits.push(createWumpa({ x: crate.position.x, y: crate.position.y, z: crate.position.z }))
            } else if (crate.userData.crateType === "akuaku") {
                sounds.createBreakSound.play();
                let akuAku = createAkuAkuCollectable({ x: crate.position.x, y: crate.position.y, z: crate.position.z })
                collectAkuAku(akuAku);
            } else if (crate.userData.crateType === crateTypes.nitro) {
                sounds.nitroSound.currentTime = 0.14
                sounds.nitroSound.play();
                nitroExplosion(crate);
            } else if (crate.userData.crateType === crateTypes.checkpoint) {
                sounds.checkpointSound.play()
                checkpointPos = new THREE.Vector3(crate.position.x, crate.position.y + 20, crate.position.z);
            }
    
        }
    
    }
}


export class Collectable {

    static collect(element, sound) {
        sound.play()

        let objAmmo = element.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if (ms) {
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new Ammo.btVector3(100, 100, 100));
            transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
            objAmmo.setWorldTransform(ms)
        }
    }

}

export class WumpaCollectable extends Collectable {

    static animate(fruit, time) {
        fruit.getObjectByName("wumpaMesh").rotation.y = time * 5;
        fruit.getObjectByName("wumpaMesh").position.y = Math.sin(time * 2) / 1.5;
    }

    static collect(wumpa) {

        sounds.wumpaSound.currentTime = 0.14;
        super.collect(wumpa, sounds.wumpaSound);

        let wumpaMesh = wumpa.getObjectByName("wumpaMesh");

        if (wumpaMesh != null) {
    
            wumpa.remove(wumpaMesh);
            wumpaMesh.geometry.dispose();
            wumpaMesh.material.dispose();
            wumpaMesh = undefined;
        } else {
            console.log("nnt2")
        }
        
    }

    static instantiate(scene, physicsWorld, pos) {
        let radius = .5;
        let quat = { x: 0, y: 0, z: 0, w: 1 };
        let mass = 0;
    
        const targetGeometry = new THREE.SphereGeometry(radius, 6, 3);
        const targetMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00, flatShading: true });
        const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
        const targetOrbit = new THREE.Object3D();
        targetMesh.castShadow = true;
        targetMesh.name = "wumpaMesh";
        scene.add(targetOrbit);
        targetOrbit.add(targetMesh);
        targetOrbit.position.z = 4 * 2;
        targetOrbit.position.y = 8;
    
    
        //Ammojs Section
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
    
        targetOrbit.userData.tag = "wumpa";
        targetOrbit.userData.physicsBody = body;
    
        return targetOrbit
    }


}