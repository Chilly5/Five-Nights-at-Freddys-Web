import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import getCam from "./Images";
import { logWithTime } from "./LoggingUtil";

import AnimatronicsMoving from "../media/Sounds/garble1.mp3";
import AnimatronicsMoving2 from "../media/Sounds/garble2.mp3";
import Static from "../media/Textures/Static-Cam.webp";
import Black from "../media/Textures/black.jpg";
import Media from "./Media";

import CameraMap from "../components/CameraMap";
import CameraButton from "../components/CameraButton";

// Room descriptions for more detailed logging
const ROOM_DESCRIPTIONS = {
    'Stage': 'Show Stage - Main performance area with red curtains and star-decorated backdrop',
    'DinningArea': 'Dining Area - Large room with party tables and chairs',
    'Backstage': 'Backstage - Storage room with spare parts and endoskeletons',
    'PirateCove': 'Pirate Cove - Stage area with purple star-decorated curtains',
    'SupplyCloset': 'Supply Closet - Small maintenance room with cleaning supplies',
    'WestHall': 'West Hall - Left corridor leading to your office',
    'WHallCorner': 'West Hall Corner - Corner of left corridor near your office',
    'EastHall': 'East Hall - Right corridor leading to your office',
    'EHallCorner': 'East Hall Corner - Corner of right corridor near your office',
    'Restrooms': 'Restrooms - Bathroom area with checkered tile floor',
    'Kitchen': 'Kitchen - A creepy laugh echoes in the distance'
};

// Animatronic pose and position descriptions
const getAnimatronicDescription = (character, camera) => {
    switch(character) {
        case 'Bonnie':
            switch(camera) {
                case 'Stage': 
                    return 'standing on stage at left position (screen left), facing forward';
                case 'DinningArea': 
                    return 'looming between tables in center frame, staring directly at camera';
                case 'Backstage': 
                    return 'face filling most of frame (extreme close-up), eyes locked on camera';
                case 'SupplyCloset': 
                    return 'positioned at right edge of frame, head turned 90 degrees toward camera';
                case 'WestHall': 
                    return 'dark silhouette visible at bottom third of frame';
                case 'WHallCorner': 
                    return 'face illuminated in center frame, inches from camera';
                default: 
                    return 'visible in frame';
            }
        case 'Chica':
            switch(camera) {
                case 'Stage': 
                    return 'standing on stage at right position (screen right), cupcake raised';
                case 'DinningArea': 
                    return 'positioned between tables at right third of frame, head tilted unnaturally';
                case 'Restrooms': 
                    return 'lurking in doorway at center-right of frame';
                case 'EastHall': 
                    return 'silhouette visible at bottom of frame, head twisted';
                case 'EHallCorner': 
                    return 'face filling right side of frame, jaw unhinged';
                case 'Kitchen': 
                    return 'pots and pans clatter violently in the darkness';
                default: 
                    return 'visible in frame';
            }
        case 'Freddy':
            switch(camera) {
                case 'Stage': 
                    return 'center stage position (screen center), microphone raised to face';
                case 'DinningArea': 
                    return 'barely visible in shadows at back of room, eyes glowing';
                case 'Restrooms': 
                    return 'white eyes visible in darkness at frame left';
                case 'EastHall': 
                    return 'dark figure barely visible in top-right corner';
                case 'EHallCorner': 
                    return 'glowing eyes visible in darkness, filling left half of frame';
                case 'Kitchen': 
                    return 'his music box melody echoes through the darkness';
                default: 
                    return 'visible in frame';
            }
        case 'Foxy':
            switch(camera) {
                case '1': 
                    return 'head peeking through curtain gap at center-right';
                case '2': 
                    return 'half-emerged from curtain at center frame, hook visible';
                case '3': 
                    return 'fully exposed in center frame, leaning forward ready to sprint';
                default: 
                    return 'hidden behind the purple curtain';
            }
        default:
            return 'visible in frame';
    }
};

