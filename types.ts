
export enum GameState {
    StartMenu,
    Playing,
    GameOver,
}

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface Point2D {
    x: number;
    y: number;
}

export interface TrackSegment {
    z: number;
    x: number;
    y: number;
    curve: number;
    color: string;
}

export interface Player {
    angle: number; // position on the track circumference, in radians
    xOffset: number; // for smooth left/right movement
    z: number;
    speed: number;
}

export enum OpponentShape {
    Triangle,
    Square,
    Pentagon,
}

export interface Opponent {
    id: number;
    z: number; // distance ahead of the player
    angle: number;
    color: string;
    shape: OpponentShape;
    speed: number;
    laneChangeSpeed: number;
    targetAngle: number;
}
