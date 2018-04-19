/* globals Image */

import * as actions from "./actionTypes";
import * as synth from "../../synth/synth";
import * as flickrApi from "../../api/flickrApi";
import * as utils from "../../utils";

let page = 1;

export const Play = () => {
  return (dispatch, getState) => {
    const generatedSettings = synth.play(getState().app.song, getState().app.seed, null, () => {
      dispatch(ChangeImage());
    });
    dispatch({
      type: actions.SYNTH_PLAY,
      payload: generatedSettings
    });
  };
};

export const Stop = () => {
  return dispatch => {
    dispatch({
      type: actions.SYNTH_STOP
    });
  };
};

export const PlayButtonClick = () => {
  return (dispatch, getState) => {
    getState().app.isPlaying ? dispatch({ type: actions.SYNTH_STOP }) : dispatch({ type: actions.SYNTH_PLAY });
  };
};

export const SetInitialSeed = newSeed => {
  return dispatch => {
    dispatch({ type: actions.UPDATE_SEED, payload: newSeed });
    dispatch({ type: actions.SYNTH_PLAY });
  };
};

export const SetSeed = newSeed => {
  return (dispatch, getState) => {
    dispatch({ type: actions.UPDATE_SEED, payload: newSeed });
    synth.playDebounced(
      getState().app.song,
      newSeed,
      generatedSettings => {
        dispatch({
          type: actions.UPDATE_GENERATED_SETTINGS,
          payload: generatedSettings
        });
      },
      () => {
        dispatch(ChangeImage());
      }
    );
  };
};

export const RandomiseSeed = () => {
  return () => {
    const randomSeed = new Date().getTime().toString();
    return SetSeed(randomSeed);
  };
};

export const SetSong = song => {
  page = 1;
  return dispatch => {
    dispatch({ type: actions.CLEAR_IMAGES });
    dispatch({ type: actions.SET_SONG, payload: song });
    dispatch(Play());
  };
};

const selectNextImage = (dispatch, getState) => {
  dispatch({ type: actions.SELECT_NEXT_IMAGE });

  const newImage = getState().app.nextImage;
  var img = new Image();
  img.onload = function() {
    dispatch({ type: actions.CHANGE_IMAGE, payload: newImage });
  };
  img.src = newImage;
};

const getBatchOfImages = (page, group) => {
  const apiResponse = flickrApi.getImages(page, group);
  return apiResponse;
};
const checkForAcceptableImages = (dispatch, getState, response) => {
  const data = response.data;
  dispatch({ type: actions.SET_IMAGE_PAGECOUNT, payload: data.photos.pages });

  const acceptableImages = data.photos.photo.filter(photo => photo.url_c !== undefined);
  if (acceptableImages === undefined || acceptableImages.length === 0) {
    return false;
  }

  dispatch({
    type: actions.IMAGES_FOUND,
    payload: acceptableImages.map(img => img.url_c)
  });

  selectNextImage(dispatch, getState);
  return true;
};

export const ChangeImage = () => {
  return (dispatch, getState) => {
    if (getState().app.images.length < 5) {
      const group = getState().app.song === 1 ? "2702819%40N24" : "430026@N21";
      const totalPages = getState().app.imagePageCount;

      page++;
      if (page > totalPages) {
        page = 1;
      }

      const getNextGroupImage = () => {
        return getBatchOfImages(page, group);
      };

      utils.runFunctionUntilCheckPasses(getNextGroupImage, checkForAcceptableImages, false, dispatch, getState);
    } else {
      selectNextImage(dispatch, getState);
    }
  };
};