function Camera({
    animatronics,
    areAnimatronicsMoving,
    isCameraOpen,
    office,
    camera,
    cameraButtonDisappear,
    dispatch,
}) {
    const [Image, setImage] = useState(Media.Images.Stage);
    const [prevAnimatronicStates, setPrevAnimatronicStates] = useState({});
    const [prevCamera, setPrevCamera] = useState(null);

    const closeCameraRef = useRef(null);
    const cameraDivRef = useRef(null);

    const handleCameraButton = () => {
        dispatch({ type: "SET_IS_OPEN" });
        if (!areAnimatronicsMoving) {
            logWithTime(`Camera system ${isCameraOpen ? 'closed' : 'opened'}`);
            if (!isCameraOpen) {
                logWithTime(`Viewing ${ROOM_DESCRIPTIONS[camera] || camera}`);
            }
        }
    };

    const handleCameraChange = (e) => {
        e.preventDefault();
        Media.Sounds.CameraChange.play();
        const newCamera = e.target.title;
        if (!areAnimatronicsMoving) {
            logWithTime(`Switching camera view: ${ROOM_DESCRIPTIONS[newCamera] || newCamera}`);
        }
        setPrevCamera(newCamera);
        dispatch({ type: "CHANGE_CAMERA", content: newCamera });
    };

    useEffect(() => {
        if (cameraDivRef.current) {
            if (isCameraOpen)
                setTimeout(() => {
                    cameraDivRef.current.style.display = "flex";
                }, 350);
            else
                setTimeout(() => {
                    cameraDivRef.current.style.display = "none";
                }, 100);
        }
    }, [isCameraOpen]);

    useEffect(() => {
        const { Bonnie, Chica, Freddy, Foxy } = animatronics;
        
        // Only log if camera is open and not in blackout/static
        if (isCameraOpen && !areAnimatronicsMoving) {
            // Log visible animatronics with their poses
            const visibleAnimatronics = [];
            if (Bonnie.camera === camera) 
                visibleAnimatronics.push(`Bonnie: ${getAnimatronicDescription('Bonnie', camera)}`);
            if (Chica.camera === camera) 
                visibleAnimatronics.push(`Chica: ${getAnimatronicDescription('Chica', camera)}`);
            if (Freddy.camera === camera) 
                visibleAnimatronics.push(`Freddy: ${getAnimatronicDescription('Freddy', camera)}`);
            if (camera === 'PirateCove') 
                visibleAnimatronics.push(`Foxy: ${getAnimatronicDescription('Foxy', Foxy.camera)}`);
            
            if (visibleAnimatronics.length > 0) {
                logWithTime(`Current view (${camera}):`);
                visibleAnimatronics.forEach(desc => logWithTime(`- ${desc}`));
            } else if (camera === 'Kitchen' && (Chica.camera === 'Kitchen' || Freddy.camera === 'Kitchen')) {
                logWithTime('Kitchen camera malfunctioning');
                if (Chica.camera === 'Kitchen') logWithTime('- ' + getAnimatronicDescription('Chica', 'Kitchen'));
                if (Freddy.camera === 'Kitchen') logWithTime('- ' + getAnimatronicDescription('Freddy', 'Kitchen'));
            } else {
                logWithTime(`${ROOM_DESCRIPTIONS[camera] || camera} - No movement detected`);
            }
        }

        // Update previous states
        setPrevAnimatronicStates({ Bonnie, Chica, Freddy, Foxy });

        let result = "";
        if (Bonnie.camera === camera) result += "_b";
        if (Chica.camera === camera) result += "_c";
        if (Freddy.camera === camera) result += "_f";

        const newCamera = getCam(result, camera, Foxy.camera);
        setImage(newCamera);
    }, [camera, animatronics, areAnimatronicsMoving, animatronics.Foxy.camera]);

    useEffect(() => {
        if (areAnimatronicsMoving && isCameraOpen) {
            logWithTime('Camera feed interrupted - Static interference detected');
        }
    }, [areAnimatronicsMoving]);

    return (
        <div>
            {cameraButtonDisappear ? null : (
                <CameraButton
                    handleCameraButton={handleCameraButton}
                    style={{ zIndex: "1" }}
                />
            )}
            {isCameraOpen ? (
                <>
                    <img
                        draggable="false"
                        className="camera opening animation"
                        data-left-door={office.leftDoor}
                        data-right-door={office.rightDoor}
                        id="camera"
                        src={Media.Images.Up}
                        alt="Opening camera"
                        style={{
                            margin: 0,
                            width: "100vw",
                            height: "100vh",
                            position: "absolute",
                            top: 0,
                        }}
                    />
                    <div
                        className="camera-container"
                        style={{ display: "none" }}
                        ref={cameraDivRef}
                    >
                        <CameraMap handleCameraChange={handleCameraChange} />
                        {areAnimatronicsMoving ? (
                            <img
                                draggable="false"
                                src={Black}
                                alt="Animatronics are moving"
                                className="animatronics-true"
                                style={{
                                    height: "100vh",
                                    width: "100vw",
                                    backgroundColor: "black",
                                    position: "absolute",
                                }}
                            />
                        ) : (
                            <img
                                src={Image}
                                alt="Camera"
                                className="camera-img"
                                style={{
                                    width: "100vw",
                                    position: "absolute",
                                }}
                            />
                        )}
                        <img
                            alt="Static"
                            src={Static}
                            style={{
                                opacity: "0.1",
                                width: "100vw",
                                height: "100vh",
                            }}
                            draggable="false"
                            className="static-open"
                        />
                    </div>
                </>
            ) : (
                <img
                    draggable="false"
                    className={`camera opening`}
                    id="camera"
                    ref={closeCameraRef}
                    src={Media.Images.Down}
                    alt="Closing camera"
                    style={{
                        width: "100vw",
                        height: "100vh",
                        position: "absolute",
                    }}
                />
            )}
        </div>
    );
}

const mapStateToProps = (state) => {
    return {
        animatronics: state.animatronicsReducer,
        camera: state.cameraReducer.camera,
        office: state.officeReducer,
        isCameraOpen: state.cameraReducer.isCameraOpen,
        areAnimatronicsMoving: state.cameraReducer.areAnimatronicsMoving,
        jumpscare: state.configReducer.jumpscare,
        cameraButtonDisappear: state.configReducer.cameraButtonDisappear,
    };
};

export default connect(mapStateToProps)(Camera);
