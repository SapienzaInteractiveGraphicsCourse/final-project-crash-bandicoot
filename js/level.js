export const ground = [
    {
        pos: { x: 0, y: -10, z: 0 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: 0, y: -10, z: 20 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: -5, y: 1.5 - 10, z: 40 },
        scale: { x: 10, y: 20, z: 20 },
        quat: { x: -0.07798, y: 0, z: 0, w: 0.996955 }
    },
    {
        pos: { x: -5, y: 4.4 - 10, z: 60 },
        scale: { x: 10, y: 20, z: 20 },
        quat: { x: -0.07798, y: 0, z: 0, w: 0.996955 }
    },
    {
        pos: { x: -5, y: 4.5 - 10, z: 60 },
        scale: { x: 10, y: 20, z: 20 },
        quat: { x: -0.07798, y: 0, z: 0, w: 0.996955 }
    },
    {
        pos: { x: 0, y: 5.8 - 10, z: 80 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: -5, y: 5.20 - 10, z: 120 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: -0.145, z: 0, w: 0.989 }
    },
    {
        pos: { x: -11 + 0.3, y: 5.20 - 10, z: 140 - 1 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: -0.145, z: 0, w: 0.989 }
    },
    {
        pos: { x: -20, y: 5.20 - 10, z: 170 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: 0, y: -0.145, z: 0, w: 0.989 }
    },

    {
        pos: { x: -25, y: 1.5 - 10, z: 260 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: -0.208457, y: 0, z: 0, w: 0.978032 }    },
    {
        pos: { x: -25, y: -0.8, z: 278 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: -0.208457, y: 0, z: 0, w: 0.978032 }
    },
    {
        pos: { x: -25, y: 6.3, z: 294 },
        scale: { x: 20, y: 20, z: 20 },
        quat: { x: -0.208457, y: 0, z: 0, w: 0.978032 }
    },
    {
        pos: { x: -25, y: 10.5, z: 304 },
        scale: { x:10, y: 20, z: 10 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: -25, y: 10.5, z: 334 },
        scale: { x: 45, y: 20, z: 45 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: -25, y: 10.5, z: 364 },
        scale: { x: 15, y: 20, z: 15 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
    {
        pos: { x: -25, y: 13.5, z: 430 },
        scale: { x: 15, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }// { x: -0.10, y: 0.11644, z: 0, w: 0.976296 }
    },
    {
        pos: { x: -25, y: 13.5, z: 460 },
        scale: { x: 15, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }// { x: -0.10, y: 0.11644, z: 0, w: 0.976296 }
    },
    {
        pos: { x: -25, y: 13.5, z: 490 },
        scale: { x: 15, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }// { x: -0.10, y: 0.11644, z: 0, w: 0.976296 }
    },
    {
        pos: { x: -25, y: 13.5, z: 520 },
        scale: { x: 15, y: 20, z: 20 },
        quat: { x: 0, y: 0, z: 0, w: 1 }// { x: -0.10, y: 0.11644, z: 0, w: 0.976296 }
    },
    {
        pos: { x: -25, y: 10.5, z: 620 },
        scale: { x: 45, y: 20, z: 80 },
        quat: { x: 0, y: 0, z: 0, w: 1 }
    },
]


export const winPlatform = {
    pos: {x:-250, y: 290, z: 708},
    scale: { x: 7, y: 15, z: 7 },
    quat: { x: 0, y: 0, z: 0, w: 1 }
}

export const movingPlaftorms =
    [
       { x: -25, y: 8.5, z: 690, to: 300 },
      // { x: -250, y: 310, z: 708, to: 8 },
    ]


export const fallingCylinders =
    [
        { x: -25, y: 5.20 - 11, z: 200 },
        { x: -25, y: 5.20 - 11, z: 230 },
        { x: -25, y: 11, z: 550 },
        { x: -25, y: 11, z: 580 },
    ]

export const cameraCurve = [
    { x: 0, y: 10, z: -35 },
    { x: 0, y: +10, z: 0 },
    { x: 0, y: +10, z: 20 },
    { x: 0, y: 15, z: 40 },
    { x: 0, y: 15, z: 60 },
    { x: 0, y: 15, z: 80 },

    { x: 0, y: 15, z: 100 },
    { x: -3, y: 15, z: 120 },
    { x: -10, y: 15, z: 140 },
    { x: -13, y: 15, z: 160 },
    { x: -15, y: 15, z: 200 },


    { x: -25, y: 35, z: 340 },
    { x: -25, y: 30, z: 500 },
    { x: -25, y: 30, z: 800 }

]


export const crates = [
    {x: -11.873655319213867, y: 23.499996185302734, z: 332.3036193847656, type: "nitro"},
    {x: -17.268630981445312, y: 23.499996185302734, z: 318.09832763671875, type: "wumpa"},
    {x: -21.228424072265625, y: 23.499996185302734, z: 333.958251953125, type: "checkpoint"},
    {x: -31.933460235595703, y: 23.499996185302734, z: 317.6529235839844, type: "wumpa"},
    {x: -36.67317581176758, y: 23.499996185302734, z: 336.8927307128906, type: "wumpa"},
    {x: -32.27316665649414, y: 23.499996185302734, z: 332.6926574707031, type: "wumpa"},
    {x: -32.27316665649414, y: 28.499996185302734, z: 332.6926574707031, type: "wumpa"},
    {x: -32.27316665649414, y: 32.499996185302734, z: 332.6926574707031, type: "wumpa"},
    {x: -32.27316665649414, y: 36.499996185302734, z: 332.6926574707031, type: "akuaku"},
    {x: -30.257972717285156, y: 23.499996185302734, z: 609.28466796875, type: "nitro"},
    {x: -37.95798110961914, y: 23.499996185302734, z: 620.48486328125, type: "nitro"},
    {x: -17.968515396118164, y: 23.499996185302734, z: 634.2948608398438, type: "nitro"},
    {x: -12.368515014648438, y: 23.499996185302734, z: 620.99462890625, type: "nitro"},
    { x: -75, y: 305, z: 713.5, type: "nitro"},
    { x: -75, y: 305, z: 710, type: "nitro"},
    { x: -75, y: 305, z: 717, type: "nitro"},
    { x: -75, y: 305, z: 706.5, type: "nitro"},
    { x: -50, y: 305, z: 710, type: "checkpoint"},
]