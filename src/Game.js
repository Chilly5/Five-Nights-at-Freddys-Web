import React, { useEffect } from "react";
import { connect } from "react-redux";

import Animatronic from "./components/Animatronic";
import Office from "./components/Office";
import Camera from "./components/Camera";
import Hud from "./components/Hud";
import Media from "./components/Media";
import { logWithTime } from "./components/LoggingUtil";

let isBlackout = false;

let { Ambience } = Media.Sounds;
Ambience.loop = true;

let officeProps = { leftDoor: false, rightDoor: false };

// Death descriptions for more detailed logging
const DEATH_DESCRIPTIONS = {
  Freddy: "Freddy Fazbear emerged from the darkness",
  Bonnie: "Bonnie appeared in your face",
  Chica: "Chica lunged from the doorway",
  Foxy: "Foxy sprinted down the hall and got you",
};

const Game = ({
  office,
  isCameraOpen,
  energy,
  gameOver,
  stages,
  endGame,
  dispatch,
}) => {
  useEffect(() => {
    Ambience.currentTime = 0;
    Ambience.play();
    isBlackout = false;
    officeProps = { leftDoor: false, rightDoor: false };
  }, []);

  useEffect(() => {
    if (gameOver) {
      logWithTime('Game Over!');
      Ambience.pause();
    }
  }, [gameOver]);

  useEffect(() => {
    if (energy <= 0) {
      logWithTime('POWER OUTAGE - All systems offline');
      logWithTime('Emergency power conservation mode activated');
      logWithTime('Warning: Security doors disabled, cameras offline');
      isBlackout = true;
      Ambience.pause();
    } else if (energy <= 20) {
      logWithTime(`WARNING: Power critically low (${energy}% remaining)`);
    }
  }, [energy]);

  useEffect(() => {
    let newTime = 6300;
    if (office.leftDoor) newTime -= 1100;
    if (office.rightDoor) newTime -= 1100;
    if (office.leftLight) newTime -= 500;
    if (office.rightLight) newTime -= 500;
    if (isCameraOpen) newTime -= 1100;

    dispatch({ type: "CHANGE_TIME", content: newTime });
    
    // Log door and light state changes
    if (office.leftDoor !== officeProps.leftDoor) {
      logWithTime(`Left door ${office.leftDoor ? 'closed' : 'opened'}`);
    }
    if (office.rightDoor !== officeProps.rightDoor) {
      logWithTime(`Right door ${office.rightDoor ? 'closed' : 'opened'}`);
    }
    if (office.leftLight) {
      logWithTime('Left light activated - checking blind spot');
    }
    if (office.rightLight) {
      logWithTime('Right light activated - checking blind spot');
    }

    officeProps = {
      leftDoor: office.leftDoor,
      rightDoor: office.rightDoor,
    };
  }, [
    office.leftDoor,
    office.rightDoor,
    office.leftLight,
    office.rightLight,
    isCameraOpen,
  ]);

  const handleJumpscare = (character) => {
    if (isBlackout || gameOver) return;
    
    logWithTime(`ALERT: Security breach - ${DEATH_DESCRIPTIONS[character]}`);
    logWithTime('SYSTEM FAILURE - Game Over');
    
    dispatch({
      type: "CHANGE_ANIMATRONIC",
      animatronic: character,
      animatronicState: {
        door: null,
        camera: null,
        jumpscare: true,
      },
    });

    dispatch({ type: "CHANGE_JUMPSCARE", animatronic: character });
    if (character === "Foxy" || character === "Freddy")
      dispatch({ type: "FORCE_CAMERA_CLOSE" });
    setTimeout(() => {
      if (!isCameraOpen) dispatch({ type: "FORCE_CAMERA_CLOSE" });
    }, 10000);
  };

  async function isThisDoorOpen(door) {
    const isDoorOpen = await officeProps[door];
    return isDoorOpen;
  }

  return (
    <>
      <Animatronic
        stages={stages}
        handleJumpscare={handleJumpscare}
        gameOver={gameOver}
        isThisDoorOpen={isThisDoorOpen}
        blackout={energy <= 0}
      />

      {!gameOver ? (
        <>
          {energy <= 0 ? null : <Hud />}
          <Camera handleJumpscare={handleJumpscare} />
          {isCameraOpen ? null : (
            <Office endGame={endGame} blackout={energy <= 0} />
          )}
        </>
      ) : null}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    animatronics: state.animatronicsReducer,
    time: state.configReducer.time,
    hour: state.configReducer.hour,
    energy: state.configReducer.energy,
    office: state.officeReducer,
    camera: state.cameraReducer.camera,
    isCameraOpen: state.cameraReducer.isCameraOpen,
  };
};

export default connect(mapStateToProps)(Game);
